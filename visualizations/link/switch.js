/* Self-learning switch simulator (Kurose §6.4.3). */
(function () {
  'use strict';
  var CN = window.CN;
  var TOPO = {
    one: { switches: { S: [330, 160] }, hosts: { A: ['S', 1, 330, 40], B: ['S', 2, 520, 90], C: ['S', 3, 520, 230], D: ['S', 4, 330, 290], E: ['S', 5, 140, 230], F: ['S', 6, 140, 90] }, trunks: [] },
    two: { switches: { S1: [220, 160], S2: [470, 160] }, hosts: { A: ['S1', 1, 80, 60], B: ['S1', 2, 60, 160], C: ['S1', 3, 80, 260], D: ['S2', 1, 610, 60], E: ['S2', 2, 630, 160], F: ['S2', 3, 610, 260] }, trunks: [['S1', 4, 'S2', 4]] }
  };
  function simulate(topoKey, seq) {
    var T = TOPO[topoKey], tables = {}, steps = [], k = 0;
    Object.keys(T.switches).forEach(function (s) { tables[s] = {}; });
    var frames = seq.split(',').map(function (x) { var m = x.trim().toUpperCase().match(/^([A-F])\s*>\s*([A-F*])$/); return m ? [m[1], m[2]] : null; }).filter(Boolean);
    function portsOf(sw) {
      var ps = [];
      Object.keys(T.hosts).forEach(function (h) { if (T.hosts[h][0] === sw) ps.push(T.hosts[h][1]); });
      T.trunks.forEach(function (tr) { if (tr[0] === sw) ps.push(tr[1]); if (tr[2] === sw) ps.push(tr[3]); });
      return ps.sort();
    }
    function whatOnPort(sw, p) {
      for (var h in T.hosts) if (T.hosts[h][0] === sw && T.hosts[h][1] === p) return { host: h };
      for (var i = 0; i < T.trunks.length; i++) { var tr = T.trunks[i]; if (tr[0] === sw && tr[1] === p) return { sw: tr[2], port: tr[3] }; if (tr[2] === sw && tr[3] === p) return { sw: tr[0], port: tr[1] }; }
      return null;
    }
    frames.forEach(function (f) {
      k++;
      var src = f[0], dst = f[1], links = [], log = [], delivered = [];
      // process at switches, starting with the source's switch
      var queue = [{ sw: T.hosts[src][0], inPort: T.hosts[src][1] }];
      links.push(src + '|' + T.hosts[src][0]);
      while (queue.length) {
        var q = queue.shift(), tab = tables[q.sw];
        var learnedNew = !tab[src] || tab[src].port !== q.inPort;
        tab[src] = { port: q.inPort, time: k };
        var action, outs = [];
        if (dst === '*' || !tab[dst]) {
          outs = portsOf(q.sw).filter(function (p) { return p !== q.inPort; });
          action = (dst === '*' ? 'broadcast' : 'unknown destination') + ': flood out of ports ' + outs.join(', ');
        } else if (tab[dst].port === q.inPort) {
          action = 'destination ' + dst + ' is on the incoming port ' + q.inPort + ': filter (discard)';
        } else {
          outs = [tab[dst].port];
          action = dst + ' is known on port ' + tab[dst].port + ': forward only there';
        }
        log.push('<b>' + q.sw + '</b>: ' + (learnedNew ? 'learns ' + src + ' → port ' + q.inPort : 'refreshes ' + src + ' → port ' + q.inPort) + '; ' + action + '.');
        outs.forEach(function (p) {
          var w = whatOnPort(q.sw, p);
          if (!w) return;
          if (w.host) { links.push(w.host + '|' + q.sw); delivered.push(w.host); }
          else { links.push(q.sw + '|' + w.sw); queue.push({ sw: w.sw, inPort: w.port }); }
        });
      }
      var snap = {}; Object.keys(tables).forEach(function (s) { snap[s] = JSON.parse(JSON.stringify(tables[s])); });
      steps.push({ t: k, title: src + ' sends a frame to ' + (dst === '*' ? 'everyone (broadcast)' : dst), text: log.join(' ') + ' Frame reaches: ' + (delivered.length ? delivered.join(', ') : 'nobody else') + (dst !== '*' && delivered.length > 1 ? ' (only ' + dst + ' keeps it; the other adapters discard it).' : '.'), links: links, tables: snap, src: src, dst: dst });
    });
    return { steps: steps, topo: T };
  }

  var stage = CN.$('#stage'), cur = null;
  var player = new CN.Player({ steps: [], unitMs: 1200, render: draw, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function draw(T, idx) {
    if (!cur) return;
    var tp = cur.topo, o = [], i = Math.ceil(T) - 1, frac = T - Math.floor(T);
    if (T > 0 && frac === 0) frac = 1;
    var st = cur.steps[i] || null;
    var active = {}; if (st) st.links.forEach(function (l) { active[l] = 1; });
    function link(a, b, x1, y1, x2, y2, label) {
      var on = active[a + '|' + b] || active[b + '|' + a];
      o.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + (on ? 'g-hl' : 'g-edge') + '"/>');
      if (label) o.push('<text x="' + (x1 + (x2 - x1) * 0.25) + '" y="' + (y1 + (y2 - y1) * 0.25 - 4) + '" class="c-muted c-halo" text-anchor="middle">' + label + '</text>');
    }
    Object.keys(tp.hosts).forEach(function (h) { var d = tp.hosts[h], S = tp.switches[d[0]]; link(h, d[0], S[0], S[1], d[2], d[3], 'port ' + d[1]); });
    tp.trunks.forEach(function (tr) { var A = tp.switches[tr[0]], B = tp.switches[tr[2]]; link(tr[0], tr[2], A[0], A[1], B[0], B[1], 'port ' + tr[1] + ' ↔ ' + tr[3]); });
    Object.keys(tp.switches).forEach(function (s) { var P = tp.switches[s]; o.push('<rect x="' + (P[0] - 34) + '" y="' + (P[1] - 18) + '" width="68" height="36" rx="6" class="g-box"/><text x="' + P[0] + '" y="' + (P[1] + 5) + '" class="g-label" text-anchor="middle">' + s + '</text>'); });
    Object.keys(tp.hosts).forEach(function (h) {
      var d = tp.hosts[h], isSrc = st && st.src === h, isDst = st && (st.dst === h);
      o.push('<rect x="' + (d[2] - 22) + '" y="' + (d[3] - 15) + '" width="44" height="30" rx="5" class="' + (isSrc ? 'g-node-hl' : 'g-host') + '"' + (isDst ? ' style="stroke-width:3"' : '') + '/><text x="' + d[2] + '" y="' + (d[3] + 5) + '" class="g-label" text-anchor="middle">' + h + '</text>');
    });
    if (st && frac < 1) {
      var sd = tp.hosts[st.src], sw = tp.switches[sd[0]];
      var f = Math.min(1, frac * 2), x = sd[2] + (sw[0] - sd[2]) * f, y = sd[3] + (sw[1] - sd[3]) * f;
      o.push('<rect x="' + (x - 16) + '" y="' + (y - 9) + '" width="32" height="18" rx="3" class="tl-chip data"/><text x="' + x + '" y="' + (y + 4) + '" class="tl-chipt" text-anchor="middle">' + st.src + '→' + st.dst + '</text>');
    }
    stage.innerHTML = '<svg viewBox="0 0 680 330" role="img" aria-label="Switched LAN" style="width:100%;height:auto;min-width:480px">' + o.join('') + '</svg>';
    void idx;
  }
  function paint(i) {
    if (!cur) return;
    var st = cur.steps[i], tabs = st ? st.tables : null;
    var h = '';
    Object.keys(cur.topo.switches).forEach(function (s) {
      var tb = tabs ? tabs[s] : {}, keys = Object.keys(tb || {}).sort();
      h += '<span class="k">Switch table of ' + s + '</span><div class="tw"><table><thead><tr><th>MAC (host)</th><th>Interface</th><th>Learned at frame</th></tr></thead><tbody>' + (keys.length ? keys.map(function (m) { return '<tr' + (st && m === st.src ? ' class="hl"' : '') + '><td>' + m + '</td><td>' + tb[m].port + '</td><td>' + tb[m].time + '</td></tr>'; }).join('') : '<tr><td colspan="3"><i>empty</i></td></tr>') + '</tbody></table></div>';
    });
    CN.$('#state').innerHTML = h;
  }
  function run() {
    cur = simulate(CN.$('#topo').value, CN.$('#seq').value || 'B>E');
    player.introText = 'All switch tables start empty. Press Play or Next to send the first frame.';
    player.load(cur.steps);
  }
  CN.$('#topo').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', run);
  run();
})();

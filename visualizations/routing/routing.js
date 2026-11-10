/* Routing visualizer: Dijkstra (link state), synchronous distance vector (with link-cost
   changes and poisoned reverse), and hop-by-hop forwarding. */
(function () {
  'use strict';
  var CN = window.CN, INF = Infinity;
  var PRESETS = {
    kurose: { pos: { u: [70, 160], v: [230, 60], w: [420, 60], x: [230, 260], y: [420, 260], z: [580, 160] }, edges: 'u-v 2, u-x 1, u-w 5, v-x 2, v-w 3, x-w 3, x-y 1, w-y 1, w-z 5, y-z 2', src: 'u', dst: 'z', change: '', poison: false },
    end25: { pos: { A: [70, 160], B: [260, 60], C: [260, 260], D: [470, 60], E: [470, 260] }, edges: 'A-B 2, A-C 5, B-C 1, B-D 2, C-D 3, C-E 1, D-E 4', src: 'A', dst: 'E', change: '', poison: false },
    xyz: { pos: { X: [110, 160], Y: [360, 60], Z: [360, 260] }, edges: 'X-Y 2, Y-Z 1, X-Z 7', src: 'X', dst: 'Z', change: '', poison: false },
    cti: { pos: { x: [110, 160], y: [360, 60], z: [360, 260] }, edges: 'x-y 4, y-z 1, z-x 50', src: 'y', dst: 'x', change: 'x-y 60', poison: false },
    four: { pos: { x: [80, 160], y: [280, 60], z: [280, 260], w: [480, 160] }, edges: 'x-y 4, x-z 50, y-w 1, z-w 1, y-z 3', src: 'y', dst: 'x', change: 'x-y 60', poison: true }
  };
  var G = null, cur = null;

  function parseEdges(s) {
    var edges = [], nodes = {};
    s.split(',').forEach(function (part) {
      var m = part.trim().match(/^([A-Za-z0-9]+)\s*-\s*([A-Za-z0-9]+)\s+(\d+(?:\.\d+)?)$/);
      if (!m) return;
      edges.push({ a: m[1], b: m[2], c: +m[3] });
      nodes[m[1]] = 1; nodes[m[2]] = 1;
    });
    return { edges: edges, nodes: Object.keys(nodes).sort() };
  }
  function graph(presetKey) {
    var p = PRESETS[presetKey];
    var g = parseEdges(CN.$('#edges').value);
    if (!g.nodes.length) g = parseEdges(PRESETS.kurose.edges);
    var pos = {};
    var usePreset = p && g.nodes.every(function (n) { return p.pos[n]; });
    g.nodes.forEach(function (n, i) {
      if (usePreset) pos[n] = p.pos[n];
      else { var a = 2 * Math.PI * i / g.nodes.length - Math.PI / 2; pos[n] = [330 + 240 * Math.cos(a), 160 + 120 * Math.sin(a)]; }
    });
    g.pos = pos;
    return g;
  }
  function cost(g, a, b) {
    for (var i = 0; i < g.edges.length; i++) { var e = g.edges[i]; if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) return e.c; }
    return INF;
  }
  function nbrs(g, n) {
    var out = [];
    g.edges.forEach(function (e) { if (e.a === n) out.push(e.b); else if (e.b === n) out.push(e.a); });
    return out.sort();
  }
  function fmt(v) { return v === INF ? '∞' : String(Math.round(v * 100) / 100); }

  /* ---------- Dijkstra ---------- */
  function dijkstra(g, src) {
    var D = {}, P = {}, Np = [src], steps = [], rows = [];
    g.nodes.forEach(function (v) { if (v !== src) { D[v] = cost(g, src, v); P[v] = D[v] < INF ? src : null; } });
    function row(changed) { var r = { np: Np.slice(), D: Object.assign({}, D), P: Object.assign({}, P), changed: changed || {} }; rows.push(r); return r; }
    row({});
    steps.push({ t: 1, title: 'Initialise: N′ = {' + src + '}', text: 'D(v) = c(' + src + ', v) for each neighbour of ' + src + ' (' + nbrs(g, src).join(', ') + '), ∞ for all other nodes; p(v) = ' + src + ' for the neighbours.', row: 0 });
    var k = 1;
    while (Np.length < g.nodes.length) {
      var w = null;
      g.nodes.forEach(function (v) { if (Np.indexOf(v) < 0 && (w === null || D[v] < D[w])) w = v; });
      if (w === null || D[w] === INF) break;
      var ties = g.nodes.filter(function (v) { return Np.indexOf(v) < 0 && D[v] === D[w]; });
      Np.push(w);
      var changed = {}, notes = [];
      nbrs(g, w).forEach(function (v) {
        if (Np.indexOf(v) >= 0) return;
        var alt = D[w] + cost(g, w, v);
        if (alt < D[v]) { notes.push('D(' + v + ') = min(' + fmt(D[v]) + ', ' + fmt(D[w]) + ' + ' + cost(g, w, v) + ') = ' + fmt(alt) + ' via ' + w); D[v] = alt; P[v] = w; changed[v] = 1; }
        else notes.push('D(' + v + ') stays ' + fmt(D[v]) + ' (' + fmt(D[w]) + ' + ' + cost(g, w, v) + ' = ' + fmt(alt) + ' is not smaller)');
      });
      row(changed);
      steps.push({ t: k + 1, title: 'Step ' + k + ': add ' + w + ' (D = ' + fmt(D[w]) + ') to N′', text: w + ' has the smallest D among nodes not yet in N′' + (ties.length > 1 ? ' (a tie with ' + ties.filter(function (x) { return x !== w; }).join(', ') + ', broken alphabetically)' : '') + '. Update its neighbours: ' + (notes.length ? notes.join('; ') : 'none left outside N′') + '.', row: rows.length - 1 });
      k++;
    }
    return { D: D, P: P, rows: rows, steps: steps };
  }
  function firstHop(P, src, dst) {
    var v = dst, prev = null, guard = 0;
    while (v !== src && v !== null && guard++ < 50) { prev = v; v = P[v]; }
    return v === src ? prev : null;
  }
  function pathTo(P, src, dst) {
    var path = [dst], v = dst, guard = 0;
    while (v !== src && guard++ < 50) { v = P[v]; if (v === null || v === undefined) return null; path.unshift(v); }
    return path;
  }

  /* ---------- distance vector, synchronous rounds ---------- */
  function dv(g, change, poison) {
    var Ns = g.nodes, D = {}, NH = {}, steps = [], snaps = [];
    Ns.forEach(function (n) { D[n] = {}; NH[n] = {}; Ns.forEach(function (d) { var c = n === d ? 0 : cost(g, n, d); D[n][d] = c; NH[n][d] = n === d ? n : (c < INF ? d : null); }); });
    function snap(changed) { snaps.push({ D: JSON.parse(JSON.stringify(D, function (k, v) { return v === INF ? 'INF' : v; })), NH: JSON.parse(JSON.stringify(NH)), changed: changed || {}, g: g.edges.map(function (e) { return Object.assign({}, e); }) }); }
    function getD(s, n, d) { var v = s.D[n][d]; return v === 'INF' ? INF : v; }
    snap({});
    steps.push({ t: 1, title: 'Round 0: each router knows only its own links', text: 'D_x(y) = c(x, y) for neighbours, ∞ otherwise. Every router sends this vector to its neighbours.', snap: 0 });
    function round(label) {
      var newD = {}, newNH = {}, changed = {}, log = [];
      Ns.forEach(function (n) {
        newD[n] = {}; newNH[n] = {};
        Ns.forEach(function (d) {
          if (n === d) { newD[n][d] = 0; newNH[n][d] = n; return; }
          var best = INF, bh = null;
          nbrs(g, n).forEach(function (m) {
            var adv = (poison && NH[m][d] === n && m !== d) ? INF : D[m][d];
            var v = cost(g, n, m) + adv;
            if (v < best || (v === best && bh !== null && m < bh)) { best = v; bh = m; }
          });
          newD[n][d] = best; newNH[n][d] = best < INF ? bh : null;
          if (best !== D[n][d] || newNH[n][d] !== NH[n][d]) { changed[n + '>' + d] = 1; log.push(n + ': D(' + d + ') ' + fmt(D[n][d]) + ' → ' + fmt(best) + (bh ? ' via ' + bh : '')); }
        });
      });
      D = newD; NH = newNH;
      snap(changed);
      return log;
    }
    var r = 1, t = 2, maxR = 70;
    while (r < maxR) {
      var log = round();
      if (!log.length) { steps.push({ t: t++, title: 'Round ' + r + ': no vector changes: converged', text: 'Every router recomputed D_x(y) = min_v { c(x, v) + D_v(y) } and nothing changed, so no new vectors are sent. The algorithm is quiet.', snap: snaps.length - 1 }); break; }
      steps.push({ t: t++, title: 'Round ' + r + ': ' + log.length + ' entr' + (log.length === 1 ? 'y changes' : 'ies change'), text: log.join('; ') + '.', snap: snaps.length - 1 });
      r++;
    }
    var changeIdx = null;
    if (change) {
      var m = change.trim().match(/^([A-Za-z0-9]+)\s*-\s*([A-Za-z0-9]+)\s+(\d+(?:\.\d+)?)$/);
      if (m) {
        var old = cost(g, m[1], m[2]);
        g.edges.forEach(function (e) { if ((e.a === m[1] && e.b === m[2]) || (e.a === m[2] && e.b === m[1])) e.c = +m[3]; });
        snap({ link: m[1] + '-' + m[2] });
        changeIdx = steps.length;
        steps.push({ t: t++, title: 'Link cost c(' + m[1] + ', ' + m[2] + ') changes ' + fmt(old) + ' → ' + m[3], text: (+m[3] < old ? 'Good news: the cost fell. Watch how quickly it spreads.' : 'Bad news: the cost rose. The routers next to the link notice at once; the others still hold old, now-wrong estimates.') + (poison ? ' Poisoned reverse is on: a router advertises ∞ to the neighbour it routes through.' : ''), snap: snaps.length - 1, link: m[1] + '-' + m[2] });
        var r2 = 1;
        while (r2 < maxR) {
          var log2 = round();
          if (!log2.length) { steps.push({ t: t++, title: 'Round ' + r2 + ' after the change: converged', text: 'No vector changed, so the algorithm is quiet again after ' + (r2 - 1) + ' round(s) with changes.', snap: snaps.length - 1 }); break; }
          steps.push({ t: t++, title: 'Round ' + r2 + ' after the change: ' + log2.length + ' change' + (log2.length === 1 ? '' : 's'), text: log2.join('; ') + '.', snap: snaps.length - 1 });
          r2++;
        }
        if (r2 >= maxR) steps.push({ t: t++, title: 'Stopped after ' + maxR + ' rounds', text: 'The costs are still counting up: this is count-to-infinity.', snap: snaps.length - 1 });
      }
    }
    return { steps: steps, snaps: snaps, changeIdx: changeIdx };
  }

  /* ---------- drawing ---------- */
  var stage = CN.$('#stage');
  function drawGraph(opts) {
    var g = G, o = [], W = 660, H = 330;
    o.push('<defs><marker id="rA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--mark)"/></marker></defs>');
    (opts.edges || g.edges).forEach(function (e) {
      var A = g.pos[e.a], B = g.pos[e.b];
      var hl = opts.tree && (opts.tree[e.a + '-' + e.b] || opts.tree[e.b + '-' + e.a]);
      var ch = opts.link && (opts.link === e.a + '-' + e.b || opts.link === e.b + '-' + e.a);
      o.push('<line x1="' + A[0] + '" y1="' + A[1] + '" x2="' + B[0] + '" y2="' + B[1] + '" class="' + (hl ? 'g-hl' : 'g-edge') + '"' + (ch ? ' style="stroke:var(--bad);stroke-width:3"' : '') + '/>');
      var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[1] - A[1], dy = -(B[0] - A[0]), dl = Math.hypot(dx, dy) || 1;
      o.push('<text x="' + (mx + dx / dl * 13) + '" y="' + (my + dy / dl * 13 + 4) + '" class="g-cost c-halo" text-anchor="middle">' + e.c + '</text>');
    });
    if (opts.arrows) opts.arrows.forEach(function (a) {
      var A = g.pos[a[0]], B = g.pos[a[1]]; if (!A || !B) return;
      var d = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / d, uy = (B[1] - A[1]) / d;
      o.push('<line x1="' + (A[0] + ux * 22 + uy * 6) + '" y1="' + (A[1] + uy * 22 - ux * 6) + '" x2="' + (B[0] - ux * 24 + uy * 6) + '" y2="' + (B[1] - uy * 24 - ux * 6) + '" stroke="var(--mark)" stroke-width="2" marker-end="url(#rA)"/>');
    });
    g.nodes.forEach(function (n) {
      var P = g.pos[n], on = opts.inN && opts.inN.indexOf(n) >= 0, sel = opts.sel === n;
      o.push('<circle cx="' + P[0] + '" cy="' + P[1] + '" r="19" class="' + (on || sel ? 'g-node-hl' : 'g-node') + '"' + (sel ? ' style="stroke-width:3"' : '') + '/>');
      o.push('<text x="' + P[0] + '" y="' + (P[1] + 5) + '" class="g-label" text-anchor="middle">' + CN.esc(n) + '</text>');
      if (opts.labels && opts.labels[n]) o.push('<text x="' + P[0] + '" y="' + (P[1] + 36) + '" class="c-text c-halo" text-anchor="middle">' + CN.esc(opts.labels[n]) + '</text>');
    });
    if (opts.packet) o.push('<circle cx="' + opts.packet[0] + '" cy="' + opts.packet[1] + '" r="9" fill="var(--bad)" stroke="var(--panel)" stroke-width="2"/>');
    if (opts.caption) o.push('<text x="12" y="' + (H - 10) + '" class="c-muted">' + CN.esc(opts.caption) + '</text>');
    stage.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Network graph" style="width:100%;height:auto;min-width:480px">' + o.join('') + '</svg>';
  }

  var player = new CN.Player({ steps: [], unitMs: 650, render: render, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);

  function render(T, idx) {
    if (!cur) return;
    var i = Math.max(-1, Math.min(cur.steps.length - 1, idx));
    if (cur.algo === 'ls') {
      var row = cur.res.rows[i >= 0 ? cur.res.steps[i].row : 0];
      var tree = {}, labels = {};
      row.np.forEach(function (v) { if (row.P[v]) tree[row.P[v] + '-' + v] = 1; });
      G.nodes.forEach(function (v) { if (v === cur.src) labels[v] = 'source'; else labels[v] = fmt(row.D[v]) + (row.P[v] ? ', ' + row.P[v] : ''); });
      drawGraph({ inN: row.np, tree: tree, labels: labels, sel: cur.src, caption: 'Filled nodes are in N′. Thick links are the least-cost tree so far. Labels: D(v), p(v).' });
    } else if (cur.algo === 'dv') {
      var s = cur.res.snaps[i >= 0 ? cur.res.steps[i].snap : 0], dst = cur.dst, arrows = [], labels2 = {};
      G.nodes.forEach(function (n) { var nh = s.NH[n][dst]; var v = s.D[n][dst]; labels2[n] = (n === dst ? 'destination' : 'D(' + dst + ') = ' + (v === 'INF' ? '∞' : v)); if (n !== dst && nh && nh !== n) arrows.push([n, nh]); });
      drawGraph({ edges: s.g, arrows: arrows, labels: labels2, sel: cur.src, link: (cur.res.steps[i] || {}).link, caption: 'Ochre arrows: each router\'s next hop towards ' + dst + '. Arrows pointing at each other = a routing loop.' });
    } else {
      var path = cur.path, f = Math.max(0, Math.min(path.length - 1, T));
      var k = Math.floor(f), frac = f - k, A = G.pos[path[k]], B = G.pos[path[Math.min(path.length - 1, k + 1)]];
      var pk = [A[0] + (B[0] - A[0]) * frac, A[1] + (B[1] - A[1]) * frac];
      var tree2 = {}; for (var q = 0; q + 1 < path.length; q++) tree2[path[q] + '-' + path[q + 1]] = 1;
      drawGraph({ tree: tree2, packet: pk, sel: cur.dst, inN: path.slice(0, k + 1), caption: 'Each router looks up the destination in its own forwarding table and sends the packet to the next hop.' });
    }
  }
  function paint(i) {
    if (!cur) return;
    var st = CN.$('#state');
    if (cur.algo === 'ls') {
      var others = G.nodes.filter(function (v) { return v !== cur.src; });
      var upto = i >= 0 ? cur.res.steps[i].row : 0;
      var h = '<div class="tw"><table><thead><tr><th>Step</th><th>N′</th>' + others.map(function (v) { return '<th>D(' + v + '),p(' + v + ')</th>'; }).join('') + '</tr></thead><tbody>';
      cur.res.rows.forEach(function (r, k) {
        if (k > upto) return;
        h += '<tr' + (k === upto ? ' class="hl"' : '') + '><td>' + k + '</td><td class="mono">' + r.np.join('') + '</td>' + others.map(function (v) {
          var prevIn = k > 0 && cur.res.rows[k - 1].np.indexOf(v) >= 0;
          if (prevIn) return '<td></td>';
          var txt = fmt(r.D[v]) + (r.P[v] && r.D[v] < INF ? ', ' + r.P[v] : '');
          return '<td class="mono">' + (r.changed[v] ? '<b>' + txt + '</b>' : txt) + '</td>';
        }).join('') + '</tr>';
      });
      h += '</tbody></table></div>';
      if (i === cur.steps.length - 1) {
        h += '<span class="k">Forwarding table at ' + cur.src + '</span><div class="tw"><table><thead><tr><th>Destination</th><th>Cost</th><th>Path</th><th>Link</th></tr></thead><tbody>' + others.map(function (v) {
          var p = pathTo(cur.res.P, cur.src, v), fh = firstHop(cur.res.P, cur.src, v);
          return '<tr><td>' + v + '</td><td>' + fmt(cur.res.D[v]) + '</td><td class="mono">' + (p ? p.join('→') : '—') + '</td><td class="mono">' + (fh ? '(' + cur.src + ', ' + fh + ')' : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      }
      st.innerHTML = h;
    } else if (cur.algo === 'dv') {
      var s = cur.res.snaps[i >= 0 ? cur.res.steps[i].snap : 0], n = cur.src;
      var h2 = '<span class="k">Distance table at router ' + n + ' (own vector recomputed; neighbours\' vectors as received)</span><div class="tw"><table><thead><tr><th>From \\ to</th>' + G.nodes.map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr></thead><tbody>';
      h2 += '<tr class="hl"><td><b>' + n + '</b></td>' + G.nodes.map(function (d) { var v = s.D[n][d]; var c = s.changed[n + '>' + d]; return '<td class="mono">' + (c ? '<b>' : '') + (v === 'INF' ? '∞' : v) + (s.NH[n][d] && d !== n ? ' <small>via ' + s.NH[n][d] + '</small>' : '') + (c ? '</b>' : '') + '</td>'; }).join('') + '</tr>';
      nbrs(G, n).forEach(function (m) { h2 += '<tr><td>' + m + '</td>' + G.nodes.map(function (d) { var v = s.D[m][d]; return '<td class="mono">' + (v === 'INF' ? '∞' : v) + '</td>'; }).join('') + '</tr>'; });
      h2 += '</tbody></table></div><span class="k">All routers\' distance vectors</span><div class="tw"><table><thead><tr><th>Router</th>' + G.nodes.map(function (d) { return '<th>to ' + d + '</th>'; }).join('') + '</tr></thead><tbody>';
      G.nodes.forEach(function (r) { h2 += '<tr><td>' + r + '</td>' + G.nodes.map(function (d) { var v = s.D[r][d], c = s.changed[r + '>' + d]; return '<td class="mono">' + (c ? '<b>' : '') + (v === 'INF' ? '∞' : v) + (c ? '</b>' : '') + '</td>'; }).join('') + '</tr>'; });
      st.innerHTML = h2 + '</tbody></table></div><p class="srcline">Bold = changed in this round. Change “Source / router” to inspect another router\'s table.</p>';
    } else {
      var hop = Math.max(0, i), r0 = cur.path[Math.min(hop, cur.path.length - 1)];
      var res = dijkstra(G, r0), fh2 = firstHop(res.P, r0, cur.dst);
      st.innerHTML = '<span class="k">Forwarding table at ' + r0 + '</span><div class="tw"><table><thead><tr><th>Destination</th><th>Next hop</th><th>Cost</th></tr></thead><tbody>' + G.nodes.filter(function (v) { return v !== r0; }).map(function (v) { var f = firstHop(res.P, r0, v); return '<tr' + (v === cur.dst ? ' class="hl"' : '') + '><td>' + v + '</td><td>' + (f || '—') + '</td><td>' + fmt(res.D[v]) + '</td></tr>'; }).join('') + '</tbody></table></div>' + (r0 === cur.dst ? '<p class="okmsg">Delivered.</p>' : '<p>Lookup ' + cur.dst + ' → next hop <b>' + fh2 + '</b>.</p>');
    }
  }
  function fillNodeSelects() {
    var s = CN.$('#src'), d = CN.$('#dst'), sv = s.value, dv0 = d.value;
    var opts = G.nodes.map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
    s.innerHTML = opts; d.innerHTML = opts;
    if (G.nodes.indexOf(sv) >= 0) s.value = sv;
    if (G.nodes.indexOf(dv0) >= 0) d.value = dv0;
  }
  function run(keepSel) {
    var pk = CN.$('#preset').value;
    G = graph(pk);
    fillNodeSelects();
    if (!keepSel && PRESETS[pk]) { CN.$('#src').value = PRESETS[pk].src; CN.$('#dst').value = PRESETS[pk].dst; }
    var algo = CN.$('#algo').value, src = CN.$('#src').value, dst = CN.$('#dst').value;
    cur = { algo: algo, src: src, dst: dst };
    if (algo === 'ls') {
      cur.res = dijkstra(G, src);
      cur.steps = cur.res.steps;
    } else if (algo === 'dv') {
      cur.res = dv(G, CN.$('#change').value, CN.$('#poison').checked);
      cur.steps = cur.res.steps;
    } else {
      var res = dijkstra(G, src), path = pathTo(res.P, src, dst) || [src];
      cur.path = path;
      cur.steps = path.slice(1).map(function (n, k) {
        var at = path[k];
        return { t: k + 1, title: at + ' forwards to ' + n, text: 'Router ' + at + ' looks up destination ' + dst + ' in its forwarding table: next hop ' + n + ' (least-cost path ' + path.join('→') + ', total cost ' + fmt(res.D[dst]) + ').' };
      });
      if (!cur.steps.length) cur.steps = [{ t: 0, title: 'Source and destination are the same', text: '' }];
    }
    player.load(cur.steps);
  }
  CN.$('#preset').addEventListener('change', function (e) {
    var p = PRESETS[e.target.value];
    if (p) { CN.$('#edges').value = p.edges; CN.$('#change').value = p.change; CN.$('#poison').checked = p.poison; }
    run(false);
  });
  CN.$('#algo').addEventListener('change', function () { run(true); });
  CN.$('#src').addEventListener('change', function () { run(true); });
  CN.$('#dst').addEventListener('change', function () { run(true); });
  CN.$('#poison').addEventListener('change', function () { run(true); });
  CN.$('#apply').addEventListener('click', function () { CN.$('#preset').value = 'custom'; run(true); });
  run(false);
})();

/* TCP congestion window simulator: round-based Tahoe / Reno model used in exam questions. */
(function () {
  'use strict';
  var CN = window.CN;
  var PRESETS = {
    p40: { variant: 'reno', cw0: 1, ss0: 32, rounds: 26, events: '16:3dup, 22:timeout', plus3: true },
    end25: { variant: 'tahoe', cw0: 1, ss0: 16, rounds: 14, events: '10:3dup', plus3: true },
    mid25: { variant: 'reno', cw0: 1, ss0: 8, rounds: 10, events: '5:timeout', plus3: true },
    jan23: { variant: 'reno', cw0: 2, ss0: 8, rounds: 10, events: '5:timeout', plus3: true },
    compare: { variant: 'reno', cw0: 1, ss0: 8, rounds: 16, events: '8:3dup', plus3: true, compare: true }
  };

  function parseEvents(s) {
    var m = {};
    (s || '').split(/[\s,;]+/).filter(Boolean).forEach(function (x) {
      var p = x.split(':'), r = parseInt(p[0], 10), ty = (p[1] || '').toLowerCase();
      if (!isNaN(r)) m[r] = /^t/.test(ty) ? 'timeout' : '3dup';
    });
    return m;
  }
  function model(c, variant) {
    var ev = parseEvents(c.events), cw = c.cw0, ss = c.ss0, cum = 0, rows = [], after = null;
    for (var r = 1; r <= c.rounds; r++) {
      var phase = cw < ss ? 'Slow start' : 'Congestion avoidance';
      cum += cw;
      var row = { r: r, cw: cw, ss: ss, phase: phase, cum: cum, ev: ev[r] || null, after: after, note: '' };
      after = null;
      if (ev[r] === 'timeout') {
        var nss = Math.max(1, Math.floor(cw / 2));
        row.note = 'Timeout at the end of this round: ssthresh = ⌊' + cw + '/2⌋ = ' + nss + ', cwnd = ' + c.cw0 + ' (back to slow start).';
        ss = nss; cw = c.cw0; after = 'timeout';
      } else if (ev[r] === '3dup') {
        var nss2 = Math.max(1, Math.floor(cw / 2));
        if (variant === 'tahoe') {
          row.note = 'Triple duplicate ACK. Tahoe treats it like a timeout: ssthresh = ⌊' + cw + '/2⌋ = ' + nss2 + ', cwnd = ' + c.cw0 + ', slow start.';
          ss = nss2; cw = c.cw0;
        } else {
          var ncw = nss2 + (c.plus3 ? 3 : 0);
          row.note = 'Triple duplicate ACK: fast retransmit; Reno halves: ssthresh = ⌊' + cw + '/2⌋ = ' + nss2 + ', cwnd = ' + (c.plus3 ? nss2 + ' + 3 = ' + ncw : nss2) + ' (fast recovery, then linear growth).';
          ss = nss2; cw = ncw;
        }
        after = '3dup';
      } else if (cw < ss) {
        var nx = Math.min(2 * cw, ss);
        row.note = 'All ' + cw + ' segments acknowledged; slow start doubles cwnd to ' + (2 * cw > ss ? 'min(' + (2 * cw) + ', ssthresh) = ' + nx : nx) + '.';
        cw = nx;
      } else {
        row.note = 'Congestion avoidance: cwnd grows by 1 MSS per RTT, to ' + (cw + 1) + '.';
        cw = cw + 1;
      }
      rows.push(row);
    }
    return rows;
  }

  var host = CN.$('#stage');
  var cur = null;
  var player = new CN.Player({ steps: [], unitMs: 450, render: draw, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);

  function draw(T) {
    if (!cur) return;
    var A = cur.a, Bs = cur.b, R = cur.c.rounds;
    var all = A.concat(Bs || []), maxY = 0;
    all.forEach(function (x) { maxY = Math.max(maxY, x.cw, x.ss); });
    maxY = Math.max(4, Math.ceil(maxY * 1.12));
    var W = 760, H = 420, L = 50, Rm = 20, Tp = 30, Bm = 44;
    function sx(r) { return L + (r - 1) / Math.max(1, R - 1) * (W - L - Rm); }
    function sy(v) { return H - Bm - v / maxY * (H - Tp - Bm); }
    var o = [];
    var stepY = maxY > 40 ? 10 : maxY > 20 ? 5 : maxY > 10 ? 2 : 1;
    for (var v = 0; v <= maxY; v += stepY) o.push('<line x1="' + L + '" y1="' + sy(v) + '" x2="' + (W - Rm) + '" y2="' + sy(v) + '" class="c-grid"/><text x="' + (L - 6) + '" y="' + (sy(v) + 4) + '" class="c-muted" text-anchor="end">' + v + '</text>');
    var xstep = R > 30 ? 5 : R > 15 ? 2 : 1;
    for (var r = 1; r <= R; r += xstep) o.push('<text x="' + sx(r) + '" y="' + (H - Bm + 16) + '" class="c-muted" text-anchor="middle">' + r + '</text>');
    o.push('<text x="' + ((L + W) / 2) + '" y="' + (H - 8) + '" class="c-muted" text-anchor="middle">Transmission round (RTT)</text>');
    o.push('<text x="8" y="16" class="c-muted">cwnd (segments, MSS)</text>');
    var upto = Math.max(1, T);
    function series(rows, dash, labelSeries) {
      // ssthresh step line
      var d2 = '';
      rows.forEach(function (x, i) { if (x.r > Math.ceil(upto)) return; d2 += (i ? 'L' : 'M') + sx(x.r).toFixed(1) + ' ' + sy(x.ss).toFixed(1); if (i + 1 < rows.length && rows[i + 1].r <= Math.ceil(upto)) d2 += 'L' + sx(rows[i + 1].r).toFixed(1) + ' ' + sy(x.ss).toFixed(1); });
      if (!labelSeries) o.push('<path d="' + d2 + '" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="6 4"/>');
      var d = '';
      for (var i = 0; i < rows.length; i++) {
        var x = rows[i];
        if (x.r > upto + 1e-9) {
          if (i > 0 && x.r - 1 < upto) { var f = upto - (x.r - 1), p = rows[i - 1]; d += 'L' + (sx(p.r) + (sx(x.r) - sx(p.r)) * f).toFixed(1) + ' ' + (sy(p.cw) + (sy(x.cw) - sy(p.cw)) * f).toFixed(1); }
          break;
        }
        d += (i ? 'L' : 'M') + sx(x.r).toFixed(1) + ' ' + sy(x.cw).toFixed(1);
      }
      o.push('<path d="' + d + '" fill="none" stroke="' + (dash ? 'var(--mark)' : 'var(--ink)') + '" stroke-width="2"' + (dash ? ' stroke-dasharray="7 4"' : '') + '/>');
      rows.forEach(function (x) {
        if (x.r > upto + 1e-9) return;
        var col = x.after === 'timeout' ? 'var(--bad)' : x.after === '3dup' ? 'var(--mark)' : x.phase === 'Slow start' ? 'var(--good)' : 'var(--accent)';
        o.push('<circle cx="' + sx(x.r) + '" cy="' + sy(x.cw) + '" r="' + (dash ? 3.2 : 4.5) + '" fill="' + col + '"/>');
        if (x.ev && !dash) o.push('<text x="' + sx(x.r) + '" y="' + (sy(x.cw) - 10) + '" class="c-text" text-anchor="middle">' + (x.ev === 'timeout' ? 'timeout' : '3 dup ACKs') + '</text>');
      });
    }
    series(A, false);
    if (Bs) series(Bs, true, true);
    if (Bs) o.push('<text x="' + (W - Rm) + '" y="16" class="c-text" text-anchor="end">solid: ' + (cur.c.variant === 'tahoe' ? 'Tahoe' : 'Reno') + ' · dashed ochre: ' + (cur.c.variant === 'tahoe' ? 'Reno' : 'Tahoe') + ' · grey dashes: ssthresh</text>');
    else o.push('<text x="' + (W - Rm) + '" y="16" class="c-text" text-anchor="end">grey dashes: ssthresh</text>');
    host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Congestion window per transmission round" style="width:100%;height:auto;min-width:520px">' + o.join('') + '</svg>';
  }
  function paint(i) {
    if (!cur) return;
    var x = i >= 0 ? cur.a[Math.min(cur.a.length - 1, i)] : null;
    CN.$('#state').innerHTML = x ? '<div class="tw"><table><tbody><tr><td>Round</td><td class="mono">' + x.r + '</td></tr><tr><td>cwnd at start</td><td class="mono"><b>' + x.cw + '</b> MSS</td></tr><tr><td>ssthresh</td><td class="mono">' + x.ss + '</td></tr><tr><td>Phase</td><td>' + x.phase + '</td></tr><tr><td>Segments sent this round</td><td class="mono">' + x.cw + '</td></tr><tr><td>Cumulative segments</td><td class="mono">' + x.cum + '</td></tr></tbody></table></div>' : '';
    CN.$$('#cc-table tbody tr').forEach(function (tr, k) { tr.classList.toggle('hl', k === i); });
  }
  function table(c, a, b) {
    var other = c.variant === 'tahoe' ? 'Reno' : 'Tahoe';
    var h = '<div class="panel"><h3>Round-by-round table</h3><div class="tw"><table id="cc-table"><thead><tr><th>Round</th><th>cwnd</th><th>ssthresh</th><th>Phase</th><th>Sent</th><th>Cumulative</th><th>What happens at the end of the round</th>' + (b ? '<th>' + other + ' cwnd</th>' : '') + '</tr></thead><tbody>';
    a.forEach(function (x, k) {
      h += '<tr><td>' + x.r + '</td><td><b>' + x.cw + '</b></td><td>' + x.ss + '</td><td>' + x.phase + '</td><td>' + x.cw + '</td><td>' + x.cum + '</td><td>' + x.note + '</td>' + (b ? '<td>' + b[k].cw + '</td>' : '') + '</tr>';
    });
    return h + '</tbody></table></div></div>';
  }
  function cfg() {
    return { variant: CN.$('#variant').value, cw0: Math.max(1, +CN.$('#cw0').value || 1), ss0: Math.max(1, +CN.$('#ss0').value || 8), rounds: Math.max(2, Math.min(60, +CN.$('#rounds').value || 20)), events: CN.$('#events').value, plus3: CN.$('#plus3').checked, compare: CN.$('#preset').value === 'compare' };
  }
  function set(p) { CN.$('#variant').value = p.variant; CN.$('#cw0').value = p.cw0; CN.$('#ss0').value = p.ss0; CN.$('#rounds').value = p.rounds; CN.$('#events').value = p.events; CN.$('#plus3').checked = p.plus3; }
  function run() {
    var c = cfg();
    var a = model(c, c.variant), b = c.compare ? model(c, c.variant === 'tahoe' ? 'reno' : 'tahoe') : null;
    cur = { c: c, a: a, b: b };
    CN.$('#extra').innerHTML = table(c, a, b);
    var steps = a.map(function (x) { return { t: x.r, title: 'Round ' + x.r + ': cwnd = ' + x.cw + ' (' + x.phase + ')', text: 'The sender transmits ' + x.cw + ' segment' + (x.cw === 1 ? '' : 's') + ' (cumulative ' + x.cum + '); ssthresh = ' + x.ss + '. ' + x.note }; });
    player.introText = 'Initial cwnd = ' + c.cw0 + ' MSS, ssthresh = ' + c.ss0 + ' MSS, ' + (c.variant === 'tahoe' ? 'TCP Tahoe' : 'TCP Reno') + '. Press Play to draw the graph round by round.';
    player.load(steps);
    player.goTo(-1);
  }
  CN.$('#preset').addEventListener('change', function (e) { if (PRESETS[e.target.value]) set(PRESETS[e.target.value]); run(); });
  CN.$('#variant').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', function () { if (CN.$('#preset').value !== 'compare') CN.$('#preset').value = 'custom'; run(); });
  set(PRESETS.p40);
  run();
  player.goTo(cur.a.length - 1);
})();

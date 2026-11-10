/* RTT estimation and timeout visualizer (Kurose §3.5.3, RFC 6298). */
(function () {
  'use strict';
  var CN = window.CN;
  var GAP = 25;

  function r2(x) { return Math.round(x * 100) / 100; }
  function compute(c) {
    var E = c.e0, Dv = c.d0, rows = [];
    c.samples.forEach(function (S, i) {
      var Eold = E, Dold = Dv, TOold = Eold + 4 * Dold, Enew, Dnew, devTerm;
      if (c.order === 'rfc') {
        devTerm = Math.abs(S - Eold);
        Dnew = (1 - c.beta) * Dold + c.beta * devTerm;
        Enew = (1 - c.alpha) * Eold + c.alpha * S;
      } else {
        Enew = (1 - c.alpha) * Eold + c.alpha * S;
        devTerm = Math.abs(S - Enew);
        Dnew = (1 - c.beta) * Dold + c.beta * devTerm;
      }
      rows.push({ i: i + 1, S: S, Eold: Eold, Dold: Dold, TOold: TOold, E: Enew, D: Dnew, TO: Enew + 4 * Dnew, devTerm: devTerm, premature: S > TOold });
      E = Enew; Dv = Dnew;
    });
    return rows;
  }

  function build(c, rows) {
    var msgs = [], notes = [], timers = [], steps = [], t = 0;
    rows.forEach(function (r) {
      var s = t, half = r.S / 2;
      msgs.push({ from: 0, to: 1, t0: s, t1: s + half, label: 'segment ' + r.i, kind: 'data' });
      msgs.push({ from: 1, to: 0, t0: s + half, t1: s + r.S, label: 'ACK ' + r.i, kind: 'ack' });
      timers.push({ lane: 0, t0: s, t1: r.premature ? s + r.TOold : s + r.S, end: r.premature ? 'fired' : 'stopped', label: 'timeout ' + r2(r.TOold) + ' ms' });
      steps.push({ t: s, title: 'Send segment ' + r.i + '; arm timer for ' + r2(r.TOold) + ' ms', text: 'The timer uses the current TimeoutInterval = EstimatedRTT + 4·DevRTT = ' + r2(r.Eold) + ' + 4 × ' + r2(r.Dold) + ' = <b>' + r2(r.TOold) + ' ms</b>. TCP starts measuring this segment\'s SampleRTT now.', row: r, phase: 'sent' });
      if (r.premature) {
        notes.push({ lane: 0, t: s + r.TOold, text: 'premature timeout!', cls: 'bad' });
        steps.push({ t: s + r.TOold, title: 'Premature timeout at ' + r2(r.TOold) + ' ms', text: 'The ACK is still on its way (the true RTT is ' + r.S + ' ms), but the timer has already expired, so TCP would retransmit a segment that was not lost. Because of Karn\'s rule a real TCP would then not use this measurement; it would double the timeout. The table below still applies the formulas, as exam questions do.', row: r, phase: 'timeout' });
      }
      notes.push({ lane: 0, t: s + r.S, text: 'SampleRTT = ' + r.S + ' ms', cls: r.premature ? 'warn' : 'good' });
      var formula = c.order === 'rfc'
        ? 'DevRTT = (1 − β)·' + r2(r.Dold) + ' + β·|' + r.S + ' − ' + r2(r.Eold) + '| = ' + r2(r.D) + ' ms; then EstimatedRTT = (1 − α)·' + r2(r.Eold) + ' + α·' + r.S + ' = ' + r2(r.E) + ' ms'
        : 'EstimatedRTT = (1 − α)·' + r2(r.Eold) + ' + α·' + r.S + ' = ' + r2(r.E) + ' ms; then DevRTT = (1 − β)·' + r2(r.Dold) + ' + β·|' + r.S + ' − ' + r2(r.E) + '| = ' + r2(r.D) + ' ms';
      steps.push({ t: s + r.S, title: 'ACK ' + r.i + ' arrives: SampleRTT = ' + r.S + ' ms → new timeout ' + r2(r.TO) + ' ms', text: formula + '. New TimeoutInterval = ' + r2(r.E) + ' + 4 × ' + r2(r.D) + ' = <b>' + r2(r.TO) + ' ms</b>.', row: r, phase: 'ack' });
      t = s + Math.max(r.S, r.premature ? r.TOold : 0) + GAP;
    });
    return { lanes: [{ name: 'Sender', sub: 'measures SampleRTT' }, { name: 'Receiver', sub: 'returns ACKs' }], msgs: msgs, notes: notes, timers: timers, steps: steps };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 700, unitPx: 0.9, margin: 170 });
  var cur = null, rows = [];
  var player = new CN.Player({ steps: [], unitMs: 9, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);

  function paint(i) {
    var s = i >= 0 ? cur.steps[i] : null, r = s ? s.row : null, c = cur && cur.cfg;
    if (!c) return;
    var E = r ? (s.phase === 'ack' ? r.E : r.Eold) : c.e0, D = r ? (s.phase === 'ack' ? r.D : r.Dold) : c.d0;
    CN.$('#state').innerHTML = '<div class="tw"><table><tbody>' +
      '<tr><td>EstimatedRTT</td><td class="mono">' + r2(E) + ' ms</td></tr>' +
      '<tr><td>DevRTT</td><td class="mono">' + r2(D) + ' ms</td></tr>' +
      '<tr><td>TimeoutInterval</td><td class="mono"><b>' + r2(E + 4 * D) + ' ms</b></td></tr>' +
      '<tr><td>α, β</td><td class="mono">' + c.alpha + ', ' + c.beta + '</td></tr></tbody></table></div>';
    CN.$$('#rtt-table tbody tr').forEach(function (tr, k) { tr.classList.toggle('hl', !!r && k === r.i - 1); });
  }
  function chart(rows) {
    var W = 680, H = 280, L = 56, R = 16, T = 24, B = 40;
    var maxY = 0; rows.forEach(function (r) { maxY = Math.max(maxY, r.S, r.TO, r.TOold); });
    maxY *= 1.1;
    var n = rows.length;
    function sx(i) { return L + (n === 1 ? (W - L - R) / 2 : (i) * (W - L - R) / (n - 1)); }
    function sy(v) { return H - B - v / maxY * (H - T - B); }
    var o = [];
    for (var k = 0; k <= 5; k++) { var v = maxY * k / 5; o.push('<line x1="' + L + '" y1="' + sy(v) + '" x2="' + (W - R) + '" y2="' + sy(v) + '" class="c-grid"/><text x="' + (L - 6) + '" y="' + (sy(v) + 4) + '" class="c-muted" text-anchor="end">' + Math.round(v) + '</text>'); }
    function line(key, cls, dot) {
      var d = rows.map(function (r, i) { return (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(r[key]).toFixed(1); }).join('');
      o.push('<path d="' + d + '" class="' + cls + '"/>');
      rows.forEach(function (r, i) { o.push('<circle cx="' + sx(i) + '" cy="' + sy(r[key]) + '" r="3.5" class="' + dot + '"/>'); });
    }
    line('S', 'p-s1', 'p-d1'); line('E', 'p-s0', 'p-d0'); line('TO', 'p-s3', 'p-d3');
    rows.forEach(function (r, i) { o.push('<text x="' + sx(i) + '" y="' + (H - B + 16) + '" class="c-muted" text-anchor="middle">#' + r.i + '</text>'); if (r.premature) o.push('<text x="' + sx(i) + '" y="' + (sy(r.S) - 10) + '" class="c-text" text-anchor="middle" fill="var(--bad)">premature</text>'); });
    o.push('<text x="' + (L + 4) + '" y="14" class="c-text">— SampleRTT (ochre)   — EstimatedRTT (blue)   ··· TimeoutInterval (red)</text>');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="SampleRTT, EstimatedRTT and TimeoutInterval per sample" style="width:100%;height:auto">' + o.join('') + '</svg>';
  }
  function table(c, rows) {
    var h = '<div class="panel"><h3>Calculation table</h3><p class="srcline">Initial EstimatedRTT = ' + c.e0 + ' ms, DevRTT = ' + c.d0 + ' ms, α = ' + c.alpha + ', β = ' + c.beta + '; order: ' + (c.order === 'rfc' ? 'RFC 6298 (DevRTT uses the previous EstimatedRTT)' : 'textbook (DevRTT uses the new EstimatedRTT)') + '. Values carried at full precision, shown to 2 decimals.</p>';
    h += '<div class="tw"><table id="rtt-table"><thead><tr><th>#</th><th>SampleRTT</th><th>EstimatedRTT</th><th>|Sample − Est|</th><th>DevRTT</th><th>TimeoutInterval</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr><td>' + r.i + '</td><td>' + r.S + '</td><td>' + r2(r.E) + '</td><td>' + r2(r.devTerm) + '</td><td>' + r2(r.D) + '</td><td><b>' + r2(r.TO) + '</b>' + (r.premature ? ' <span class="badmsg">(sample exceeded the previous timeout ' + r2(r.TOold) + ')</span>' : '') + '</td></tr>';
    });
    h += '</tbody></table></div>' + chart(rows);
    h += '<h3 style="margin-top:14px">Working for each sample</h3>';
    rows.forEach(function (r) {
      h += '<p class="mono" style="font-size:13px;margin:0 0 6px">#' + r.i + ': ' + (c.order === 'rfc'
        ? 'DevRTT = ' + (1 - c.beta) + '×' + r2(r.Dold) + ' + ' + c.beta + '×|' + r.S + ' − ' + r2(r.Eold) + '| = ' + r2(r.D) + '; EstimatedRTT = ' + (1 - c.alpha) + '×' + r2(r.Eold) + ' + ' + c.alpha + '×' + r.S + ' = ' + r2(r.E)
        : 'EstimatedRTT = ' + (1 - c.alpha) + '×' + r2(r.Eold) + ' + ' + c.alpha + '×' + r.S + ' = ' + r2(r.E) + '; DevRTT = ' + (1 - c.beta) + '×' + r2(r.Dold) + ' + ' + c.beta + '×|' + r.S + ' − ' + r2(r.E) + '| = ' + r2(r.D)) +
        '; TimeoutInterval = ' + r2(r.E) + ' + 4×' + r2(r.D) + ' = ' + r2(r.TO) + '</p>';
    });
    return h + '</div>';
  }
  function cfg() {
    var samples = CN.$('#samples').value.split(/[\s,;]+/).map(Number).filter(function (x) { return x > 0; }).slice(0, 12);
    if (!samples.length) samples = [106, 120, 140, 90, 115];
    return { samples: samples, alpha: +CN.$('#alpha').value || 0.125, beta: +CN.$('#beta').value || 0.25, e0: +CN.$('#e0').value || 100, d0: +CN.$('#d0').value || 0, order: CN.$('#order').value };
  }
  function run() {
    var c = cfg();
    rows = compute(c);
    var m = build(c, rows);
    cur = { steps: m.steps, cfg: c };
    var mean = c.samples.reduce(function (a, b) { return a + b; }, 0) / c.samples.length;
    tl.unit = 70 / mean; tl.top = 70;
    tl.setModel(m);
    CN.$('#extra').innerHTML = table(c, rows);
    player.opts.unitMs = Math.max(4, 900 / mean);
    player.load(m.steps);
  }
  CN.$('#apply').addEventListener('click', run);
  CN.$('#order').addEventListener('change', run);
  run();
})();

/* Packet switching (store-and-forward) vs circuit switching, as a space–time diagram. */
(function () {
  'use strict';
  var CN = window.CN;
  function f3(x) { return Math.round(x * 1000) / 1000; }

  function build(c) {
    var n = c.links, lanes = [{ name: 'Host A', sub: 'source' }];
    for (var r = 1; r < n; r++) lanes.push({ name: 'R' + r, sub: 'router' });
    lanes.push({ name: 'Host B', sub: 'destination' });
    var msgs = [], notes = [], steps = [], bpms = c.R * 1000;   // bits per ms
    var calc = {};
    if (c.mode === 'circuit') {
      var Rc = bpms / c.slots, tx = c.F / Rc, half = c.setup / 2;
      msgs.push({ from: 0, to: n, t0: 0, t1: half, label: 'setup request', kind: 'ack' });
      msgs.push({ from: n, to: 0, t0: half, t1: c.setup, label: 'circuit established', kind: 'ack' });
      steps.push({ t: c.setup, title: 'Circuit set up: ' + c.setup + ' ms', text: 'Signalling reserves one of the ' + c.slots + ' FDM channels / TDM slots on every link of the path. Each circuit gets R / ' + c.slots + ' = ' + f3(c.R / c.slots) + ' Mbps.' });
      for (var i = 0; i < n; i++) msgs.push({ from: i, to: i + 1, t0: c.setup + i * c.prop, t1: c.setup + (i + 1) * c.prop, label: i === 0 ? 'bits stream through' : '', kind: 'ctrl', dur: tx });
      var end = c.setup + tx + n * c.prop;
      steps.push({ t: c.setup + tx / 2, title: 'Bits flow through every switch without being stored', text: 'A circuit switch passes each bit on immediately, so all links carry the file at the same time (only shifted by propagation delay).' });
      steps.push({ t: end, title: 'Last bit arrives at B: ' + f3(end) + ' ms', text: 'Total = setup + F / R<sub>c</sub> + propagation = ' + c.setup + ' + ' + f3(tx) + ' + ' + f3(n * c.prop) + ' = <b>' + f3(end) + ' ms</b>.' });
      calc = { total: end, rows: [['Circuit rate', 'R_c = R / slots = ' + c.R + ' Mbps / ' + c.slots + ' = ' + f3(c.R / c.slots) + ' Mbps'], ['Transmission', 'F / R_c = ' + c.F + ' / ' + f3(Rc * 1000) + ' bps = ' + f3(tx) + ' ms'], ['Propagation', n + ' × ' + c.prop + ' = ' + f3(n * c.prop) + ' ms'], ['Total', c.setup + ' + ' + f3(tx) + ' + ' + f3(n * c.prop) + ' = ' + f3(end) + ' ms']] };
      return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, calc: calc };
    }
    var P = c.mode === 'message' ? 1 : c.P;
    var payload = Math.ceil(c.F / P), L = payload + (c.mode === 'message' ? c.H : c.H), T = L / bpms;
    var free = []; for (var k = 0; k < n; k++) free.push(0);
    var arrive = [];
    var drawSet = {};
    if (P <= 12) for (var q = 0; q < P; q++) drawSet[q] = 1; else { drawSet[0] = drawSet[1] = drawSet[2] = drawSet[P - 1] = 1; }
    for (var j = 0; j < P; j++) {
      arrive[j] = [];
      var ready = 0;
      for (var li = 0; li < n; li++) {
        var start = Math.max(ready, free[li]);
        free[li] = start + T;
        var done = start + T + c.prop;
        arrive[j][li] = done;
        if (drawSet[j]) msgs.push({ from: li, to: li + 1, t0: start, t1: start + c.prop, label: (j < 3 || j === P - 1) && li === 0 ? (P === 1 ? 'message' : 'pkt ' + (j + 1)) : '', kind: 'data', dur: T });
        ready = done + (li + 1 < n ? c.proc : 0);
      }
    }
    var total = arrive[P - 1][n - 1];
    if (P > 12) notes.push({ lane: 0, t: arrive[2][0], text: 'packets 4–' + (P - 1) + ' not drawn', cls: 'info' });
    if (P <= 4) {
      for (var a = 0; a < P; a++) for (var b = 0; b < n; b++) steps.push({ t: arrive[a][b], title: (P === 1 ? 'Message' : 'Packet ' + (a + 1)) + ' fully received at ' + lanes[b + 1].name + ' (' + f3(arrive[a][b]) + ' ms)', text: b + 1 < n ? 'Store-and-forward: only now can ' + lanes[b + 1].name + ' start transmitting it on the next link' + (c.proc ? ' (after ' + c.proc + ' ms of processing)' : '') + '.' : 'It has crossed all ' + n + ' links.' });
      steps.sort(function (x, y) { return x.t - y.t; });
    } else {
      steps.push({ t: arrive[0][0], title: 'Packet 1 fully received at R1: ' + f3(arrive[0][0]) + ' ms', text: 'L / R = ' + L + ' / ' + bpms * 1000 + ' = ' + f3(T) + ' ms' + (c.prop ? ' plus ' + c.prop + ' ms propagation' : '') + '.' });
      steps.push({ t: arrive[1][0], title: 'Packet 2 fully received at R1: ' + f3(arrive[1][0]) + ' ms', text: 'While packet 1 crosses link 2, packet 2 crosses link 1: the links work like a pipeline.' });
      steps.push({ t: arrive[0][n - 1], title: 'Packet 1 reaches B: ' + f3(arrive[0][n - 1]) + ' ms', text: 'After that, one packet arrives every L/R = ' + f3(T) + ' ms.' });
    }
    steps.push({ t: total, title: 'Last ' + (P === 1 ? 'bit of the message' : 'packet') + ' arrives at B: ' + f3(total) + ' ms', text: 'Total end-to-end time = <b>' + f3(total) + ' ms</b>' + (c.prop === 0 && c.proc === 0 ? ' = (N + P − 1) × L/R = (' + n + ' + ' + P + ' − 1) × ' + f3(T) + ' ms.' : '.') });
    calc = { total: total, rows: [['Packet size', 'L = ' + payload + ' data bits + ' + c.H + ' header = ' + L + ' bits'], ['Transmission per link', 'L / R = ' + L + ' / (' + c.R + ' × 10⁶) = ' + f3(T) + ' ms'], ['First packet at B', n + ' × ' + f3(T) + (c.prop ? ' + ' + n + ' × ' + c.prop : '') + (c.proc && n > 1 ? ' + ' + (n - 1) + ' × ' + c.proc : '') + ' = ' + f3(arrive[0][n - 1]) + ' ms'], ['Remaining packets', '(P − 1) × L/R = ' + (P - 1) + ' × ' + f3(T) + ' = ' + f3((P - 1) * T) + ' ms (bottleneck: equal-rate links)'], ['Total', f3(total) + ' ms']] };
    return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, calc: calc };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 760, unitPx: 1, margin: 90, axis: null });
  var cur = null;
  var player = new CN.Player({ steps: [], unitMs: 1, render: function (T) { tl.draw(T); }, onStep: function () {
    if (!cur) return;
    CN.$('#state').innerHTML = '<div class="tw"><table><tbody>' + cur.calc.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="mono">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table></div>';
  } });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function run() {
    var c = { mode: CN.$('#mode').value, F: Math.max(1, +CN.$('#F').value || 1), P: Math.max(1, Math.min(2000, +CN.$('#P').value || 1)), H: Math.max(0, +CN.$('#H').value || 0), links: Math.max(1, Math.min(4, +CN.$('#links').value || 3)), R: Math.max(0.001, +CN.$('#R').value || 1), prop: Math.max(0, +CN.$('#prop').value || 0), proc: Math.max(0, +CN.$('#proc').value || 0), slots: Math.max(1, +CN.$('#slots').value || 1), setup: Math.max(0, +CN.$('#setup').value || 0) };
    cur = build(c);
    tl.unit = 520 / Math.max(1e-6, cur.calc.total);
    tl.setModel({ lanes: cur.lanes, msgs: cur.msgs, notes: cur.notes, timers: [] });
    player.opts.unitMs = 6000 / Math.max(1e-6, cur.calc.total);
    player.load(cur.steps);
    var other = build(Object.assign({}, c, { mode: c.mode === 'circuit' ? 'packet' : 'circuit' }));
    CN.$('#extra').innerHTML = '<div class="panel"><h3>Comparison</h3><p>With these settings: <b>' + (c.mode === 'circuit' ? 'circuit switching' : (c.mode === 'message' ? 'sending the whole message' : 'packet switching')) + '</b> takes <b>' + f3(cur.calc.total) + ' ms</b>; ' + (c.mode === 'circuit' ? 'packet switching (' + c.P + ' packets)' : 'circuit switching (' + c.slots + ' channels, ' + c.setup + ' ms setup)') + ' would take <b>' + f3(other.calc.total) + ' ms</b>.</p><p class="srcline">Try the 23CSE302 Mid 2025 Q1 numbers: F = 8,000,000 bits, packets of 16,000 bits including a 1,600-bit header (P = 556, H = 1600), R = 4 Mbps, 3 links, propagation 10 ms, processing 5 ms, 8 FDM channels, 300 ms setup.</p></div>';
  }
  CN.$('#mode').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', run);
  run();
})();

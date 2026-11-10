/* HTTP timing visualizer: DNS + TCP handshakes + GET/response for each connection mode. */
(function () {
  'use strict';
  var CN = window.CN;
  var MODES = { np: 'Non-persistent, serial', npp: 'Non-persistent, parallel', p: 'Persistent, no pipelining', pp: 'Persistent, with pipelining' };

  function build(c) {
    var msgs = [], notes = [], steps = [], R = c.rtt, h = R / 2, tt = c.tt, t = 0, rtts = 0, conns = 0;
    var lanes = c.dns > 0 ? [{ name: 'Browser', sub: 'client' }, { name: 'Local DNS', sub: 'name lookup' }, { name: 'Web server', sub: 'port 80' }] : [{ name: 'Browser', sub: 'client' }, { name: 'Web server', sub: 'port 80' }];
    var S = lanes.length - 1;
    function step(tm, title, text) { steps.push({ t: tm, title: title, text: text, total: tm, rtts: rtts, conns: conns }); }
    if (c.dns > 0) {
      msgs.push({ from: 0, to: 1, t0: 0, t1: c.dns / 2, label: 'DNS query', kind: 'data' });
      msgs.push({ from: 1, to: 0, t0: c.dns / 2, t1: c.dns, label: 'DNS reply (IP)', kind: 'ack' });
      t = c.dns;
      step(t, 'DNS lookup done: ' + c.dns + ' ms', 'Before any TCP connection, the browser needs the server\'s IP address. The whole lookup (however many DNS servers were visited) took ' + c.dns + ' ms. It happens once, not once per object.');
    }
    // one TCP connection + one GET/response, starting at time s, with a small visual offset dx for parallel connections
    function connObject(s, name, dx, label) {
      conns++;
      msgs.push({ from: 0, to: S, t0: s + dx, t1: s + dx + h, label: 'SYN' + label, kind: 'ctrl' });
      msgs.push({ from: S, to: 0, t0: s + dx + h, t1: s + dx + R, label: 'SYNACK' + label, kind: 'ctrl' });
      msgs.push({ from: 0, to: S, t0: s + dx + R, t1: s + dx + R + h, label: 'ACK + GET ' + name, kind: 'data' });
      msgs.push({ from: S, to: 0, t0: s + dx + R + h, t1: s + dx + 2 * R, label: name, kind: 'ack', dur: tt });
      return s + 2 * R + tt;
    }
    function getObject(s, name, dx) {
      msgs.push({ from: 0, to: S, t0: s + dx, t1: s + dx + h, label: 'GET ' + name, kind: 'data' });
      msgs.push({ from: S, to: 0, t0: s + dx + h, t1: s + dx + R, label: name, kind: 'ack', dur: tt });
      return s + R + tt;
    }
    var objs = []; for (var i = 1; i <= c.n; i++) objs.push('obj' + i);
    // base page always: connection + GET
    var t0 = t;
    t = connObject(t, 'base.html', 0, '');
    rtts += 2;
    step(t0 + R, 'TCP three-way handshake: 1 RTT', 'SYN and SYNACK take one round trip (' + R + ' ms). The third segment (ACK) carries the HTTP GET.');
    step(t, 'Base HTML received: 2 RTT' + (tt ? ' + transmission' : ''), 'The GET and the response take a second round trip' + (tt ? ', plus ' + tt + ' ms to transmit the file' : '') + '. Time so far: <b>' + t + ' ms</b>. The browser now parses the HTML and finds ' + c.n + ' referenced object(s).');
    if (c.n === 0) return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, total: t };
    if (c.mode === 'np') {
      objs.forEach(function (o, k) {
        var s = t; t = connObject(t, o, 0, ''); rtts += 2;
        step(t, o + ': new connection, 2 RTT', 'Non-persistent: the previous connection was closed, so ' + o + ' needs its own handshake (1 RTT) and request/response (1 RTT). Time so far: <b>' + t + ' ms</b>.');
        void s;
      });
    } else if (c.mode === 'npp') {
      var k = 0, round = 0;
      while (k < objs.length) {
        var batch = objs.slice(k, k + c.par), s2 = t;
        batch.forEach(function (o, j) { connObject(s2, o, j * R * 0.06, ' #' + (j + 1)); });
        t = s2 + 2 * R + tt; rtts += 2; round++;
        step(t, 'Round ' + round + ': ' + batch.length + ' parallel connection' + (batch.length > 1 ? 's' : '') + ' (' + batch.join(', ') + ')', 'Up to ' + c.par + ' connections run at the same time, each with its own handshake, so this batch costs 2 RTT in total' + (tt ? ' (plus transmission; with a shared access link the transmissions would really share bandwidth)' : '') + '. Time so far: <b>' + t + ' ms</b>.');
        k += c.par;
      }
    } else if (c.mode === 'p') {
      objs.forEach(function (o) {
        t = getObject(t, o, 0); rtts += 1;
        step(t, o + ': same connection, 1 RTT', 'Persistent: the connection stays open, so each object needs only a request and response, one at a time (no pipelining). Time so far: <b>' + t + ' ms</b>.');
      });
    } else {
      var s3 = t;
      objs.forEach(function (o, j) { getObject(s3, o, j * R * 0.06); });
      t = s3 + R + tt * objs.length; rtts += 1;
      step(t, 'All ' + objs.length + ' requests pipelined: 1 RTT' + (tt ? ' + transmissions' : ''), 'With pipelining the browser sends all GETs back to back without waiting, and the responses come back one after another: about one RTT for all of them' + (tt ? ', plus ' + objs.length + ' × ' + tt + ' ms of transmission' : '') + '. Total: <b>' + t + ' ms</b>.');
    }
    steps[steps.length - 1].title += ' → total ' + t + ' ms';
    return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, total: t };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 720, unitPx: 2, margin: 150, axis: null });
  var cur = null;
  var player = new CN.Player({ steps: [], unitMs: 18, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function paint(i) {
    if (!cur) return;
    var s = i >= 0 ? cur.steps[i] : { total: 0, rtts: 0, conns: 0 };
    var c = cur.c;
    var formula = { np: (c.dns ? 'DNS + ' : '') + '(1 + n) × 2 RTT', npp: (c.dns ? 'DNS + ' : '') + '2 RTT + ⌈n / k⌉ × 2 RTT', p: (c.dns ? 'DNS + ' : '') + '2 RTT + n × RTT', pp: (c.dns ? 'DNS + ' : '') + '2 RTT + 1 RTT' }[c.mode];
    CN.$('#state').innerHTML = '<div class="tw"><table><tbody><tr><td>Elapsed</td><td class="mono"><b>' + s.total + ' ms</b></td></tr><tr><td>Total for this page</td><td class="mono">' + cur.total + ' ms</td></tr><tr><td>TCP connections opened</td><td class="mono">' + s.conns + '</td></tr><tr><td>Mode</td><td>' + MODES[c.mode] + '</td></tr><tr><td>Formula (ignoring transmission)</td><td class="mono">' + formula + '</td></tr></tbody></table></div>';
  }
  function run() {
    var c = { mode: CN.$('#mode').value, n: Math.max(0, Math.min(12, +CN.$('#nobj').value || 0)), par: Math.max(1, +CN.$('#par').value || 1), rtt: Math.max(1, +CN.$('#rtt').value || 20), dns: Math.max(0, +CN.$('#dns').value || 0), tt: Math.max(0, +CN.$('#tt').value || 0) };
    cur = build(c); cur.c = c;
    tl.unit = 90 / c.rtt;
    tl.setModel({ lanes: cur.lanes, msgs: cur.msgs, notes: cur.notes, timers: [] });
    player.opts.unitMs = 900 / c.rtt;
    player.load(cur.steps);
  }
  CN.$('#mode').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', run);
  run();
})();

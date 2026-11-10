/* Go-Back-N and Selective Repeat simulator (Kurose §3.4.3–3.4.4). Event-driven. */
(function () {
  'use strict';
  var CN = window.CN;
  var PROP = 1, TX = 0.25, TO = 3.2;
  var PRESETS = {
    kurose: { proto: 'gbn', win: 4, npk: 8, first: 0, dloss: '2', aloss: '', every: 0 },
    end24: { proto: 'gbn', win: 5, npk: 10, first: 1, dloss: '4, 7', aloss: '', every: 0 },
    mid23: { proto: 'gbn', win: 3, npk: 5, first: 0, dloss: '2', aloss: '3', every: 0 },
    every6: { proto: 'gbn', win: 3, npk: 11, first: 1, dloss: '', aloss: '', every: 6 },
    acklost: { proto: 'gbn', win: 4, npk: 6, first: 0, dloss: '', aloss: '1', every: 0 }
  };

  function parseLoss(s) {
    var m = {};
    (s || '').split(/[\s,]+/).filter(Boolean).forEach(function (x) {
      var p = x.split(':'), n = parseInt(p[0], 10), a = parseInt(p[1] || '1', 10);
      if (!isNaN(n)) m[n + ':' + a] = true;
    });
    return m;
  }

  function simulate(c) {
    var msgs = [], notes = [], timers = [], steps = [], ev = [], order = 0;
    var F = c.first, M = c.npk, N = c.win, sr = c.proto === 'sr';
    var dl = parseLoss(c.dloss), al = parseLoss(c.aloss);
    var attempts = {}, ackAttempts = {}, txCount = 0, retx = 0;
    var base = F, next = F, linkFree = 0;
    var acked = {}, sentOnce = {};
    var timer = null, timerSeq = 0, pkTimers = {};
    var expected = F, rbase = F, buf = {}, delivered = [];
    function sched(e) { e.o = order++; ev.push(e); ev.sort(function (a, b) { return a.t - b.t || a.o - b.o; }); }
    function snap() {
      return { base: base, next: next, acked: Object.assign({}, acked), expected: expected, rbase: rbase, buf: Object.assign({}, buf), delivered: delivered.slice(), tx: txCount, retx: retx };
    }
    function step(t, title, text) { steps.push({ t: t, title: title, text: text, snap: snap() }); }

    function sendPkt(n, tMin, isRetx) {
      var t = Math.max(tMin, linkFree);
      linkFree = t + TX;
      attempts[n] = (attempts[n] || 0) + 1;
      txCount++;
      if (isRetx) retx++;
      var lost = dl[n + ':' + attempts[n]] || (c.every > 0 && txCount % c.every === 0);
      msgs.push({ from: 0, to: 1, t0: t, t1: t + PROP, label: 'pkt' + n, kind: 'data', lost: lost });
      sentOnce[n] = true;
      if (lost) sched({ t: t + PROP * 0.6, type: 'lost', n: n, what: 'pkt' + n, tx: txCount });
      else sched({ t: t + PROP, type: 'rcv', n: n });
      if (sr) {
        if (pkTimers[n]) pkTimers[n].t1 = t;
        var tm = { lane: 0, t0: t, t1: t + TO, end: 'fired', label: 'T' + n, id: ++timerSeq };
        pkTimers[n] = tm; timers.push(tm);
        sched({ t: t + TO, type: 'to', n: n, id: tm.id });
      }
      return t;
    }
    function startTimer(t) {
      if (timer) { timer.t1 = t; timer.end = null; }
      timer = { lane: 0, t0: t, t1: t + TO, end: 'fired', label: 'timer (base ' + base + ')', id: ++timerSeq };
      timers.push(timer);
      sched({ t: t + TO, type: 'to', id: timer.id });
    }
    function stopTimer(t) { if (timer) { timer.t1 = t; timer.end = 'stopped'; timer = null; } }
    function fill(t) {
      var sentNow = [];
      while (next < base + N && next < F + M) {
        var ts = sendPkt(next, t, false);
        if (!sr && base === next) startTimer(ts);
        sentNow.push(next);
        next++;
      }
      return sentNow;
    }
    function sendAck(n, t) {
      ackAttempts[n] = (ackAttempts[n] || 0) + 1;
      var lost = !!al[n + ':' + ackAttempts[n]];
      msgs.push({ from: 1, to: 0, t0: t, t1: t + PROP, label: 'ACK' + n, kind: 'ack', lost: lost });
      if (lost) sched({ t: t + PROP * 0.6, type: 'lost', what: 'ACK' + n });
      else sched({ t: t + PROP, type: 'ack', n: n });
    }

    var first = fill(0);
    step(0, 'Sender fills its window: ' + first.map(function (x) { return 'pkt' + x; }).join(', '), 'With window N = ' + N + ', the sender may have up to ' + N + ' unacknowledged packets in flight, so it sends ' + first.length + ' packets back to back without waiting.' + (sr ? ' Each packet gets its own timer.' : ' Go-Back-N uses one timer, for the oldest unacknowledged packet (base = ' + base + ').'));

    var guard = 0;
    while (ev.length && guard++ < 600 && steps.length < 160) {
      var e = ev.shift(), t = e.t;
      if (e.type === 'lost') { step(t, e.what + ' is lost', e.what.indexOf('ACK') === 0 ? 'The acknowledgement disappears in the channel.' + (sr ? ' The sender will retransmit that packet when its own timer expires.' : ' A later cumulative ACK may still cover it.') : 'The packet never reaches the receiver.'); continue; }
      if (e.type === 'rcv') {
        var n = e.n;
        if (!sr) {
          if (n === expected) {
            delivered.push(n); expected++;
            notes.push({ lane: 1, t: t, text: 'deliver ' + n, cls: 'good' });
            sendAck(n, t);
            step(t, 'Receiver gets pkt' + n + ' in order: deliver, ACK' + n, 'It is the expected packet, so the receiver delivers it and sends a cumulative ACK' + n + ' (all packets up to ' + n + ' received). It now expects ' + expected + '.');
          } else {
            notes.push({ lane: 1, t: t, text: 'discard pkt' + n, cls: 'warn' });
            if (expected > F) sendAck(expected - 1, t);
            step(t, 'Receiver discards pkt' + n + (expected > F ? ', re-sends ACK' + (expected - 1) : ''), 'The receiver expects pkt' + expected + ', but pkt' + n + ' arrived. A Go-Back-N receiver keeps no buffer: it discards any out-of-order packet' + (expected > F ? ' and re-acknowledges the last in-order packet (ACK' + (expected - 1) + ')' : '') + '.');
          }
        } else {
          if (n >= rbase && n < rbase + N) {
            sendAck(n, t);
            var was = buf[n] || delivered.indexOf(n) >= 0;
            buf[n] = true;
            var del = [];
            if (n === rbase) {
              while (buf[rbase]) { delete buf[rbase]; delivered.push(rbase); del.push(rbase); rbase++; }
            }
            notes.push({ lane: 1, t: t, text: del.length ? 'deliver ' + del.join(',') : (was ? 'dup, re-ACK' : 'buffer ' + n), cls: del.length ? 'good' : 'warn' });
            step(t, 'Receiver ACKs pkt' + n + (del.length ? ' and delivers ' + del.join(', ') : ' and buffers it'), del.length ? 'pkt' + n + ' was the lowest missing packet, so the receiver delivers it together with every consecutive buffered packet (' + del.join(', ') + ') and slides its window to start at ' + rbase + '.' : 'pkt' + n + ' is inside the receive window [' + rbase + ', ' + (rbase + N - 1) + '] but not the lowest missing one, so Selective Repeat buffers it and acknowledges it individually.');
          } else if (n >= rbase - N && n < rbase) {
            sendAck(n, t);
            notes.push({ lane: 1, t: t, text: 're-ACK ' + n, cls: 'info' });
            step(t, 'Receiver re-ACKs old pkt' + n, 'pkt' + n + ' was already delivered (it is in [rcv_base − N, rcv_base − 1]); its earlier ACK must have been lost, so the receiver acknowledges it again or the sender\'s window could never move.');
          } else {
            step(t, 'Receiver ignores pkt' + n, 'Outside both windows.');
          }
        }
        continue;
      }
      if (e.type === 'ack') {
        var a = e.n;
        if (!sr) {
          if (a >= base) {
            base = a + 1;
            for (var k = F; k < base; k++) acked[k] = true;
            if (base === next) stopTimer(t); else startTimer(t);
            var nw = fill(t);
            notes.push({ lane: 0, t: t, text: 'base → ' + base, cls: 'good' });
            step(t, 'Sender gets ACK' + a + ': window slides to base ' + base, 'A cumulative ACK' + a + ' confirms every packet up to ' + a + '. ' + (base === next ? 'Nothing is outstanding, so the timer stops.' : 'Packets are still outstanding, so the timer restarts for the new base.') + (nw.length ? ' New packets now fit in the window: ' + nw.map(function (x) { return 'pkt' + x; }).join(', ') + '.' : ''));
          } else {
            notes.push({ lane: 0, t: t, text: 'dup ACK' + a, cls: 'info' });
            step(t, 'Sender gets duplicate ACK' + a, 'This ACK acknowledges nothing new (base is already ' + base + '); Go-Back-N simply ignores it and waits for the timer.');
          }
          if (base >= F + M && next >= F + M) { step(t + 0.05, 'All ' + M + ' packets acknowledged', 'Total transmissions: ' + txCount + ' (' + retx + ' retransmission' + (retx === 1 ? '' : 's') + ').'); break; }
        } else {
          if (a >= base && a < base + N && !acked[a]) {
            acked[a] = true;
            if (pkTimers[a]) { pkTimers[a].t1 = t; pkTimers[a].end = 'stopped'; delete pkTimers[a]; }
            var moved = false;
            while (acked[base]) { base++; moved = true; }
            var nw2 = fill(t);
            notes.push({ lane: 0, t: t, text: 'ACK' + a + (moved ? ', base → ' + base : ''), cls: 'good' });
            step(t, 'Sender marks pkt' + a + ' acknowledged' + (moved ? '; base → ' + base : ''), 'Selective Repeat acknowledges packets individually; pkt' + a + '\'s timer stops. ' + (moved ? 'The window base moves to the smallest unacknowledged packet, ' + base + '.' : 'The base (' + base + ') is still unacknowledged, so the window cannot move yet.') + (nw2.length ? ' Newly usable: ' + nw2.map(function (x) { return 'pkt' + x; }).join(', ') + '.' : ''));
          } else {
            step(t, 'Sender gets ACK' + a + ' (already known)', 'This packet was already marked as acknowledged.');
          }
          if (base >= F + M) { step(t + 0.05, 'All ' + M + ' packets acknowledged', 'Total transmissions: ' + txCount + ' (' + retx + ' retransmission' + (retx === 1 ? '' : 's') + ').'); break; }
        }
        continue;
      }
      if (e.type === 'to') {
        if (!sr) {
          if (!timer || timer.id !== e.id) continue;
          timer.end = 'fired';
          var list = [];
          timer = null;
          for (var q = base; q < next; q++) { var ts2 = sendPkt(q, t, true); if (q === base) startTimer(ts2); list.push(q); }
          step(t, 'Timeout: Go-Back-N resends ' + list.map(function (x) { return 'pkt' + x; }).join(', '), 'The timer for the oldest unacknowledged packet (' + base + ') expired, so the sender goes back and retransmits every packet that has been sent but not acknowledged, and restarts the timer.');
        } else {
          var tm2 = pkTimers[e.n];
          if (!tm2 || tm2.id !== e.id) continue;
          sendPkt(e.n, t, true);
          step(t, 'Timeout for pkt' + e.n + ': resend only pkt' + e.n, 'Selective Repeat retransmits only the packet whose own timer expired; correctly received packets are not resent.');
        }
      }
    }
    return { model: { lanes: [{ name: 'Sender', sub: (sr ? 'Selective Repeat' : 'Go-Back-N') + ', N = ' + N }, { name: 'Receiver', sub: sr ? 'buffers out-of-order' : 'window of 1' }], msgs: msgs, notes: notes, timers: timers }, steps: steps, cfg: c };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 720, unitPx: 74, margin: 160 });
  var cur = null;
  var player = new CN.Player({ steps: [], unitMs: 800, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);

  function boxes(c, s, side) {
    var h = '<div class="win">';
    for (var n = c.first; n < c.first + c.npk; n++) {
      var cls = '';
      if (side === 's') {
        if (s.acked[n] || n < s.base) cls = 'acked';
        else if (n < s.next) cls = 'sent';
        else if (n < s.base + c.win) cls = 'usable';
        var inw = n >= s.base && n < s.base + c.win;
        h += '<span class="' + cls + (inw ? ' inwin' : '') + '">' + n + '</span>';
      } else {
        if (s.delivered.indexOf(n) >= 0) cls = 'acked';
        else if (s.buf[n]) cls = 'buf';
        var lo = c.proto === 'sr' ? s.rbase : s.expected, hi = c.proto === 'sr' ? s.rbase + c.win : s.expected + 1;
        h += '<span class="' + cls + (n >= lo && n < hi ? ' inwin' : '') + '">' + n + '</span>';
      }
    }
    return h + '</div>';
  }
  function paint(i) {
    if (!cur) return;
    var c = cur.cfg;
    var s = i >= 0 ? cur.steps[i].snap : { base: c.first, next: c.first, acked: {}, expected: c.first, rbase: c.first, buf: {}, delivered: [], tx: 0, retx: 0 };
    CN.$('#state').innerHTML =
      '<span class="k">Sender window (outlined = inside the window)</span>' + boxes(c, s, 's') +
      '<p class="legend" style="margin:0 0 8px"><span><i style="background:var(--mark)"></i>ACKed</span><span><i style="background:var(--accent)"></i>sent, not ACKed</span><span><i style="background:var(--ink)"></i>usable</span></p>' +
      '<span class="k">Receiver (' + (c.proto === 'sr' ? 'receive window outlined' : 'expected packet outlined') + ')</span>' + boxes(c, s, 'r') +
      '<p class="legend" style="margin:0 0 8px"><span><i style="background:var(--mark)"></i>delivered</span><span><i style="background:var(--good)"></i>buffered</span></p>' +
      '<div class="tw"><table><tbody><tr><td>Transmissions so far</td><td class="mono">' + s.tx + '</td></tr><tr><td>Retransmissions</td><td class="mono">' + s.retx + '</td></tr><tr><td>Delivered in order</td><td class="mono">' + (s.delivered.join(', ') || '—') + '</td></tr></tbody></table></div>';
  }
  function readCfg() {
    return { proto: CN.$('#proto').value, win: Math.max(1, Math.min(8, +CN.$('#win').value || 4)), npk: Math.max(1, Math.min(16, +CN.$('#npk').value || 8)), first: +CN.$('#first').value, dloss: CN.$('#dloss').value, aloss: CN.$('#aloss').value, every: Math.max(0, +CN.$('#every').value || 0) };
  }
  function setCfg(p) {
    CN.$('#proto').value = p.proto; CN.$('#win').value = p.win; CN.$('#npk').value = p.npk; CN.$('#first').value = String(p.first);
    CN.$('#dloss').value = p.dloss; CN.$('#aloss').value = p.aloss; CN.$('#every').value = p.every;
  }
  function run() {
    cur = simulate(readCfg());
    tl.setModel(cur.model);
    player.load(cur.steps);
  }
  CN.$('#preset').addEventListener('change', function (e) {
    if (PRESETS[e.target.value]) { var keep = CN.$('#proto').value; setCfg(PRESETS[e.target.value]); CN.$('#proto').value = keep; }
    run();
  });
  CN.$('#proto').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', function () { CN.$('#preset').value = 'custom'; run(); });
  var hp = CN.hashParams();
  setCfg(PRESETS.kurose);
  if (hp.p === 'sr') CN.$('#proto').value = 'sr';
  run();
})();

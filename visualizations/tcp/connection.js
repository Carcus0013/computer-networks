/* TCP connection simulator: three-way handshake, byte-stream sequence/ACK numbers,
   receive-window flow control (with zero-window probes), loss recovery, and the close. */
(function () {
  'use strict';
  var CN = window.CN;
  var OW = 1, TX = 0.3, RTO = 4.2;

  function simulate(c) {
    var msgs = [], notes = [], timers = [], steps = [], ev = [], order = 0;
    var x = c.cisn, y = c.sisn, MSS = c.mss, B = c.bytes, RB = c.rbuf;
    var cs = 'CLOSED', ss = 'LISTEN';
    // sender (client) data state: bytes numbered x+1 .. x+B
    var firstByte = x + 1, lastData = x + B;
    var sent = x, acked = x, rwnd = RB, linkFree = 0, timer = null, tid = 0, dupCount = 0, lastAckNo = null;
    var lostOnce = {};
    // receiver (server)
    var rcvd = x, read = x, ooo = {};
    var closeIdx = null, done = false;
    function sched(e) { e.o = order++; ev.push(e); ev.sort(function (a, b) { return a.t - b.t || a.o - b.o; }); }
    function snap() { return { cs: cs, ss: ss, sent: sent, acked: acked, rwnd: rwnd, rcvd: rcvd, read: read, ooo: Object.keys(ooo).length }; }
    function step(t, title, text) { steps.push({ t: t, title: title, text: text, snap: snap() }); }
    function freeSpace() { return RB - (rcvd - read) - Object.keys(ooo).reduce(function (s, k) { return s + ooo[k]; }, 0); }
    function startTimer(t) {
      if (timer) { timer.t1 = t; timer.end = null; }
      timer = { lane: 0, t0: t, t1: t + RTO, end: 'fired', label: '', id: ++tid };
      timers.push(timer);
      sched({ t: t + RTO, type: 'rto', id: timer.id });
    }
    function stopTimer(t) { if (timer) { timer.t1 = t; timer.end = 'stopped'; timer = null; } }
    function sendSeg(seq, len, t0, why) {
      var t = Math.max(t0, linkFree);
      linkFree = t + TX;
      var lost = c.preset === 'loss' && seq === firstByte + MSS && !lostOnce[seq];
      if (lost) lostOnce[seq] = true;
      msgs.push({ from: 0, to: 1, t0: t, t1: t + OW, label: 'seq=' + seq + (len === 1 && why === 'probe' ? ' (1-byte probe)' : ' len=' + len), kind: 'data', lost: lost });
      if (lost) sched({ t: t + OW * 0.6, type: 'lost', seq: seq });
      else sched({ t: t + OW, type: 'seg', seq: seq, len: len, probe: why === 'probe' });
      if (!timer) startTimer(t);
      return t;
    }
    function pump(t) {
      var list = [];
      while (sent < lastData) {
        var inflight = sent - acked, len = Math.min(MSS, lastData - sent);
        if (inflight + len > rwnd) break;
        sendSeg(sent + 1, len, t, 'data');
        list.push('seq=' + (sent + 1));
        sent += len;
      }
      return list;
    }
    function sendAck(t, why) {
      var ackNo = rcvd + 1, win = Math.max(0, freeSpace());
      msgs.push({ from: 1, to: 0, t0: t, t1: t + OW, label: 'ACK ack=' + ackNo + ' rwnd=' + win, kind: 'ack' });
      sched({ t: t + OW, type: 'ack', ack: ackNo, win: win });
      return { ack: ackNo, win: win };
    }

    // ---- handshake
    cs = 'SYN_SENT';
    msgs.push({ from: 0, to: 1, t0: 0, t1: 1, label: 'SYN seq=' + x, kind: 'ctrl' });
    step(0, 'Client sends SYN, seq = ' + x, 'The client picks a random initial sequence number client_isn = ' + x + ' and sends a segment with the <b>SYN</b> flag set and no data. Client state: SYN_SENT.');
    ss = 'SYN_RCVD';
    msgs.push({ from: 1, to: 0, t0: 1, t1: 2, label: 'SYNACK seq=' + y + ' ack=' + (x + 1) + ' rwnd=' + RB, kind: 'ctrl' });
    step(1, 'Server replies SYNACK: seq = ' + y + ', ack = ' + (x + 1), 'The server allocates buffers and variables (a RcvBuffer of ' + RB + ' bytes), chooses server_isn = ' + y + ', and acknowledges client_isn + 1 = ' + (x + 1) + ' (the SYN consumed one sequence number). It advertises rwnd = ' + RB + '. Server state: SYN_RCVD.');
    cs = 'ESTABLISHED';
    msgs.push({ from: 0, to: 1, t0: 2, t1: 3, label: 'ACK seq=' + (x + 1) + ' ack=' + (y + 1), kind: 'ctrl' });
    step(2, 'Client sends ACK: ack = ' + (y + 1), 'The client acknowledges server_isn + 1 = ' + (y + 1) + ' with SYN = 0. The connection is now ESTABLISHED at the client, which may start sending data right away.');
    linkFree = 2 + TX;
    sched({ t: 3, type: 'estab' });
    var first = pump(2 + TX);
    step(2 + TX, 'Client starts sending data: ' + first.join(', '), 'Bytes ' + firstByte + ' to ' + lastData + ' are numbered from client_isn + 1. Flow control lets the client have at most rwnd = ' + rwnd + ' unacknowledged bytes, so it sends ' + first.length + ' segment(s) of up to ' + MSS + ' bytes.');

    var appReadAt = c.preset === 'slow' ? 7 : null;
    if (appReadAt) sched({ t: appReadAt, type: 'read' });

    var guard = 0;
    while (ev.length && guard++ < 500 && steps.length < 120) {
      var e = ev.shift(), t = e.t;
      if (e.type === 'estab') { ss = 'ESTABLISHED'; step(t, 'Server: ESTABLISHED', 'The third handshake segment reaches the server. Both sides now have each other\'s initial sequence numbers.'); continue; }
      if (e.type === 'lost') { step(t, 'Segment seq=' + e.seq + ' is lost', 'The network drops this segment. The receiver will notice a gap when later segments arrive.'); continue; }
      if (e.type === 'read') {
        var avail = rcvd - read;
        if (avail > 0) {
          read += Math.min(avail, MSS * 2);
          step(t, 'Server application reads ' + Math.min(avail, MSS * 2) + ' bytes', 'The slow application finally reads from the receive buffer. Free space is now ' + freeSpace() + ' bytes, but TCP does not send an update by itself; the sender will learn of it from the reply to its next (probe) segment.');
        }
        if (sent < lastData || rcvd - read > 0) sched({ t: t + 5, type: 'read' });
        continue;
      }
      if (e.type === 'seg') {
        if (e.probe) {
          if (freeSpace() > 0) {
            rcvd += 1;
            var r0 = sendAck(t);
            step(t, 'Probe accepted: ACK ack=' + r0.ack + ', rwnd=' + r0.win, 'There is space again, so the receiver accepts the probe byte and advertises the reopened window rwnd = ' + r0.win + '.');
          } else {
            var r1 = sendAck(t);
            step(t, 'Probe arrives, buffer still full: rwnd=0', 'The buffer is still full, so the probe byte cannot be accepted; the ACK repeats ack=' + r1.ack + ' with rwnd = 0.');
          }
          continue;
        }
        if (e.seq === rcvd + 1) {
          rcvd += e.len;
          var filled = [];
          while (ooo[rcvd + 1]) { var L = ooo[rcvd + 1]; delete ooo[rcvd + 1]; rcvd += L; filled.push(L); }
          if (!c.preset || c.preset !== 'slow') read = rcvd;
          var r = sendAck(t);
          step(t, 'Server receives seq=' + e.seq + (filled.length ? ' (fills the gap)' : '') + ': ACK ' + r.ack, 'The segment is in order' + (filled.length ? ' and fills the gap, so buffered out-of-order data is now in order too' : '') + '. The ACK number is the next byte expected, ' + r.ack + ' (a cumulative acknowledgement). rwnd = RcvBuffer − (LastByteRcvd − LastByteRead) = ' + RB + ' − (' + (rcvd - x) + ' − ' + (read - x) + ') = ' + r.win + '.');
        } else if (e.seq > rcvd + 1) {
          ooo[e.seq] = e.len;
          var r2 = sendAck(t);
          step(t, 'Out-of-order seq=' + e.seq + ': duplicate ACK ' + r2.ack, 'There is a gap: the receiver still expects byte ' + r2.ack + '. It buffers this segment and immediately sends a duplicate ACK for ' + r2.ack + ' (RFC 5681).');
        } else {
          var r3 = sendAck(t);
          step(t, 'Duplicate segment seq=' + e.seq + ': re-ACK ' + r3.ack, 'These bytes were already received; the receiver discards them and acknowledges again.');
        }
        continue;
      }
      if (e.type === 'ack') {
        rwnd = e.win;
        if (e.ack - 1 > acked) {
          acked = e.ack - 1; dupCount = 0; lastAckNo = e.ack;
          if (acked >= sent) stopTimer(t); else startTimer(t);
          var more = pump(t);
          var finished = acked >= lastData;
          step(t, 'Client gets ACK ' + e.ack + ', rwnd ' + e.win + (more.length ? ': sends ' + more.join(', ') : ''), 'SendBase moves to ' + e.ack + '. Unacknowledged bytes in flight: ' + (sent - acked) + '; the window allows ' + e.win + '.' + (more.length ? ' So the client can send more.' : (sent < lastData ? ' The window is full, so the client must wait.' : '')) + (finished ? ' All ' + B + ' bytes are acknowledged.' : ''));
          if (finished && !done) {
            done = true;
            var tf = t + 0.5;
            cs = 'FIN_WAIT_1';
            msgs.push({ from: 0, to: 1, t0: tf, t1: tf + 1, label: 'FIN seq=' + (lastData + 1), kind: 'ctrl' });
            closeIdx = steps.length;
            step(tf, 'Client closes: FIN seq=' + (lastData + 1), 'The client application has nothing more to send, so the client sends a segment with the <b>FIN</b> bit set. Client state: FIN_WAIT_1.');
            sched({ t: tf + 1, type: 'fin1' });
          }
          if (e.win === 0 && sent < lastData) sched({ t: t + 2, type: 'probe' });
        } else if (e.ack === lastAckNo) {
          dupCount++;
          if (dupCount === 3) {
            sendSeg(acked + 1, Math.min(MSS, lastData - acked), t, 'retx');
            step(t, 'Third duplicate ACK ' + e.ack + ': fast retransmit', 'Three duplicate ACKs for byte ' + e.ack + ' strongly suggest that the segment starting at ' + e.ack + ' was lost, so TCP retransmits it immediately without waiting for the timer.');
          } else {
            step(t, 'Duplicate ACK ' + e.ack + ' (' + dupCount + ')', 'The receiver is still waiting for byte ' + e.ack + '. ' + (dupCount < 3 ? 'TCP waits for three duplicates before reacting.' : ''));
            if (e.win === 0 && sent < lastData) sched({ t: t + 2, type: 'probe' });
          }
        } else {
          lastAckNo = e.ack; dupCount = 0;
          step(t, 'Client gets ACK ' + e.ack + ', rwnd ' + e.win, e.win === 0 ? 'The receiver\'s buffer is full: <b>rwnd = 0</b>. The client must stop, but it keeps sending 1-byte probe segments so that it learns when space opens.' : 'Window update.');
          if (e.win === 0 && sent < lastData) sched({ t: t + 2, type: 'probe' });
          else { var mm = pump(t); if (mm.length) step(t + 0.01, 'Window reopened: client sends ' + mm.join(', '), 'The advertised window lets the client send again.'); }
        }
        continue;
      }
      if (e.type === 'probe') {
        if (rwnd > 0 || sent >= lastData) continue;
        sendSeg(sent + 1, 1, t, 'probe');
        sent += 1;
        step(t, 'Zero window: client sends a 1-byte probe', 'Because rwnd = 0, the TCP standard requires the client to keep sending segments with one data byte; their ACKs will carry the new rwnd once the application has read data.');
        continue;
      }
      if (e.type === 'rto') {
        if (!timer || timer.id !== e.id) continue;
        timer.end = 'fired'; timer = null;
        var len2 = Math.min(MSS, lastData - acked);
        sendSeg(acked + 1, len2, t, 'retx');
        step(t, 'Timeout: retransmit seq=' + (acked + 1), 'No ACK covered the oldest unacknowledged segment before the timer expired, so TCP retransmits just that segment and restarts the timer (doubling the interval).');
        continue;
      }
      if (e.type === 'fin1') {
        ss = 'CLOSE_WAIT';
        msgs.push({ from: 1, to: 0, t0: t, t1: t + 1, label: 'ACK ack=' + (lastData + 2), kind: 'ack' });
        step(t, 'Server ACKs the FIN: ack=' + (lastData + 2), 'The server acknowledges the FIN (which used one sequence number). Server state: CLOSE_WAIT; it could still send data to the client.');
        sched({ t: t + 1, type: 'fin1ack' });
        sched({ t: t + 1.6, type: 'fin2' });
        continue;
      }
      if (e.type === 'fin1ack') { cs = 'FIN_WAIT_2'; step(t, 'Client: FIN_WAIT_2', 'The client\'s FIN is acknowledged; it now waits for the server\'s FIN.'); continue; }
      if (e.type === 'fin2') {
        ss = 'LAST_ACK';
        msgs.push({ from: 1, to: 0, t0: t, t1: t + 1, label: 'FIN seq=' + (y + 1), kind: 'ctrl' });
        step(t, 'Server sends its FIN: seq=' + (y + 1), 'The server application closes too, so the server sends its own FIN. Server state: LAST_ACK.');
        sched({ t: t + 1, type: 'fin2rcv' });
        continue;
      }
      if (e.type === 'fin2rcv') {
        cs = 'TIME_WAIT';
        msgs.push({ from: 0, to: 1, t0: t, t1: t + 1, label: 'ACK ack=' + (y + 2), kind: 'ack' });
        timers.push({ lane: 0, t0: t, t1: t + 2.5, end: 'stopped', label: 'TIME_WAIT' });
        step(t, 'Client ACKs the server\'s FIN, enters TIME_WAIT', 'The client acknowledges the FIN and waits (typically 30 s to 2 min, twice the maximum segment lifetime) in case this last ACK is lost and the server resends its FIN.');
        sched({ t: t + 1, type: 'srvclosed' });
        sched({ t: t + 2.5, type: 'cliclosed' });
        continue;
      }
      if (e.type === 'srvclosed') { ss = 'CLOSED'; step(t, 'Server: CLOSED', 'The last ACK arrives; the server releases the connection\'s resources.'); continue; }
      if (e.type === 'cliclosed') { cs = 'CLOSED'; step(t, 'Client: TIME_WAIT over → CLOSED', 'The timed wait ends; the client releases the connection, including its port number.'); continue; }
    }
    return { model: { lanes: [{ name: 'Client', sub: 'ISN ' + x }, { name: 'Server', sub: 'ISN ' + y + ', RcvBuffer ' + RB }], msgs: msgs, notes: notes, timers: timers }, steps: steps, closeIdx: closeIdx, cfg: c };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 760, unitPx: 46, margin: 160 });
  var cur = null;
  var CSTATES = ['CLOSED', 'SYN_SENT', 'ESTABLISHED', 'FIN_WAIT_1', 'FIN_WAIT_2', 'TIME_WAIT'];
  var SSTATES = ['LISTEN', 'SYN_RCVD', 'ESTABLISHED', 'CLOSE_WAIT', 'LAST_ACK', 'CLOSED'];
  var player = new CN.Player({ steps: [], unitMs: 700, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function pills(list, on) { return '<div class="pills">' + list.map(function (s) { return '<span class="pill' + (s === on ? ' on' : '') + '">' + s + '</span>'; }).join('') + '</div>'; }
  function paint(i) {
    if (!cur) return;
    var c = cur.cfg, s = i >= 0 ? cur.steps[i].snap : { cs: 'CLOSED', ss: 'LISTEN', sent: c.cisn, acked: c.cisn, rwnd: c.rbuf, rcvd: c.cisn, read: c.cisn, ooo: 0 };
    var used = s.rcvd - s.read, pct = Math.min(100, 100 * used / c.rbuf);
    CN.$('#state').innerHTML = '<span class="k">Client state</span>' + pills(CSTATES, s.cs) + '<span class="k">Server state</span>' + pills(SSTATES, s.ss) +
      '<div class="tw"><table><tbody>' +
      '<tr><td>LastByteSent</td><td class="mono">' + s.sent + '</td></tr>' +
      '<tr><td>LastByteAcked (SendBase − 1)</td><td class="mono">' + s.acked + '</td></tr>' +
      '<tr><td>Bytes in flight</td><td class="mono">' + (s.sent - s.acked) + '</td></tr>' +
      '<tr><td>rwnd known to the client</td><td class="mono">' + s.rwnd + '</td></tr>' +
      '<tr><td>LastByteRcvd / LastByteRead</td><td class="mono">' + s.rcvd + ' / ' + s.read + '</td></tr>' +
      '</tbody></table></div><span class="k">Receive buffer (' + used + ' of ' + c.rbuf + ' bytes waiting to be read)</span>' +
      '<span class="bar" style="height:10px"><i style="width:' + pct + '%;background:var(--accent)"></i></span>';
  }
  function cfg() {
    return { preset: CN.$('#preset').value, cisn: +CN.$('#cisn').value || 0, sisn: +CN.$('#sisn').value || 0, mss: Math.max(1, +CN.$('#mss').value || 500), bytes: Math.max(1, Math.min(20000, +CN.$('#bytes').value || 2500)), rbuf: Math.max(1, +CN.$('#rbuf').value || 1500) };
  }
  function run(jumpClose) {
    var c = cfg();
    if (c.preset === 'loss' && c.rbuf < 4 * c.mss) { c.rbuf = 5 * c.mss; CN.$('#rbuf').value = c.rbuf; }
    if (Math.ceil(c.bytes / c.mss) > 24) { c.mss = Math.ceil(c.bytes / 24); CN.$('#mss').value = c.mss; }
    cur = simulate(c);
    tl.setModel(cur.model);
    player.load(cur.steps);
    if (jumpClose && cur.closeIdx) player.goTo(cur.closeIdx - 1);
  }
  CN.$('#preset').addEventListener('change', function () { run(false); });
  CN.$('#apply').addEventListener('click', function () { run(false); });
  run(CN.hashParams().phase === 'close');
})();

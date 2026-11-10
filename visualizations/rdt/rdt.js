/* Reliable data transfer simulator: rdt1.0, 2.0, 2.1, 2.2, 3.0 (Kurose §3.4.1).
   Each run is a real event-driven simulation of the version's FSMs over a channel whose
   faults (per transmission) come from the chosen scenario. */
(function () {
  'use strict';
  var CN = window.CN;

  var VERSIONS = {
    '1.0': { send: ['Wait for call from above'], rcv: ['Wait for call from below'], seq: false, timer: false, nak: false, assume: 'The channel is perfectly reliable: no bit errors and no loss.' },
    '2.0': { send: ['Wait for call from above', 'Wait for ACK or NAK'], rcv: ['Wait for call from below'], seq: false, timer: false, nak: true, assume: 'Bits can be flipped (corruption) but packets are never lost. ACK/NAK packets are assumed perfect, which is the flaw.' },
    '2.1': { send: ['Wait for call 0 from above', 'Wait for ACK or NAK 0', 'Wait for call 1 from above', 'Wait for ACK or NAK 1'], rcv: ['Wait for 0 from below', 'Wait for 1 from below'], seq: true, timer: false, nak: true, assume: 'Bits can be flipped in data and in ACK/NAK packets; no loss. Sequence numbers 0/1 expose duplicates.' },
    '2.2': { send: ['Wait for call 0 from above', 'Wait for ACK 0', 'Wait for call 1 from above', 'Wait for ACK 1'], rcv: ['Wait for 0 from below', 'Wait for 1 from below'], seq: true, timer: false, nak: false, assume: 'Same channel as rdt2.1, but no NAKs: the receiver re-sends the ACK of the last good packet, and a duplicate ACK acts as a NAK.' },
    '3.0': { send: ['Wait for call 0 from above', 'Wait for ACK 0', 'Wait for call 1 from above', 'Wait for ACK 1'], rcv: ['Wait for 0 from below', 'Wait for 1 from below'], seq: true, timer: true, nak: false, assume: 'Bits can be flipped AND packets (data or ACK) can be lost. A countdown timer detects loss.' }
  };

  // scenario presets: d = fates of data transmissions in order, f = fates of ACK/NAK transmissions in order
  var SCEN = {
    '1.0': [{ id: 'normal', name: 'Normal operation', d: [], f: [] }],
    '2.0': [
      { id: 'normal', name: 'No errors', d: [], f: [] },
      { id: 'pktcorrupt', name: 'Data packet corrupted → NAK → retransmit', d: ['ok', 'corrupt'], f: [] },
      { id: 'ackcorrupt', name: 'ACK corrupted (the fatal flaw)', d: [], f: ['corrupt'] },
      { id: 'pktlost', name: 'Packet lost (no timer: deadlock)', d: ['ok', 'lose'], f: [] }
    ],
    '2.1': [
      { id: 'normal', name: 'No errors', d: [], f: [] },
      { id: 'pktcorrupt', name: 'Data packet corrupted → NAK', d: ['corrupt'], f: [] },
      { id: 'ackcorrupt', name: 'ACK corrupted → duplicate detected', d: [], f: ['corrupt'] },
      { id: 'nakcorrupt', name: 'Packet corrupted, then its NAK corrupted', d: ['corrupt'], f: ['corrupt'] },
      { id: 'pktlost', name: 'Packet lost (no timer: deadlock)', d: ['lose'], f: [] }
    ],
    '2.2': [
      { id: 'normal', name: 'No errors', d: [], f: [] },
      { id: 'pktcorrupt', name: 'Data corrupted → duplicate ACK', d: ['ok', 'corrupt'], f: [] },
      { id: 'ackcorrupt', name: 'ACK corrupted → retransmit, duplicate detected', d: [], f: ['ok', 'corrupt'] }
    ],
    '3.0': [
      { id: 'normal', name: 'No loss', d: [], f: [] },
      { id: 'pktlost', name: 'Packet lost → timeout → retransmit', d: ['ok', 'lose'], f: [] },
      { id: 'acklost', name: 'ACK lost → timeout → duplicate detected', d: [], f: ['lose'] },
      { id: 'premature', name: 'Premature timeout (ACK delayed)', d: [], f: ['ok', 'delay'] },
      { id: 'pktcorrupt', name: 'Data corrupted → receiver re-ACKs → timeout', d: ['corrupt'], f: [] },
      { id: 'ackcorrupt', name: 'ACK corrupted → ignored → timeout', d: [], f: ['corrupt'] },
      { id: 'mixed', name: 'Several faults in one run', d: ['ok', 'lose', 'ok', 'corrupt'], f: ['ok', 'delay', 'lose'] }
    ]
  };

  var D = 1, DELAY = 2.4, TO = 2.7, GAP = 0.45;

  function simulate(v, n, dF, fF) {
    var cfg = VERSIONS[v];
    var msgs = [], notes = [], timers = [], steps = [], ev = [];
    var di = 0, fi = 0, timerSeq = 0, activeTimer = null, halted = false;
    var S = { st: 0, seq: 0, k: 0, pkt: null, retx: 0 };       // st = index into cfg.send
    var R = { st: 0, exp: 0, delivered: [], dups: 0, lastAck: 1, dupDelivered: 0 };
    function dataName(k) { return 'D' + (k + 1); }
    function plabel(p) { return cfg.seq ? 'pkt' + p.seq + ' (' + p.data + ')' : 'pkt (' + p.data + ')'; }
    function flabel(fb) { return fb.type === 'NAK' ? (cfg.seq && !cfg.nak ? 'NAK' : 'NAK') : (cfg.nak ? 'ACK' : 'ACK' + fb.seq); }
    function vars() {
      return { seq: S.seq, k: S.k, delivered: R.delivered.slice(), retx: S.retx, dups: R.dups, exp: R.exp, dupDelivered: R.dupDelivered };
    }
    function step(t, title, text) {
      steps.push({ t: t, title: title, text: text, s: S.st, r: R.st, vars: vars() });
    }
    function push(e) { ev.push(e); ev.sort(function (a, b) { return a.t - b.t || a.o - b.o; }); }
    var order = 0;
    function sched(e) { e.o = order++; push(e); }
    function fsm(event, action) { return '<br><code>' + CN.esc(event) + '</code> / <code>' + CN.esc(action) + '</code>'; }

    function transmitData(t, isRetx, why) {
      var fate = dF[di++] || 'ok';
      if (v === '1.0') fate = 'ok';
      var p = S.pkt;
      var t1 = t + (fate === 'delay' ? DELAY : D);
      var m = { from: 0, to: 1, t0: t, t1: t1, label: plabel(p), kind: fate === 'corrupt' ? 'bad' : 'data', lost: fate === 'lose' };
      msgs.push(m);
      if (fate === 'lose') sched({ t: t + D * 0.6, type: 'lost', what: plabel(p), dir: 'data' });
      else sched({ t: t1, type: 'arriveR', p: { seq: p.seq, data: p.data }, corrupt: fate === 'corrupt' });
      if (cfg.timer) {
        if (activeTimer) { activeTimer.t1 = t; activeTimer.end = null; }
        activeTimer = { lane: 0, t0: t, t1: t + TO, end: 'fired', label: 'timer', id: ++timerSeq };
        timers.push(activeTimer);
        sched({ t: t + TO, type: 'timeout', id: timerSeq });
      }
      return fate;
    }
    function transmitFb(t, fb) {
      var fate = fF[fi++] || 'ok';
      var t1 = t + (fate === 'delay' ? DELAY : D);
      msgs.push({ from: 1, to: 0, t0: t, t1: t1, label: flabel(fb), kind: fate === 'corrupt' ? 'bad' : 'ack', lost: fate === 'lose' });
      if (fate === 'lose') sched({ t: t + D * 0.6, type: 'lost', what: flabel(fb), dir: 'fb' });
      else sched({ t: t1, type: 'arriveS', fb: fb, corrupt: fate === 'corrupt', delayed: fate === 'delay' });
      return fate;
    }
    function startMessage(t) {
      var k = S.k;
      S.pkt = { seq: S.seq, data: dataName(k) };
      var waitIdx = cfg.send.length === 1 ? 0 : (cfg.seq ? S.seq * 2 + 1 : 1);
      var ev1 = 'rdt_send(' + dataName(k) + ')';
      var act = cfg.seq ? 'sndpkt = make_pkt(' + S.seq + ', ' + dataName(k) + ', checksum); udt_send(sndpkt)' : (v === '1.0' ? 'packet = make_pkt(data); udt_send(packet)' : 'sndpkt = make_pkt(data, checksum); udt_send(sndpkt)');
      if (cfg.timer) act += '; start_timer';
      var fate = transmitData(t, false);
      S.st = waitIdx;
      var extra = fate === 'corrupt' ? ' Bits will be flipped on the way.' : fate === 'lose' ? ' This packet will be lost in the channel.' : fate === 'delay' ? ' This packet will be delayed.' : '';
      step(t, 'Sender sends ' + plabel(S.pkt), 'The application passes ' + dataName(k) + ' down; the sender makes a packet' + (cfg.seq ? ' with sequence number ' + S.seq : '') + ' and sends it' + (cfg.timer ? ', starting the timer' : '') + '.' + extra + fsm(ev1, act));
    }

    // rdt1.0 is not stop-and-wait: send all messages
    if (v === '1.0') {
      for (var k0 = 0; k0 < n; k0++) sched({ t: 0.2 + k0 * 0.9, type: 'app1', k: k0 });
    } else {
      sched({ t: 0.2, type: 'app' });
    }

    var guard = 0;
    while (ev.length && !halted && guard++ < 400 && steps.length < 140) {
      var e = ev.shift();
      var t = e.t;
      if (e.type === 'app1') {
        S.k = e.k; S.pkt = { seq: 0, data: dataName(e.k) };
        transmitData(t, false);
        step(t, 'Sender sends pkt (' + dataName(e.k) + ')', 'rdt1.0 has nothing to wait for: it sends each message as soon as the application gives it.' + fsm('rdt_send(data)', 'packet = make_pkt(data); udt_send(packet)'));
        continue;
      }
      if (e.type === 'app') { startMessage(t); continue; }
      if (e.type === 'lost') {
        if (!cfg.timer && v !== '1.0') {
          step(t, e.what + ' is lost in the channel', 'The packet disappears. rdt' + v + ' has no timer, so the sender waits for feedback forever and the receiver waits for data forever: the protocol is <b>deadlocked</b>. Loss is exactly the problem rdt3.0 solves with a countdown timer.');
          notes.push({ lane: 0, t: t + 0.6, text: 'waiting forever…', cls: 'bad' });
          steps.push({ t: t + 0.6, title: 'Deadlock: nothing more can happen', text: 'Without a timer the sender never learns that the packet was lost. Switch to rdt3.0 to see how a timeout recovers.', s: S.st, r: R.st, vars: vars() });
          halted = true;
        } else {
          step(t, e.what + ' is lost in the channel', e.dir === 'data' ? 'The data packet never reaches the receiver, so no ACK will come back. The sender\'s timer keeps running.' : 'The receiver did its job, but its ACK never reaches the sender. The sender cannot tell this apart from a lost data packet; its timer keeps running.');
        }
        continue;
      }
      if (e.type === 'timeout') {
        if (!activeTimer || activeTimer.id !== e.id) continue;
        S.retx++;
        activeTimer = null;
        transmitData(t, true);
        step(t, 'Timeout: sender retransmits ' + plabel(S.pkt), 'No correct ACK arrived before the timer expired, so the sender assumes the packet or its ACK was lost (or is very late) and resends the same packet, restarting the timer.' + fsm('timeout', 'udt_send(sndpkt); start_timer'));
        continue;
      }
      if (e.type === 'arriveR') {
        var p = e.p;
        if (v === '1.0') {
          R.delivered.push(p.data);
          notes.push({ lane: 1, t: t, text: 'deliver ' + p.data, cls: 'good' });
          step(t, 'Receiver delivers ' + p.data, 'The packet arrives intact (the channel is perfect); the receiver extracts the data and delivers it.' + fsm('rdt_rcv(packet)', 'extract(packet, data); deliver_data(data)'));
          if (R.delivered.length === n) steps.push({ t: t + 0.3, title: 'All ' + n + ' messages delivered', text: 'No feedback was needed because nothing could go wrong.', s: S.st, r: R.st, vars: vars() });
          continue;
        }
        if (e.corrupt) {
          if (cfg.nak) {
            transmitFb(t, { type: 'NAK' });
            notes.push({ lane: 1, t: t, text: 'corrupt!', cls: 'bad' });
            step(t, 'Receiver detects corruption, sends NAK', 'The checksum fails, so the receiver asks for a retransmission with a negative acknowledgement and delivers nothing.' + fsm('rdt_rcv(rcvpkt) && corrupt(rcvpkt)', 'sndpkt = make_pkt(NAK); udt_send(sndpkt)'));
          } else {
            var la = R.lastAck;
            transmitFb(t, { type: 'ACK', seq: la });
            notes.push({ lane: 1, t: t, text: 'corrupt!', cls: 'bad' });
            step(t, 'Receiver detects corruption, re-sends ACK' + la, 'The checksum fails. rdt' + v + ' has no NAK, so the receiver re-sends the ACK for the last correctly received packet (ACK' + la + '). To the sender this is a duplicate ACK.' + fsm('rdt_rcv(rcvpkt) && corrupt(rcvpkt)', 'udt_send(sndpkt)   [sndpkt = ACK' + la + ']'));
          }
          continue;
        }
        if (!cfg.seq) {
          // rdt2.0: no sequence numbers, so it cannot tell a duplicate
          var isDup = R.delivered.indexOf(p.data) >= 0;
          R.delivered.push(p.data);
          if (isDup) { R.dupDelivered++; notes.push({ lane: 1, t: t, text: 'delivered ' + p.data + ' AGAIN', cls: 'bad' }); }
          else notes.push({ lane: 1, t: t, text: 'deliver ' + p.data, cls: 'good' });
          transmitFb(t, { type: 'ACK' });
          step(t, isDup ? 'Receiver delivers ' + p.data + ' a second time!' : 'Receiver delivers ' + p.data + ', sends ACK', isDup ? 'With no sequence numbers the receiver cannot know this is a retransmission, so the application gets ' + p.data + ' twice. This is rdt2.0\'s fatal flaw; rdt2.1 fixes it with sequence numbers.' + fsm('rdt_rcv(rcvpkt) && notcorrupt(rcvpkt)', 'extract; deliver_data; udt_send(ACK)') : 'The checksum is fine, so the receiver delivers the data and sends a positive acknowledgement.' + fsm('rdt_rcv(rcvpkt) && notcorrupt(rcvpkt)', 'extract(rcvpkt, data); deliver_data(data); sndpkt = make_pkt(ACK); udt_send(sndpkt)'));
          continue;
        }
        if (p.seq === R.exp) {
          R.delivered.push(p.data);
          notes.push({ lane: 1, t: t, text: 'deliver ' + p.data, cls: 'good' });
          var ackSeq = p.seq;
          R.lastAck = ackSeq;
          R.exp = 1 - R.exp; R.st = R.exp;
          transmitFb(t, { type: 'ACK', seq: ackSeq });
          step(t, 'Receiver delivers ' + p.data + ', sends ' + (cfg.nak ? 'ACK' : 'ACK' + ackSeq), 'pkt' + p.seq + ' is intact and has the expected sequence number, so the receiver delivers ' + p.data + ', acknowledges it, and now waits for sequence number ' + R.exp + '.' + fsm('rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && has_seq' + p.seq + '(rcvpkt)', 'extract; deliver_data; sndpkt = make_pkt(ACK' + (cfg.nak ? '' : ', ' + ackSeq) + ', chksum); udt_send(sndpkt)'));
        } else {
          R.dups++;
          notes.push({ lane: 1, t: t, text: 'duplicate pkt' + p.seq + ': discard', cls: 'warn' });
          var reAck = cfg.nak ? 'ACK' : 'ACK' + p.seq;
          transmitFb(t, { type: 'ACK', seq: p.seq });
          step(t, 'Receiver spots a duplicate pkt' + p.seq + ', re-sends ' + reAck, 'The receiver is waiting for sequence number ' + R.exp + ' but this packet carries ' + p.seq + ': it is a retransmission of data already delivered. It is discarded (not delivered again) and acknowledged once more, because the sender evidently missed the earlier ACK.' + fsm('rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && has_seq' + p.seq + '(rcvpkt)', 'sndpkt = make_pkt(ACK' + (cfg.nak ? '' : ', ' + p.seq) + ', chksum); udt_send(sndpkt)'));
        }
        continue;
      }
      if (e.type === 'arriveS') {
        var fb = e.fb;
        var waiting = cfg.seq ? (S.st % 2 === 1) : S.st === 1;
        if (!waiting) {
          notes.push({ lane: 0, t: t, text: 'late ' + flabel(fb) + ': ignore', cls: 'info' });
          step(t, 'A late ' + flabel(fb) + ' arrives and is ignored', 'The sender has already moved on (it is in “' + cfg.send[S.st] + '”), so this duplicate acknowledgement, left over from a premature timeout, is ignored.' + fsm('rdt_rcv(rcvpkt)', 'Λ'));
          continue;
        }
        var good = !e.corrupt && fb.type === 'ACK' && (cfg.nak || fb.seq === S.seq);
        if (e.corrupt && !cfg.seq) {
          // rdt2.0 fatal flaw
          notes.push({ lane: 0, t: t, text: 'garbled: ACK or NAK?', cls: 'bad' });
          S.retx++;
          transmitData(t, true);
          step(t, 'Sender receives a garbled ACK/NAK', 'rdt2.0 has no rule for this: the sender cannot tell whether it was an ACK or a NAK. Playing safe, it resends the packet, but the receiver cannot recognise a duplicate. Watch what happens next.' + fsm('rdt_rcv(rcvpkt) && corrupt(rcvpkt)', '?? (undefined in rdt2.0) → udt_send(sndpkt)'));
          continue;
        }
        if (good) {
          if (activeTimer) { activeTimer.t1 = t; activeTimer.end = 'stopped'; activeTimer = null; }
          notes.push({ lane: 0, t: t, text: flabel(fb) + ' OK', cls: 'good' });
          S.k++;
          if (cfg.seq) { S.seq = 1 - S.seq; S.st = S.seq * 2; } else S.st = 0;
          var done = S.k >= n;
          step(t, 'Sender receives ' + flabel(fb) + (done ? ': transfer complete' : ''), 'A correct acknowledgement for the current packet arrives' + (cfg.timer ? ', so the sender stops the timer' : '') + ' and moves to “' + cfg.send[S.st] + '”.' + (done ? ' All ' + n + ' messages have been delivered once, in order.' : ' It can now accept the next message from the application.') + fsm('rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt' + (cfg.nak ? '' : ', ' + fb.seq) + ')', cfg.timer ? 'stop_timer' : 'Λ'));
          if (!done) sched({ t: t + GAP, type: 'app' });
          continue;
        }
        // corrupted, NAK, or wrong-numbered ACK
        var why = e.corrupt ? 'garbled (checksum fails)' : (fb.type === 'NAK' ? 'a NAK' : 'ACK' + fb.seq + ', the ACK for the previous packet (a duplicate ACK)');
        if (cfg.timer) {
          notes.push({ lane: 0, t: t, text: (e.corrupt ? 'garbled' : 'dup ACK') + ': ignore', cls: 'warn' });
          step(t, 'Sender gets ' + (e.corrupt ? 'a garbled ACK' : 'ACK' + fb.seq) + ' and ignores it', 'The feedback is ' + why + '. rdt3.0 does nothing here: it simply keeps waiting, and lets the timer decide when to retransmit.' + fsm('rdt_rcv(rcvpkt) && (corrupt(rcvpkt) || isACK(rcvpkt, ' + (1 - S.seq) + '))', 'Λ'));
        } else {
          S.retx++;
          notes.push({ lane: 0, t: t, text: 'resend', cls: 'warn' });
          transmitData(t, true);
          step(t, 'Sender gets ' + (e.corrupt ? 'garbled feedback' : (fb.type === 'NAK' ? 'a NAK' : 'a duplicate ACK' + fb.seq)) + ': retransmits ' + plabel(S.pkt), 'The feedback is ' + why + ', so the sender resends the current packet' + (cfg.seq ? ' (same sequence number ' + S.seq + ')' : '') + '.' + fsm('rdt_rcv(rcvpkt) && (corrupt(rcvpkt) || ' + (cfg.nak ? 'isNAK(rcvpkt)' : 'isACK(rcvpkt, ' + (1 - S.seq) + ')') + ')', 'udt_send(sndpkt)'));
        }
        continue;
      }
    }
    // close any timer still open at the end
    timers.forEach(function (tm) { if (tm.end === 'fired' && tm.t1 > (steps.length ? steps[steps.length - 1].t : 0) + 3) tm.end = null; });
    return { model: { lanes: [{ name: 'Sender', sub: 'rdt' + v }, { name: 'Receiver', sub: 'rdt' + v }], msgs: msgs, notes: notes, timers: timers }, steps: steps };
  }

  /* ---------- page wiring ---------- */
  var vSel = CN.$('#ver'), sSel = CN.$('#scen'), nIn = CN.$('#nmsg'), dIn = CN.$('#dfates'), fIn = CN.$('#ffates');
  var tl = new CN.Timeline(CN.$('#stage'), { width: 720, unitPx: 62, margin: 150, aria: 'Sender and receiver timeline' });
  var current = null;
  var player = new CN.Player({
    steps: [], unitMs: 950,
    render: function (T) { tl.draw(T); },
    onStep: function (i) { paintState(i); }
  });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);

  function paintState(i) {
    if (!current) return;
    var v = vSel.value, cfg = VERSIONS[v];
    var st = i >= 0 ? current.steps[i] : { s: 0, r: 0, vars: { seq: 0, delivered: [], retx: 0, dups: 0, exp: 0, dupDelivered: 0 } };
    var h = '<span class="k">Sender FSM state</span><div class="pills">' + cfg.send.map(function (s, k) { return '<span class="pill' + (k === st.s ? ' on' : '') + '">' + CN.esc(s) + '</span>'; }).join('') + '</div>';
    h += '<span class="k">Receiver FSM state</span><div class="pills">' + cfg.rcv.map(function (s, k) { return '<span class="pill' + (k === st.r ? ' on' : '') + '">' + CN.esc(s) + '</span>'; }).join('') + '</div>';
    var vv = st.vars;
    h += '<div class="tw"><table><tbody>' +
      '<tr><td>Delivered to the application</td><td class="mono">' + (vv.delivered.length ? CN.esc(vv.delivered.join(', ')) : '—') + '</td></tr>' +
      (cfg.seq ? '<tr><td>Receiver expects sequence #</td><td class="mono">' + vv.exp + '</td></tr>' : '') +
      '<tr><td>Retransmissions</td><td class="mono">' + vv.retx + '</td></tr>' +
      (cfg.seq ? '<tr><td>Duplicates discarded</td><td class="mono">' + vv.dups + '</td></tr>' : '') +
      (vv.dupDelivered ? '<tr><td class="badmsg">Duplicates wrongly delivered</td><td class="mono badmsg">' + vv.dupDelivered + '</td></tr>' : '') +
      '</tbody></table></div>';
    CN.$('#state').innerHTML = h;
  }

  function fillScenarios() {
    var v = vSel.value;
    sSel.innerHTML = SCEN[v].map(function (s) { return '<option value="' + s.id + '">' + CN.esc(s.name) + '</option>'; }).join('') + '<option value="custom">Custom faults (below)</option>';
    CN.$('#assume').textContent = VERSIONS[v].assume;
    CN.$('#customrow').classList.toggle('hidden', v === '1.0');
  }
  function parseFates(s) {
    return (s || '').split(/[\s,]+/).filter(Boolean).map(function (x) {
      x = x.toLowerCase();
      if (/^l/.test(x)) return 'lose';
      if (/^c/.test(x)) return 'corrupt';
      if (/^d/.test(x)) return 'delay';
      return 'ok';
    });
  }
  function run() {
    var v = vSel.value, sid = sSel.value, n = Math.max(1, Math.min(6, parseInt(nIn.value, 10) || 3));
    var d, f;
    if (sid === 'custom') { d = parseFates(dIn.value); f = parseFates(fIn.value); }
    else {
      var sc = SCEN[v].filter(function (x) { return x.id === sid; })[0] || SCEN[v][0];
      d = sc.d.slice(); f = sc.f.slice();
      dIn.value = d.join(', '); fIn.value = f.join(', ');
    }
    if (!VERSIONS[v].timer) { d = d.map(function (x) { return x === 'delay' ? 'ok' : x; }); f = f.map(function (x) { return x === 'delay' ? 'ok' : x; }); }
    if (v === '2.0') f = f.map(function (x) { return x === 'lose' ? 'ok' : x; });
    current = simulate(v, n, d, f);
    tl.setModel(current.model);
    player.introText = 'rdt' + v + ': ' + VERSIONS[v].assume + ' Press Play, or step with Next (→).';
    player.load(current.steps);
    try { history.replaceState(null, '', '#v=' + v + '&s=' + sid); } catch (e) {}
  }
  vSel.addEventListener('change', function () { fillScenarios(); run(); });
  sSel.addEventListener('change', run);
  nIn.addEventListener('change', run);
  CN.$('#apply').addEventListener('click', function () { sSel.value = 'custom'; run(); });

  var hp = CN.hashParams();
  if (hp.v && VERSIONS[hp.v]) vSel.value = hp.v;
  fillScenarios();
  if (hp.s && SCEN[vSel.value].some(function (x) { return x.id === hp.s; })) sSel.value = hp.s;
  run();
})();

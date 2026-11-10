/* ARP and link-layer addressing across subnets (Kurose §6.4.1 example addresses). */
(function () {
  'use strict';
  var CN = window.CN;
  var H = {
    A: { ip: '111.111.111.111', mac: '74-29-9C-E8-FF-55' },
    C: { ip: '111.111.111.112', mac: 'CC-49-DE-D0-AB-7D' },
    R1: { ip: '111.111.111.110', mac: 'E6-E9-00-17-BB-4B' },
    R2: { ip: '222.222.222.220', mac: '1A-23-F9-CD-06-9B' },
    B: { ip: '222.222.222.222', mac: '49-BD-D2-C7-56-2A' }
  };
  var BC = 'FF-FF-FF-FF-FF-FF';
  function build(scen) {
    var lanes = [{ name: 'Host A', sub: H.A.ip }, { name: 'Host C', sub: H.C.ip }, { name: 'Router R', sub: '.110 | .220' }, { name: 'Host B', sub: H.B.ip }];
    var msgs = [], notes = [], steps = [], frames = [], t = 0;
    var arpA = scen === 'cached' ? [[H.R1.ip, H.R1.mac]] : [], arpR = scen === 'cached' ? [[H.B.ip, H.B.mac]] : [];
    function snap() { return { arpA: arpA.slice(), arpR: arpR.slice(), frames: frames.length }; }
    function step(title, text) { steps.push({ t: t, title: title, text: text, snap: snap() }); }
    function frame(link, sm, dm, si, di, type) { frames.push({ link: link, sm: sm, dm: dm, si: si, di: di, type: type }); }
    if (scen === 'same') {
      msgs.push({ from: 0, to: 1, t0: 0, t1: 1, label: 'ARP query: who has .112? (to ' + BC + ')', kind: 'ctrl' });
      msgs.push({ from: 0, to: 2, t0: 0, t1: 1, label: '', kind: 'ctrl' });
      frame('subnet 1', H.A.mac, BC, '—', '—', 'ARP query'); t = 1;
      step('A broadcasts an ARP query for 111.111.111.112', 'C is on A\'s own subnet, so A needs C\'s MAC address. Its ARP table has no entry, so it broadcasts an ARP query in a frame to FF-FF-FF-FF-FF-FF. Every adapter on subnet 1 (C and the router\'s interface) receives it.');
      msgs.push({ from: 1, to: 0, t0: 1, t1: 2, label: 'ARP reply: .112 is ' + H.C.mac + ' (unicast)', kind: 'ack' });
      frame('subnet 1', H.C.mac, H.A.mac, '—', '—', 'ARP reply'); t = 2;
      arpA.push([H.C.ip, H.C.mac]);
      step('C replies (unicast); A caches the mapping', 'Only C recognises its own IP address. Its reply goes in an ordinary unicast frame to A. A adds (111.111.111.112, ' + H.C.mac + ', TTL ≈ 20 min) to its ARP table. The router ignored the query.');
      msgs.push({ from: 0, to: 1, t0: 2, t1: 3, label: 'IP datagram to .112', kind: 'data' });
      frame('subnet 1', H.A.mac, H.C.mac, H.A.ip, H.C.ip, 'IPv4'); t = 3;
      step('A sends the datagram directly to C', 'Same subnet: no router involved. Destination MAC = C\'s MAC, destination IP = C\'s IP.');
    } else {
      if (scen !== 'cached') {
        msgs.push({ from: 0, to: 2, t0: 0, t1: 1, label: 'ARP query: who has .110? (to ' + BC + ')', kind: 'ctrl' });
        msgs.push({ from: 0, to: 1, t0: 0, t1: 1, label: '', kind: 'ctrl' });
        frame('subnet 1', H.A.mac, BC, '—', '—', 'ARP query'); t = 1;
        step('B is on another subnet: A ARPs for its gateway, not for B', 'A compares B\'s address with its own subnet mask and sees B is not local, so the frame must go to the first-hop router 111.111.111.110. A broadcasts an ARP query for the router interface\'s MAC address (it never ARPs for B).');
        msgs.push({ from: 2, to: 0, t0: 1, t1: 2, label: 'ARP reply: .110 is ' + H.R1.mac, kind: 'ack' });
        frame('subnet 1', H.R1.mac, H.A.mac, '—', '—', 'ARP reply'); t = 2;
        arpA.push([H.R1.ip, H.R1.mac]);
        step('The router\'s subnet-1 interface replies', 'A caches (111.111.111.110, ' + H.R1.mac + ').');
      }
      msgs.push({ from: 0, to: 2, t0: t, t1: t + 1, label: 'frame to ' + H.R1.mac + ' [IP → .222]', kind: 'data' });
      frame('subnet 1', H.A.mac, H.R1.mac, H.A.ip, H.B.ip, 'IPv4'); t += 1;
      step('A sends the datagram in a frame addressed to the router', 'Destination MAC = router interface E6-E9-00-17-BB-4B, but the IP datagram inside keeps destination IP 222.222.222.222 (B). The router\'s adapter accepts the frame because the MAC address matches; C\'s adapter discards it.');
      notes.push({ lane: 2, t: t, text: 'forwarding table: → interface .220', cls: 'info' });
      if (scen !== 'cached') {
        msgs.push({ from: 2, to: 3, t0: t, t1: t + 1, label: 'ARP query: who has .222? (subnet 2)', kind: 'ctrl' });
        frame('subnet 2', H.R2.mac, BC, '—', '—', 'ARP query'); t += 1;
        step('The router ARPs for B on subnet 2', 'The router looks up 222.222.222.222 in its forwarding table: out of interface 222.222.222.220. It needs B\'s MAC address on that subnet, so it broadcasts an ARP query there.');
        msgs.push({ from: 3, to: 2, t0: t, t1: t + 1, label: 'ARP reply: .222 is ' + H.B.mac, kind: 'ack' });
        frame('subnet 2', H.B.mac, H.R2.mac, '—', '—', 'ARP reply'); t += 1;
        arpR.push([H.B.ip, H.B.mac]);
        step('B replies to the router', 'The router caches (222.222.222.222, ' + H.B.mac + ').');
      }
      msgs.push({ from: 2, to: 3, t0: t, t1: t + 1, label: 'new frame to ' + H.B.mac + ' [same IP datagram]', kind: 'data' });
      frame('subnet 2', H.R2.mac, H.B.mac, H.A.ip, H.B.ip, 'IPv4'); t += 1;
      step('The router sends a brand-new frame to B', 'Source MAC = the router\'s subnet-2 interface (1A-23-F9-CD-06-9B), destination MAC = B. The IP addresses are unchanged: source 111.111.111.111, destination 222.222.222.222. MAC addresses change hop by hop; IP addresses stay end to end.');
    }
    return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, frames: frames };
  }
  var tl = new CN.Timeline(CN.$('#stage'), { width: 860, unitPx: 70, margin: 100 });
  var cur = null;
  var player = new CN.Player({ steps: [], unitMs: 900, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function tab(rows) { return rows.length ? rows.map(function (r) { return '<tr><td class="mono">' + r[0] + '</td><td class="mono">' + r[1] + '</td></tr>'; }).join('') : '<tr><td colspan="2"><i>empty</i></td></tr>'; }
  function paint(i) {
    if (!cur) return;
    var s = i >= 0 ? cur.steps[i].snap : { arpA: CN.$('#scen').value === 'cached' ? [[H.R1.ip, H.R1.mac]] : [], arpR: CN.$('#scen').value === 'cached' ? [[H.B.ip, H.B.mac]] : [], frames: 0 };
    CN.$('#state').innerHTML = '<span class="k">A\'s ARP table</span><div class="tw"><table><thead><tr><th>IP</th><th>MAC</th></tr></thead><tbody>' + tab(s.arpA) + '</tbody></table></div><span class="k">Router R\'s ARP table (subnet 2)</span><div class="tw"><table><thead><tr><th>IP</th><th>MAC</th></tr></thead><tbody>' + tab(s.arpR) + '</tbody></table></div>';
    var rows = cur.frames.map(function (f, k) { return '<tr' + (k < s.frames ? (k === s.frames - 1 ? ' class="hl"' : '') : ' style="opacity:.35"') + '><td>' + (k + 1) + '</td><td>' + f.link + '</td><td>' + f.type + '</td><td class="mono">' + f.sm + '</td><td class="mono">' + f.dm + '</td><td class="mono">' + f.si + '</td><td class="mono">' + f.di + '</td></tr>'; }).join('');
    CN.$('#extra').innerHTML = '<div class="panel"><h3>Every frame and its addresses</h3><div class="tw"><table><thead><tr><th>#</th><th>On</th><th>Carries</th><th>Source MAC</th><th>Destination MAC</th><th>Source IP</th><th>Destination IP</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="srcline">Addresses follow Kurose\'s example (Section 6.4.1); C is an extra host on subnet 1.</p></div>';
  }
  function run() { cur = build(CN.$('#scen').value); tl.setModel({ lanes: cur.lanes, msgs: cur.msgs, notes: cur.notes, timers: [] }); player.load(cur.steps); }
  CN.$('#scen').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', run);
  run();
})();

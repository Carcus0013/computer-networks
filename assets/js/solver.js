/* Numerical solvers for the course page. Each solver renders inputs and a
   Given → Required → Formula → Substitution → Calculation → Final answer block. */
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n(x, d) { if (!isFinite(x)) return '∞'; var p = Math.pow(10, d === undefined ? 4 : d); return String(Math.round(x * p) / p); }
  function list(s) { return String(s || '').split(/[\s,;]+/).filter(Boolean).map(Number).filter(function (v) { return !isNaN(v); }); }
  function gr(rows, extra) {
    return '<dl class="gr">' + rows.map(function (r) {
      var fin = r[0] === 'Answer';
      return '<dt' + (fin ? ' class="fin"' : '') + '>' + (fin ? 'Final answer' : r[0]) + '</dt><dd' + (fin ? ' class="fin"' : '') + '>' + r[1] + '</dd>';
    }).join('') + '</dl>' + (extra || '');
  }
  function ipToInt(s) { var p = s.split('.').map(Number); if (p.length !== 4 || p.some(function (x) { return isNaN(x) || x < 0 || x > 255; })) return null; return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]; }
  function intToIp(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.'); }
  function maskOf(pfx) { return pfx === 0 ? 0 : ((0xFFFFFFFF << (32 - pfx)) >>> 0); }
  function bin8(v) { return ('00000000' + v.toString(2)).slice(-8); }

  var S = {};

  S.delay = {
    t: 'Nodal and end-to-end delay', k: 'Unit I · I.6',
    f: [['L', 'Packet length', '1200'], ['Lu', 'Unit', 'bytes', ['bytes', 'bits']], ['R', 'Link rates, Mbps (one per link)', '5, 5, 5'], ['d', 'Link lengths, km (one per link)', '4000, 3000, 1000'], ['s', 'Propagation speed (m/s)', '2e8'], ['proc', 'Processing per router (ms)', '2'], ['q', 'Queuing per router (ms)', '0']],
    run: function (v) {
      var L = +v.L * (v.Lu === 'bytes' ? 8 : 1), R = list(v.R), d = list(v.d), s = +v.s, proc = +v.proc, q = +v.q;
      var nL = Math.max(R.length, d.length); if (!nL || !L || !s) throw 'Enter the packet length, rates, lengths and speed.';
      while (R.length < nL) R.push(R[R.length - 1] || 1); while (d.length < nL) d.push(d[d.length - 1] || 0);
      var tr = R.map(function (r) { return L / (r * 1e6) * 1000; }), pr = d.map(function (k) { return k * 1000 / s * 1000; });
      var T = tr.reduce(function (a, b) { return a + b; }, 0), P = pr.reduce(function (a, b) { return a + b; }, 0), Pc = (nL - 1) * proc, Q = (nL - 1) * q, tot = T + P + Pc + Q;
      return gr([['Given', 'L = ' + L + ' bits; ' + nL + ' links, so ' + (nL - 1) + ' routers; R = ' + R.join(', ') + ' Mbps; lengths ' + d.join(', ') + ' km; s = ' + s + ' m/s; d<sub>proc</sub> = ' + proc + ' ms, d<sub>queue</sub> = ' + q + ' ms per router.'],
        ['Required', 'End-to-end delay of one packet (store-and-forward).'],
        ['Formula', '\\( d_{end-end} = \\sum_i \\left(\\frac{L}{R_i} + \\frac{d_i}{s}\\right) + (N-1)(d_{proc} + d_{queue}) \\)'],
        ['Substitution', tr.map(function (x, i) { return 'Link ' + (i + 1) + ': ' + L + '/(' + R[i] + '×10⁶) = ' + n(x) + ' ms; ' + d[i] + '×10³/' + s + ' = ' + n(pr[i]) + ' ms'; }).join('<br>')],
        ['Calculation', 'Transmission ' + n(T) + ' ms + propagation ' + n(P) + ' ms + processing ' + n(Pc) + ' ms + queuing ' + n(Q) + ' ms'],
        ['Answer', n(tot, 3) + ' ms. Shares: transmission ' + n(100 * T / tot, 1) + '%, propagation ' + n(100 * P / tot, 1) + '%, processing ' + n(100 * Pc / tot, 1) + '%' + (Q ? ', queuing ' + n(100 * Q / tot, 1) + '%' : '') + '.']]);
    }
  };

  S.throughput = {
    t: 'Throughput and transfer time', k: 'Unit I · I.6',
    f: [['R', 'Link rates along the path (Mbps)', '0.5, 2, 1'], ['k', 'Flows sharing each link (same order, optional)', ''], ['F', 'File size', '4'], ['Fu', 'File unit', 'MB', ['MB', 'Mbit', 'GB']]],
    run: function (v) {
      var R = list(v.R), K = list(v.k); if (!R.length) throw 'Enter at least one link rate.';
      var eff = R.map(function (r, i) { return r / (K[i] || 1); }), th = Math.min.apply(null, eff), idx = eff.indexOf(th);
      var Fb = +v.F * (v.Fu === 'MB' ? 8 : v.Fu === 'GB' ? 8000 : 1);
      return gr([['Given', 'Link rates ' + R.join(', ') + ' Mbps' + (K.length ? ', shared by ' + K.join(', ') + ' flows' : '') + '; file = ' + v.F + ' ' + v.Fu + ' = ' + n(Fb) + ' Mbit.'],
        ['Required', 'End-to-end throughput and approximate transfer time.'],
        ['Formula', '\\( \\text{throughput} = \\min_i (R_i / k_i), \\quad T \\approx F / \\text{throughput} \\)'],
        ['Substitution', 'min(' + eff.map(function (x) { return n(x); }).join(', ') + ') Mbps'],
        ['Calculation', 'Bottleneck = link ' + (idx + 1) + ' at ' + n(th) + ' Mbps; T = ' + n(Fb) + ' / ' + n(th) + ''],
        ['Answer', 'Throughput = ' + n(th) + ' Mbps; transfer time ≈ ' + n(Fb / th, 3) + ' s.']]);
    }
  };

  S.segment = {
    t: 'Message segmentation (store-and-forward)', k: 'Unit I · I.3, I.6',
    f: [['F', 'Message size (bits)', '8000000'], ['N', 'Links', '3'], ['R', 'Rate per link (Mbps)', '2'], ['P', 'Packets', '800'], ['h', 'Header per packet (bits)', '0']],
    run: function (v) {
      var F = +v.F, N = +v.N, R = +v.R * 1e6, P = Math.max(1, +v.P), h = +v.h; if (!F || !N || !R) throw 'Fill in all fields.';
      var t1 = N * (F + h) / R, L = F / P + h, t2 = (N + P - 1) * L / R;
      return gr([['Given', 'F = ' + F + ' bits, N = ' + N + ' links of ' + v.R + ' Mbps, P = ' + P + ' packets, header ' + h + ' bits; no propagation, queuing or processing.'],
        ['Required', 'Time without and with segmentation.'],
        ['Formula', 'Whole message: \\( N\\,(F + h)/R \\). Segmented: \\( (N + P - 1)\\,L/R \\) with \\( L = F/P + h \\).'],
        ['Substitution', 'L = ' + n(F / P) + ' + ' + h + ' = ' + n(L) + ' bits; L/R = ' + n(L / R * 1000) + ' ms'],
        ['Calculation', 'Whole: ' + N + ' × ' + n((F + h) / R) + ' s = ' + n(t1) + ' s. Segmented: (' + N + ' + ' + P + ' − 1) × ' + n(L / R * 1000) + ' ms = ' + n(t2 * 1000) + ' ms'],
        ['Answer', 'Without segmentation ' + n(t1, 3) + ' s; with segmentation ' + n(t2, 4) + ' s (' + n(t1 / t2, 2) + '× faster).']]);
    }
  };

  S.circuit = {
    t: 'Circuit switching with FDM/TDM', k: 'Unit I · I.3',
    f: [['F', 'File size (bits)', '640000'], ['R', 'Link rate (Mbps)', '1.536'], ['sl', 'Slots / channels', '24'], ['set', 'Setup time (ms)', '500']],
    run: function (v) {
      var Rc = +v.R * 1e6 / +v.sl, tx = +v.F / Rc;
      return gr([['Given', 'F = ' + v.F + ' bits; R = ' + v.R + ' Mbps shared by ' + v.sl + ' circuits; setup ' + v.set + ' ms.'], ['Required', 'Time to send the file.'], ['Formula', '\\( R_c = R / \\text{slots}, \\quad T = t_{setup} + F/R_c \\)'], ['Substitution', 'R<sub>c</sub> = ' + v.R + '×10⁶ / ' + v.sl + ' = ' + n(Rc) + ' bps'], ['Calculation', 'F/R<sub>c</sub> = ' + v.F + ' / ' + n(Rc) + ' = ' + n(tx) + ' s'], ['Answer', n(tx + v.set / 1000, 4) + ' s (independent of the number of links).']]);
    }
  };

  S.http = {
    t: 'HTTP response time', k: 'Unit I · I.10',
    f: [['mode', 'Mode', 'np', ['np', 'npp', 'p', 'pp']], ['n', 'Referenced objects', '10'], ['k', 'Parallel connections', '5'], ['rtt', 'RTT (ms)', '20'], ['dns', 'DNS time (ms)', '56'], ['tt', 'Transmission per object (ms)', '0']],
    labels: { np: 'Non-persistent, serial', npp: 'Non-persistent, parallel', p: 'Persistent, no pipelining', pp: 'Persistent, pipelined' },
    run: function (v) {
      var N = +v.n, K = Math.max(1, +v.k), R = +v.rtt, D = +v.dns, t = +v.tt, base = 2 * R + t, rest, f;
      if (v.mode === 'np') { rest = N * (2 * R + t); f = 'n × (2 RTT + t)'; }
      else if (v.mode === 'npp') { rest = Math.ceil(N / K) * (2 * R + t); f = '⌈n/k⌉ × (2 RTT + t)'; }
      else if (v.mode === 'p') { rest = N * (R + t); f = 'n × (RTT + t)'; }
      else { rest = R + N * t; f = 'RTT + n·t'; }
      return gr([['Given', 'Base HTML + ' + N + ' objects; RTT = ' + R + ' ms; DNS = ' + D + ' ms; transmission ' + t + ' ms/object; mode: ' + S.http.labels[v.mode] + (v.mode === 'npp' ? ', k = ' + K : '') + '.'], ['Required', 'Time until the whole page is received.'], ['Formula', 'Total = DNS + (2 RTT + t) for the base + ' + f], ['Substitution', D + ' + ' + base + ' + ' + rest], ['Calculation', 'Base page by ' + (D + base) + ' ms; objects add ' + rest + ' ms'], ['Answer', (D + base + rest) + ' ms']]);
    }
  };

  S.p2p = {
    t: 'P2P vs client-server distribution time', k: 'Unit I · I.14',
    f: [['F', 'File size (Mbit)', '8000'], ['N', 'Peers N', '10'], ['us', 'Server upload u_s (Mbps)', '5'], ['d', 'Slowest download d_min (Mbps)', '2'], ['u', 'Upload per peer (Mbps, or a list)', '1']],
    run: function (v) {
      var F = +v.F, N = +v.N, us = +v.us, d = +v.d, U = list(v.u), sumU = U.length === 1 ? U[0] * N : U.reduce(function (a, b) { return a + b; }, 0);
      var cs = Math.max(N * F / us, F / d), pp = Math.max(F / us, F / d, N * F / (us + sumU));
      return gr([['Given', 'F = ' + F + ' Mbit, N = ' + N + ', u_s = ' + us + ' Mbps, d_min = ' + d + ' Mbps, Σu_i = ' + sumU + ' Mbps.'], ['Required', 'Minimum distribution times.'], ['Formula', '\\( D_{cs} = \\max\\{NF/u_s, F/d_{min}\\} \\), \\( D_{P2P} = \\max\\{F/u_s, F/d_{min}, NF/(u_s + \\sum u_i)\\} \\)'], ['Substitution', 'CS: max(' + n(N * F / us) + ', ' + n(F / d) + '); P2P: max(' + n(F / us) + ', ' + n(F / d) + ', ' + n(N * F / (us + sumU)) + ')'], ['Calculation', 'Take the largest term in each.'], ['Answer', 'Client-server ' + n(cs, 2) + ' s; P2P ' + n(pp, 2) + ' s.']]);
    }
  };

  S.util = {
    t: 'Stop-and-wait and pipelining utilisation', k: 'Unit II · II.5, II.6',
    f: [['L', 'Packet size (bits)', '8000'], ['R', 'Link rate (Mbps)', '1000'], ['rtt', 'RTT (ms)', '30'], ['N', 'Window N (1 = stop-and-wait)', '1']],
    run: function (v) {
      var tr = +v.L / (+v.R * 1e6) * 1000, U = Math.min(1, +v.N * tr / (+v.rtt + tr));
      return gr([['Given', 'L = ' + v.L + ' bits, R = ' + v.R + ' Mbps, RTT = ' + v.rtt + ' ms, N = ' + v.N + '.'], ['Required', 'Sender utilisation and effective throughput.'], ['Formula', '\\( U = \\dfrac{N \\cdot L/R}{\\text{RTT} + L/R} \\) (at most 1)'], ['Substitution', 'L/R = ' + n(tr, 6) + ' ms; U = ' + v.N + ' × ' + n(tr, 6) + ' / (' + v.rtt + ' + ' + n(tr, 6) + ')'], ['Calculation', 'U = ' + n(U, 6)], ['Answer', 'U = ' + n(U, 6) + '; throughput = U × R = ' + n(U * +v.R, 4) + ' Mbps.']]);
    }
  };

  S.rtt = {
    t: 'EstimatedRTT, DevRTT and TimeoutInterval', k: 'Unit II · II.8',
    f: [['E', 'Initial EstimatedRTT (ms)', '100'], ['D', 'Initial DevRTT (ms)', '5'], ['S', 'SampleRTTs (ms)', '106, 120, 140, 90, 115'], ['a', 'α', '0.125'], ['b', 'β', '0.25'], ['ord', 'Order', 'kurose', ['kurose', 'rfc']]],
    labels: { kurose: 'Textbook: EstimatedRTT first', rfc: 'RFC 6298: DevRTT first' },
    run: function (v) {
      var E = +v.E, D = +v.D, a = +v.a, b = +v.b, rows = [];
      list(v.S).forEach(function (s, i) {
        var Eo = E, Do = D;
        if (v.ord === 'rfc') { D = (1 - b) * D + b * Math.abs(s - Eo); E = (1 - a) * Eo + a * s; }
        else { E = (1 - a) * Eo + a * s; D = (1 - b) * D + b * Math.abs(s - E); }
        rows.push('<tr><td>' + (i + 1) + '</td><td>' + s + '</td><td>' + n(E, 2) + '</td><td>' + n(D, 2) + '</td><td><b>' + n(E + 4 * D, 2) + '</b></td></tr>');
        void Do;
      });
      return gr([['Given', 'EstimatedRTT₀ = ' + v.E + ', DevRTT₀ = ' + v.D + ', α = ' + a + ', β = ' + b + '; order: ' + S.rtt.labels[v.ord] + '.'], ['Formula', '\\( E \\leftarrow (1-\\alpha)E + \\alpha S \\); \\( D \\leftarrow (1-\\beta)D + \\beta\\lvert S - E\\rvert \\); \\( T = E + 4D \\)'], ['Calculation', '<div class="tw"><table><thead><tr><th>#</th><th>SampleRTT</th><th>EstimatedRTT</th><th>DevRTT</th><th>Timeout</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'], ['Answer', 'Final TimeoutInterval = ' + n(E + 4 * D, 2) + ' ms.']]);
    }
  };

  S.tcpseq = {
    t: 'TCP sequence and acknowledgement numbers', k: 'Unit II · II.7',
    f: [['isn', 'Sequence number of the first data byte', '127'], ['lens', 'Segment data lengths (bytes)', '80, 40'], ['lost', 'Lost segments (1-based, optional)', '']],
    run: function (v) {
      var seq = +v.isn, lens = list(v.lens), lost = list(v.lost), exp = seq, rows = [], buf = {};
      lens.forEach(function (L, i) {
        var s = seq; seq += L;
        var arrived = lost.indexOf(i + 1) < 0, ack = '—';
        if (arrived) { if (s === exp) { exp += L; while (buf[exp]) { var l2 = buf[exp]; delete buf[exp]; exp += l2; } } else if (s > exp) buf[s] = L; ack = exp; }
        rows.push('<tr><td>' + (i + 1) + '</td><td>' + s + '</td><td>' + L + '</td><td>' + s + '–' + (s + L - 1) + '</td><td>' + (arrived ? 'ACK ' + ack : 'lost') + '</td></tr>');
      });
      return gr([['Given', 'First byte number ' + v.isn + '; segment lengths ' + lens.join(', ') + (lost.length ? '; lost: ' + lost.join(', ') : '') + '.'], ['Formula', 'seq<sub>i+1</sub> = seq<sub>i</sub> + length<sub>i</sub>; ACK = next byte expected (cumulative).'], ['Calculation', '<div class="tw"><table><thead><tr><th>Segment</th><th>Seq #</th><th>Bytes</th><th>Byte range</th><th>Receiver\'s ACK</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'], ['Answer', 'Next sequence number to send: ' + seq + '.']]);
    }
  };

  S.checksum = {
    t: 'Internet (UDP) checksum', k: 'Unit II · II.3',
    f: [['w', '16-bit words (hex or 16-bit binary)', '4500, 0073, 0000, 4000, 4011, B861']],
    run: function (v) {
      var ws = String(v.w).split(/[\s,;]+/).filter(Boolean).map(function (w) { return /^[01]{16}$/.test(w) ? parseInt(w, 2) : parseInt(w.replace(/^0x/i, ''), 16); }).filter(function (x) { return !isNaN(x) && x <= 0xFFFF; });
      if (!ws.length) throw 'Enter 16-bit words.';
      var h = function (x) { return '0x' + ('0000' + x.toString(16).toUpperCase()).slice(-4); }, sum = ws[0], lines = ['start: ' + h(sum)];
      ws.slice(1).forEach(function (w) { var raw = sum + w; sum = (raw & 0xFFFF) + (raw > 0xFFFF ? 1 : 0); lines.push('+ ' + h(w) + (raw > 0xFFFF ? ' = 0x' + raw.toString(16).toUpperCase() + ' → wrap → ' : ' = ') + h(sum)); });
      var cs = (~sum) & 0xFFFF;
      return gr([['Given', ws.map(h).join(', ')], ['Formula', 'One\'s-complement sum (wrap carries), then complement.'], ['Calculation', '<pre>' + lines.join('\n') + '\ncomplement of ' + h(sum) + ' = ' + h(cs) + '</pre>'], ['Answer', 'Checksum = ' + h(cs) + ' = ' + ('0000000000000000' + cs.toString(2)).slice(-16) + '. Receiver check: sum + checksum = ' + h((sum + cs) & 0xFFFF) + '.']]);
    }
  };

  S.subnet = {
    t: 'IPv4 address block and VLSM', k: 'Unit II · II.17', id: 'solver-subnet',
    f: [['cidr', 'Address / prefix', '193.10.1.0/24'], ['sizes', 'Subnet sizes for VLSM (optional)', '120, 56, 28, 12, 12'], ['kind', 'Sizes are', 'addr', ['addr', 'hosts']]],
    labels: { addr: 'addresses (round up to a power of 2)', hosts: 'usable hosts (add 2 first)' },
    run: function (v) {
      var m = String(v.cidr).trim().match(/^(\d+\.\d+\.\d+\.\d+)\s*\/\s*(\d+)$/); if (!m) throw 'Write the block as a.b.c.d/n.';
      var ip = ipToInt(m[1]), p = +m[2]; if (ip === null || p < 0 || p > 32) throw 'Invalid address or prefix.';
      var mk = maskOf(p), net = (ip & mk) >>> 0, bc = (net | (~mk >>> 0)) >>> 0, size = Math.pow(2, 32 - p);
      var first = m[1].split('.').map(Number)[0], cls = first < 128 ? 'A (default /8)' : first < 192 ? 'B (default /16)' : first < 224 ? 'C (default /24)' : first < 240 ? 'D (multicast)' : 'E (reserved)';
      var rows = [['Given', m[1] + '/' + p], ['Formula', 'network = address AND mask; broadcast = network OR NOT mask; addresses = 2<sup>32−n</sup>; hosts = 2<sup>32−n</sup> − 2'],
        ['Substitution', 'Mask /' + p + ' = ' + intToIp(mk) + ' = ' + intToIp(mk).split('.').map(function (x) { return bin8(+x); }).join(' ') + '<br>Address = ' + m[1].split('.').map(function (x) { return bin8(+x); }).join(' ')],
        ['Calculation', 'Network ' + intToIp(net) + ', broadcast ' + intToIp(bc) + ', ' + size + ' addresses, ' + Math.max(0, size - 2) + ' usable hosts; classful class ' + cls + '.'],
        ['Answer', 'Block ' + intToIp(net) + '/' + p + ': usable ' + (size > 2 ? intToIp(net + 1) + ' – ' + intToIp(bc - 1) : '—') + ', broadcast ' + intToIp(bc) + ', mask ' + intToIp(mk) + '.']];
      var sizes = list(v.sizes), extra = '';
      if (sizes.length) {
        var need = sizes.map(function (s, i) { var want = v.kind === 'hosts' ? s + 2 : s, b = 1; while (b < want) b *= 2; return { i: i + 1, s: s, b: b }; }).sort(function (a, b) { return b.b - a.b; });
        var cur = net, ok = true, tr = '';
        need.forEach(function (x) {
          var pf = 32 - Math.log2(x.b), end = cur + x.b - 1;
          if (end > bc) ok = false;
          tr += '<tr' + (end > bc ? ' style="color:var(--bad)"' : '') + '><td>' + x.i + '</td><td>' + x.s + '</td><td>' + x.b + '</td><td>' + intToIp(cur) + '/' + pf + '</td><td>' + intToIp(maskOf(pf)) + '</td><td>' + intToIp(cur + 1) + ' – ' + intToIp(end - 1) + '</td><td>' + intToIp(end) + '</td></tr>';
          cur = end + 1;
        });
        var used = need.reduce(function (a, x) { return a + x.b; }, 0);
        extra = '<h4>VLSM allocation (largest first)</h4><div class="tw"><table><thead><tr><th>Subnet</th><th>Needs</th><th>Block</th><th>Prefix</th><th>Mask</th><th>Usable range</th><th>Broadcast</th></tr></thead><tbody>' + tr + '</tbody></table></div><p>' + (ok ? 'Fits: ' + used + ' of ' + size + ' addresses used.' : '<span class="badmsg">Does not fit in this block (' + used + ' addresses needed).</span>') + ' Sizes are ' + S.subnet.labels[v.kind] + '.</p>';
      }
      return gr(rows, extra);
    }
  };

  S.frag = {
    t: 'IPv4 fragmentation', k: 'Unit II · II.16',
    f: [['tot', 'Datagram size incl. header (bytes)', '4000'], ['h', 'Header (bytes)', '20'], ['mtu', 'MTU (bytes)', '1500']],
    run: function (v) {
      var tot = +v.tot, h = +v.h, mtu = +v.mtu, data = tot - h, max = Math.floor((mtu - h) / 8) * 8;
      if (max <= 0 || data <= 0) throw 'The MTU must exceed the header.';
      var rows = [], off = 0, k = 0;
      while (off < data && k < 200) { var len = Math.min(max, data - off); rows.push('<tr><td>' + (++k) + '</td><td>' + len + '</td><td>' + (len + h) + '</td><td>' + off / 8 + '</td><td>' + (off + len < data ? 1 : 0) + '</td></tr>'); off += len; }
      return gr([['Given', 'Datagram ' + tot + ' bytes (' + h + ' header + ' + data + ' data), MTU ' + mtu + '.'], ['Formula', 'Data per fragment ≤ MTU − header, rounded down to a multiple of 8; offset = first data byte / 8; MF = 1 except the last.'], ['Substitution', 'Max data = ⌊(' + mtu + ' − ' + h + ')/8⌋ × 8 = ' + max + ' bytes'], ['Calculation', '<div class="tw"><table><thead><tr><th>Fragment</th><th>Data</th><th>Total length</th><th>Offset</th><th>MF</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'], ['Answer', k + ' fragments.']]);
    }
  };

  S.crc = {
    t: 'CRC remainder', k: 'Unit III · III.2',
    f: [['D', 'Data bits', '1010001101'], ['G', 'Generator bits', '110101']],
    run: function (v) {
      var D = String(v.D).replace(/[^01]/g, ''), G = String(v.G).replace(/[^01]/g, '');
      if (!D || G.length < 2 || G[0] !== '1') throw 'Enter data bits and a generator starting with 1.';
      var r = G.length - 1, a = (D + '0'.repeat(r)).split('').map(Number), g = G.split('').map(Number), lines = [a.join('')];
      for (var i = 0; i + g.length <= a.length; i++) { if (!a[i]) continue; for (var j = 0; j < g.length; j++) a[i + j] ^= g[j]; lines.push(' '.repeat(i) + G); lines.push(a.join('')); }
      var R = a.slice(-r).join('');
      return gr([['Given', 'D = ' + D + ', G = ' + G + ' (r = ' + r + ')'], ['Formula', 'R = remainder of D·2<sup>r</sup> ÷ G (XOR division)'], ['Calculation', '<pre>' + lines.join('\n') + '</pre>'], ['Answer', 'R = ' + R + '; transmit ' + D + R + '.']]);
    }
  };

  S.aloha = {
    t: 'ALOHA efficiency and Ethernet backoff', k: 'Unit III · III.4',
    f: [['N', 'Active nodes N', '4'], ['p', 'Probability p', '0.4'], ['c', 'Collisions so far n', '5'], ['R', 'Link rate (Mbps)', '1']],
    run: function (v) {
      var N = +v.N, p = +v.p, sl = N * p * Math.pow(1 - p, N - 1), pu = N * p * Math.pow(1 - p, 2 * (N - 1)), nn = Math.min(+v.c, 10), K = Math.pow(2, nn) - 1, bt = 512 / (+v.R * 1e6) * 1e6;
      return gr([['Given', 'N = ' + N + ', p = ' + p + '; n = ' + v.c + ' collisions; R = ' + v.R + ' Mbps.'], ['Formula', 'Slotted: \\( Np(1-p)^{N-1} \\); pure: \\( Np(1-p)^{2(N-1)} \\); backoff K ∈ {0 … 2ⁿ − 1}, wait K × 512 bit times.'], ['Substitution', 'Slotted: ' + N + ' × ' + p + ' × ' + n(1 - p) + '^' + (N - 1) + '; pure: ' + N + ' × ' + p + ' × ' + n(1 - p) + '^' + (2 * (N - 1)) + '; 512 bit times = ' + n(bt) + ' µs'], ['Calculation', 'Slotted = ' + n(sl) + ', pure = ' + n(pu) + '; K ≤ ' + K], ['Answer', 'Slotted ALOHA efficiency ' + n(sl) + ' (' + n(100 * sl, 2) + '%); pure ' + n(pu) + '. Backoff after collision ' + v.c + ': K × ' + n(bt) + ' µs, from 0 to ' + n(K * bt) + ' µs (mean ' + n(K / 2 * bt) + ' µs).']]);
    }
  };

  S.shannon = {
    t: 'Nyquist and Shannon', k: 'Unit III · III.14',
    f: [['B', 'Bandwidth (Hz)', '3000'], ['L', 'Signal levels L', '2'], ['snr', 'SNR (ratio, or add dB)', '3162'], ['u', 'SNR given as', 'ratio', ['ratio', 'dB']]],
    run: function (v) {
      var B = +v.B, L = +v.L, snr = v.u === 'dB' ? Math.pow(10, +v.snr / 10) : +v.snr;
      return gr([['Given', 'B = ' + B + ' Hz, L = ' + L + ', SNR = ' + n(snr, 2) + (v.u === 'dB' ? ' (from ' + v.snr + ' dB)' : ' (' + n(10 * Math.log10(snr), 2) + ' dB)')], ['Formula', '\\( \\text{BitRate} = 2B\\log_2 L \\); \\( C = B\\log_2(1+\\text{SNR}) \\)'], ['Substitution', '2 × ' + B + ' × log₂' + L + '; ' + B + ' × log₂(' + n(1 + snr, 2) + ')'], ['Calculation', 'log₂' + L + ' = ' + n(Math.log2(L)) + '; log₂(' + n(1 + snr, 2) + ') = ' + n(Math.log2(1 + snr))], ['Answer', 'Nyquist bit rate = ' + n(2 * B * Math.log2(L), 2) + ' bps; Shannon capacity = ' + n(B * Math.log2(1 + snr), 2) + ' bps.']]);
    }
  };

  S.db = {
    t: 'Decibels and attenuation', k: 'Unit III · III.13',
    f: [['P1', 'Power in, P₁ (mW)', '2'], ['P2', 'Power out, P₂ (mW, leave blank to compute)', ''], ['stages', 'Stage gains/losses (dB, e.g. -1.5)', '-1.5']],
    run: function (v) {
      var P1 = +v.P1;
      if (v.P2 !== '' && v.P2 !== undefined) { var P2 = +v.P2, d = 10 * Math.log10(P2 / P1); return gr([['Given', 'P₁ = ' + P1 + ' mW, P₂ = ' + P2 + ' mW'], ['Formula', '\\( \\text{dB} = 10\\log_{10}(P_2/P_1) \\)'], ['Substitution', '10 log₁₀(' + P2 + '/' + P1 + ')'], ['Calculation', '10 × ' + n(Math.log10(P2 / P1)) ], ['Answer', n(d, 3) + ' dB (' + (d < 0 ? 'a loss' : 'a gain') + ')']]); }
      var st = list(v.stages), tot = st.reduce(function (a, b) { return a + b; }, 0), out = P1 * Math.pow(10, tot / 10);
      return gr([['Given', 'P₁ = ' + P1 + ' mW; stages ' + st.join(', ') + ' dB'], ['Formula', 'dB values add; \\( P_2 = P_1 \\times 10^{\\text{dB}/10} \\)'], ['Substitution', 'Total = ' + n(tot) + ' dB'], ['Calculation', 'P₂ = ' + P1 + ' × 10^(' + n(tot / 10) + ')'], ['Answer', 'P₂ = ' + n(out) + ' mW = ' + n(10 * Math.log10(out), 2) + ' dBm']]);
    }
  };

  S.baud = {
    t: 'Bit rate, baud rate and bit length', k: 'Unit III · III.9, III.10',
    f: [['N', 'Data rate N (bps)', '100000'], ['r', 'Data elements per signal element r', '1'], ['c', 'Case factor c', '0.5'], ['s', 'Propagation speed (m/s)', '2e8']],
    run: function (v) {
      var N = +v.N, r = +v.r, c = +v.c, Sb = c * N / r;
      return gr([['Given', 'N = ' + N + ' bps, r = ' + r + ', c = ' + c + ', s = ' + v.s + ' m/s'], ['Formula', '\\( S = c \\cdot N / r \\) baud; \\( B_{min} = c \\cdot N / r \\); bit length = s × (1/N)'], ['Substitution', 'S = ' + c + ' × ' + N + ' / ' + r], ['Calculation', 'S = ' + n(Sb) + ' baud; bit length = ' + v.s + ' / ' + N], ['Answer', 'Baud rate ' + n(Sb) + ' baud (minimum bandwidth ≈ ' + n(Sb) + ' Hz); each bit occupies ' + n(+v.s / N, 3) + ' m.']]);
    }
  };

  function render(el) {
    var key = el.dataset.solver, def = S[key];
    if (!def) return;
    if (def.id && !el.id) el.id = def.id;
    var fields = def.f.map(function (f) {
      if (f[3]) return '<label>' + esc(f[1]) + ' <select data-k="' + f[0] + '">' + f[3].map(function (o) { return '<option value="' + o + '"' + (o === f[2] ? ' selected' : '') + '>' + esc((def.labels && def.labels[o]) || o) + '</option>'; }).join('') + '</select></label>';
      return '<label>' + esc(f[1]) + ' <input data-k="' + f[0] + '" type="text" value="' + esc(f[2]) + '"></label>';
    }).join('');
    el.innerHTML = '<div class="s-head"><span class="s-k">Solver · ' + esc(def.k) + '</span><span class="s-t">' + esc(def.t) + '</span></div><div class="s-body"><div class="fields">' + fields + '</div><button class="btn primary small" type="button">Solve step by step</button> <button class="btn small" type="button" data-reset>Reset values</button><p class="s-err"></p><div class="s-out"></div></div>';
    var go = function () {
      var v = {};
      el.querySelectorAll('[data-k]').forEach(function (i) { v[i.dataset.k] = esc(i.value.trim()); });
      var err = el.querySelector('.s-err'), out = el.querySelector('.s-out');
      try { out.innerHTML = def.run(v); err.textContent = ''; if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(function () {}); }
      catch (e) { err.textContent = typeof e === 'string' ? e : 'Please check the inputs.'; out.innerHTML = ''; }
    };
    el.querySelector('.btn.primary').addEventListener('click', go);
    el.querySelector('[data-reset]').addEventListener('click', function () { def.f.forEach(function (f) { var i = el.querySelector('[data-k="' + f[0] + '"]'); if (i) i.value = f[2]; }); go(); });
    el.querySelectorAll('input[data-k]').forEach(function (i) { i.addEventListener('input', function () { el.querySelector('.s-err').textContent = ''; }); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); }); });
    go();
  }
  document.querySelectorAll('[data-solver]').forEach(render);
})();

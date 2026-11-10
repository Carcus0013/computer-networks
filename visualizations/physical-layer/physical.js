/* Physical-layer studio: line coding, Nyquist/Shannon, decibels and SNR. */
(function () {
  'use strict';
  var CN = window.CN;
  CN.$('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    CN.$$('#tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
    ['code', 'rate', 'db'].forEach(function (t) { CN.$('#t-' + t).classList.toggle('hidden', t !== b.dataset.t); });
    CN.typeset();
  });
  var NAMES = { unipolar: 'Unipolar NRZ', nrzl: 'NRZ-L', nrzi: 'NRZ-I', rz: 'RZ', manchester: 'Manchester', diffman: 'Differential Manchester', ami: 'Bipolar AMI', pseudo: 'Pseudoternary', mlt3: 'MLT-3' };
  var RULES = {
    unipolar: '1 = +V, 0 = 0 V for the whole bit.',
    nrzl: 'The level decides the bit (Forouzan: 0 = +V, 1 = −V; switch the convention below).',
    nrzi: 'A 1 inverts the level at the start of the bit; a 0 keeps it.',
    rz: '1 = +V for the first half then 0; 0 = −V for the first half then 0.',
    manchester: 'A transition in the middle of every bit: 0 = high→low, 1 = low→high (IEEE 802.3, Forouzan).',
    diffman: 'Always a mid-bit transition; an extra transition at the start of the bit means 0, none means 1.',
    ami: '0 = 0 V; each 1 alternates between +V and −V.',
    pseudo: '1 = 0 V; each 0 alternates between +V and −V.',
    mlt3: 'A 0 keeps the level; each 1 steps through 0 → +V → 0 → −V → 0 …'
  };
  function code(s, bits, conv) {
    var seg = [], lev = conv.start, lastNZ = -1, cyc = [0, 1, 0, -1], ci = 0;
    bits.split('').map(Number).forEach(function (b) {
      if (s === 'unipolar') seg.push(b, b);
      else if (s === 'nrzl') { var v = (b === 0) === conv.nrzl0high ? 1 : -1; seg.push(v, v); }
      else if (s === 'nrzi') { if (b) lev = -lev; seg.push(lev, lev); }
      else if (s === 'rz') seg.push(b ? 1 : -1, 0);
      else if (s === 'manchester') { var zeroHL = conv.ieee; seg.push.apply(seg, (b === 0) === zeroHL ? [1, -1] : [-1, 1]); }
      else if (s === 'diffman') { if (b === 0) lev = -lev; seg.push(lev, -lev); lev = -lev; }
      else if (s === 'ami') { if (b) { lastNZ = -lastNZ; seg.push(lastNZ, lastNZ); } else seg.push(0, 0); }
      else if (s === 'pseudo') { if (!b) { lastNZ = -lastNZ; seg.push(lastNZ, lastNZ); } else seg.push(0, 0); }
      else if (s === 'mlt3') { if (b) ci = (ci + 1) % 4; seg.push(cyc[ci], cyc[ci]); }
    });
    return seg;
  }
  CN.$('#t-code').innerHTML = '<h3>Line-coding drawing board</h3><div class="opts">' +
    '<label>Bit stream <input id="lcBits" type="text" value="0010111101000010" style="width:220px"></label>' +
    '<label>NRZ-L convention <select id="lcNrzl"><option value="0">0 = +V, 1 = −V (Forouzan)</option><option value="1">1 = +V, 0 = −V</option></select></label>' +
    '<label>Manchester convention <select id="lcMan"><option value="ieee">0 = high→low (IEEE, Forouzan)</option><option value="thomas">0 = low→high (G. E. Thomas)</option></select></label>' +
    '<label>Starting level (NRZ-I, diff. Manchester) <select id="lcStart"><option value="1">positive</option><option value="-1">negative</option></select></label></div>' +
    '<div class="opts" id="lcSchemes">' + Object.keys(NAMES).map(function (k) { return '<label style="flex-direction:row;align-items:center;gap:5px"><input type="checkbox" value="' + k + '"' + (['nrzl', 'nrzi', 'manchester'].indexOf(k) >= 0 ? ' checked' : '') + '> ' + NAMES[k] + '</label>'; }).join('') + '</div>' +
    '<div id="lcOut"></div><p class="srcline">Default bits: 23CSE302 End 2025 Q1 (0b0010111101000010). State your convention in the exam.</p>';
  function drawCodes() {
    var b = (CN.$('#lcBits').value || '').replace(/[^01]/g, '').slice(0, 32);
    var schemes = CN.$$('#lcSchemes input:checked').map(function (x) { return x.value; });
    var conv = { nrzl0high: CN.$('#lcNrzl').value === '0', ieee: CN.$('#lcMan').value === 'ieee', start: +CN.$('#lcStart').value };
    if (!b || !schemes.length) { CN.$('#lcOut').innerHTML = '<p class="badmsg">Enter bits and choose at least one scheme.</p>'; return; }
    var W = 760, x0 = 150, bw = Math.min(56, (W - 170) / b.length), rowH = 78, amp = 24, o = [];
    b.split('').forEach(function (bit, i) { o.push('<text x="' + (x0 + bw * i + bw / 2) + '" y="18" class="c-head" text-anchor="middle">' + bit + '</text>'); });
    for (var i = 0; i <= b.length; i++) o.push('<line x1="' + (x0 + bw * i) + '" y1="26" x2="' + (x0 + bw * i) + '" y2="' + (26 + rowH * schemes.length) + '" class="w-bit"/>');
    schemes.forEach(function (s, r) {
      var mid = 26 + rowH * r + rowH / 2, seg = code(s, b, conv), d = '', px = x0, prev = null;
      o.push('<text x="8" y="' + (mid + 4) + '" class="c-text">' + NAMES[s] + '</text><text x="' + (x0 - 8) + '" y="' + (mid - amp + 4) + '" class="c-muted" text-anchor="end">+V</text><text x="' + (x0 - 8) + '" y="' + (mid + amp + 4) + '" class="c-muted" text-anchor="end">−V</text>');
      o.push('<line x1="' + x0 + '" y1="' + mid + '" x2="' + (x0 + bw * b.length) + '" y2="' + mid + '" class="w-zero"/>');
      seg.forEach(function (v) { var y = mid - v * amp; if (prev === null) d += 'M' + px + ' ' + y; else if (prev !== y) d += 'L' + px + ' ' + y; px += bw / 2; d += 'L' + px + ' ' + y; prev = y; });
      o.push('<path d="' + d + '" class="w-sig"/>');
    });
    var svg = '<svg viewBox="0 0 ' + W + ' ' + (36 + rowH * schemes.length) + '" role="img" aria-label="Line coding" style="width:100%;height:auto;min-width:560px">' + o.join('') + '</svg>';
    CN.$('#lcOut').innerHTML = '<div class="figbox" style="overflow-x:auto">' + svg + '</div><div class="tw"><table><thead><tr><th>Scheme</th><th>Rule used</th></tr></thead><tbody>' + schemes.map(function (s) { return '<tr><td>' + NAMES[s] + '</td><td>' + RULES[s] + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  CN.$('#t-code').addEventListener('input', drawCodes);
  CN.$('#t-code').addEventListener('change', drawCodes);
  drawCodes();

  function fmt(x, d) { return (Math.round(x * Math.pow(10, d || 2)) / Math.pow(10, d || 2)).toLocaleString('en-IN'); }
  function gr(rows) { return '<dl class="gr">' + rows.map(function (r) { var fin = r[0] === 'Answer'; return '<dt' + (fin ? ' class="fin"' : '') + '>' + (fin ? 'Final answer' : r[0]) + '</dt><dd' + (fin ? ' class="fin"' : '') + '>' + r[1] + '</dd>'; }).join('') + '</dl>'; }
  CN.$('#t-rate').innerHTML = '<h3>Data-rate limits</h3><div class="opts">' +
    '<label>Bandwidth B (Hz) <input id="rB" type="number" value="1000000" style="width:120px"></label>' +
    '<label>Signal levels L <input id="rL" type="number" value="4" style="width:70px"></label>' +
    '<label>SNR (ratio) <input id="rS" type="number" value="63" style="width:90px"></label>' +
    '<label>or SNR in dB <input id="rSdb" type="number" value="" placeholder="e.g. 36" style="width:80px"></label>' +
    '<label>Target bit rate (bps, for levels) <input id="rT" type="number" value="4000000" style="width:120px"></label>' +
    '<button class="btn" id="rGo" type="button">Compute</button><span class="hint">Defaults: Forouzan Example 3.41 (B = 1 MHz, SNR = 63).</span></div><div id="rOut"></div>';
  function rate() {
    var B = +CN.$('#rB').value, L = Math.max(2, +CN.$('#rL').value), sdb = CN.$('#rSdb').value, S = sdb !== '' ? Math.pow(10, +sdb / 10) : +CN.$('#rS').value, T = +CN.$('#rT').value;
    var nyq = 2 * B * Math.log2(L), C = B * Math.log2(1 + S), lv = T > 0 ? Math.pow(2, T / (2 * B)) : 0;
    CN.$('#rOut').innerHTML = '<h4>Nyquist (noiseless channel)</h4>' + gr([['Given', 'B = ' + fmt(B, 0) + ' Hz, L = ' + L + ' levels'], ['Formula', '\\( \\text{BitRate} = 2B\\log_2 L \\)'], ['Substitution', '\\( 2 \\times ' + B + ' \\times \\log_2 ' + L + ' \\)'], ['Calculation', '\\( \\log_2 ' + L + ' = ' + fmt(Math.log2(L), 3) + ' \\)'], ['Answer', fmt(nyq, 0) + ' bps']]) +
      '<h4>Shannon (noisy channel)</h4>' + gr([['Given', 'B = ' + fmt(B, 0) + ' Hz, SNR = ' + fmt(S, 2) + (sdb !== '' ? ' (from ' + sdb + ' dB: \\(10^{' + sdb + '/10}\\))' : ' (= ' + fmt(10 * Math.log10(S), 2) + ' dB)')], ['Formula', '\\( C = B\\log_2(1 + \\text{SNR}) \\)'], ['Substitution', '\\( ' + B + ' \\times \\log_2(1 + ' + fmt(S, 2) + ') \\)'], ['Calculation', '\\( \\log_2(' + fmt(1 + S, 2) + ') = ' + fmt(Math.log2(1 + S), 3) + ' \\)'], ['Answer', 'C = ' + fmt(C, 0) + ' bps (the upper limit for any number of levels)']]) +
      '<h4>Levels needed for the target rate</h4>' + gr([['Given', 'Target = ' + fmt(T, 0) + ' bps' + (T > C ? ' <span class="badmsg">(above the Shannon capacity: impossible)</span>' : '')], ['Formula', '\\( L = 2^{\\,\\text{rate}/2B} \\)'], ['Calculation', '\\( 2^{' + fmt(T / (2 * B), 3) + '} = ' + fmt(lv, 2) + ' \\)'], ['Answer', 'Use ' + Math.pow(2, Math.ceil(Math.log2(Math.max(2, lv)))) + ' levels (rounded up to a power of 2)']]);
    CN.typeset(CN.$('#rOut'));
  }
  CN.$('#rGo').addEventListener('click', rate); rate();

  CN.$('#t-db').innerHTML = '<h3>Decibels, attenuation and SNR</h3><div class="opts">' +
    '<label>P₁ (mW) <input id="dP1" type="number" value="2" style="width:90px"></label>' +
    '<label>Loss per km (dB) <input id="dL" type="number" value="0.3" style="width:80px"></label>' +
    '<label>Length (km) <input id="dK" type="number" value="5" style="width:70px"></label>' +
    '<label>Other stages (dB, comma) <input id="dS" type="text" value="" placeholder="e.g. +7, -3" style="width:120px"></label>' +
    '<label>Noise power (mW, for SNR) <input id="dN" type="number" value="0.001" style="width:90px"></label>' +
    '<button class="btn" id="dGo" type="button">Compute</button><span class="hint">Defaults: Forouzan Example 3.30 (2 mW into 5 km of −0.3 dB/km cable).</span></div><div id="dOut"></div>';
  function db() {
    var P1 = +CN.$('#dP1').value, loss = +CN.$('#dL').value, km = +CN.$('#dK').value, extra = (CN.$('#dS').value || '').split(/[\s,]+/).filter(Boolean).map(Number).filter(function (x) { return !isNaN(x); }), N = +CN.$('#dN').value;
    var total = -loss * km + extra.reduce(function (a, b) { return a + b; }, 0), P2 = P1 * Math.pow(10, total / 10), snr = N > 0 ? P2 / N : Infinity;
    CN.$('#dOut').innerHTML = gr([['Given', 'P₁ = ' + P1 + ' mW; cable −' + loss + ' dB/km × ' + km + ' km' + (extra.length ? '; other stages ' + extra.join(', ') + ' dB' : '')], ['Formula', '\\( \\text{dB} = 10\\log_{10}(P_2/P_1) \\Rightarrow P_2 = P_1 \\times 10^{\\text{dB}/10} \\); decibels add along a path.'], ['Substitution', 'Total = ' + (-loss * km) + (extra.length ? ' + (' + extra.join(') + (') + ')' : '') + ' = ' + fmt(total, 2) + ' dB'], ['Calculation', '\\( P_2 = ' + P1 + ' \\times 10^{' + fmt(total / 10, 3) + '} = ' + fmt(P2, 4) + ' \\) mW; in dBm: \\(10\\log_{10}' + fmt(P2, 4) + ' = ' + fmt(10 * Math.log10(P2), 2) + '\\) dBm'], ['Answer', 'P₂ ≈ ' + fmt(P2, 3) + ' mW (' + fmt(10 * Math.log10(P2), 2) + ' dBm)'], ['SNR', 'With noise ' + N + ' mW: SNR = ' + fmt(P2, 4) + ' / ' + N + ' = ' + fmt(snr, 2) + ' = ' + fmt(10 * Math.log10(snr), 2) + ' dB']]);
    CN.typeset(CN.$('#dOut'));
  }
  CN.$('#dGo').addEventListener('click', db); db();
  if ((location.hash || '').indexOf('rate') >= 0) CN.$('#tabs button[data-t=rate]').click();
})();

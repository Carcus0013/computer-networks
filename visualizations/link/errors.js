/* Error-detection workbench: CRC long division, 2-D parity, Internet checksum. */
(function () {
  'use strict';
  var CN = window.CN;
  CN.$('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    CN.$$('#tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
    ['crc', 'parity', 'csum'].forEach(function (t) { CN.$('#t-' + t).classList.toggle('hidden', t !== b.dataset.t); });
  });
  function bits(s) { return (s || '').replace(/[^01]/g, ''); }
  function polyToBits(s) {
    s = (s || '').trim();
    if (/^[01\s]+$/.test(s)) return bits(s);
    var terms = s.toLowerCase().replace(/\s/g, '').split('+'), pw = [];
    terms.forEach(function (t) { if (t === '1') pw.push(0); else if (t === 'x') pw.push(1); else { var m = t.match(/^x\^?(\d+)$/); if (m) pw.push(+m[1]); } });
    if (!pw.length) return '';
    var mx = Math.max.apply(null, pw), out = '';
    for (var i = mx; i >= 0; i--) out += pw.indexOf(i) >= 0 ? '1' : '0';
    return out;
  }
  function divide(dividend, G) {
    var a = dividend.split('').map(Number), g = G.split('').map(Number), r = G.length - 1, rows = [dividend];
    for (var i = 0; i + G.length <= a.length; i++) {
      if (a[i] !== 1) continue;
      for (var j = 0; j < g.length; j++) a[i + j] ^= g[j];
      rows.push({ pos: i, g: G, after: a.join('') });
    }
    return { rem: a.slice(a.length - r).join(''), rows: rows };
  }
  function divText(res, G) {
    var out = [res.rows[0]];
    res.rows.slice(1).forEach(function (row) {
      out.push(' '.repeat(row.pos) + G + '    XOR at position ' + (row.pos + 1));
      out.push('-'.repeat(res.rows[0].length));
      out.push(row.after);
    });
    return out.join('\n');
  }

  /* ---- CRC ---- */
  CN.$('#t-crc').innerHTML = '<h3>Cyclic redundancy check</h3><div class="opts">' +
    '<label>Data D <input id="crcD" type="text" value="1000111" style="width:200px"></label>' +
    '<label>Generator G (bits or polynomial) <input id="crcG" type="text" value="1001" style="width:180px"></label>' +
    '<label>Flip these bit positions in transit <input id="crcF" type="text" value="" placeholder="e.g. 3, 9" style="width:120px"></label>' +
    '<button class="btn" id="crcGo" type="button">Compute</button><span class="hint">Defaults: 23CSE302 End 2025 Q7(a). Try G = x^5 + x^2 + 1 with D = 11010011, or G = 110101 with D = 1010001101.</span></div><div id="crcOut" class="calc-out"></div>';
  function crc() {
    var D = bits(CN.$('#crcD').value), G = polyToBits(CN.$('#crcG').value), out = CN.$('#crcOut');
    if (!D || G.length < 2 || G[0] !== '1') { out.innerHTML = '<p class="badmsg">Enter data bits and a generator that starts with 1 (at least 2 bits).</p>'; return; }
    var r = G.length - 1, res = divide(D + '0'.repeat(r), G), T = D + res.rem;
    var flips = (CN.$('#crcF').value || '').split(/[\s,]+/).map(Number).filter(function (x) { return x >= 1 && x <= T.length; });
    var Rx = T.split(''); flips.forEach(function (p) { Rx[p - 1] = Rx[p - 1] === '1' ? '0' : '1'; }); Rx = Rx.join('');
    var chk = divide(Rx, G), ok = /^0+$/.test(chk.rem);
    out.innerHTML = '<dl class="gr"><dt>Given</dt><dd>D = <code>' + D + '</code> (d = ' + D.length + ' bits), G = <code>' + G + '</code> (' + G.length + ' bits, so r = ' + r + ')</dd>' +
      '<dt>Formula</dt><dd>Append r = ' + r + ' zeros to D and divide by G using XOR (modulo-2) arithmetic; the last r bits that remain are R.</dd>' +
      '<dt>Calculation</dt><dd><pre>' + divText(res, G) + '</pre></dd>' +
      '<dt class="fin">Answer</dt><dd class="fin">R = <code>' + res.rem + '</code>; transmitted frame = <code>' + D + '</code><code>' + res.rem + '</code> = <code>' + T + '</code></dd>' +
      '<dt>Receiver</dt><dd>' + (flips.length ? 'Received (bits ' + flips.join(', ') + ' flipped): <code>' + Rx + '</code>. ' : 'Received unchanged: <code>' + Rx + '</code>. ') + 'Divide by G:<pre>' + divText(chk, G) + '</pre>Remainder <code>' + chk.rem + '</code>: ' + (ok ? (flips.length ? '<span class="badmsg">zero, so this error pattern is <b>not</b> detected (it is a multiple of G).</span>' : '<span class="okmsg">zero, so the frame is accepted.</span>') : '<span class="badmsg">non-zero, so the error is detected and the frame is discarded.</span>') + '</dd></dl>';
  }
  CN.$('#crcGo').addEventListener('click', crc); crc();

  /* ---- 2-D parity ---- */
  CN.$('#t-parity').innerHTML = '<h3>Two-dimensional even parity</h3><p>Mode 1 builds the parity block for your data rows; click any bit to flip it and watch the receiver locate it. Mode 2 checks a received block whose last bit of every row and whose last row are parity (as in 20CYS303 End 2024 Q9).</p><div class="opts">' +
    '<label>Rows (space or comma separated) <input id="parRows" type="text" value="1010111, 1111001, 0111000" style="width:300px"></label>' +
    '<label>Mode <select id="parMode"><option value="build">Build parity for data rows</option><option value="check">Check a received block</option></select></label>' +
    '<button class="btn" id="parGo" type="button">Apply</button></div><div id="parOut"></div>';
  var grid = null;
  function parBuild() {
    var rows = CN.$('#parRows').value.split(/[\s,]+/).map(bits).filter(Boolean), mode = CN.$('#parMode').value;
    if (!rows.length) return;
    var w = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    rows = rows.map(function (r) { while (r.length < w) r = '0' + r; return r.split('').map(Number); });
    if (mode === 'build') {
      rows = rows.map(function (r) { return r.concat([r.reduce(function (a, b) { return a ^ b; }, 0)]); });
      var last = []; for (var c = 0; c <= w; c++) last.push(rows.reduce(function (a, r) { return a ^ r[c]; }, 0));
      rows.push(last);
    }
    grid = rows; parDraw();
  }
  function parDraw() {
    var R = grid.length, C = grid[0].length;
    var badR = [], badC = [];
    for (var i = 0; i < R; i++) if (grid[i].reduce(function (a, b) { return a ^ b; }, 0)) badR.push(i);
    for (var j = 0; j < C; j++) { var s = 0; for (var k = 0; k < R; k++) s ^= grid[k][j]; if (s) badC.push(j); }
    var h = '<table class="mono" style="width:auto;border-collapse:separate;border-spacing:3px;margin:10px 0"><tbody>';
    for (var i2 = 0; i2 < R; i2++) {
      h += '<tr>';
      for (var j2 = 0; j2 < C; j2++) {
        var par = i2 === R - 1 || j2 === C - 1, bad = badR.indexOf(i2) >= 0 && badC.indexOf(j2) >= 0;
        h += '<td data-r="' + i2 + '" data-c="' + j2 + '" style="cursor:pointer;text-align:center;width:28px;border:1px solid var(--rule);border-radius:4px;background:' + (bad ? 'var(--bad-soft)' : par ? 'var(--accent-soft)' : 'var(--panel)') + '">' + grid[i2][j2] + '</td>';
      }
      h += '<td style="border:none;color:' + (badR.indexOf(i2) >= 0 ? 'var(--bad)' : 'var(--good)') + '">' + (badR.indexOf(i2) >= 0 ? '✗ odd' : '✓') + '</td></tr>';
    }
    h += '<tr>' + grid[0].map(function (_, j3) { return '<td style="border:none;text-align:center;color:' + (badC.indexOf(j3) >= 0 ? 'var(--bad)' : 'var(--good)') + '">' + (badC.indexOf(j3) >= 0 ? '✗' : '✓') + '</td>'; }).join('') + '</tr></tbody></table>';
    var verdict;
    if (!badR.length && !badC.length) verdict = '<p class="okmsg">Every row and column has even parity: no error detected.</p>';
    else if (badR.length === 1 && badC.length === 1) verdict = '<p class="warnmsg">Exactly one row (' + (badR[0] + 1) + ') and one column (' + (badC[0] + 1) + ') fail, so the single flipped bit is at their intersection and can be <b>corrected</b>. Click it to flip it back.</p>';
    else verdict = '<p class="badmsg">Rows ' + badR.map(function (x) { return x + 1; }).join(', ') + ' and columns ' + badC.map(function (x) { return x + 1; }).join(', ') + ' fail: an error is <b>detected</b>, but more than one bit is wrong and the location is ambiguous, so it cannot be corrected.</p>';
    CN.$('#parOut').innerHTML = h + verdict + '<p class="srcline">Blue cells are parity bits. Click any bit to flip it.</p>';
  }
  CN.$('#parOut').addEventListener('click', function (e) { var td = e.target.closest('td[data-r]'); if (!td || !grid) return; var r = +td.dataset.r, c = +td.dataset.c; grid[r][c] ^= 1; parDraw(); });
  CN.$('#parGo').addEventListener('click', parBuild);
  CN.$('#parMode').addEventListener('change', function () { CN.$('#parRows').value = CN.$('#parMode').value === 'check' ? '10001101 01001001 10110011 01001101 00010010' : '1010111, 1111001, 0111000'; parBuild(); });
  parBuild();

  /* ---- Internet checksum ---- */
  CN.$('#t-csum').innerHTML = '<h3>Internet checksum (16-bit one\'s complement)</h3><div class="opts">' +
    '<label>16-bit words (hex like 4500 or binary) <input id="csW" type="text" value="0x4500, 0x0073, 0x0000, 0x4000, 0x4011, 0xB861" style="width:380px"></label>' +
    '<button class="btn" id="csGo" type="button">Compute</button><span class="hint">Default: 23CSE302 Mid 2025 Q3(b). Try 0110011001100000 0101010101010101 1000111100001100 (19CSE301 End 2023), or E3B4 1C4B (20CYS303 End 2025).</span></div><div id="csOut"></div>';
  function hex4(v) { return '0x' + ('0000' + v.toString(16).toUpperCase()).slice(-4); }
  function bin16(v) { var s = ('0000000000000000' + v.toString(2)).slice(-16); return s.slice(0, 4) + ' ' + s.slice(4, 8) + ' ' + s.slice(8, 12) + ' ' + s.slice(12); }
  function csum() {
    var words = CN.$('#csW').value.split(/[\s,;]+/).filter(Boolean).map(function (w) {
      w = w.trim(); if (/^[01]{16}$/.test(w)) return parseInt(w, 2);
      return parseInt(w.replace(/^0x/i, ''), 16);
    }).filter(function (v) { return !isNaN(v) && v >= 0 && v <= 0xFFFF; });
    if (words.length < 1) { CN.$('#csOut').innerHTML = '<p class="badmsg">Enter at least one 16-bit word.</p>'; return; }
    var sum = 0, lines = [];
    words.forEach(function (w, i) {
      if (i === 0) { sum = w; lines.push('start with ' + hex4(w) + '   ' + bin16(w)); return; }
      var raw = sum + w, wrap = raw > 0xFFFF;
      sum = (raw & 0xFFFF) + (wrap ? 1 : 0);
      lines.push('+ ' + hex4(w) + ' = ' + (wrap ? '0x' + raw.toString(16).toUpperCase() + ' → wrap the carry: ' + hex4(raw & 0xFFFF) + ' + 1 = ' : '') + hex4(sum) + '   ' + bin16(sum));
    });
    var cs = (~sum) & 0xFFFF, check = sum + cs;
    CN.$('#csOut').innerHTML = '<dl class="gr"><dt>Given</dt><dd>' + words.map(hex4).join(', ') + '</dd><dt>Formula</dt><dd>Add the words with end-around carry; checksum = one\'s complement (flip every bit) of the sum.</dd><dt>Calculation</dt><dd><pre>' + lines.join('\n') + '\nsum      = ' + hex4(sum) + '   ' + bin16(sum) + '\ncomplement = ' + hex4(cs) + '   ' + bin16(cs) + '</pre></dd><dt class="fin">Answer</dt><dd class="fin">Checksum = ' + hex4(cs) + ' (' + bin16(cs) + ')' + (cs === 0 ? '. In UDP an all-zero result is sent as 0xFFFF, because 0 means “no checksum”.' : '') + '</dd><dt>Receiver</dt><dd>Sum of all words + checksum = ' + hex4(sum) + ' + ' + hex4(cs) + ' = ' + hex4(check & 0xFFFF) + (check === 0xFFFF ? ' (all ones): <span class="okmsg">no error detected</span>.' : '') + ' A bit flipped 0→1 in one word and 1→0 in the same column of another word leaves this sum unchanged, which is why the checksum is weak.</dd></dl>';
  }
  CN.$('#csGo').addEventListener('click', csum); csum();
})();

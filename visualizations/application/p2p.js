/* Client-server vs P2P minimum distribution time (Kurose §2.5). */
(function () {
  'use strict';
  var CN = window.CN;
  CN.$('#calc').innerHTML = '<div class="opts">' +
    '<label>File F <input id="pF" type="number" value="1000" style="width:90px"></label>' +
    '<label>Unit <select id="pFu"><option value="MB">MB (× 8 × 10⁶ bits)</option><option value="Mb">Mbit</option><option value="Gb">Gbit</option></select></label>' +
    '<label>N peers <input id="pN" type="number" value="10" style="width:70px"></label>' +
    '<label>Server upload u_s (Mbps) <input id="pUs" type="number" value="5" style="width:80px"></label>' +
    '<label>Min peer download d_min (Mbps) <input id="pD" type="number" value="2" style="width:80px"></label>' +
    '<label>Each peer\'s upload u (Mbps) <input id="pU" type="number" value="1" style="width:80px"></label>' +
    '<button class="btn" id="pGo" type="button">Compute</button><span class="hint">Defaults: 23CSE302 Mid 2025 Q2(A). Try 19CSE301 Mid 2024 Q6: F = 10 Gbit, u_s = 1000, d = 200, u = 2 or 10, N = 10, 100, 1000.</span></div><div id="pOut"></div><div id="pChart"></div>';
  function f(x) { return (Math.round(x * 100) / 100).toLocaleString('en-IN'); }
  function calc() {
    var unit = CN.$('#pFu').value, Fv = +CN.$('#pF').value, F = unit === 'MB' ? Fv * 8 : unit === 'Gb' ? Fv * 1000 : Fv;   // in Mbit
    var N = Math.max(1, +CN.$('#pN').value || 1), us = +CN.$('#pUs').value, d = +CN.$('#pD').value, u = +CN.$('#pU').value;
    var a = N * F / us, b = F / d, cs = Math.max(a, b);
    var p1 = F / us, p2 = F / d, p3 = N * F / (us + N * u), pp = Math.max(p1, p2, p3);
    function mark(v, m) { return v === m ? '<b>' + f(v) + ' s ← decides</b>' : f(v) + ' s'; }
    CN.$('#pOut').innerHTML = '<div class="two"><div><h4>Client-server</h4><dl class="gr"><dt>Formula</dt><dd>\\( D_{cs} = \\max\\{NF/u_s,\\ F/d_{min}\\} \\)</dd><dt>NF/u_s</dt><dd>' + N + ' × ' + f(F) + ' / ' + us + ' = ' + mark(a, cs) + '</dd><dt>F/d_min</dt><dd>' + f(F) + ' / ' + d + ' = ' + mark(b, cs) + '</dd><dt class="fin">Answer</dt><dd class="fin">' + f(cs) + ' s (' + f(cs / 60) + ' min)</dd></dl></div>' +
      '<div><h4>Peer-to-peer</h4><dl class="gr"><dt>Formula</dt><dd>\\( D_{P2P} = \\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s + \\sum u_i)\\} \\)</dd><dt>F/u_s</dt><dd>' + f(F) + ' / ' + us + ' = ' + mark(p1, pp) + '</dd><dt>F/d_min</dt><dd>' + f(F) + ' / ' + d + ' = ' + mark(p2, pp) + '</dd><dt>NF/(u_s+Σu)</dt><dd>' + f(N * F) + ' / (' + us + ' + ' + N + ' × ' + u + ') = ' + mark(p3, pp) + '</dd><dt class="fin">Answer</dt><dd class="fin">' + f(pp) + ' s (' + f(pp / 60) + ' min)</dd></dl></div></div><p class="srcline">F = ' + f(F) + ' Mbit. All rates in Mbps, so times come out in seconds.</p>';
    // chart over N
    var W = 680, H = 280, L = 60, R = 16, T = 24, B = 40, maxN = Math.max(20, N * 2), pts = [];
    for (var k = 1; k <= 60; k++) { var n = Math.round(k * maxN / 60) || 1; pts.push([n, Math.max(n * F / us, F / d), Math.max(F / us, F / d, n * F / (us + n * u))]); }
    var maxY = Math.max.apply(null, pts.map(function (p) { return p[1]; })) * 1.05;
    function sx(v) { return L + v / maxN * (W - L - R); } function sy(v) { return H - B - v / maxY * (H - T - B); }
    var o = [];
    for (var g = 0; g <= 5; g++) { var vv = maxY * g / 5; o.push('<line x1="' + L + '" y1="' + sy(vv) + '" x2="' + (W - R) + '" y2="' + sy(vv) + '" class="c-grid"/><text x="' + (L - 6) + '" y="' + (sy(vv) + 4) + '" class="c-muted" text-anchor="end">' + Math.round(vv) + '</text>'); }
    o.push('<path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1); }).join('') + '" class="p-s0"/>');
    o.push('<path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[2]).toFixed(1); }).join('') + '" class="p-s1"/>');
    o.push('<line x1="' + sx(N) + '" y1="' + T + '" x2="' + sx(N) + '" y2="' + (H - B) + '" class="p-vline"/><text x="' + (sx(N) + 4) + '" y="' + (T + 10) + '" class="c-muted">N = ' + N + '</text>');
    o.push('<text x="' + ((L + W) / 2) + '" y="' + (H - 8) + '" class="c-muted" text-anchor="middle">number of peers N</text><text x="' + (L + 6) + '" y="16" class="c-text">blue: client-server (grows linearly) · ochre: P2P (levels off) · seconds</text>');
    CN.$('#pChart').innerHTML = '<div class="figbox" style="margin-top:12px"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Distribution time vs N" style="width:100%;height:auto">' + o.join('') + '</svg></div>';
    CN.typeset(CN.$('#pOut'));
  }
  CN.$('#pGo').addEventListener('click', calc);
  calc();
})();

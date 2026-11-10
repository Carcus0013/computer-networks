/* Multiple access simulator: slotted ALOHA, pure ALOHA, CSMA/CD with binary exponential backoff. */
(function () {
  'use strict';
  var CN = window.CN;
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  function slotted(c) {
    var R = rng(c.seed), steps = [], cells = [], succ = 0, coll = 0, empty = 0;
    for (var s = 0; s < c.slots; s++) {
      var tx = [];
      for (var n = 0; n < c.N; n++) if (R() < c.p) tx.push(n);
      var res = tx.length === 0 ? 'empty' : tx.length === 1 ? 'success' : 'collision';
      if (res === 'success') succ++; else if (res === 'collision') coll++; else empty++;
      cells.push({ s: s, tx: tx, res: res });
      steps.push({ t: s + 1, title: 'Slot ' + (s + 1) + ': ' + (res === 'empty' ? 'empty (nobody transmitted)' : res === 'success' ? 'success (node ' + (tx[0] + 1) + ' alone)' : 'collision (nodes ' + tx.map(function (x) { return x + 1; }).join(', ') + ')'), text: 'Each of the ' + c.N + ' nodes (all backlogged) transmits in this slot with probability p = ' + c.p + '. ' + (res === 'collision' ? 'Two or more frames overlap, so all are lost and each node will retry in a later slot with probability p.' : res === 'success' ? 'Exactly one node transmitted, so its frame gets through.' : 'Everyone held back: the slot is wasted.') + ' Successful slots so far: ' + succ + ' of ' + (s + 1) + '.', succ: succ, n: s + 1 });
    }
    var theory = c.N * c.p * Math.pow(1 - c.p, c.N - 1);
    return { cells: cells, steps: steps, theory: theory, formula: 'E = N p (1 − p)^(N − 1) = ' + c.N + ' × ' + c.p + ' × ' + (1 - c.p).toFixed(2) + '^' + (c.N - 1) + ' = ' + theory.toFixed(4), succ: succ };
  }
  function pure(c) {
    var R = rng(c.seed), frames = [], steps = [];
    for (var s = 0; s < c.slots; s++) for (var n = 0; n < c.N; n++) if (R() < c.p) frames.push({ n: n, start: s + R() });
    frames.sort(function (a, b) { return a.start - b.start; });
    frames.forEach(function (f) { f.ok = !frames.some(function (g) { return g !== f && Math.abs(g.start - f.start) < 1; }); });
    var succ = 0;
    frames.forEach(function (f, k) {
      if (f.start + 1 > c.slots) return;
      if (f.ok) succ++;
      steps.push({ t: f.start + 1, title: 'Node ' + (f.n + 1) + ' finishes a frame begun at ' + f.start.toFixed(2) + ': ' + (f.ok ? 'success' : 'collision'), text: f.ok ? 'No other frame started within one frame time before or after it, so it got through.' : 'Another frame overlapped it inside its vulnerable period of two frame times [t₀ − 1, t₀ + 1], so it was destroyed.', succ: succ, n: Math.ceil(f.start + 1) });
      void k;
    });
    var theory = c.N * c.p * Math.pow(1 - c.p, 2 * (c.N - 1));
    return { frames: frames, steps: steps, theory: theory, formula: 'E = N p (1 − p)^(2(N − 1)) = ' + c.N + ' × ' + c.p + ' × ' + (1 - c.p).toFixed(2) + '^' + (2 * (c.N - 1)) + ' = ' + theory.toFixed(4), succ: succ };
  }
  function csmacd(c) {
    // two stations, each with 2 frames; frame time 4, propagation 0.3, jam 0.5, backoff unit (512 bit times) = 1
    var R = rng(c.seed), FT = 4, PR = 0.3, JAM = 0.5, steps = [], bars = [], t = 0;
    var st = [{ name: 'A', left: 2, coll: 0, ready: 0 }, { name: 'B', left: 2, coll: 0, ready: 0.15 }];
    var guard = 0;
    while ((st[0].left || st[1].left) && guard++ < 40) {
      var cand = st.filter(function (x) { return x.left; }).sort(function (a, b) { return a.ready - b.ready; });
      var first = cand[0], second = cand[1];
      var t0 = Math.max(first.ready, t);
      if (second && second.ready < t0 + PR) {
        var t1 = Math.max(second.ready, t);
        var detect = Math.max(t0, t1) + PR;
        [first, second].forEach(function (x, j) {
          var s0 = j === 0 ? t0 : t1;
          bars.push({ who: x.name, a: s0, b: detect, kind: 'coll' });
          bars.push({ who: x.name, a: detect, b: detect + JAM, kind: 'jam' });
          x.coll++;
          var n = Math.min(x.coll, 10), K = Math.floor(R() * Math.pow(2, n));
          x.K = K; x.ready = detect + JAM + K;
          bars.push({ who: x.name, a: detect + JAM, b: x.ready, kind: 'wait', label: 'K=' + K });
        });
        steps.push({ t: detect + JAM, title: 'Collision! A and B both detect it, jam, and back off', text: 'Both stations sensed an idle channel and began within one propagation delay of each other, so neither could hear the other in time. Each aborts, sends a 48-bit jam signal, and picks K from {0, …, 2ⁿ − 1} for its n-th collision: A chose K = ' + st[0].K + ' (collision ' + st[0].coll + '), B chose K = ' + st[1].K + ' (collision ' + st[1].coll + '). Each waits K × 512 bit times (one unit here).' });
        t = detect + JAM;
        continue;
      }
      // success for first
      bars.push({ who: first.name, a: t0, b: t0 + FT, kind: 'ok' });
      first.left--; first.coll = 0;
      st.forEach(function (x) { if (x !== first && x.left && x.ready < t0 + FT + PR) x.ready = t0 + FT + PR + 0.05; });
      first.ready = t0 + FT + PR + 0.4;
      steps.push({ t: t0 + FT, title: 'Station ' + first.name + ' transmits a frame successfully', text: 'The channel was idle when ' + first.name + ' sensed it and no one else started within one propagation delay, so the whole frame got through. ' + (second ? 'The other station sensed the channel busy and deferred until it was idle again.' : '') + ' ' + first.name + '\'s collision counter resets to 0.' });
      t = t0 + FT;
    }
    return { bars: bars, steps: steps, end: t };
  }

  var stage = CN.$('#stage'), cur = null;
  var player = new CN.Player({ steps: [], unitMs: 700, render: draw, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function draw(T) {
    if (!cur) return;
    var c = cur.c, o = [], W = 760, L = 70, Rm = 16, top = 30, rowH = 34;
    if (c.proto === 'csmacd') {
      var span = cur.r.end + 1, sx = function (v) { return L + v / span * (W - L - Rm); };
      ['A', 'B'].forEach(function (w, j) {
        var y = top + j * (rowH + 12);
        o.push('<text x="10" y="' + (y + 22) + '" class="c-head">Station ' + w + '</text><line x1="' + L + '" y1="' + (y + rowH) + '" x2="' + (W - Rm) + '" y2="' + (y + rowH) + '" class="c-grid"/>');
        cur.r.bars.forEach(function (b) {
          if (b.who !== w || b.a > T) return;
          var bb = Math.min(b.b, T), col = { ok: 'var(--good)', coll: 'var(--bad)', jam: 'var(--mark)', wait: 'transparent' }[b.kind];
          o.push('<rect x="' + sx(b.a) + '" y="' + (y + 4) + '" width="' + Math.max(1, sx(bb) - sx(b.a)) + '" height="' + (rowH - 8) + '" rx="3" fill="' + col + '"' + (b.kind === 'wait' ? ' stroke="var(--mark)" stroke-dasharray="4 3"' : ' opacity=".85"') + '/>');
          if (b.label && T >= b.b) o.push('<text x="' + ((sx(b.a) + sx(b.b)) / 2) + '" y="' + (y + 22) + '" class="c-text" text-anchor="middle">backoff ' + b.label + '</text>');
        });
      });
      for (var k = 0; k <= span; k += 2) o.push('<text x="' + sx(k) + '" y="' + (top + 2 * (rowH + 12) + 14) + '" class="c-muted" text-anchor="middle">' + k + '</text>');
      o.push('<text x="' + L + '" y="' + (top + 2 * (rowH + 12) + 32) + '" class="c-muted">time (units of 512 bit times); green = frame sent, red = collided part, ochre = jam, dashed = backoff wait</text>');
      stage.innerHTML = '<svg viewBox="0 0 ' + W + ' 160" role="img" aria-label="CSMA/CD timeline" style="width:100%;height:auto;min-width:520px">' + o.join('') + '</svg>';
      return;
    }
    var S = c.slots, sx2 = function (v) { return L + v / S * (W - L - Rm); }, H = top + c.N * rowH + 70;
    for (var n = 0; n < c.N; n++) {
      var y = top + n * rowH;
      o.push('<text x="10" y="' + (y + 21) + '" class="c-head">Node ' + (n + 1) + '</text><line x1="' + L + '" y1="' + (y + rowH) + '" x2="' + (W - Rm) + '" y2="' + (y + rowH) + '" class="c-grid"/>');
    }
    if (c.proto === 'slotted') {
      for (var s = 0; s <= S; s++) o.push('<line x1="' + sx2(s) + '" y1="' + top + '" x2="' + sx2(s) + '" y2="' + (top + c.N * rowH) + '" class="c-grid"/>');
      cur.r.cells.forEach(function (cell) {
        if (cell.s + 1 > T + 1e-9) return;
        var col = cell.res === 'success' ? 'var(--good)' : cell.res === 'collision' ? 'var(--bad)' : null;
        cell.tx.forEach(function (nn) { o.push('<rect x="' + (sx2(cell.s) + 2) + '" y="' + (top + nn * rowH + 5) + '" width="' + (sx2(1) - sx2(0) - 4) + '" height="' + (rowH - 10) + '" rx="3" fill="' + col + '" opacity=".85"/>'); });
        o.push('<rect x="' + (sx2(cell.s) + 2) + '" y="' + (top + c.N * rowH + 6) + '" width="' + (sx2(1) - sx2(0) - 4) + '" height="10" rx="2" fill="' + (col || 'var(--rule)') + '"/>');
      });
      o.push('<text x="10" y="' + (top + c.N * rowH + 15) + '" class="c-muted">channel</text>');
    } else {
      cur.r.frames.forEach(function (f) {
        if (f.start > T || f.start + 1 > S) return;
        var e = Math.min(f.start + 1, T), done = T >= f.start + 1;
        o.push('<rect x="' + sx2(f.start) + '" y="' + (top + f.n * rowH + 5) + '" width="' + Math.max(1, sx2(e) - sx2(f.start)) + '" height="' + (rowH - 10) + '" rx="3" fill="' + (done ? (f.ok ? 'var(--good)' : 'var(--bad)') : 'var(--accent)') + '" opacity=".85"/>');
      });
    }
    for (var q = 0; q <= S; q += Math.ceil(S / 12)) o.push('<text x="' + sx2(q) + '" y="' + (H - 34) + '" class="c-muted" text-anchor="middle">' + q + '</text>');
    o.push('<text x="' + L + '" y="' + (H - 14) + '" class="c-muted">' + (c.proto === 'slotted' ? 'slots' : 'time (frame times)') + '</text>');
    stage.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Multiple access timeline" style="width:100%;height:auto;min-width:520px">' + o.join('') + '</svg>';
  }
  function paint(i) {
    if (!cur) return;
    var c = cur.c, s = cur.steps[i];
    if (c.proto === 'csmacd') {
      CN.$('#state').innerHTML = '<div class="tw"><table><tbody><tr><td>Backoff after n-th collision</td><td class="mono">K ∈ {0 … 2ⁿ − 1}</td></tr><tr><td>Wait</td><td class="mono">K × 512 bit times</td></tr><tr><td>At 10 Mbps</td><td class="mono">512 bit times = 51.2 µs</td></tr></tbody></table></div>';
      return;
    }
    var meas = s ? s.succ / Math.max(1, s.n) : 0;
    CN.$('#state').innerHTML = '<div class="tw"><table><tbody><tr><td>Measured efficiency so far</td><td class="mono">' + (s ? s.succ + ' / ' + s.n + ' = ' + meas.toFixed(3) : '—') + '</td></tr><tr><td>Theory</td><td class="mono">' + cur.r.formula + '</td></tr><tr><td>Best p for N = ' + c.N + '</td><td class="mono">p = 1/N = ' + (1 / c.N).toFixed(3) + ' → ' + (c.proto === 'slotted' ? Math.pow(1 - 1 / c.N, c.N - 1).toFixed(4) : (c.N * (1 / c.N) * Math.pow(1 - 1 / c.N, 2 * (c.N - 1))).toFixed(4)) + '</td></tr><tr><td>Limit as N → ∞</td><td class="mono">' + (c.proto === 'slotted' ? '1/e ≈ 0.368' : '1/(2e) ≈ 0.184') + '</td></tr></tbody></table></div><p class="srcline">A short random run fluctuates around the theoretical value; increase the slots or change the seed.</p>';
  }
  function run() {
    var c = { proto: CN.$('#proto').value, N: Math.max(2, Math.min(10, +CN.$('#N').value || 4)), p: Math.max(0.01, Math.min(1, +CN.$('#p').value || 0.4)), slots: Math.max(8, Math.min(60, +CN.$('#slots').value || 24)), seed: +CN.$('#seed').value || 7 };
    var r = c.proto === 'slotted' ? slotted(c) : c.proto === 'pure' ? pure(c) : csmacd(c);
    cur = { c: c, r: r, steps: r.steps };
    player.load(r.steps);
  }
  CN.$('#proto').addEventListener('change', run);
  CN.$('#apply').addEventListener('click', run);
  run();
})();

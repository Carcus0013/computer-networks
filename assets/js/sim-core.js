/* Shared engine for the CN simulators: page chrome, a step player, and a time-sequence (timeline) renderer.
   Works from file:// with no server. */
(function () {
  'use strict';
  var CN = window.CN = window.CN || {};

  /* ---------- helpers ---------- */
  CN.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };
  CN.$ = function (sel, root) { return (root || document).querySelector(sel); };
  CN.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  CN.hashParams = function () {
    var out = {};
    (location.hash || '').replace(/^#/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return out;
  };
  CN.typeset = function (el) {
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise(el ? [el] : undefined).catch(function () {});
  };

  /* ---------- page chrome: theme toggle ---------- */
  CN.initPage = function () {
    var btn = document.getElementById('theme-btn');
    var THEMES = ['auto', 'light', 'dark'];
    function cur() { return document.documentElement.getAttribute('data-theme') || 'auto'; }
    function set(t) {
      if (t === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('cn-theme', t); } catch (e) {}
      if (btn) btn.textContent = 'Theme: ' + t;
    }
    if (btn) {
      btn.textContent = 'Theme: ' + cur();
      btn.addEventListener('click', function () { set(THEMES[(THEMES.indexOf(cur()) + 1) % 3]); });
    }
  };

  /* ---------- the step player ----------
     opts.steps: [{t: number, title: string, text: string(html), ...}]
     opts.render(T, idx): draw the scene at continuous time T after step idx (-1 = initial)
     opts.onStep(idx): update panels when a step completes
     opts.unitMs: animation ms per time unit at 1x speed                          */
  CN.Player = function (opts) {
    this.opts = opts;
    this.speed = 1;
    this.idx = -1;
    this.T = 0;
    this.playing = false;
    this.anim = null;
    this.timer = null;
    this.listeners = [];
    this.load(opts.steps || []);
  };
  CN.Player.prototype = {
    load: function (steps) {
      this.stop();
      this.steps = steps;
      this.idx = -1;
      this.T = 0;
      this.draw();
    },
    on: function (fn) { this.listeners.push(fn); },
    emit: function () { var s = this; this.listeners.forEach(function (fn) { fn(s); }); },
    timeOf: function (i) { return i < 0 ? 0 : this.steps[i].t; },
    draw: function () {
      this.opts.render(this.T, this.idx);
      if (this.opts.onStep) this.opts.onStep(this.idx);
      this.emit();
    },
    stop: function () {
      if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; }
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    },
    animateTo: function (i, done) {
      var self = this;
      this.stop();
      this.target = i;
      var t0 = this.T, t1 = this.timeOf(i);
      var dur = Math.max(250, Math.abs(t1 - t0) * (this.opts.unitMs || 900)) / this.speed;
      if (t1 <= t0) dur = 120 / this.speed;
      var start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var k = Math.min(1, (ts - start) / dur);
        self.T = t0 + (t1 - t0) * (t1 > t0 ? k : 1);
        self.opts.render(self.T, k >= 1 ? i : i - 1);
        if (k < 1) { self.anim = requestAnimationFrame(frame); }
        else { self.anim = null; self.idx = i; self.T = t1; self.draw(); if (done) done(); }
      }
      this.anim = requestAnimationFrame(frame);
    },
    next: function () {
      if (this.anim && this.target !== undefined) {
        // a step is still animating: finish it at once instead of restarting it
        this.stop();
        this.idx = this.target; this.T = this.timeOf(this.idx); this.draw();
        return;
      }
      if (this.idx >= this.steps.length - 1) { this.pause(); return; }
      this.animateTo(this.idx + 1);
    },
    prev: function () {
      this.pause();
      if (this.idx < 0) return;
      this.idx -= 1;
      this.T = this.timeOf(this.idx);
      this.draw();
    },
    goTo: function (i) {
      this.pause();
      this.idx = Math.max(-1, Math.min(this.steps.length - 1, i));
      this.T = this.timeOf(this.idx);
      this.draw();
    },
    reset: function () { this.pause(); this.idx = -1; this.T = 0; this.draw(); },
    play: function () {
      var self = this;
      if (this.idx >= this.steps.length - 1) { this.idx = -1; this.T = 0; this.draw(); }
      this.playing = true;
      this.emit();
      function go() {
        if (!self.playing) return;
        if (self.idx >= self.steps.length - 1) { self.pause(); return; }
        self.animateTo(self.idx + 1, function () {
          if (!self.playing) return;
          self.timer = setTimeout(go, 650 / self.speed);
        });
      }
      go();
    },
    pause: function () { this.playing = false; this.stop(); this.emit(); },
    stepNext: function () {
      this.playing = false;
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      this.next();
      this.emit();
    },
    toggle: function () { if (this.playing) this.pause(); else this.play(); },
    setSpeed: function (s) { this.speed = s; }
  };

  /* Build the standard control bar for a player inside `host` */
  CN.controls = function (host, player) {
    host.innerHTML =
      '<button class="btn primary" type="button" data-a="play">▶ Play</button>' +
      '<button class="btn" type="button" data-a="prev" aria-label="Previous step">◀ Prev</button>' +
      '<button class="btn" type="button" data-a="next" aria-label="Next step">Next ▶</button>' +
      '<button class="btn" type="button" data-a="reset">⟲ Reset</button>' +
      '<label class="count">Speed <select data-a="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label>' +
      '<span class="count" data-a="count"></span>';
    var playBtn = host.querySelector('[data-a=play]');
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'play') player.toggle();
      if (a === 'next') player.stepNext();
      if (a === 'prev') player.prev();
      if (a === 'reset') player.reset();
    });
    host.querySelector('[data-a=speed]').addEventListener('change', function (e) { player.setSpeed(parseFloat(e.target.value)); });
    player.on(function (p) {
      playBtn.textContent = p.playing ? '❚❚ Pause' : '▶ Play';
      host.querySelector('[data-a=count]').textContent = 'Step ' + (p.idx + 1) + ' of ' + p.steps.length;
    });
    document.addEventListener('keydown', function (e) {
      if (/INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
      if (e.key === ' ') { e.preventDefault(); player.toggle(); }
      else if (e.key === 'ArrowRight') player.stepNext();
      else if (e.key === 'ArrowLeft') player.prev();
      else if (e.key === 'r' || e.key === 'R') player.reset();
    });
    player.emit();
  };

  /* Panel showing the current step's explanation and a clickable list of all steps */
  CN.stepPanel = function (nowEl, listEl, player) {
    function paint() {
      var i = player.idx, s = player.steps[i];
      if (!s) nowEl.innerHTML = '<p class="st">Ready</p><p>' + (player.introText || 'Press Play, or step through with Next.') + '</p>';
      else nowEl.innerHTML = '<p class="st">' + (i + 1) + '. ' + s.title + '</p>' + (s.text ? '<p>' + s.text + '</p>' : '');
      if (listEl) {
        listEl.innerHTML = player.steps.map(function (st, k) {
          return '<li data-i="' + k + '" class="' + (k === i ? 'cur' : (k > i ? 'future' : '')) + '"><span class="i">' + (k + 1) + '</span><span>' + st.title + '</span></li>';
        }).join('');
        var cur = listEl.querySelector('.cur');
        if (cur) { var r = cur.offsetTop - listEl.offsetTop; if (r < listEl.scrollTop || r > listEl.scrollTop + listEl.clientHeight - 30) listEl.scrollTop = r - 60; }
      }
    }
    if (listEl) listEl.addEventListener('click', function (e) {
      var li = e.target.closest('li'); if (li) player.goTo(parseInt(li.dataset.i, 10));
    });
    player.on(paint);
    paint();
  };

  /* ---------- timeline (time-sequence diagram) renderer ----------
     model = {
       lanes: [{name, sub}],
       msgs:  [{from, to, t0, t1, label, kind:'data'|'ack'|'ctrl'|'bad', lost:bool, lossAt:0.6, dur:0}],
       notes: [{lane, t, text, cls:'info'|'good'|'warn'|'bad'}],
       timers:[{lane, t0, t1, end:'fired'|'stopped'|null, label}]
     }                                                                            */
  CN.Timeline = function (host, opts) {
    this.host = host;
    this.opts = opts || {};
    this.W = this.opts.width || 760;
    this.unit = this.opts.unitPx || 56;
    this.top = 70;
    host.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('role', 'img');
    this.svg.setAttribute('aria-label', this.opts.aria || 'Time-sequence diagram');
    host.appendChild(this.svg);
  };
  CN.Timeline.prototype = {
    setModel: function (m) {
      this.m = m;
      var n = m.lanes.length, W = this.W, margin = this.opts.margin || 110;
      this.xs = m.lanes.map(function (l, i) { return n === 1 ? W / 2 : margin + i * (W - 2 * margin) / (n - 1); });
      var maxT = 0;
      m.msgs.forEach(function (x) { maxT = Math.max(maxT, x.t1 + (x.dur || 0)); });
      (m.notes || []).forEach(function (x) { maxT = Math.max(maxT, x.t); });
      (m.timers || []).forEach(function (x) { maxT = Math.max(maxT, x.t1); });
      this.maxT = maxT;
      this.H = this.top + (maxT + 1) * this.unit + 20;
      this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + this.H);
    },
    y: function (t) { return this.top + t * this.unit; },
    draw: function (T) {
      var self = this, m = this.m, o = [], esc = CN.esc;
      if (!m) return;
      o.push('<defs>' +
        '<marker id="tmA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink)"/></marker>' +
        '<marker id="tmB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker>' +
        '<marker id="tmC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--good)"/></marker>' +
        '<marker id="tmD" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--bad)"/></marker>' +
        '</defs>');
      // time axis ticks
      if (this.opts.axis) {
        for (var k = 0; k <= Math.ceil(this.maxT); k++) {
          var yy = this.y(k);
          o.push('<line x1="40" y1="' + yy + '" x2="' + (this.W - 10) + '" y2="' + yy + '" class="tl-grid"/>');
          o.push('<text x="6" y="' + (yy + 4) + '" class="tl-axis">' + esc(this.opts.axis(k)) + '</text>');
        }
      }
      // lanes
      m.lanes.forEach(function (l, i) {
        var x = self.xs[i], w = Math.max(96, 8 * l.name.length + 22);
        o.push('<line x1="' + x + '" y1="52" x2="' + x + '" y2="' + (self.H - 10) + '" class="tl-lane"/>');
        o.push('<rect x="' + (x - w / 2) + '" y="10" width="' + w + '" height="' + (l.sub ? 38 : 30) + '" rx="5" class="tl-head"/>');
        o.push('<text x="' + x + '" y="' + (l.sub ? 27 : 30) + '" text-anchor="middle" class="tl-headt">' + esc(l.name) + '</text>');
        if (l.sub) o.push('<text x="' + x + '" y="' + 42 + '" text-anchor="middle" class="tl-subt">' + esc(l.sub) + '</text>');
      });
      // timers
      (m.timers || []).forEach(function (tm) {
        if (T < tm.t0) return;
        var x = self.xs[tm.lane] + (tm.lane === m.lanes.length - 1 ? 14 : -14);
        var tEnd = Math.min(T, tm.t1), reached = T >= tm.t1 - 1e-9;
        var cls = 'tl-timer' + (reached && tm.end ? ' ' + tm.end : '');
        o.push('<line x1="' + x + '" y1="' + self.y(tm.t0) + '" x2="' + x + '" y2="' + self.y(tEnd) + '" class="' + cls + '"/>');
        if (tm.label) {
          var anchor = tm.lane === m.lanes.length - 1 ? 'start' : 'end', dx = tm.lane === m.lanes.length - 1 ? 8 : -8;
          o.push('<text x="' + (x + dx) + '" y="' + (self.y(tm.t0) + 16) + '" text-anchor="' + anchor + '" class="tl-note warn">' + esc(tm.label) + '</text>');
        }
        if (reached && tm.end === 'fired') {
          var a2 = tm.lane === m.lanes.length - 1 ? 'start' : 'end', d2 = tm.lane === m.lanes.length - 1 ? 8 : -8;
          o.push('<text x="' + (x + d2) + '" y="' + (self.y(tm.t1) - 6) + '" text-anchor="' + a2 + '" class="tl-note bad">⏰ timeout</text>');
        }
      });
      // messages
      var chips = [];
      m.msgs.forEach(function (msg) {
        if (T < msg.t0 - 1e-9) return;
        var xa = self.xs[msg.from], xb = self.xs[msg.to];
        var kind = msg.kind || 'data';
        var cls = msg.lost ? 'tl-lost' : (kind === 'bad' ? 'tl-bad' : 'tl-' + kind);
        var mk = { data: 'tmA', ack: 'tmB', ctrl: 'tmC', bad: 'tmD' }[kind] || 'tmA';
        var dur = msg.dur || 0;
        if (dur > 0) {
          // band: transmission of `dur` time units with propagation t1 - t0
          var p = Math.min(1, (T - msg.t0) / (msg.t1 - msg.t0 + dur));
          var tt = Math.min(T, msg.t1 + dur);
          var lead = Math.min(T, msg.t1), leadFrac = (lead - msg.t0) / Math.max(1e-9, msg.t1 - msg.t0);
          var xLead = xa + (xb - xa) * Math.max(0, Math.min(1, leadFrac));
          var tailStart = Math.min(T, msg.t0 + dur);
          var tailFrac = Math.max(0, (T - msg.t0 - dur) / Math.max(1e-9, msg.t1 - msg.t0));
          var xTail = xa + (xb - xa) * Math.min(1, tailFrac);
          var pts = [[xa, self.y(msg.t0)], [xLead, self.y(lead)], [xTail, self.y(tt)], [xa, self.y(tailStart)]];
          o.push('<polygon points="' + pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '" class="tl-band ' + kind + '"/>');
          if (T >= msg.t1 + dur - 1e-9 && msg.label) {
            var mx = (xa + xb) / 2, my = (self.y(msg.t0) + self.y(msg.t1 + dur)) / 2;
            o.push('<rect x="' + (mx - 3.4 * msg.label.length - 4) + '" y="' + (my - 10) + '" width="' + (6.8 * msg.label.length + 8) + '" height="15" rx="2" class="tl-lblbg"/>');
            o.push('<text x="' + mx + '" y="' + (my + 1) + '" text-anchor="middle" class="tl-lbl">' + esc(msg.label) + '</text>');
          }
          void p;
          return;
        }
        var frac = msg.t1 > msg.t0 ? (T - msg.t0) / (msg.t1 - msg.t0) : 1;
        var stopAt = msg.lost ? (msg.lossAt || 0.6) : 1;
        var f = Math.max(0, Math.min(frac, stopAt));
        var x2 = xa + (xb - xa) * f, y2 = self.y(msg.t0 + (msg.t1 - msg.t0) * f);
        var done = frac >= stopAt - 1e-9;
        o.push('<line x1="' + xa + '" y1="' + self.y(msg.t0) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" class="' + cls + '"' + (done && !msg.lost ? ' marker-end="url(#' + mk + ')"' : '') + '/>');
        if (msg.lost && done) o.push('<path d="M' + (x2 - 6) + ' ' + (y2 - 6) + 'l12 12m0 -12l-12 12" class="tl-x"/>');
        if (!done) {
          chips.push({ x: x2, y: y2, label: msg.label, kind: msg.lost ? 'data' : kind });
        } else if (msg.label) {
          var lf = msg.lost ? stopAt * 0.5 : 0.5;
          var lx = xa + (xb - xa) * lf, ly = self.y(msg.t0 + (msg.t1 - msg.t0) * lf);
          var span = Math.abs(xb - xa) || 1, tw = 6.8 * msg.label.length;
          ly = ly - Math.abs(self.y(msg.t1) - self.y(msg.t0)) / span * tw / 2 - 6;
          o.push('<rect x="' + (lx - tw / 2 - 4).toFixed(1) + '" y="' + (ly - 11).toFixed(1) + '" width="' + (tw + 8).toFixed(1) + '" height="15" rx="2" class="tl-lblbg"/>');
          o.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" class="tl-lbl">' + esc(msg.label + (msg.lost ? ' ✗ lost' : '')) + '</text>');
        }
      });
      // notes
      (m.notes || []).forEach(function (nt) {
        if (T < nt.t - 1e-9) return;
        var last = m.lanes.length - 1;
        var x = self.xs[nt.lane], anchor = nt.lane === 0 ? 'start' : (nt.lane === last ? 'end' : 'start');
        var dx = nt.lane === 0 ? 10 : (nt.lane === last ? -10 : 10);
        var tw = 6.6 * nt.text.length, bx = anchor === 'start' ? x + dx - 3 : x + dx - tw - 3;
        o.push('<rect x="' + bx.toFixed(1) + '" y="' + (self.y(nt.t) - 10) + '" width="' + (tw + 6).toFixed(1) + '" height="14" rx="2" class="tl-lblbg"/>');
        o.push('<text x="' + (x + dx) + '" y="' + (self.y(nt.t) + 1) + '" text-anchor="' + anchor + '" class="tl-note ' + (nt.cls || 'info') + '">' + esc(nt.text) + '</text>');
      });
      // moving packets on top
      chips.forEach(function (c) {
        var w = Math.max(30, 7 * (c.label || '').length + 12);
        o.push('<rect x="' + (c.x - w / 2).toFixed(1) + '" y="' + (c.y - 11).toFixed(1) + '" width="' + w + '" height="20" rx="4" class="tl-chip ' + c.kind + '"/>');
        o.push('<text x="' + c.x.toFixed(1) + '" y="' + (c.y + 3).toFixed(1) + '" text-anchor="middle" class="tl-chipt">' + CN.esc(c.label || '') + '</text>');
      });
      // current-time line
      if (T > 0) o.push('<line x1="20" y1="' + this.y(T) + '" x2="' + (this.W - 20) + '" y2="' + this.y(T) + '" class="tl-now"/>');
      this.svg.innerHTML = o.join('');
      // keep "now" in view
      var stage = this.host;
      if (stage && stage.scrollHeight > stage.clientHeight) {
        var scale = stage.clientWidth / this.W, yy2 = this.y(T) * scale;
        if (yy2 > stage.scrollTop + stage.clientHeight - 60 || yy2 < stage.scrollTop + 40) stage.scrollTop = Math.max(0, yy2 - stage.clientHeight / 2);
      }
    }
  };

  CN.initPage();
})();

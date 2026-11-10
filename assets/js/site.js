/* Computer Networks course site: navigation, progress tracking, theme, question bank. */
(function () {
  'use strict';
  var KEY = 'cn-progress-v1';
  var TOPICS = window.CN_TOPICS || [];
  var UNITS = window.CN_UNITS || [];
  var state = { done: {}, flag: {}, last: null, lastAt: null };

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && typeof s === 'object') {
        state.done = s.done || {}; state.flag = s.flag || {};
        state.last = s.last || null; state.lastAt = s.lastAt || null;
      }
    } catch (e) { /* storage blocked: progress just won't persist */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  load();

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById('theme-btn');
  var THEMES = ['auto', 'light', 'dark'];
  function currentTheme() { return document.documentElement.getAttribute('data-theme') || 'auto'; }
  function setTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('cn-theme', t); } catch (e) {}
    if (themeBtn) themeBtn.textContent = 'Theme: ' + t;
  }
  if (themeBtn) {
    themeBtn.textContent = 'Theme: ' + currentTheme();
    themeBtn.addEventListener('click', function () {
      var i = THEMES.indexOf(currentTheme());
      setTheme(THEMES[(i + 1) % THEMES.length]);
    });
  }

  /* ---------- contents rail on small screens ---------- */
  var toc = document.getElementById('toc');
  var small = window.matchMedia('(max-width: 999px)');
  if (toc) {
    if (small.matches) toc.removeAttribute('open');
    toc.addEventListener('click', function (e) {
      if (e.target.closest('a') && small.matches) toc.removeAttribute('open');
    });
  }

  /* ---------- progress ---------- */
  function unitStats(uid) {
    var list = TOPICS.filter(function (t) { return t.u === uid; });
    var d = list.filter(function (t) { return state.done[t.id]; }).length;
    return { total: list.length, done: d, pct: list.length ? Math.round(100 * d / list.length) : 0 };
  }
  function paint() {
    var n = TOPICS.filter(function (t) { return state.done[t.id]; }).length;
    var pct = TOPICS.length ? Math.round(100 * n / TOPICS.length) : 0;
    var pt = document.getElementById('prog-text');
    if (pt) pt.textContent = n + ' of ' + TOPICS.length + ' topics completed (' + pct + '%)';
    var pb = document.getElementById('prog-bar');
    if (pb) pb.style.width = pct + '%';
    var sp = document.getElementById('sum-prog');
    if (sp) sp.textContent = pct + '% done';
    document.querySelectorAll('.toc a[data-sec]').forEach(function (a) {
      a.classList.toggle('is-done', !!state.done[a.dataset.sec]);
      a.classList.toggle('is-flag', !!state.flag[a.dataset.sec]);
    });
    UNITS.forEach(function (u) {
      var s = unitStats(u.id);
      document.querySelectorAll('[data-upct="' + u.id + '"]').forEach(function (el) { el.textContent = s.done + '/' + s.total; });
    });
    document.querySelectorAll('input[data-done]').forEach(function (cb) { cb.checked = !!state.done[cb.dataset.done]; });
    document.querySelectorAll('input[data-flag]').forEach(function (cb) { cb.checked = !!state.flag[cb.dataset.flag]; });
    paintDashboard(n, pct);
  }
  document.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb.matches && cb.matches('input[data-done]')) { state.done[cb.dataset.done] = cb.checked; if (!cb.checked) delete state.done[cb.dataset.done]; save(); paint(); }
    if (cb.matches && cb.matches('input[data-flag]')) { state.flag[cb.dataset.flag] = cb.checked; if (!cb.checked) delete state.flag[cb.dataset.flag]; save(); paint(); }
  });

  /* ---------- dashboard ---------- */
  function li(t) {
    return '<li><a href="#' + t.id + '">' + t.n + ' · ' + escapeHtml(t.t) + '</a></li>';
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function paintResume(pending) {
    var resume = document.getElementById('dash-resume');
    if (!resume) return;
    var next = pending[0];
    var last = state.last && TOPICS.filter(function (t) { return t.id === state.last; })[0];
    var h = '';
    if (last) h += '<a class="btn primary" href="#' + last.id + '">Continue reading: ' + last.n + ' ' + escapeHtml(last.t) + '</a>';
    if (next && (!last || next.id !== last.id)) h += '<a class="btn" href="#' + next.id + '">Next unfinished: ' + next.n + ' ' + escapeHtml(next.t) + '</a>';
    h += '<a class="btn" href="#revision">Progress dashboard</a>';
    resume.innerHTML = h;
  }
  function paintDashboard(n, pct) {
    var pendingAll = TOPICS.filter(function (t) { return !state.done[t.id]; });
    paintResume(pendingAll);
    var el = document.getElementById('dashboard');
    if (!el) return;
    var cards = '<div class="card"><div class="k">Overall</div><div class="v">' + pct + '%</div><span class="bar"><i style="width:' + pct + '%"></i></span><div class="k" style="margin-top:8px">' + n + ' of ' + TOPICS.length + ' topics</div></div>';
    UNITS.forEach(function (u) {
      var s = unitStats(u.id);
      cards += '<div class="card"><div class="k">' + escapeHtml(u.short) + '</div><div class="v">' + s.pct + '%</div><span class="bar"><i style="width:' + s.pct + '%"></i></span><div class="k" style="margin-top:8px">' + s.done + ' of ' + s.total + ' topics</div></div>';
    });
    var flagged = TOPICS.filter(function (t) { return state.flag[t.id]; });
    cards += '<div class="card"><div class="k">Flagged for revision</div><div class="v">' + flagged.length + '</div></div>';
    document.getElementById('dash-cards').innerHTML = cards;
    var done = TOPICS.filter(function (t) { return state.done[t.id]; });
    var pending = TOPICS.filter(function (t) { return !state.done[t.id]; });
    document.getElementById('dash-done').innerHTML = done.length ? done.map(li).join('') : '<li class="empty">Nothing marked yet. Tick “Mark as completed” at the end of a topic.</li>';
    document.getElementById('dash-pending').innerHTML = pending.length ? pending.map(li).join('') : '<li class="empty">Everything is complete. Time for the question bank.</li>';
    document.getElementById('dash-flag').innerHTML = flagged.length ? flagged.map(li).join('') : '<li class="empty">No topics flagged. Use “Flag for revision” on any topic you found hard.</li>';
  }
  var resetBtn = document.getElementById('reset-progress');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!window.confirm('Reset all completed and flagged topics in this browser? This cannot be undone.')) return;
    state = { done: {}, flag: {}, last: null, lastAt: null };
    save(); paint();
  });
  var exportBtn = document.getElementById('export-progress');
  if (exportBtn) exportBtn.addEventListener('click', function () {
    var lines = ['# CN progress export (' + new Date().toISOString().slice(0, 10) + ')', ''];
    UNITS.forEach(function (u) {
      lines.push('## ' + u.short + ' – ' + u.title);
      TOPICS.filter(function (t) { return t.u === u.id; }).forEach(function (t) {
        lines.push('- [' + (state.done[t.id] ? 'x' : ' ') + '] ' + t.n + ' ' + t.t + (state.flag[t.id] ? '  (flagged for revision)' : ''));
      });
      lines.push('');
    });
    var box = document.getElementById('export-box');
    box.value = lines.join('\n'); box.hidden = false; box.select();
  });

  /* ---------- highlight the topic being read, remember it ---------- */
  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.toc a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-current'); });
          var a = links[en.target.id];
          a.classList.add('is-current');
          var det = a.closest('details.unit');
          if (det && !det.open) det.open = true;
          if (!small.matches && toc && a.scrollIntoView) {
            var r = a.getBoundingClientRect(), tr = toc.getBoundingClientRect();
            if (r.top < tr.top + 40 || r.bottom > tr.bottom - 40) toc.scrollTop += r.top - tr.top - tr.height / 3;
          }
          if (en.target.dataset.topic) { state.last = en.target.id; state.lastAt = Date.now(); save(); }
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  /* ---------- question bank: hide/show solutions, per-question reveal, filters ---------- */
  var toggles = document.querySelectorAll('[data-toggle-solutions]');
  function setSelftest(on) {
    document.body.classList.toggle('selftest', on);
    if (!on) document.querySelectorAll('.q.open').forEach(function (q) { q.classList.remove('open'); });
    toggles.forEach(function (b) { b.textContent = on ? 'Show all solutions' : 'Hide all solutions'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    try { localStorage.setItem('cn-selftest', on ? '1' : '0'); } catch (e) {}
  }
  toggles.forEach(function (b) { b.addEventListener('click', function () { setSelftest(!document.body.classList.contains('selftest')); }); });
  var st = '1';
  try { st = localStorage.getItem('cn-selftest') || '1'; } catch (e) {}
  setSelftest(st === '1');
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.q-reveal');
    if (!b) return;
    var q = b.closest('.q');
    q.classList.toggle('open');
    b.textContent = q.classList.contains('open') ? 'Hide this solution' : 'Show this solution';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([q]).catch(function () {});
  });
  document.querySelectorAll('.qfilter').forEach(function (bar) {
    var scope = document.getElementById(bar.dataset.scope) || document;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      var f = b.dataset.f;
      scope.querySelectorAll('.q').forEach(function (q) {
        var show = f === 'all' || q.dataset.kind === f || q.dataset.src === f;
        q.classList.toggle('hide-by-filter', !show);
      });
    });
  });

  paint();
})();

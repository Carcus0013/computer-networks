"""Build CN_Theory/index.html from the lesson sources in src/content.

Run:  python src/build.py
The output is a single self-contained page (plus assets/) that opens from file://.

Source format (a small Markdown dialect):
  @@unit u1 | Unit I | Introduction and Application Layer | lede text
  @@group Transport layer            (sub-heading inside a unit's contents list)
  @@topic id | I.1 | Title | lede | source line
  @@section id | eyebrow | Title | lede   (non-topic part such as the question bank)
  ## h3   ### h4   paragraphs   - lists   1. lists   | tables |
  :::fx Label / :::tip Label / :::exam / :::mistake / :::note / :::analogy
  :::two (columns split by a line "---") / :::ex Title / :::solve
  :::flow (lines "Label | text") / :::stack (lines "Layer | text")
  :::seq Lane A | Lane B ...  (sequence diagram)   :::graph caption  (network graph)
  :::wave bits | schemes      :::plot title | x label | y label
  :::q number | tag | meta  ... >>> solution ...   :::html (raw)
  !!sim href | Title | description
Inline: **bold** *italic* `code` [text](href) \\( math \\) {{paper:..}} {{gap:..}} {{src:..}} {{practice:..}}
"""
import html
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
CONTENT = os.path.join(SRC, 'content')

ORDER = [
    'start.md',
    'u1a.md', 'u1b.md', 'u1c.md', 'u1d.md',
    'u2a.md', 'u2b.md', 'u2c.md', 'u2d.md', 'u2e.md', 'u2f.md', 'u2g.md',
    'u3a.md', 'u3b.md', 'u3c.md',
    'numericals.md', 'visualizations.md', 'questions.md', 'revision.md',
]

esc = lambda s: html.escape(s, quote=False)
attr = lambda s: html.escape(s, quote=True)

# ----------------------------------------------------------------- inline
ALLOWED_TAG = re.compile(r'</?(sub|sup|b|i|em|strong|br|span|kbd|a|u|small|mark|code|abbr|s)\b[^>]*>', re.I)
ENTITY = re.compile(r'&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);')


def inline(s):
    store = []

    def keep(text):
        store.append(text)
        return '\x00%d\x00' % (len(store) - 1)

    # math first, kept verbatim (only HTML-escaped)
    s = re.sub(r'\\\((.+?)\\\)', lambda m: keep('\\(' + esc(m.group(1)) + '\\)'), s)
    s = re.sub(r'\\\[(.+?)\\\]', lambda m: keep('\\[' + esc(m.group(1)) + '\\]'), s, flags=re.S)
    s = re.sub(r'`([^`]+)`', lambda m: keep('<code>' + esc(m.group(1)) + '</code>'), s)
    s = ALLOWED_TAG.sub(lambda m: keep(m.group(0)), s)
    s = ENTITY.sub(lambda m: keep(m.group(0)), s)
    s = esc(s)
    s = re.sub(r'\{\{(paper|gap|src|practice):(.+?)\}\}', lambda m: chip(m.group(1), m.group(2)), s)
    s = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: '<a href="%s">%s</a>' % (m.group(2), m.group(1)), s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
    s = s.replace(' -- ', ' – ')
    s = re.sub(r'\x00(\d+)\x00', lambda m: store[int(m.group(1))], s)
    return s


def chip(kind, text):
    cls = {'paper': 'inpaper', 'gap': 'gap', 'src': 'gap', 'practice': 'practice'}[kind]
    return '<span class="%s">%s</span>' % (cls, text)


# ----------------------------------------------------------------- blocks
def collect_block(lines, i):
    """lines[i] starts with ':::name'. Return (inner_lines, next_index)."""
    depth = 1
    inner = []
    i += 1
    while i < len(lines):
        ln = lines[i]
        st = ln.strip()
        if st.startswith(':::') and st != ':::':
            depth += 1
        elif st == ':::':
            depth -= 1
            if depth == 0:
                return inner, i + 1
        inner.append(ln)
        i += 1
    raise SystemExit('Unclosed ::: block starting: ' + lines[0][:60])


def split_cols(lines, sep='---'):
    cols, cur, depth = [], [], 0
    for ln in lines:
        st = ln.strip()
        if st.startswith(':::') and st != ':::':
            depth += 1
        elif st == ':::':
            depth -= 1
        if st == sep and depth == 0:
            cols.append(cur)
            cur = []
        else:
            cur.append(ln)
    cols.append(cur)
    return cols


def render_list(items_lines):
    """items_lines: list of (indent, ordered, text). Builds nested lists."""
    out = []

    def build(idx, indent):
        ordered = items_lines[idx][1]
        tag = 'ol' if ordered else 'ul'
        parts = ['<%s class="plain">' % tag]
        while idx < len(items_lines):
            ind, o, text = items_lines[idx]
            if ind < indent:
                break
            if ind > indent:
                sub, idx = build(idx, ind)
                parts[-1] = parts[-1][:-5] + sub + '</li>'
                continue
            parts.append('<li>' + inline(text) + '</li>')
            idx += 1
        parts.append('</%s>' % tag)
        return ''.join(parts), idx

    i = 0
    while i < len(items_lines):
        h, i = build(i, items_lines[i][0])
        out.append(h)
    return '\n'.join(out)


def render_table(rows):
    cells = [[c.strip().replace(chr(1), '|') for c in r.strip().replace(r'\|', chr(1)).strip('|').split('|')] for r in rows]
    head = cells[0]
    body = [r for r in cells[2:]] if len(cells) > 1 and re.match(r'^[\s:\-|]+$', rows[1]) else cells[1:]
    o = ['<div class="tw"><table><thead><tr>']
    o += ['<th>%s</th>' % inline(c) for c in head]
    o.append('</tr></thead><tbody>')
    for r in body:
        hl = r and r[0].startswith('!')
        if hl:
            r[0] = r[0][1:].strip()
        o.append('<tr class="hl">' if hl else '<tr>')
        o += ['<td>%s</td>' % inline(c) for c in r]
        o.append('</tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)


SOLVE_KEYS = ['Given', 'Required', 'Formula', 'Substitution', 'Calculation', 'Answer', 'Check', 'Note']


def render_solve(lines):
    parts, cur_key, cur = [], None, []
    pat = re.compile(r'^(%s):\s?(.*)$' % '|'.join(SOLVE_KEYS))
    for ln in lines:
        m = pat.match(ln.strip()) if not ln.startswith('  ') else None
        if m:
            if cur_key:
                parts.append((cur_key, cur))
            cur_key, cur = m.group(1), [m.group(2)] if m.group(2) else []
        else:
            cur.append(ln[2:] if ln.startswith('  ') else ln)
    if cur_key:
        parts.append((cur_key, cur))
    o = ['<dl class="gr">']
    for k, body in parts:
        fin = ' class="fin"' if k == 'Answer' else ''
        label = 'Final answer' if k == 'Answer' else k
        o.append('<dt%s>%s</dt><dd%s>%s</dd>' % (fin, label, fin, blocks(body)))
    o.append('</dl>')
    return ''.join(o)


def blocks(lines):
    out = []
    para = []
    i = 0

    def flush():
        if para:
            text = ' '.join(x.strip() for x in para)
            out.append('<p>%s</p>' % inline(text))
            para.clear()

    while i < len(lines):
        ln = lines[i]
        st = ln.strip()
        if not st:
            flush()
            i += 1
            continue
        if st.startswith('<!--'):
            flush()
            while i < len(lines) and '-->' not in lines[i]:
                i += 1
            i += 1
            continue
        if st.startswith('```'):
            flush()
            code = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code.append(lines[i])
                i += 1
            i += 1
            out.append('<pre><code>%s</code></pre>' % esc('\n'.join(code)))
            continue
        if st.startswith(':::') and st != ':::':
            flush()
            head = st[3:].strip()
            name, _, arg = head.partition(' ')
            inner, i = collect_block(lines, i)
            out.append(render_block(name, arg.strip(), inner))
            continue
        if st.startswith('!!sim '):
            flush()
            out.append(render_sim(st[6:]))
            i += 1
            continue
        if st.startswith('#### '):
            flush()
            out.append('<h4>%s</h4>' % inline(st[5:]))
            i += 1
            continue
        if st.startswith('### '):
            flush()
            out.append('<h4>%s</h4>' % inline(st[4:]))
            i += 1
            continue
        if st.startswith('## '):
            flush()
            out.append('<h3>%s</h3>' % inline(st[3:]))
            i += 1
            continue
        if st.startswith('|'):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append(lines[i])
                i += 1
            out.append(render_table(rows))
            continue
        lm = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', ln)
        if lm and not st.startswith('**'):
            flush()
            items = []
            while i < len(lines):
                m = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', lines[i])
                if m and not lines[i].strip().startswith('**'):
                    items.append([len(m.group(1)), m.group(2)[0].isdigit(), m.group(3)])
                    i += 1
                elif lines[i].strip() and lines[i].startswith('   ') and items:
                    items[-1][2] += ' ' + lines[i].strip()
                    i += 1
                else:
                    break
            out.append(render_list([tuple(x) for x in items]))
            continue
        if st.startswith('\\[') and not para:
            # display math may span lines until \]
            buf = [st]
            while '\\]' not in buf[-1] and i + 1 < len(lines):
                i += 1
                buf.append(lines[i].strip())
            out.append('<p>%s</p>' % inline(' '.join(buf)))
            i += 1
            continue
        para.append(ln)
        i += 1
    flush()
    return '\n'.join(out)


def render_block(name, arg, inner):
    if name == 'fx':
        lbl = '<span class="fx-label">%s</span>' % inline(arg) if arg else ''
        return '<div class="fx">%s%s</div>' % (lbl, blocks(inner))
    if name in ('tip', 'exam', 'mistake', 'note', 'analogy'):
        default = {'tip': 'Tip', 'exam': 'Exam focus', 'mistake': 'Common mistakes',
                   'note': 'Note', 'analogy': 'Everyday analogy'}[name]
        cls = 'tip' if name == 'tip' else 'tip ' + name
        return '<div class="%s"><span class="lbl">%s</span>%s</div>' % (cls, inline(arg or default), blocks(inner))
    if name == 'two':
        cols = split_cols(inner)
        return '<div class="two">%s</div>' % ''.join('<div>%s</div>' % blocks(c) for c in cols)
    if name == 'ex':
        kind, _, title = arg.partition('|')
        if not title:
            kind, title = 'Worked example', kind
        return ('<div class="ex"><div class="ex-head"><span class="ex-k">%s</span><span class="ex-t">%s</span></div>'
                '<div class="ex-body">%s</div></div>') % (inline(kind.strip()), inline(title.strip()), blocks(inner))
    if name == 'solve':
        return render_solve(inner)
    if name == 'flow':
        steps = []
        for ln in inner:
            if ln.strip():
                k, _, t = ln.partition('|')
                steps.append('<div class="step"><b>%s</b>%s</div>' % (inline(k.strip()), inline(t.strip())))
        return '<div class="flow">%s</div>' % ''.join(steps)
    if name == 'stack':
        rows = []
        for ln in inner:
            if ln.strip():
                k, _, t = ln.partition('|')
                rows.append('<div class="lay"><b>%s</b><span>%s</span></div>' % (inline(k.strip()), inline(t.strip())))
        return '<div class="stack">%s</div>' % ''.join(rows)
    if name == 'rev':
        return '<div class="tip note"><span class="lbl">%s</span>%s</div>' % (inline(arg or 'Quick revision'), blocks(inner))
    if name == 'html':
        return '\n'.join(inner)
    if name == 'seq':
        return figure(seq_svg(arg, inner))
    if name == 'graph':
        return figure(graph_svg(inner), arg)
    if name == 'wave':
        return figure(*wave_svg(arg, inner))
    if name == 'plot':
        return figure(*plot_svg(arg, inner))
    if name == 'q':
        return render_q(arg, inner)
    raise SystemExit('Unknown block ::: ' + name)


def figure(svg, caption=''):
    m = re.match(r'<svg viewBox="0 0 (\d+) ', svg)
    if m:
        svg = svg.replace('<svg ', '<svg style="max-width:%spx;margin:0 auto" ' % m.group(1), 1)
    cap = '<figcaption>%s</figcaption>' % inline(caption) if caption else ''
    return '<figure><div class="figbox">%s</div>%s</figure>' % (svg, cap)


def render_sim(arg):
    href, title, desc = (p.strip() for p in (arg.split('|') + ['', ''])[:3])
    return ('<div class="simcard"><div><span class="sc-k">Interactive visualization</span>'
            '<span class="sc-t">%s</span><span class="sc-d">%s</span></div>'
            '<a class="btn primary" href="%s">Open simulator →</a></div>') % (inline(title), inline(desc), attr(href))


Q_COUNTER = [0]


def render_q(arg, inner):
    parts = [p.strip() for p in arg.split('|')]
    no = parts[0] if parts else ''
    tag = parts[1] if len(parts) > 1 else 'practice'
    meta = parts[2] if len(parts) > 2 else ''
    kind = parts[3] if len(parts) > 3 else ''
    q, sol = [], []
    target = q
    for ln in inner:
        if ln.strip() == '>>>':
            target = sol
            continue
        target.append(ln)
    Q_COUNTER[0] += 1
    is_paper = tag.lower().startswith('paper')
    label = tag.split(':', 1)[1].strip() if ':' in tag else ('From an uploaded paper' if is_paper else 'Practice question')
    chip_html = '<span class="%s">%s</span>' % ('inpaper' if is_paper else 'practice', esc(label))
    o = ['<div class="q" data-kind="%s" data-src="%s">' % (attr(kind), 'paper' if is_paper else 'practice')]
    o.append('<div class="q-top"><span class="q-no">%s</span>%s<span class="q-meta">%s</span></div>' % (esc(no), chip_html, inline(meta)))
    o.append('<div class="q-text">%s</div>' % blocks(q))
    if sol:
        o.append('<button class="btn small q-reveal" type="button">Show this solution</button>')
        o.append('<p class="sol-note">Solution hidden. Try it first, then press “Show this solution”.</p>')
        o.append('<div class="sol"><span class="sol-lbl">Solution</span>%s</div>' % blocks(sol))
    o.append('</div>')
    return ''.join(o)


# ----------------------------------------------------------------- diagrams
def T(x, y, s, cls='c-text', anchor='middle', extra=''):
    return '<text x="%.1f" y="%.1f" class="%s" text-anchor="%s"%s>%s</text>' % (x, y, cls, anchor, extra, esc(s))


ARROW_DEFS = ('<defs>'
              '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
              '<path d="M0 0L10 5L0 10z" class="m-ink"/></marker>'
              '<marker id="ahA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
              '<path d="M0 0L10 5L0 10z" class="m-acc"/></marker>'
              '<marker id="ahB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
              '<path d="M0 0L10 5L0 10z" class="m-bad"/></marker>'
              '</defs>')


def seq_svg(arg, lines):
    lanes = [x.strip() for x in arg.split('|') if x.strip()]
    n = len(lanes)
    longest = 0
    for raw in lines:
        mm = re.match(r'^\s*\d+\s*[:>]\s*(?:\d+\s*)?(?:[x!ad]+\s+)?(.*)$', raw)
        if mm:
            longest = max(longest, 6.7 * len(mm.group(1)) + 20)
    W = int(min(680, max(360, longest + 110))) if n == 2 else (600 if n == 3 else 680)
    hw = [max(88, 8 * len(name) + 20) for name in lanes]
    left, right = max(70, hw[0] / 2 + 6), W - max(70, hw[-1] / 2 + 6)
    xs = [left + i * (right - left) / max(1, n - 1) for i in range(n)] if n > 1 else [W / 2]
    y = 62
    body = []
    step, slant = 44, 30
    for raw in lines:
        st = raw.strip()
        if not st:
            continue
        m = re.match(r'^~\s*(\d+)$', st)
        if m:
            y += int(m.group(1))
            continue
        if st.startswith('--'):
            body.append('<line x1="20" y1="%.1f" x2="%d" y2="%.1f" class="sq-div"/>' % (y, W - 20, y))
            body.append(T(W / 2, y - 6, st[2:].strip(), 'c-muted c-halo'))
            y += 20
            continue
        m = re.match(r'^(\d+)\s*([:\[])\s*(.*)$', st)
        if m:
            li = int(m.group(1)) - 1
            text = m.group(3)
            if m.group(2) == '[':
                # span bar on a lane: "1[ 40 label" -> vertical bracket of height 40
                hm = re.match(r'^(\d+)\s+(.*)$', text)
                hgt, lbl = (int(hm.group(1)), hm.group(2)) if hm else (40, text)
                body.append('<rect x="%.1f" y="%.1f" width="8" height="%d" rx="2" class="sq-span"/>' % (xs[li] - 4, y, hgt))
                side = -1 if li < n - 1 or n == 1 else 1
                anchor = 'end' if side < 0 else 'start'
                body.append(T(xs[li] - 10 * (1 if side < 0 else -1), y + hgt / 2 + 4, lbl, 'sq-note', anchor))
                continue
            anchor = 'start' if li == 0 else ('end' if li == n - 1 else 'middle')
            dx = 8 if li == 0 else (-8 if li == n - 1 else 0)
            body.append(T(xs[li] + dx, y + 4, text, 'sq-note c-halo', anchor))
            y += 22
            continue
        m = re.match(r'^(\d+)\s*>\s*(\d+)\s*(.*)$', st)
        if not m:
            raise SystemExit('Bad seq line: ' + st)
        a, b = int(m.group(1)) - 1, int(m.group(2)) - 1
        rest = m.group(3)
        adv = None
        am = re.search(r'\[\+(\d+)\]\s*$', rest)
        if am:
            adv = int(am.group(1))
            rest = rest[:am.start()].strip()
        flags, label = '', rest
        fm = re.match(r'^([x!ad]+)\s+(.*)$', rest)
        if fm:
            flags, label = fm.group(1), fm.group(2)
        if adv is not None:
            y = y - step + adv
        x1, x2 = xs[a], xs[b]
        y1, y2 = y, y + slant
        cls, mk = 'sq-arr', 'ah'
        if 'a' in flags:
            cls, mk = 'sq-ack', 'ahA'
        if '!' in flags:
            cls, mk = 'sq-bad', 'ahB'
        if 'd' in flags:
            cls += '" stroke-dasharray="5 4'
        if 'x' in flags:
            xm, ym = x1 + (x2 - x1) * 0.62, y1 + (y2 - y1) * 0.62
            body.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" class="sq-lost"/>' % (x1, y1, xm, ym))
            body.append('<path d="M%.1f %.1fl8 8m0 -8l-8 8" class="sq-x"/>' % (xm - 4, ym - 4))
        else:
            body.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" class="%s" marker-end="url(#%s)"/>' % (x1, y1, x2, y2, cls, mk))
        if '!' in flags:
            label += '  (corrupted)'
        if 'x' in flags:
            label += '  (lost)'
        tw = 6.7 * len(label)
        span = abs(x2 - x1) or 1
        frac = 0.31 if 'x' in flags else 0.5
        lx = x1 + (x2 - x1) * frac
        ly = y1 + (y2 - y1) * frac - abs(y2 - y1) / span * tw / 2 - 5
        body.append('<rect x="%.1f" y="%.1f" width="%.1f" height="14" rx="2" class="sq-lblbg"/>' % (lx - tw / 2 - 3, ly - 10.5, tw + 6))
        body.append(T(lx, ly, label, 'c-text'))
        y += step
    H = y + 10
    head = []
    for i, name in enumerate(lanes):
        w = hw[i]
        head.append('<rect x="%.1f" y="14" width="%d" height="28" rx="4" class="sq-head"/>' % (xs[i] - w / 2, w))
        head.append(T(xs[i], 32, name, 'c-head'))
        head.append('<line x1="%.1f" y1="42" x2="%.1f" y2="%.1f" class="sq-life"/>' % (xs[i], xs[i], H - 4))
    return '<svg viewBox="0 0 %d %d" role="img" aria-label="Sequence diagram: %s">%s%s%s</svg>' % (
        W, H, attr(', '.join(lanes)), ARROW_DEFS, ''.join(head), ''.join(body))


def graph_svg(lines):
    nodes, edges, extra = {}, [], []
    for raw in lines:
        st = raw.strip()
        if not st:
            continue
        m = re.match(r'^(\S+)\s+(-?\d+)\s+(-?\d+)(?:\s+(\w+))?(?:\s+"(.*)")?$', st)
        if m:
            nodes[m.group(1)] = (int(m.group(2)), int(m.group(3)), m.group(4) or 'node', m.group(5))
            continue
        m = re.match(r'^(\S+?)\s*(-|>)\s*(\S+)(?:\s+(\S+))?(?:\s+([*~]+))?$', st)
        if m:
            edges.append((m.group(1), m.group(3), m.group(2) == '>', m.group(4), m.group(5) or ''))
            continue
        m = re.match(r'^text\s+(\d+)\s+(\d+)\s+(.*)$', st)
        if m:
            extra.append(T(int(m.group(1)), int(m.group(2)), m.group(3), 'c-muted'))
            continue
        raise SystemExit('Bad graph line: ' + st)
    maxx = max(v[0] for v in nodes.values()) + 60
    maxy = max(v[1] for v in nodes.values()) + 40
    o = []
    for a, b, directed, cost, style in edges:
        if cost in ('*', '~'):
            style, cost = cost, None
        x1, y1 = nodes[a][:2]
        x2, y2 = nodes[b][:2]
        cls = 'g-hl' if '*' in style else ('g-dash' if '~' in style else 'g-edge')
        if directed:
            d = math.hypot(x2 - x1, y2 - y1) or 1
            x2e, y2e = x2 - (x2 - x1) / d * 22, y2 - (y2 - y1) / d * 22
            o.append('<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" class="%s" marker-end="url(#ah)"/>' % (x1, y1, x2e, y2e, cls))
        else:
            o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" class="%s"/>' % (x1, y1, x2, y2, cls))
        if cost and cost != '_':
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            dx, dy = y2 - y1, -(x2 - x1)
            dl = math.hypot(dx, dy) or 1
            o.append(T(mx + dx / dl * 11, my + dy / dl * 11 + 4, cost, 'g-cost c-halo'))
    for name, (x, y, shape, label) in nodes.items():
        lab = label or name
        if shape == 'dot':
            o.append('<circle cx="%d" cy="%d" r="4" class="m-ink"/>' % (x, y))
        elif shape == 'node' or shape == 'hl':
            o.append('<circle cx="%d" cy="%d" r="17" class="%s"/>' % (x, y, 'g-node-hl' if shape == 'hl' else 'g-node'))
            o.append(T(x, y + 4.5, lab, 'g-label'))
        else:
            w = max(44, 7.6 * len(lab) + 18)
            cls = {'box': 'g-box', 'host': 'g-host'}.get(shape, 'g-box')
            o.append('<rect x="%.1f" y="%d" width="%.1f" height="28" rx="5" class="%s"/>' % (x - w / 2, y - 14, w, cls))
            o.append(T(x, y + 4.5, lab, 'g-label'))
    return '<svg viewBox="0 0 %d %d" role="img" aria-label="Network diagram">%s%s%s</svg>' % (max(maxx, 200), maxy, ARROW_DEFS, ''.join(o), ''.join(extra))


def line_code(scheme, bits, start=1):
    """Return list of (level) per half-bit, levels in {+1,0,-1}. Forouzan conventions."""
    seg = []
    level = start
    last_one = -1  # for AMI: last nonzero polarity
    mlt_seq, mlt_i = [0, 1, 0, -1], 0
    for b in bits:
        b = int(b)
        if scheme == 'unipolar':
            seg += [1 if b else 0] * 2
        elif scheme == 'nrzl':
            v = 1 if b == 0 else -1
            seg += [v, v]
        elif scheme == 'nrzi':
            if b == 1:
                level = -level
            seg += [level, level]
        elif scheme == 'rz':
            v = 1 if b == 1 else -1
            seg += [v, 0]
        elif scheme == 'manchester':
            seg += [1, -1] if b == 0 else [-1, 1]
        elif scheme == 'diffman':
            if b == 0:
                level = -level
            seg += [level, -level]
            level = -level
        elif scheme == 'ami':
            if b == 1:
                last_one = -last_one
                seg += [last_one, last_one]
            else:
                seg += [0, 0]
        elif scheme == 'pseudo':
            if b == 0:
                last_one = -last_one
                seg += [last_one, last_one]
            else:
                seg += [0, 0]
        elif scheme == 'mlt3':
            if b == 1:
                mlt_i = (mlt_i + 1) % 4
            v = mlt_seq[mlt_i]
            seg += [v, v]
    return seg


SCHEME_NAMES = {'unipolar': 'Unipolar NRZ', 'nrzl': 'NRZ-L', 'nrzi': 'NRZ-I', 'rz': 'RZ', 'manchester': 'Manchester',
                'diffman': 'Diff. Manchester', 'ami': 'Bipolar AMI', 'pseudo': 'Pseudoternary', 'mlt3': 'MLT-3'}


def wave_svg(arg, lines):
    bits_s, _, schemes_s = arg.partition('|')
    bits = re.sub(r'[^01]', '', bits_s)
    schemes = schemes_s.split() or ['nrzl']
    caption = ' '.join(l.strip() for l in lines if l.strip())
    W = 680
    x0, bw = 130, min(64, (W - 150) / len(bits))
    rowh, amp = 74, 22
    o = []
    for i, b in enumerate(bits):
        o.append(T(x0 + bw * i + bw / 2, 18, b, 'c-head'))
    for i in range(len(bits) + 1):
        o.append('<line x1="%.1f" y1="26" x2="%.1f" y2="%d" class="w-bit"/>' % (x0 + bw * i, x0 + bw * i, 26 + rowh * len(schemes)))
    for r, sc in enumerate(schemes):
        mid = 26 + rowh * r + rowh / 2
        o.append(T(10, mid + 4, SCHEME_NAMES.get(sc, sc), 'c-text', 'start'))
        o.append('<line x1="%d" y1="%.1f" x2="%.1f" y2="%.1f" class="w-zero"/>' % (x0, mid, x0 + bw * len(bits), mid))
        seg = line_code(sc, bits)
        d, px = '', x0
        prev = None
        for k, v in enumerate(seg):
            yv = mid - v * amp
            if prev is None:
                d += 'M%.1f %.1f' % (px, yv)
            elif prev != yv:
                d += 'L%.1f %.1f' % (px, yv)
            px += bw / 2
            d += 'L%.1f %.1f' % (px, yv)
            prev = yv
        o.append('<path d="%s" class="w-sig"/>' % d)
    H = 26 + rowh * len(schemes) + 8
    return ('<svg viewBox="0 0 %d %d" role="img" aria-label="Line coding of %s">%s</svg>' % (W, H, bits, ''.join(o)), caption)


def nice_ticks(lo, hi, n=6):
    span = hi - lo or 1
    raw = span / n
    mag = 10 ** math.floor(math.log10(raw))
    for m in (1, 2, 2.5, 5, 10):
        if raw <= m * mag:
            step = m * mag
            break
    t = math.ceil(lo / step) * step
    out = []
    while t <= hi + 1e-9:
        out.append(round(t, 10))
        t += step
    return out


def plot_svg(arg, lines):
    title, xl, yl = ([p.strip() for p in arg.split('|')] + ['', '', ''])[:3]
    series, vlines, notes, opts = [], [], [], {}
    for raw in lines:
        st = raw.strip()
        if not st:
            continue
        if st.startswith('series '):
            name, _, pts = st[7:].partition(':')
            style = 'line'
            if name.endswith(' step'):
                name, style = name[:-5], 'step'
            if name.endswith(' dots'):
                name, style = name[:-5], 'dots'
            P = [tuple(float(v) for v in p.split(',')) for p in pts.split()]
            series.append((name.strip(), P, style))
        elif st.startswith('vline '):
            x, _, lab = st[6:].partition(' ')
            vlines.append((float(x), lab))
        elif st.startswith('note '):
            x, y, lab = st[5:].split(' ', 2)
            notes.append((float(x), float(y), lab))
        elif st.startswith('ymax '):
            opts['ymax'] = float(st[5:])
        elif st.startswith('xmax '):
            opts['xmax'] = float(st[5:])
        elif st.startswith('func '):
            # func name: expr ; x0 x1   (expr in python with x)
            name, _, rest = st[5:].partition(':')
            expr, _, rng = rest.partition(';')
            a, b = (float(v) for v in rng.split())
            P = []
            for k in range(121):
                x = a + (b - a) * k / 120
                # Build-time only: expr comes from our own lesson sources (e.g. "x*math.exp(-x)"), never from users.
                P.append((x, eval(expr, {'__builtins__': {}, 'math': math, 'max': max, 'min': min, 'x': x})))
            series.append((name.strip(), P, 'line'))
        else:
            raise SystemExit('Bad plot line: ' + st)
    allx = [p[0] for s in series for p in s[1]]
    ally = [p[1] for s in series for p in s[1]]
    xmin, xmax = min(allx + [0]), opts.get('xmax', max(allx))
    ymin, ymax = 0, opts.get('ymax', max(ally) * 1.1 or 1)
    W, H = 680, 314
    L, R, Tp, B = 56, 20, 40, 44
    sx = lambda v: L + (v - xmin) / (xmax - xmin or 1) * (W - L - R)
    sy = lambda v: H - B - (v - ymin) / (ymax - ymin or 1) * (H - Tp - B)
    o = []
    for t in nice_ticks(ymin, ymax):
        o.append('<line x1="%d" y1="%.1f" x2="%d" y2="%.1f" class="c-grid"/>' % (L, sy(t), W - R, sy(t)))
        o.append(T(L - 6, sy(t) + 4, ('%g' % t), 'c-muted', 'end'))
    for t in nice_ticks(xmin, xmax, 10):
        o.append(T(sx(t), H - B + 16, ('%g' % t), 'c-muted'))
    o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" class="c-axis"/>' % (L, H - B, W - R, H - B))
    o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" class="c-axis"/>' % (L, Tp, L, H - B))
    for x, lab in vlines:
        o.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" class="p-vline"/>' % (sx(x), Tp, sx(x), H - B))
        if lab:
            o.append(T(sx(x) + 4, Tp + 10, lab, 'c-muted', 'start'))
    for k, (name, P, style) in enumerate(series):
        cls = 'p-s%d' % (k % 4)
        if style == 'step':
            d = ''
            for j, (x, y) in enumerate(P):
                d += ('M' if j == 0 else 'L') + '%.1f %.1f' % (sx(x), sy(y))
                if j + 1 < len(P):
                    d += 'L%.1f %.1f' % (sx(P[j + 1][0]), sy(y))
        else:
            d = ''.join(('M' if j == 0 else 'L') + '%.1f %.1f' % (sx(x), sy(y)) for j, (x, y) in enumerate(P))
        if style != 'dots':
            o.append('<path d="%s" class="%s"/>' % (d, cls))
        if style in ('dots', 'line') and len(P) <= 40:
            for x, y in P:
                o.append('<circle cx="%.1f" cy="%.1f" r="3" class="p-d%d"/>' % (sx(x), sy(y), k % 4))
    for x, y, lab in notes:
        o.append(T(sx(x), sy(y) - 8, lab, 'c-text c-halo'))
    # legend
    named = [s for s in series if s[0]]
    lx = W - R - sum(40 + 7 * len(s[0]) for s in named)
    for k, (name, P, style) in enumerate(series):
        if not name:
            continue
        o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" class="p-s%d"/>' % (lx, 12, lx + 22, 12, k % 4))
        o.append(T(lx + 28, 16, name, 'c-text', 'start'))
        lx += 40 + 7 * len(name)
    o.append(T((L + W - R) / 2, H - 8, xl, 'c-muted'))
    o.append(T(8, Tp - 12, yl, 'c-muted', 'start'))
    return ('<svg viewBox="0 0 %d %d" role="img" aria-label="%s">%s</svg>' % (W, H, attr(title or yl), ''.join(o)), title)


# ----------------------------------------------------------------- document
def parse_files():
    units, sections = [], []  # sections: list of dict in reading order
    cur_unit, cur_group = None, None
    for fname in ORDER:
        path = os.path.join(CONTENT, fname)
        if not os.path.exists(path):
            print('  (skipping missing %s)' % fname)
            continue
        with open(path, encoding='utf-8') as fh:
            lines = fh.read().split('\n')
        cur = None
        for ln in lines:
            if ln.startswith('@@'):
                kind, _, rest = ln[2:].partition(' ')
                parts = [p.strip() for p in rest.split('|')]
                if kind == 'unit':
                    cur_unit = {'id': parts[0], 'short': parts[1], 'title': parts[2],
                                'lede': parts[3] if len(parts) > 3 else '', 'topics': [], 'groups': []}
                    units.append(cur_unit)
                    cur_group = None
                    cur = {'type': 'unit', 'unit': cur_unit, 'lines': []}
                    sections.append(cur)
                elif kind == 'group':
                    cur_group = parts[0]
                elif kind == 'topic':
                    t = {'type': 'topic', 'id': parts[0], 'num': parts[1], 'title': parts[2],
                         'lede': parts[3] if len(parts) > 3 else '', 'src': parts[4] if len(parts) > 4 else '',
                         'unit': cur_unit['id'], 'group': cur_group, 'lines': []}
                    cur_unit['topics'].append(t)
                    cur = t
                    sections.append(t)
                elif kind == 'section':
                    cur_unit = None
                    cur = {'type': 'section', 'id': parts[0], 'eyebrow': parts[1], 'title': parts[2],
                           'lede': parts[3] if len(parts) > 3 else '', 'nav': parts[4] if len(parts) > 4 else parts[2],
                           'lines': []}
                    sections.append(cur)
                else:
                    raise SystemExit('Unknown directive @@' + kind)
            elif cur is not None:
                cur['lines'].append(ln)
    return units, sections


def build():
    units, sections = parse_files()
    body = []
    for s in sections:
        if s['type'] == 'unit':
            u = s['unit']
            body.append('<section class="unit-banner" id="%s"><p class="eyebrow">%s</p><h2>%s</h2><p class="lede">%s</p>%s</section>' % (
                u['id'], esc(u['short']), inline(u['title']), inline(u['lede']), blocks(s['lines'])))
        elif s['type'] == 'topic':
            src = '<p class="srcline">Sources: %s</p>' % inline(s['src']) if s['src'] else ''
            body.append(
                '<section class="lec" id="%s" data-topic="%s" data-unit="%s">'
                '<p class="eyebrow">%s · %s</p><h2>%s</h2>%s%s%s'
                '<div class="done-row"><label class="done"><input type="checkbox" data-done="%s"> Mark %s as completed</label>'
                '<label class="done flag"><input type="checkbox" data-flag="%s"> Flag for revision</label></div>'
                '</section>' % (
                    s['id'], s['id'], s['unit'], esc(s['num']), esc(s['group'] or next(u['short'] for u in units if u['id'] == s['unit'])),
                    inline(s['title']), '<p class="lede">%s</p>' % inline(s['lede']) if s['lede'] else '', src,
                    blocks(s['lines']), s['id'], esc(s['num']), s['id']))
        elif s['id'] == 'intro':
            body.append('<header class="hero" id="intro"><p class="eyebrow">%s</p><h1>%s</h1><p class="lead">%s</p>%s</header>' % (
                esc(s['eyebrow']), inline(s['title']), inline(s['lede']), blocks(s['lines'])))
        else:
            body.append('<section class="part" id="%s"><p class="part-head">%s</p><h2 style="margin-top:14px">%s</h2>%s%s</section>' % (
                s['id'], esc(s['eyebrow']), inline(s['title']),
                '<p class="lede">%s</p>' % inline(s['lede']) if s['lede'] else '', blocks(s['lines'])))

    # contents rail
    toc = []
    start = [s for s in sections if s['type'] == 'section' and s['id'] in ('intro', 'syllabus', 'howto')]
    tail = [s for s in sections if s['type'] == 'section' and s['id'] not in ('intro', 'syllabus', 'howto')]
    toc.append('<div class="group"><p class="group-label">Start</p><ul>')
    for s in start:
        toc.append('<li><a href="#%s"><span class="n">·</span>%s</a></li>' % (s['id'], esc(s['nav'])))
    toc.append('</ul></div>')
    for u in units:
        toc.append('<details class="unit" data-unit="%s" open><summary><span class="u-title">%s</span><span class="u-pct" data-upct="%s">0%%</span></summary>' % (u['id'], esc(u['short'] + ' · ' + u['title']), u['id']))
        toc.append('<ul>')
        toc.append('<li><a href="#%s"><span class="n">%s</span>Unit overview</a></li>' % (u['id'], esc(u['short'].split()[-1])))
        g = None
        for t in u['topics']:
            if t['group'] != g:
                g = t['group']
                if g:
                    toc.append('</ul><p class="sub-label">%s</p><ul>' % esc(g))
            toc.append('<li><a href="#%s" data-sec="%s"><span class="n">%s</span>%s</a></li>' % (t['id'], t['id'], esc(t['num']), esc(re.sub(r'\\\(|\\\)', '', t['title']))))
        toc.append('</ul></details>')
    toc.append('<div class="group"><p class="group-label">Practice and revision</p><ul>')
    for s in tail:
        toc.append('<li><a href="#%s"><span class="n">·</span>%s</a></li>' % (s['id'], esc(s['nav'])))
    toc.append('</ul></div>')

    # topic registry for the dashboard
    reg = []
    for u in units:
        for t in u['topics']:
            reg.append('{id:"%s",n:"%s",t:%s,u:"%s"}' % (t['id'], t['num'], json_str(re.sub(r'\\\(|\\\)', '', t['title'])), u['id']))
    unit_reg = ','.join('{id:"%s",short:%s,title:%s}' % (u['id'], json_str(u['short']), json_str(u['title'])) for u in units)

    with open(os.path.join(SRC, 'template.html'), encoding='utf-8') as fh:
        tpl = fh.read()
    total = sum(len(u['topics']) for u in units)
    out = (tpl.replace('{{TOC}}', '\n'.join(toc))
              .replace('{{BODY}}', '\n'.join(body))
              .replace('{{REGISTRY}}', 'window.CN_TOPICS=[%s];window.CN_UNITS=[%s];' % (','.join(reg), unit_reg))
              .replace('{{TOTAL}}', str(total)))
    with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(out)
    print('Built index.html: %d units, %d topics, %d questions, %.0f KB' % (len(units), total, Q_COUNTER[0], len(out) / 1024))


def json_str(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


if __name__ == '__main__':
    build()

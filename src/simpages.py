"""Generate the simulator HTML pages (all except visualizations/rdt, which is hand-written).
Run:  python src/simpages.py"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Computer Networks</title>
<script>try {{ var t = localStorage.getItem('cn-theme'); if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); }} catch (e) {{}}</script>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%276%27 fill=%27%231E5B8A%27/%3E%3Ctext x=%2716%27 y=%2722%27 font-family=%27Georgia%27 font-size=%2716%27 fill=%27white%27 text-anchor=%27middle%27%3ECN%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Spectral:wght@500;600;700&display=swap">
<link rel="stylesheet" href="../../assets/css/site.css">
<link rel="stylesheet" href="../../assets/css/sim.css">
{mathjax}
</head>
<body class="sim">
<header class="sim-top"><div class="in">
  <a class="back" href="../../index.html#{back}">← Back to {backlabel}</a>
  <p class="ttl">{heading}</p>
  <button class="theme-btn" id="theme-btn" type="button">Theme: auto</button>
</div></header>
<div class="sim-wrap">
  <p class="sim-intro">{intro}</p>
'''

MATHJAX = '''<script>window.MathJax = { tex: { inlineMath: [['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]']] }, svg: { fontCache: 'global' } };</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js" integrity="sha384-KKWa9jJ1MZvssLeOoXG6FiOAZfAgmzsIIfw8BXwI9+kYm0lPCbC6yTQPBC00F1/L" crossorigin="anonymous" async></script>'''

PLAYER = '''  <div class="panel" style="margin-bottom:14px">{opts}</div>
  <div class="controls" id="controls"></div>
  <p class="kbd-hint">Keyboard: <kbd>Space</kbd> play/pause · <kbd>→</kbd> next step · <kbd>←</kbd> previous step · <kbd>R</kbd> reset</p>
  <div class="sim-grid">
    <div>
      <div class="stage" id="stage"></div>
      {legend}
    </div>
    <aside>
      <div class="panel" style="margin-bottom:12px">
        <span class="k">What is happening</span>
        <div class="step-now" id="now"></div>
        <div class="statebox" id="state"></div>
      </div>
      <div class="panel">
        <span class="k">All steps (click to jump)</span>
        <ul class="steplist" id="steplist"></ul>
      </div>
    </aside>
  </div>
  <div id="extra" style="margin-top:16px"></div>
'''

TAIL = '''</div>
<script src="../../assets/js/sim-core.js"></script>
<script src="{script}"></script>
</body>
</html>
'''

LEG_TL = '''<div class="legend"><span><i style="background:var(--ink)"></i>data / request</span><span><i style="background:var(--accent)"></i>reply / ACK</span><span><i style="background:var(--good)"></i>control</span><span><i style="background:var(--bad)"></i>error</span><span><i style="background:var(--mark)"></i>lost / timer</span></div>'''


def sel(id_, label, options, selected=None):
    o = ''.join('<option value="%s"%s>%s</option>' % (v, ' selected' if v == selected else '', t) for v, t in options)
    return '<label>%s <select id="%s">%s</select></label>' % (label, id_, o)


def num(id_, label, value, width=80, step=None, mn=None, mx=None):
    extra = ''
    if step is not None:
        extra += ' step="%s"' % step
    if mn is not None:
        extra += ' min="%s"' % mn
    if mx is not None:
        extra += ' max="%s"' % mx
    return '<label>%s <input id="%s" type="number" value="%s" style="width:%dpx"%s></label>' % (label, id_, value, width, extra)


def txt(id_, label, value, width=200, ph=''):
    return '<label>%s <input id="%s" type="text" value="%s" placeholder="%s" style="width:%dpx"></label>' % (label, id_, value, ph, width)


def row(*items, hint=''):
    return '<div class="opts">%s%s</div>' % (''.join(items), '<span class="hint">%s</span>' % hint if hint else '')


APPLY = '<button class="btn" id="apply" type="button">Apply</button>'

PAGES = [
    dict(path='tcp/sliding-window.html', title='Go-Back-N and Selective Repeat', back='u2-pipelining', backlabel='II.6 GBN and SR',
         heading='Pipelined reliable transfer: Go-Back-N vs Selective Repeat', script='sliding-window.js',
         intro='Packets are sent back to back (one every 0.25 time units) and take 1 time unit to cross the channel; ACKs take 1 unit back. The window boxes on the right show the sender\'s and receiver\'s view of the sequence numbers at each step.',
         opts=row(sel('preset', 'Preset', [('kurose', 'Kurose: window 4, pkt2 lost'), ('end24', '19CSE301 End 2024: frames 4 and 7 lost, N=5'), ('mid23', '19CSE301 Mid 2023: N=3, pkt2 and ACK3 lost'), ('every6', '19CSE301 Jan 2023: Go-back-3, every 6th lost'), ('acklost', 'Only an ACK lost'), ('custom', 'Custom (fields below)')]),
                  sel('proto', 'Protocol', [('gbn', 'Go-Back-N'), ('sr', 'Selective Repeat')]),
                  num('win', 'Window N', 4, 70, mn=1, mx=8), num('npk', 'Packets', 8, 70, mn=1, mx=16), sel('first', 'First number', [('0', '0'), ('1', '1')])) +
              row(txt('dloss', 'Lost data transmissions', '2', 180, 'e.g. 2, 5:2'), txt('aloss', 'Lost ACKs', '', 150, 'e.g. 3'), num('every', 'Lose every k-th transmission (0 = off)', 0, 70, mn=0), APPLY,
                  hint='“2” loses the first transmission of packet 2; “5:2” loses its second transmission. ACK losses work the same way for the ACK carrying that number.'),
         legend=LEG_TL),
    dict(path='tcp/connection.html', title='TCP connection simulator', back='u2-tcp', backlabel='II.7 TCP',
         heading='TCP: handshake, sequence and ACK numbers, flow control, and close', script='connection.js',
         intro='A complete TCP connection between a client and a server: the three-way handshake with real initial sequence numbers, the client sending a file in MSS-sized segments under the receiver\'s advertised window (flow control), and the four-segment close with TIME_WAIT. The boxes on the right track the send window and the receive buffer.',
         opts=row(sel('preset', 'Scenario', [('normal', 'Normal transfer'), ('slow', 'Slow receiving application (flow control, zero window)'), ('loss', 'A segment lost (timeout and cumulative ACK)')]),
                  num('cisn', 'Client ISN', 1000, 90), num('sisn', 'Server ISN', 5000, 90), num('mss', 'MSS (bytes)', 500, 80), num('bytes', 'File size (bytes)', 2500, 90), num('rbuf', 'RcvBuffer (bytes)', 1500, 90), APPLY,
                  hint='Sequence numbers count bytes. SYN and FIN each use up one sequence number.'),
         legend=LEG_TL),
    dict(path='tcp/rtt.html', title='RTT and timeout visualizer', back='u2-rtt', backlabel='II.8 RTT and timeout',
         heading='Measuring RTT and setting TCP\'s timeout', script='rtt.js', mathjax=True,
         intro='Each segment\'s SampleRTT is the time from sending it to receiving its ACK. TCP smooths the samples into EstimatedRTT, tracks their variability as DevRTT, and sets TimeoutInterval = EstimatedRTT + 4·DevRTT. The ochre bar beside the sender is the timer that was armed when the segment left; if a sample is longer than it, a premature timeout would have occurred.',
         opts=row(txt('samples', 'SampleRTT values (ms)', '106, 120, 140, 90, 115', 240), num('alpha', 'α', 0.125, 70, step=0.005), num('beta', 'β', 0.25, 70, step=0.05),
                  num('e0', 'Initial EstimatedRTT (ms)', 100, 80), num('d0', 'Initial DevRTT (ms)', 5, 70),
                  sel('order', 'Update order', [('kurose', 'Textbook: EstimatedRTT first'), ('rfc', 'RFC 6298: DevRTT first (old estimate)')]), APPLY,
                  hint='Try a sudden spike such as “100, 100, 100, 100, 180” to see a premature timeout, or the uploaded Chapter3-Problems values: initial 390 / 21, samples 250, 200, 360 with RFC order.'),
         legend='<div class="legend"><span><i style="background:var(--ink)"></i>segment</span><span><i style="background:var(--accent)"></i>ACK</span><span><i style="background:var(--mark)"></i>timer armed</span><span><i style="background:var(--good)"></i>ACK before timeout</span><span><i style="background:var(--bad)"></i>premature timeout</span></div>'),
    dict(path='tcp/congestion.html', title='TCP congestion window simulator', back='u2-tcp-cc', backlabel='II.12 TCP congestion control',
         heading='TCP congestion control: slow start, congestion avoidance, fast recovery', script='congestion.js',
         intro='Round-based model, as used in exam questions: in each transmission round (one RTT) the sender transmits cwnd segments. Loss events happen at the end of the rounds you list. Step through round by round, or press Play to watch the graph draw.',
         opts=row(sel('preset', 'Preset', [('p40', 'Kurose P40 graph (Reno, ssthresh 32)'), ('end25', '23CSE302 End 2025 Q4 (Tahoe)'), ('mid25', '23CSE302 Mid 2025 Q4'), ('jan23', '19CSE301 Jan 2023 Q13(a)'), ('compare', 'Reno vs Tahoe, same loss'), ('custom', 'Custom (fields below)')]),
                  sel('variant', 'Variant', [('reno', 'TCP Reno'), ('tahoe', 'TCP Tahoe')]), num('cw0', 'Initial cwnd (MSS)', 1, 70, mn=1), num('ss0', 'Initial ssthresh', 32, 70, mn=1), num('rounds', 'Rounds', 26, 70, mn=2, mx=60)) +
              row(txt('events', 'Loss events (round:type)', '16:3dup, 22:timeout', 220, 'e.g. 8:3dup, 14:timeout'),
                  '<label style="flex-direction:row;align-items:center;gap:6px"><input id="plus3" type="checkbox" checked> Reno sets cwnd = ssthresh + 3</label>', APPLY,
                  hint='A loss listed at round r is detected at the end of that round, so the new cwnd applies from round r + 1. ssthresh is halved with rounding down.'),
         legend='<div class="legend"><span><i style="background:var(--good)"></i>slow start</span><span><i style="background:var(--accent)"></i>congestion avoidance</span><span><i style="background:var(--mark)"></i>after 3 dup ACKs</span><span><i style="background:var(--bad)"></i>after timeout</span><span><i style="background:var(--muted)"></i>ssthresh</span></div>'),
    dict(path='dns/index.html', title='DNS resolution visualizer', back='u1-dns', backlabel='I.13 DNS',
         heading='DNS resolution: iterative and recursive queries, with caching', script='dns.js',
         intro='Follow one name lookup through the hierarchy. Each arrow is one DNS message (UDP port 53); the panel shows the resource records each server returns and the delay accumulated. Run it a second time with the cache to see why most lookups never reach a root server.',
         opts=row(sel('mode', 'Query style', [('iterative', 'Iterative (local DNS does the asking)'), ('recursive', 'Recursive (each server asks the next)')]),
                  txt('host', 'Host name', 'gaia.cs.umass.edu', 190),
                  sel('cache', 'Local DNS cache', [('none', 'Empty'), ('tld', 'Has the .edu TLD server address'), ('answer', 'Already has the answer')])) +
              row(num('r1', 'RTT host↔local (ms)', 4, 70), num('r2', 'RTT local↔root (ms)', 44, 70), num('r3', 'RTT local↔TLD (ms)', 8, 70), num('r4', 'RTT local↔authoritative (ms)', 20, 70), APPLY,
                  hint='In recursive mode the root↔TLD and TLD↔authoritative round trips are assumed equal to the local↔TLD and local↔authoritative values.'),
         legend=LEG_TL),
    dict(path='routing/index.html', title='Routing visualizer', back='u2-routing', backlabel='II.18 Routing algorithms',
         heading='Routing: Dijkstra (link state), distance vector, and forwarding', script='routing.js',
         intro='Choose a network and an algorithm. Dijkstra adds one node to N′ per step and updates D(v) and p(v); distance vector runs synchronous rounds in which every router recomputes its vector from its neighbours\' previous vectors. Change a link cost to watch good news travel fast and bad news count to infinity.',
         opts=row(sel('preset', 'Network', [('kurose', 'Kurose: u, v, w, x, y, z'), ('end25', '23CSE302 End 2025 Q6(a): A–E'), ('xyz', '20CYS303 End 2025 Q9 / Kurose DV: X, Y, Z'), ('cti', 'Count-to-infinity: x–y 4, y–z 1, z–x 50'), ('four', '19CCE304 Jan 2023 Q5: x, y, z, w'), ('custom', 'Custom (edit links below)')]),
                  sel('algo', 'Algorithm', [('ls', 'Link state (Dijkstra)'), ('dv', 'Distance vector'), ('fwd', 'Forward a packet')]),
                  sel('src', 'Source / router', [('u', 'u')]), sel('dst', 'Destination', [('z', 'z')])) +
              row(txt('edges', 'Links (a-b cost, …)', 'u-v 2, u-x 1, u-w 5, v-x 2, v-w 3, x-w 3, x-y 1, w-y 1, w-z 5, y-z 2', 360),
                  txt('change', 'After convergence, change link (DV)', '', 120, 'e.g. x-y 60'),
                  '<label style="flex-direction:row;align-items:center;gap:6px"><input id="poison" type="checkbox"> Poisoned reverse</label>', APPLY),
         legend=''),
    dict(path='application/http.html', title='HTTP timing visualizer', back='u1-http', backlabel='I.10 HTTP',
         heading='HTTP request–response timing: non-persistent, parallel, persistent and pipelined', script='http.js',
         intro='Every TCP connection starts with SYN and SYN-ACK; the browser then sends the HTTP GET with the third handshake segment, and the server returns the object. The running total on the right adds the DNS lookup, each RTT and each object\'s transmission time.',
         opts=row(sel('mode', 'Connection mode', [('np', 'Non-persistent, serial'), ('npp', 'Non-persistent, parallel connections'), ('p', 'Persistent, no pipelining'), ('pp', 'Persistent, with pipelining')]),
                  num('nobj', 'Referenced objects', 3, 70, mn=0, mx=12), num('par', 'Max parallel connections', 5, 70, mn=1, mx=10)) +
              row(num('rtt', 'RTT to web server (ms)', 20, 80), num('dns', 'DNS lookup time (ms, 0 = cached)', 56, 80), num('tt', 'Transmission time per object (ms)', 0, 80), APPLY,
                  hint='Defaults reproduce the Kurose problem in Chapter2-Problems: DNS RTTs 4 + 44 + 8 = 56 ms, RTT_HTTP = 20 ms, 3 small objects.'),
         legend=LEG_TL),
    dict(path='application/email.html', title='Email delivery visualizer', back='u1-email', backlabel='I.12 Email',
         heading='Email delivery: user agent → SMTP → mailbox → IMAP/POP3', script='email.js',
         intro='Alice (on Gmail) sends a message to Bob (on Yahoo). Watch the submission, the DNS MX lookup, the full SMTP dialogue between the two mail servers, and Bob fetching the message with a mail-access protocol.',
         opts=row(sel('agent', 'Alice uses', [('app', 'A mail app (SMTP submission)'), ('web', 'Gmail in a browser (HTTP)')]),
                  sel('access', 'Bob reads with', [('imap', 'IMAP (port 143)'), ('pop', 'POP3 (port 110)'), ('web', 'Yahoo in a browser (HTTP)')]),
                  '<label style="flex-direction:row;align-items:center;gap:6px"><input id="down" type="checkbox"> Bob\'s server is down on the first attempt</label>', APPLY),
         legend=LEG_TL),
    dict(path='application/ftp.html', title='FTP connections visualizer', back='u1-ftp', backlabel='I.11 FTP',
         heading='FTP: one control connection, a new data connection per file', script='ftp.js',
         intro='The control connection (server port 21) carries commands and three-digit replies for the whole session. Every listing or file travels on its own data connection, opened and closed for that transfer. Turn on the firewall to reproduce the 23CSE302 mid-term question.',
         opts=row(sel('mode', 'Mode', [('active', 'Active (PORT: server connects back)'), ('passive', 'Passive (PASV: client connects)')]),
                  num('files', 'Files to download', 2, 70, mn=1, mx=4),
                  '<label style="flex-direction:row;align-items:center;gap:6px"><input id="fw" type="checkbox"> Client firewall blocks incoming connections</label>', APPLY),
         legend=LEG_TL),
    dict(path='core/switching.html', title='Packet vs circuit switching', back='u1-core', backlabel='I.3 Network core',
         heading='Packet switching (store-and-forward) vs circuit switching', script='switching.js', mathjax=True,
         intro='A space–time diagram: each shaded band is one packet being transmitted on a link (its height is the transmission time L/R) and the slope is the propagation delay. With store-and-forward, a router can start sending a packet only after it has received all of it. A circuit instead streams bits straight through at its reserved share of the link.',
         opts=row(sel('mode', 'Mode', [('packet', 'Packet switching'), ('message', 'Whole message, no segmentation'), ('circuit', 'Circuit switching (FDM/TDM)')]),
                  num('F', 'File size (bits)', 8000000, 110), num('P', 'Packets', 4, 60, mn=1, mx=40), num('H', 'Header per packet (bits)', 0, 80), num('links', 'Links', 3, 60, mn=1, mx=4)) +
              row(num('R', 'Link rate (Mbps)', 2, 70), num('prop', 'Propagation per link (ms)', 0, 70), num('proc', 'Processing per router (ms)', 0, 70), num('slots', 'Circuit: FDM channels / TDM slots', 8, 70), num('setup', 'Circuit setup (ms)', 300, 70), APPLY,
                  hint='Defaults follow the message-segmentation problem with 4 packets so the bands are visible; set Packets to 800 to reproduce the exam answer (the diagram then summarises).'),
         legend='<div class="legend"><span><i style="background:var(--ink)"></i>packet on a link</span><span><i style="background:var(--good)"></i>circuit stream</span><span><i style="background:var(--accent)"></i>setup signalling</span></div>'),
    dict(path='link/arp.html', title='ARP and addressing across subnets', back='u3-arp', backlabel='III.5 Addressing and ARP',
         heading='ARP, and which addresses a frame carries at each hop', script='arp.js',
         intro='Host A (111.111.111.111) sends an IP datagram. On its own subnet it needs the destination\'s MAC address; to reach another subnet it needs the router\'s. The table below the diagram lists the source and destination MAC and IP addresses of every frame.',
         opts=row(sel('scen', 'Scenario', [('same', 'A → C on the same subnet (ARP for C)'), ('diff', 'A → B on another subnet (via router R)'), ('cached', 'A → B again (ARP tables already filled)')]), APPLY),
         legend=LEG_TL),
    dict(path='link/switch.html', title='Self-learning switch', back='u3-switches', backlabel='III.7 Switches',
         heading='The self-learning switch: learn, flood, filter, forward', script='switch.js',
         intro='Each frame teaches the switch where its source lives. Frames to unknown destinations are flooded; frames to known destinations go out of exactly one port; frames whose destination is on the incoming port are filtered.',
         opts=row(sel('topo', 'Topology', [('one', 'One switch, hosts A–F'), ('two', 'Two switches: S1 (A, B, C) and S2 (D, E, F)')]),
                  txt('seq', 'Frames to send (source>destination)', 'B>E, E>B, A>B, B>A', 260), APPLY,
                  hint='The default sequence is 19CSE301 Jan 2023 Q10. Use “B>*” for a broadcast frame.'),
         legend=''),
    dict(path='link/multiple-access.html', title='Multiple access simulator', back='u3-mac', backlabel='III.4 Multiple access',
         heading='Multiple access: slotted ALOHA, pure ALOHA and CSMA/CD', script='mac.js',
         intro='Each row is a node; time runs left to right. Green frames got through, red frames collided, grey slots were empty. The measured efficiency is compared with the formula. For CSMA/CD, watch a collision being detected, the jam, and binary exponential backoff.',
         opts=row(sel('proto', 'Protocol', [('slotted', 'Slotted ALOHA'), ('pure', 'Pure ALOHA'), ('csmacd', 'CSMA/CD (two stations)')]),
                  num('N', 'Nodes', 4, 60, mn=2, mx=10), num('p', 'Transmit probability p', 0.4, 70, step=0.05), num('slots', 'Slots / frame times', 24, 70, mn=8, mx=60), num('seed', 'Random seed', 7, 60), APPLY,
                  hint='Defaults match 23CSE302 End 2025 Q7(c): 4 nodes, p = 0.4, theoretical slotted efficiency 0.3456.'),
         legend='<div class="legend"><span><i style="background:var(--good)"></i>success</span><span><i style="background:var(--bad)"></i>collision</span><span><i style="background:var(--mark)"></i>jam / backoff</span></div>'),
]

CUSTOM = [
    dict(path='link/error-detection.html', title='Error-detection workbench', back='u3-error-detect', backlabel='III.2 Error detection',
         heading='Error detection: CRC, parity and the Internet checksum', script='errors.js', mathjax=False,
         intro='Compute the check bits exactly as you would in an exam, step by step, then flip bits to see what each method catches.',
         body='''  <div class="tabs" id="tabs"><button class="on" data-t="crc" type="button">CRC</button><button data-t="parity" type="button">2-D parity</button><button data-t="csum" type="button">Internet checksum</button></div>
  <div class="panel" id="t-crc"></div>
  <div class="panel hidden" id="t-parity"></div>
  <div class="panel hidden" id="t-csum"></div>
'''),
    dict(path='physical-layer/index.html', title='Physical-layer studio', back='u3-datacomm', backlabel='III.10 Line coding',
         heading='Physical layer: line coding, Nyquist, Shannon and decibels', script='physical.js', mathjax=True,
         intro='Draw any bit stream in the line-coding schemes of Forouzan §4.1, and work the data-rate-limit and decibel formulas with every step shown.',
         body='''  <div class="tabs" id="tabs"><button class="on" data-t="code" type="button">Line coding</button><button data-t="rate" type="button">Nyquist and Shannon</button><button data-t="db" type="button">Decibels and SNR</button></div>
  <div class="panel" id="t-code"></div>
  <div class="panel hidden" id="t-rate"></div>
  <div class="panel hidden" id="t-db"></div>
'''),
    dict(path='application/p2p.html', title='Client-server vs P2P calculator', back='u1-p2p', backlabel='I.14 P2P',
         heading='File distribution time: client-server vs peer-to-peer', script='p2p.js', mathjax=True,
         intro='Enter the file size, the server and peer rates; the calculator evaluates every lower bound, marks the one that decides the answer, and plots both architectures as the number of peers grows.',
         body='''  <div class="panel" id="calc"></div>
'''),
]


def write(page, body):
    path = os.path.join(ROOT, 'visualizations', page['path'])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    html = HEAD.format(title=page['title'], back=page['back'], backlabel=page['backlabel'], heading=page['heading'],
                       intro=page['intro'], mathjax=MATHJAX if page.get('mathjax') else '')
    html += body + TAIL.format(script=page['script'])
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(html)
    print('wrote', page['path'])


for p in PAGES:
    write(p, PLAYER.format(opts=p['opts'], legend=p.get('legend', '')))
for p in CUSTOM:
    write(p, p['body'])

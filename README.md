# Computer Networks (23CSE302) – interactive course

An interactive textbook for the 23CSE302 Computer Networks syllabus, built from the materials in this folder.

**Open `index.html` in Chrome** (double-click it). No server or installation is needed.

## What's inside

| Part | What you get |
|---|---|
| Unit I (16 topics) | The Internet, network edge, core, topology, types of networks, delay/loss/throughput, layers, security and history, application principles, HTTP, FTP, email, DNS, P2P, video streaming, CDNs |
| Unit II (21 topics) | Transport services, mux/demux, UDP and checksum, RDT principles, rdt1.0–3.0, GBN/SR, TCP, RTT and timeout, TCP reliability and flow control, connection management, congestion control (principles and TCP), network layer overview, virtual circuits vs datagrams, inside a router, IP and IPv6, addressing/subnetting/DHCP/NAT, routing algorithms, OSPF and BGP, SDN, broadcast and multicast |
| Unit III (14 topics) | Link-layer services, error detection, error correction, multiple access, ARP, Ethernet, switches and VLANs, MPLS, signals, data communication and line coding, transmission media, impairments, decibels, SNR with Nyquist and Shannon |
| Important numericals | A formula sheet and 17 step-by-step solvers (Given → Required → Formula → Substitution → Calculation → Final answer) |
| Interactive visualizations | 17 simulator pages in `visualizations/` (see below) |
| Question bank | 60 questions, filterable; questions from your uploaded papers are marked with the paper and question number (reworded), practice questions are marked separately; solutions are hidden until you reveal them |
| Revision | Progress dashboard (overall and per unit, completed, pending, flagged), export and reset, exam strategy, comparison index, one-page recall |

Every topic has: why the idea exists, how it works step by step, diagrams, examples (everyday analogy, real network, worked numericals), comparison tables, exam focus with past-paper references, common mistakes and a quick-revision box.

## Simulators (`visualizations/`)

| Page | Shows |
|---|---|
| `rdt/index.html` | rdt1.0, 2.0, 2.1, 2.2, 3.0 as real FSM simulations; corrupted/lost/delayed packets and ACKs, timeouts, duplicates, custom fault lists |
| `tcp/sliding-window.html` | Go-Back-N vs Selective Repeat with windows, timers and losses |
| `tcp/connection.html` | Handshake, sequence/ACK numbers, flow control with zero-window probes, fast retransmit, close and TIME_WAIT |
| `tcp/rtt.html` | SampleRTT measurement, EstimatedRTT, DevRTT, TimeoutInterval, premature timeouts |
| `tcp/congestion.html` | cwnd graph and table: slow start, congestion avoidance, fast recovery, Tahoe vs Reno |
| `dns/index.html` | Iterative vs recursive resolution with caching |
| `routing/index.html` | Dijkstra tables, distance vector rounds, count-to-infinity, poisoned reverse, forwarding |
| `application/http.html`, `email.html`, `ftp.html`, `p2p.html` | HTTP timing, email delivery, FTP connections, distribution time |
| `core/switching.html` | Store-and-forward packet switching vs circuit switching |
| `link/error-detection.html`, `multiple-access.html`, `arp.html`, `switch.html` | CRC/parity/checksum, ALOHA and CSMA/CD, ARP across subnets, self-learning switches |
| `physical-layer/index.html` | Line coding for any bit stream, Nyquist, Shannon, decibels |

Controls on every timeline: Play/Pause, Prev, Next, Reset, speed; keyboard Space, ←, →, R.

## Progress tracking

Tick “Mark as completed” and “Flag for revision” at the end of each topic. Progress is stored in your browser's `localStorage`, so it survives refreshes. It is tied to the browser and to how you open the page (opening `index.html` from disk keeps a separate record from a local web server). Use “Export progress as text” on the Revision dashboard to copy it into `CN_PROGRESS.md`.

## Internet use

Everything runs locally. Two things load from the web when you are online: the fonts (Google Fonts) and the equation renderer (MathJax 3 from jsDelivr). Offline, the pages still work with system fonts, and equations appear as plain TeX.

## Sources, and syllabus topics not in the prescribed materials

Primary sources: Kurose & Ross 8e (Ch 1, 2.1–2.6, 3.1–3.7.1, 4.1–4.3, 5.1–5.5, 6.1–6.5), Forouzan 4e (3.3–3.5, 4.1, 19, 23.2, 26), your lecture slides, problem sets and question papers. Topics taught from other sources, and marked as such on the page:

- Network topology and types of networks: Forouzan 1.2.
- FTP: Forouzan 26.3 (Kurose 8e dropped it).
- Virtual-circuit vs datagram networks: Forouzan 8.2–8.3 (not in Kurose 8e 4.1–4.3).
- Broadcast and multicast routing: older Kurose editions (4.7); not in the 8th edition, the slides or any uploaded paper.
- Hamming code (under error correction): Forouzan Ch 10, as supplementary background.

Two textbook/material inconsistencies are flagged in the lessons: the order of the EstimatedRTT/DevRTT updates (your Chapter3-Problems file vs Kurose's solutions), and an arithmetic slip in Forouzan Example 3.18.

## Editing and rebuilding

The lessons are written in `src/content/*.md` (a small Markdown dialect described at the top of `src/build.py`). Diagrams are generated as SVG at build time.

```
python src/build.py      # rebuilds index.html from src/content
python src/simpages.py   # regenerates the simulator pages (except rdt/index.html)
```

## Folder layout

```
CN_Theory/
├── index.html                 the course (generated)
├── assets/css/                site.css (design system), sim.css (simulators)
├── assets/js/                 site.js (navigation, progress, question bank), solver.js, sim-core.js
├── visualizations/            17 simulator pages
├── src/                       build.py, simpages.py, template.html, content/*.md
├── CN_PROGRESS.md             syllabus tracker and study log (kept local, not in the repository)
└── COMPUTER NETWORKS/         original course materials (kept local, not in the repository)
```

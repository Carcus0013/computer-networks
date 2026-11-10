@@section revision | Revision | Progress dashboard and last-week revision | Your progress (saved in this browser), the topics you flagged, and a condensed revision sheet for the night before the exam. | Revision and progress

:::html
<div id="dashboard">
  <div class="dash" id="dash-cards"></div>
  <div class="dash-lists">
    <div><h4>Completed topics</h4><ul id="dash-done"></ul></div>
    <div><h4>Pending topics</h4><ul id="dash-pending"></ul></div>
    <div><h4>Flagged for revision</h4><ul id="dash-flag"></ul></div>
  </div>
  <div class="resume">
    <button class="btn" id="export-progress" type="button">Export progress as text</button>
    <button class="btn" id="reset-progress" type="button">Reset all progress</button>
  </div>
  <textarea id="export-box" hidden readonly style="width:100%;min-height:180px;margin-top:10px;font-family:var(--f-mono);font-size:12.5px;background:var(--panel);color:var(--ink);border:1px solid var(--rule);border-radius:6px;padding:10px"></textarea>
  <p class="srcline">Progress is stored in this browser's localStorage, so it survives refreshes but not a different browser or a cleared browser. Use “Export progress as text” and paste it into CN_PROGRESS.md to keep a copy.</p>
</div>
:::

## Exam strategy for 23CSE302

- Your October 2025 end-semester paper had **7 questions for 50 marks in two hours**, and almost all were numerical: line coding, VLSM, DNS + HTTP timing, TCP Tahoe, end-to-end delay, Dijkstra + DHCP, CRC + backoff + slotted ALOHA. Expect the same balance.
- Spend about one minute per mark. Write the formula first, then substitute; partial marks come from the method.
- For every table question (Dijkstra, DV, cwnd, GBN/SR, RTT), draw the table frame first and fill it row by row.
- State assumptions explicitly: units (1 MB = 10⁶ bytes), conventions (NRZ-L level, Manchester direction), interpretation of “transmission round”.
- Diagram questions: label every arrow with packet type, sequence and ACK numbers; label lifelines with host names and states.

## Highest-yield topics (from your past papers)

| Rank | Topic | Practise with |
|---|---|---|
| 1 | Delay and store-and-forward numericals | [I.6](#u1-delay), [delay solver](#numericals) |
| 2 | TCP congestion window tables and graphs | [II.12](#u2-tcp-cc), [cwnd simulator](visualizations/tcp/congestion.html) |
| 3 | HTTP + DNS timing | [I.10](#u1-http), [HTTP visualizer](visualizations/application/http.html) |
| 4 | Dijkstra tables | [II.18](#u2-routing), [routing visualizer](visualizations/routing/index.html) |
| 5 | RDT FSMs and GBN/SR timelines | [II.5](#u2-rdt), [II.6](#u2-pipelining), [RDT simulator](visualizations/rdt/index.html) |
| 6 | Subnetting / VLSM / longest prefix match | [II.17](#u2-addressing), [subnet solver](#solver-subnet) |
| 7 | CRC, ALOHA, CSMA/CD backoff | [III.2](#u3-error-detect), [III.4](#u3-mac) |
| 8 | Email, DNS records, FTP connections | [I.11](#u1-ftp)–[I.13](#u1-dns) |
| 9 | ARP and addresses across subnets, switch tables, VLANs | [III.5](#u3-arp), [III.7](#u3-switches) |

## Comparisons to know cold

| Comparison | Where |
|---|---|
| Circuit vs packet switching; forwarding vs routing | [I.3](#u1-core) |
| Mesh vs star vs bus vs ring; LAN vs MAN vs WAN | [I.4](#u1-topology), [I.5](#u1-types) |
| Transmission vs propagation delay; throughput vs bandwidth | [I.6](#u1-delay) |
| OSI vs TCP/IP | [I.7](#u1-layers) |
| Client-server vs P2P; TCP vs UDP | [I.9](#u1-apps), [II.1](#u2-transport) |
| Persistent vs non-persistent HTTP; HTTP vs FTP; SMTP vs HTTP; POP3 vs IMAP | [I.10](#u1-http)–[I.12](#u1-email) |
| Iterative vs recursive DNS | [I.13](#u1-dns) |
| rdt1.0 → 3.0; stop-and-wait vs GBN vs SR | [II.5](#u2-rdt), [II.6](#u2-pipelining) |
| Flow vs congestion control; Tahoe vs Reno | [II.9](#u2-tcp-rdt), [II.12](#u2-tcp-cc) |
| Datagram vs virtual circuit | [II.14](#u2-vc) |
| IPv4 vs IPv6; LS vs DV; OSPF vs BGP; traditional vs SDN control | [II.16](#u2-ip)–[II.20](#u2-sdn) |
| Error detection vs correction; parity vs checksum vs CRC | [III.2](#u3-error-detect), [III.3](#u3-error-correct) |
| Partitioning vs random access vs taking turns; pure vs slotted ALOHA; CSMA/CD vs CSMA/CA | [III.4](#u3-mac) |
| MAC vs IP addresses; hub vs switch vs router | [III.5](#u3-arp), [III.7](#u3-switches) |
| Analog vs digital signals; NRZ-L vs NRZ-I vs Manchester; Nyquist vs Shannon | [III.9](#u3-signals)–[III.14](#u3-snr) |

## One-page recall, unit by unit

:::two
#### Unit I
- Network edge: hosts, access networks (DSL dedicated, cable shared), physical media.
- Core: packet switching, store-and-forward, \(N L/R\); circuit switching FDM/TDM; ISP hierarchy, IXPs.
- Four delays; traffic intensity; throughput = bottleneck.
- Five layers: message, segment, datagram, frame, bits; encapsulation.
- HTTP: 2 RTT per object (non-persistent), cookies, caches, conditional GET (304).
- FTP: control 21 (persistent), data 20 (per file), out-of-band.
- Email: SMTP push (25), IMAP/POP3 pull; MX lookup.
- DNS: root, TLD, authoritative, local; A, NS, CNAME, MX.
- P2P: \(\max\{F/u_s, F/d_{min}, NF/(u_s + \sum u_i)\}\); BitTorrent.
- DASH and CDNs (enter deep vs bring home, DNS redirection).
---
#### Unit II
- Mux/demux: UDP 2-tuple, TCP 4-tuple.
- UDP 8-byte header; checksum with wraparound.
- rdt2.0 ACK/NAK; 2.1 seq 0/1; 2.2 no NAK; 3.0 timer.
- GBN cumulative ACK, one timer; SR individual ACKs, buffering.
- TCP: byte sequence numbers, cumulative ACKs, \(E + 4D\) timeout, 3 dup ACKs, rwnd.
- Congestion: slow start, AIMD, ssthresh = cwnd/2; Reno fast recovery.
- Router: input ports, fabrics, HOL blocking, WFQ.
- IP: header, fragmentation (offset/8), IPv6; CIDR, DHCP (DORA), NAT.
- Dijkstra and Bellman-Ford; poisoned reverse; OSPF, BGP; SDN.
---
#### Unit III
- Link services; NIC implementation.
- Parity (2-D corrects one bit), checksum, CRC (\(D \cdot 2^r \bmod G\)).
- ALOHA 0.37 / 0.18; CSMA/CD backoff \(K \times 512\) bit times.
- MAC 48-bit; ARP broadcast query, unicast reply.
- Ethernet frame fields; switches learn source addresses; VLAN 802.1Q tag.
- MPLS labels between layer-2 and IP headers.
- Signals: \(f = 1/T\), bandwidth, bits per level \(\log_2 L\).
- Line codes and their bandwidths; 4B/5B; B8ZS, HDB3.
- Impairments; dB; Nyquist \(2B\log_2 L\); Shannon \(B\log_2(1+\text{SNR})\).
:::

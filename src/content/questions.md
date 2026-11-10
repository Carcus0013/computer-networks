@@section questions | Question bank | Examination practice: short, long, numerical, comparison and diagram questions | Ochre chips mark questions taken from your uploaded papers (reworded, with the paper and question number). Green chips mark questions written for practice. Solutions start hidden: attempt each question, then reveal its solution. | Question bank

:::html
<div class="paper-head"><p class="srcline" style="margin:0">Solutions are hidden by default so you can attempt first. Reveal one at a time, or all at once.</p><button class="toggle" data-toggle-solutions type="button" aria-pressed="true">Show all solutions</button></div>
<div class="qfilter" data-scope="qbank"><button class="on" data-f="all" type="button">All</button><button data-f="paper" type="button">From papers</button><button data-f="practice" type="button">Practice</button><button data-f="numerical" type="button">Numerical</button><button data-f="short" type="button">Short answer</button><button data-f="long" type="button">Long answer</button><button data-f="comparison" type="button">Comparison</button><button data-f="diagram" type="button">Diagram</button><button data-f="conceptual" type="button">Conceptual</button></div>
<div id="qbank">
:::

## Unit I

:::q Q1 | practice | 2 marks · I.1 | short
Define a protocol. What three things does it specify?
>>>
A protocol defines (1) the **format** of messages exchanged between two or more communicating entities, (2) the **order** in which they are sent, and (3) the **actions** taken when a message is sent, received or another event (such as a timeout) occurs. Example: TCP's three-way handshake fixes the format (SYN, SYNACK, ACK segments), the order, and the actions (allocate buffers on SYN). See [I.1](#u1-internet).
:::

:::q Q2 | paper:19CSE301 Mid 2023 Q1(b) | 3 marks · I.4 | diagram
Explain the network topologies with pictorial representations.
>>>
Draw mesh, star, bus and ring (see the four diagrams in [I.4](#u1-topology)). Mesh: dedicated link between every pair, \(n(n-1)/2\) links, robust and private but costly. Star: every device to a central hub/switch, \(n\) links, the hub is the single point of failure; used in LANs. Bus: one backbone with drop lines and taps, cheap, a backbone break stops everything. Ring: each device linked to two neighbours, signals in one direction through repeaters; a break disables the ring unless it is a dual ring.
:::

:::q Q3 | paper:23CSE302 Mid 2025 Q1 | 4 marks · I.3 | numerical
An 8,000,000-bit file crosses three 4 Mbps links (two routers). Circuit switching: FDM with 8 channels, 300 ms setup. Packet switching: 2,000-byte packets including a 200-byte header, 10 ms propagation per link, 5 ms processing per router. Which is faster? Why does transmission delay dominate?
>>>
Circuit: rate \(4/8 = 0.5\) Mbps; \(0.3 + 8\times10^6/5\times10^5 = 16.3\) s. Packet: 1,800 data bytes = 14,400 bits per packet → 556 packets; \(L/R = 16{,}000/4\times10^6 = 4\) ms; first packet \(3(4) + 3(10) + 2(5) = 52\) ms; total \(52 + 555 \times 4 \approx 2{,}272\) ms ≈ **2.27 s**. Packet switching is faster because it uses the full 4 Mbps of every link and pipelines the packets. Transmission delay dominates because pushing millions of bits through a link takes seconds, while propagation and processing add only milliseconds. Full working in [I.3](#u1-core).
:::

:::q Q4 | paper:19CSE301 End 2023 Q1(a) | 5 marks · I.3 | numerical
Users each need 20 Mbps on a 200 Mbps link with circuit switching. How many can be supported?
>>>
Each circuit reserves its 20 Mbps permanently, so \(N = 200/20 = \mathbf{10}\) users. An 11th user would need 220 Mbps in total, more than the link has. (Packet switching could support more bursty users through statistical multiplexing.)
:::

:::q Q5 | paper:23CSE302 End 2025 Q5 | 6 marks · I.6 | numerical
A 1,200-byte packet crosses three links (4,000 km, 3,000 km, 1,000 km), all at 5 Mbps with \(s = 2\times10^8\) m/s, through two store-and-forward switches with 2 ms processing each. Find the end-to-end delay and which parameter matters most.
>>>
Transmission: \(9{,}600/5\times10^6 = 1.92\) ms per link → 5.76 ms. Propagation: 20 + 15 + 5 = 40 ms. Processing: 4 ms. Total **49.76 ms**. Propagation is 80.4% of the total, so link length (distance) has by far the largest effect; doubling the rate would save only 2.88 ms. See [I.6](#u1-delay).
:::

:::q Q6 | paper:19CCE304 Mid 2023 Q2 | 10 marks · I.6 | numerical
An \(8\times10^6\)-bit message crosses three 2 Mbps links (two store-and-forward switches). Find the time (a) without segmentation, (b) for the first packet to reach switch 1 and when the second packet is fully there, (c) with 800 packets of 10,000 bits.
>>>
(a) \(3 \times 4 = 12\) s. (b) 5 ms and 10 ms. (c) \((3 + 800 - 1) \times 5\) ms = **4.01 s**. Segmentation pipelines the links, also limits retransmission to small packets and avoids one message monopolising a link; the drawbacks are header overhead and reassembly.
:::

:::q Q7 | practice | 4 marks · I.6 | numerical
Packets of 1,500 bytes arrive at a router at an average of 100 packets/s, and the output link runs at 1 Mbps. Find the traffic intensity and say what happens to the queue.
>>>
\(I = La/R = (12{,}000 \times 100)/10^6 = 1.2\). Because \(I > 1\), bits arrive faster than the link can send them: the queue grows without bound, the queuing delay approaches infinity and packets are dropped once the buffer fills. The design rule is \(I \le 1\), and delay rises steeply as \(I\) approaches 1.
:::

:::q Q8 | paper:19CSE301 Mid 2024 Q4 | 5 marks · I.7 | diagram
Draw the TCP/IP stack from a sender through a router to a receiver, showing encapsulation and decapsulation and the name of the packet at each layer.
>>>
Sender: 5 layers (message → segment Ht M → datagram Hn Ht M → frame Hl Hn Ht M → bits). Router: only physical, link and network layers; it decapsulates up to the datagram, makes the forwarding decision, and re-encapsulates in a new frame for the next link. Receiver: decapsulates up all 5 layers. Use the encapsulation figure in [I.7](#u1-layers).
:::

:::q Q9 | paper:19CSE301 Jan 2023 Q2 | 5 marks · I.9 | comparison
Compare client-server and P2P architectures, with a typical application for each.
>>>
Client-server: always-on server with a fixed address; clients don't talk to each other; scaling needs data centres; centralised control and security; the server is a single point of failure; e.g. the web. P2P: intermittently connected peers talk directly; self-scalable (each peer adds upload capacity); cheap for the provider; hard to secure and manage; no single point of failure; e.g. BitTorrent. Full table in [I.9](#u1-apps).
:::

:::q Q10 | paper:19CSE301 Mid 2023 Q8 | 10 marks · I.10 | numerical
A base HTML file references 10 objects; RTT dominates. How many RTTs for: (i) non-persistent, no parallel; (ii) non-persistent with 10 parallel; (iii) persistent without pipelining; (iv) persistent with pipelining?
>>>
(i) \(2 + 2 \times 10 = 22\) RTT. (ii) \(2 + 2 = 4\) RTT. (iii) \(2 + 10 = 12\) RTT. (iv) \(2 + 1 = 3\) RTT. Each new connection costs 1 RTT for the handshake plus 1 RTT for request/response.
:::

:::q Q11 | paper:23CSE302 Mid 2025 Q7(B) | 4 marks · I.10, I.13 | numerical
www.medilab.org has a base page and 5 images. RTT client–local DNS = 6 ms; local DNS to the authoritative server through the .org TLD = 20 ms; client–server RTT = 40 ms. Non-persistent HTTP without parallel connections. Total time?
>>>
DNS = 6 + 20 = 26 ms. Six objects × 2 RTT × 40 ms = 480 ms. Total **506 ms**. Part (C), with a cache and persistent HTTP, is worked in [I.10](#u1-http) (about 208 ms).
:::

:::q Q12 | paper:19CSE301 End 2024 Q1(a) | 8 marks · I.10 | long
A news site updates articles often. Which HTTP mechanism lets users always see the latest version without re-downloading unchanged resources? Give sample request and response formats.
>>>
The **conditional GET**. The cache/browser stored the object with its `Last-Modified` date; next time it sends `GET /news/article.html HTTP/1.1`, `Host: …`, `If-Modified-Since: <that date>`. If the article is unchanged the server replies `HTTP/1.1 304 Not Modified` with no body (no transmission delay, no bandwidth). If it changed, the reply is `HTTP/1.1 200 OK`, `Last-Modified: <new date>`, and the new object. See [I.10](#u1-http).
:::

:::q Q13 | paper:23CSE302 Mid 2025 Q5 | 4 marks · I.11 | long
An employee logs in to an FTP server successfully, but downloads fail and the firewall log shows an FTP port blocked. Which connection is blocked and why does it matter? Explain the roles of FTP's connections with a diagram.
>>>
The **data connection** (port 20 / the client's data port in active mode) is blocked. Login uses the control connection on port 21, which works, but every file travels on a separate data connection, which the server opens back to the client in active mode, and the client firewall drops it. Control connection: persistent, carries USER, PASS, RETR, QUIT and three-digit replies. Data connection: opened per file and closed afterwards. Passive mode (PASV) fixes it. See [I.11](#u1-ftp).
:::

:::q Q14 | paper:23CSE302 Mid 2025 Q6 | 4 marks · I.12 | short
Gmail to Yahoo: name the protocol at each step and its role.
>>>
You → Gmail server: SMTP (mail app) or HTTP (webmail), submitting/pushing the message. Gmail → Yahoo: SMTP over TCP 25, after a DNS MX lookup, pushing between servers. Yahoo → friend: IMAP or POP3 (or HTTP for webmail), pulling the message from the mailbox.
:::

:::q Q15 | paper:20CYS303 End 2025 Q1 | 5 marks · I.12 | comparison
Compare POP3 and IMAP: operating paradigm, synchronisation and suitable use.
>>>
POP3 (port 110): download (and usually delete) messages to one device; three phases (authorisation, transaction, update); no server folders; poor multi-device sync; simple; suits a single device or offline use. IMAP (port 143): mail stays on the server; folders, search and partial fetch on the server; state is kept across sessions, so every device sees the same mailbox; more server storage and complexity; suits multiple devices.
:::

:::q Q16 | paper:19CSE301 End 2023 Q2(a) | 7 marks · I.13 | diagram
A user visits aums.amrita.edu and the browser doesn't know its IP address. Explain iterative and recursive DNS resolution with flow diagrams.
>>>
Iterative: host → local DNS (recursive request); local → root (referral to .edu TLD); local → TLD (referral to amrita.edu's authoritative server); local → authoritative (A record); local → host. Recursive: host → local → root → TLD → authoritative, and the answer returns along the same chain. Both use 8 messages; caching at the local server often skips the root. Draw both diagrams from [I.13](#u1-dns).
:::

:::q Q17 | paper:19CSE301 Mid 2023 Q3 | 5 marks · I.13 | conceptual
DNS uses UDP, which doesn't recover lost packets. Is this a problem, and how is it solved?
>>>
A lost query or reply would leave the client waiting, so the **resolver itself** sets a timer and **retransmits** (possibly to a secondary server) if no reply arrives. Reliability is handled in the application; UDP avoids TCP's handshake delay and connection state for a one-message exchange. Caching reduces how many queries are sent at all.
:::

:::q Q18 | paper:23CSE302 Mid 2025 Q2(A) | 4 marks · I.14 | numerical
\(u_s = 5\) Mbps, F = 1000 MB, N = 10, \(d_{min} = 2\) Mbps, each peer uploads 1 Mbps. Minimum P2P distribution time?
>>>
F = 8,000 Mbit. \(F/u_s = 1{,}600\) s; \(F/d_{min} = 4{,}000\) s; \(NF/(u_s + \sum u_i) = 80{,}000/15 = 5{,}333.3\) s. Answer: **5,333.3 s** (≈ 88.9 min).
:::

:::q Q19 | paper:20CYS303 End 2023 Q8 | 5 marks · I.15 | short
How does DASH help HTTP streaming?
>>>
The video is encoded at several bit rates and cut into chunks with URLs listed in a manifest. The client measures its throughput and, chunk by chunk, requests the highest rate it can sustain, switching down when bandwidth drops instead of stalling. Plain HTTP streaming sends one encoding to everyone. The client decides when, what rate and from where.
:::

:::q Q20 | paper:19CCE304 Mid 2023 Q3 | 5 marks · I.16 | short
Besides delay, loss and bandwidth, what else goes into choosing a CDN server?
>>>
Load balancing across clusters, diurnal (time-of-day) load, the location of clients' local DNS servers, whether the cluster holds the (possibly rarely watched) content, relieving hot spots, and delivery cost through particular ISPs.
:::

:::q Q21 | practice | 3 marks · I.7 | conceptual
Why doesn't a router need the transport layer?
>>>
A router's job is forwarding datagrams hop by hop using network-layer headers. Transport-layer functions (ports, reliability, congestion control) are end-to-end between processes on hosts; the router never delivers data to an application, so it implements only physical, link and network layers. This keeps routers simple and fast.
:::

## Unit II

:::q Q22 | paper:19CSE301 Jan 2023 Q3 | 5 marks · II.2 | short
Clients A and B open HTTP sessions with server S at the same time. Give possible ports for A→S, B→S, S→A, S→B. Can A and B use the same source port if they are different hosts? The same host?
>>>
A→S: 26145 → 80; B→S: 7532 → 80; S→A: 80 → 26145; S→B: 80 → 7532. Different hosts: yes (different IPs make different four-tuples). Same host: no (the four-tuples would be identical).
:::

:::q Q23 | paper:23CSE302 Mid 2025 Q3(b) | 4 marks · II.3 | numerical
Compute the UDP checksum of 0x4500, 0x0073, 0x0000, 0x4000, 0x4011, 0xB861.
>>>
Running sum: 4573 → 4573 → 8573 → C584 → C584 + B861 = 1 7DE5 → wrap → 7DE6. Complement: **0x8219**. Check: 7DE6 + 8219 = FFFF.
:::

:::q Q24 | paper:20CYS303 End 2025 Q12 | 11 marks · II.5 | long
Why weren't checksums alone enough in rdt2.0? Show a scenario where sequence numbers are essential. Why does rdt3.0 need a timer, and why does the timer force sequence numbers even if only data packets could be lost?
>>>
A checksum only detects errors; feedback (ACK/NAK) and retransmission are needed, and rdt2.0 fails if the feedback itself is garbled. Scenario: ACK corrupted → sender resends → receiver without numbers delivers the data twice. A timer is needed to detect loss (otherwise the sender waits forever); a timer can expire for a merely delayed packet (premature timeout), causing duplicates that only sequence numbers can expose. See [II.5](#u2-rdt) and the [RDT simulator](visualizations/rdt/index.html#v=2.0&s=ackcorrupt).
:::

:::q Q25 | practice | 3 marks · II.5 | comparison
How does rdt2.2 differ from rdt2.1?
>>>
rdt2.2 has no NAKs. The receiver sends an ACK carrying the sequence number of the last correctly received packet; when a packet is corrupt (or a duplicate), it re-sends the ACK for the previous packet. A sender that receives a duplicate ACK (the ACK for the other sequence number) treats it as a NAK and retransmits. FSM sizes are the same (sender 4 states, receiver 2).
:::

:::q Q26 | paper:19CSE301 Jan 2023 Q12(b) | 6 marks · II.6 | numerical
In Go-back-3, every 6th packet transmitted is lost. How many transmissions are needed to deliver 11 packets?
>>>
**17.** Transmissions 1–5 carry packets 1–5; t6 (packet 6) is lost, so 7, 8 (t7, t8) are discarded; timeout → 6, 7, 8 (t9–t11); t12 (packet 9) is lost, so 10, 11 are discarded; timeout → 9, 10, 11 (t15–t17). Confirmed by the [GBN simulator](visualizations/tcp/sliding-window.html) preset.
:::

:::q Q27 | paper:19CSE301 End 2024 Q2 | 15 marks · II.6 | diagram
Ten frames, window 5, frames 4 and 7 lost on first transmission. Show the exchanges for GBN and SR.
>>>
GBN: 1–5 sent, 4 lost, 5 discarded; window slides with ACK3 → 6, 7, 8 sent, 7 lost, 6 and 8 discarded; timeout → 4–8 resent; then 9, 10. Total **15** transmissions. SR: 1–5, 5 buffered; 6, 7, 8 sent, 7 lost, 6 and 8 buffered; timeout → only 4 resent (4, 5, 6 delivered); 9, 10 sent; timeout → only 7 resent (7–10 delivered). Total **12**. Timelines in [II.6](#u2-pipelining).
:::

:::q Q28 | practice | 2 marks · II.6 | numerical
With a 3-bit sequence number, what is the largest window for GBN and for SR?
>>>
GBN: \(2^3 - 1 = 7\). SR: \(2^{3-1} = 4\). A larger SR window would let the receiver confuse a retransmitted old packet with a new one (the SR dilemma).
:::

:::q Q29 | paper:19CCE304 End 2023 Q3 | 10 marks · II.7 | numerical
B has received bytes up to 126. A sends two segments of 80 and 40 bytes; the first has seq 127, source port 302, destination port 80. Give the second segment's seq and ports, and the ACK for the first.
>>>
Second segment: seq **207**, source 302, destination 80. ACK for the first: ack **207**, source 80, destination 302. (If the second arrived first, B would ACK 127.)
:::

:::q Q30 | paper:19CCE304 Mid 2023 Q6 | 10 marks · II.8 | numerical
SampleRTTs 106, 120, 140, 90, 115 ms; EstimatedRTT = 100 ms, DevRTT = 5 ms initially; α = 0.125, β = 0.25. Compute EstimatedRTT, DevRTT and TimeoutInterval after each sample.
>>>
EstimatedRTT: 100.75, 103.16, 107.76, 105.54, 106.72. DevRTT: 5.06, 8.01, 14.07, 14.43, 12.89. Timeout: 121.00, 135.19, 164.02, 163.28, 158.30 ms (textbook order). Table and the RFC-order alternative in [II.8](#u2-rtt).
:::

:::q Q31 | paper:19CSE301 Jan 2023 Q13(b) | 4 marks · II.9 | short
Explain TCP flow control when RcvBuffer = 10 KB and 4 KB is currently buffered.
>>>
rwnd = RcvBuffer − (LastByteRcvd − LastByteRead) = 10 − 4 = **6 KB**, advertised in every segment the receiver sends. The sender keeps LastByteSent − LastByteAcked ≤ 6 KB. As the application reads, rwnd grows; at rwnd = 0 the sender sends 1-byte probes.
:::

:::q Q32 | paper:19CSE301 Jan 2023 Q12(a) | 4 marks · II.10 | diagram
Explain the three-way handshake and the four-way close with diagrams.
>>>
Open: SYN (seq = x) → SYNACK (seq = y, ack = x + 1, buffers allocated) → ACK (ack = y + 1, may carry data). Close: FIN → ACK → FIN → ACK; the client waits in TIME_WAIT before CLOSED. Label flags and numbers; states: SYN_SENT, SYN_RCVD, ESTABLISHED, FIN_WAIT_1/2, CLOSE_WAIT, LAST_ACK, TIME_WAIT. Step through it in the [TCP simulator](visualizations/tcp/connection.html).
:::

:::q Q33 | paper:23CSE302 End 2025 Q4 | 6 marks · II.12 | numerical
TCP Tahoe, cwnd = 1, ssthresh = 16; a triple duplicate ACK at the end of RTT 10. (a) RTTs to reach 16 and packets sent in slow start. (b) cwnd per RTT to RTT 14 with cumulative totals; Tahoe vs Reno.
>>>
(a) cwnd 1, 2, 4, 8 → 16 at RTT 5: 4 RTTs of slow start, 15 packets. (b) 16, 17, 18, 19, 20, 21 (RTT 5–10); loss → ssthresh 10, cwnd 1; RTT 11–14: 1, 2, 4, 8. Cumulative: 1, 3, 7, 15, 31, 48, 66, 85, 105, 126, 127, 129, 133, 141. Reno would enter fast recovery with cwnd = 10 + 3 = 13 instead of 1. Table in [II.12](#u2-tcp-cc).
:::

:::q Q34 | paper:20CYS303 End 2025 Q11 | 10 marks · II.12 | short
(a) cwnd = 1, ssthresh = 32; cwnd at the start of RTT 3? (b) Reno sees a triple duplicate ACK at cwnd = 50: new ssthresh and cwnd? (c) When does TCP move from slow start to congestion avoidance?
>>>
(a) 4 MSS. (b) ssthresh = 25, cwnd = 25 + 3 = 28 MSS. (c) When cwnd ≥ ssthresh: it is back at half the window where congestion was last seen, so it switches from exponential to additive (linear) increase.
:::

:::q Q35 | practice | 4 marks · II.9, II.11 | comparison
Distinguish flow control from congestion control.
>>>
Flow control protects the **receiver's buffer** from a fast sender; it uses rwnd advertised by the receiver. Congestion control protects the **network** (router buffers and links) from too much total traffic; the sender infers congestion from loss and delay and adjusts cwnd. The sender is limited by min(cwnd, rwnd).
:::

:::q Q36 | paper:19CCE304 End 2023 Q5 | 10 marks · II.14 | long
For a network where H1 and H2 reach H3 through router A (interfaces 3 and 4 towards B and C): give A's datagram forwarding table, say whether a datagram network can send H1's and H2's traffic on different interfaces, and give VC tables in A, B, C, D.
>>>
Datagram: destination H3 → interface 3. No: datagram forwarding uses only the destination address. VC (H1–H3 on VC 22, H2–H3 on VC 17): A: (1, 22) → (3, 22), (2, 17) → (4, 17); B: (1, 22) → (2, 22); C: (1, 17) → (2, 17); D: (1, 22) → (3, 22), (2, 17) → (3, 17). See [II.14](#u2-vc).
:::

:::q Q37 | paper:19CSE301 Jan 2023 Q6 | 5 marks · II.15 | numerical
Destination 131.23.151.76; entries 131.16.0.0/12 → 3, 131.28.0.0/14 → 5, 131.19.0.0/16 → 2, 131.22.0.0/15 → 1. Which interface?
>>>
Second octet 23 = 00010111. /12 (0001…) matches; /14 (000111) no; /16 (19) no; /15 (0001011) matches. Longest match /15 → **interface 1**.
:::

:::q Q38 | paper:19CSE301 End 2024 Q4(a) | 5 marks · II.16 | numerical
A 5,000-byte datagram meets an MTU of 1,300. How many fragments? List them.
>>>
With a 20-byte header: data 4,980; max data per fragment 1,280. Fragments: (1,300 bytes, offset 0, MF 1), (1,300, 160, 1), (1,300, 320, 1), (1,160, 480, 0). **4 fragments.**
:::

:::q Q39 | paper:23CSE302 End 2025 Q2 | 6 marks · II.17 | numerical
An ISP has 193.10.1.0/24 … 193.10.10.0/24. A client needs subnets of 120, 56, 28, 12 and 12 addresses. Give classful and classless allocations, the addresses saved, and drawbacks of classless allocation.
>>>
Classful: five /24 blocks (1,280 addresses). Classless: 193.10.1.0/25, .128/26, .192/27, .224/28, .240/28, all in one /24 (256 addresses). Saved: **1,024** addresses. Drawbacks: masks must be configured explicitly, more complex planning, longest-prefix matching in routers, harder renumbering and aggregation. See [II.17](#u2-addressing) and the [VLSM solver](#solver-subnet).
:::

:::q Q40 | paper:23CSE302 End 2025 Q6(b) | 5 marks · II.17 | long
After joining the corporate Wi-Fi, how does a laptop obtain its IP address, default gateway and DNS server?
>>>
DHCP over UDP (67/68): DISCOVER (src 0.0.0.0, dst 255.255.255.255), OFFER (proposed address, mask, lease), REQUEST (accepts one offer), ACK (confirms; includes gateway and DNS server). The address is leased and renewed before expiry. A relay agent forwards the broadcast if the server is on another subnet.
:::

:::q Q41 | paper:20CYS303 End 2024 Q14 | 10 marks · II.17 | long
Why is NAT needed, and how does it work? Show a translation table.
>>>
IPv4 addresses are scarce; NAT lets a whole private network (10/8, 172.16/12, 192.168/16) share one public address. The NAT router rewrites each outgoing datagram's source (IP, port) to (its public IP, a new port) and records the mapping; replies to that port are rewritten back. Table example: 138.76.29.7:5001 ↔ 10.0.0.1:3345. Controversial: ports used to address hosts, violates layering and end-to-end, hinders incoming connections.
:::

:::q Q42 | paper:23CSE302 End 2025 Q6(a) | 7 marks · II.18 | numerical
Links: A–B 2, A–C 5, B–C 1, B–D 2, C–D 3, C–E 1, D–E 4. Use the LS algorithm from A.
>>>
N′ grows A → AB → ABC → ABCD → ABCDE. Final: B 2 (A-B), C 3 (A-B-C), D 4 (A-B-D), E 4 (A-B-C-E). Every destination leaves A on link (A, B). Full table in [II.18](#u2-routing).
:::

:::q Q43 | paper:20CYS303 End 2025 Q9 | 15 marks · II.18 | numerical
X, Y, Z with c(X,Y) = 2, c(Y,Z) = 1, c(X,Z) = 7. Give the distance tables at t = 0, X's and Z's at t = 1, X's at t = 2, the final X→Z path, and why t = 2 is needed.
>>>
t = 0: X [0, 2, 7], Y [2, 0, 1], Z [7, 1, 0]. t = 1: X [0, 2, 3] (Z via Y), Z [3, 1, 0] (X via Y). t = 2: X unchanged. Final X→Y→Z, cost 3. The second round confirms that no neighbour's updated vector produces a further improvement (the algorithm stops when no vector changes).
:::

:::q Q44 | paper:19CSE301 Jan 2023 Q7 | 5 marks · II.18 | comparison
Compare LS and DV routing, with a protocol example of each.
>>>
LS: global topology flooded to all routers, Dijkstra, fast convergence, more messages, robust (each router computes its own table); e.g. OSPF. DV: only neighbours exchange vectors, Bellman-Ford, slow convergence with routing loops and count-to-infinity, errors propagate; e.g. RIP.
:::

:::q Q45 | paper:20CYS303 End 2025 Q10 | 10 marks · II.20 | long
Contrast the traditional and SDN control planes; name SDN's three layers; explain southbound and northbound APIs; give three advantages of SDN.
>>>
Traditional: control logic in every router, which compute their own tables with distributed protocols. SDN: a logically centralised controller computes and installs flow tables. Layers: data-plane switches, SDN controller, network-control applications. Southbound (OpenFlow): controller ↔ switches (modify-state, read-state, packet-in, port-status). Northbound: applications ↔ controller. Advantages: easier management with a global view, programmability and faster innovation, flexible flow-based traffic engineering, open vendor-neutral hardware.
:::

:::q Q46 | paper:20CYS303 End 2023 Q3 | 5 marks · II.15 | short
Explain packet scheduling disciplines and recommend one for a university.
>>>
FIFO (arrival order), priority (highest non-empty class first), round robin (cycle through classes), WFQ (class i gets at least \(R w_i/\sum w_j\)). Recommend WFQ: weight academic/exam traffic highest so it is guaranteed bandwidth, while no class starves (unlike strict priority).
:::

:::q Q47 | paper:20CYS303 End 2024 Q1(e) | 2 marks · II.19 | short
What is hot-potato routing?
>>>
Among BGP routes to a destination, choose the one whose gateway (NEXT-HOP) has the least intra-AS cost, so the packet leaves the AS as quickly as possible, ignoring the cost outside the AS.
:::

## Unit III

:::q Q48 | paper:23CSE302 End 2025 Q7(a) | 4 marks · III.2 | numerical
Data 1000111, generator 1001. Find the CRC remainder with steps.
>>>
Divide 1000111**000** by 1001 (XOR at positions 1, 4, 5, 6): remainder **110**; send 1000111110. Division rows in [III.2](#u3-error-detect).
:::

:::q Q49 | paper:19CSE301 End 2023 Q5(b) | 10 marks · III.2 | numerical
Payload 11010011, generator \(x^5 + x^2 + 1\). Show CRC generation and checking.
>>>
G = 100101, r = 5. Remainder of 1101001100000 ÷ 100101 = **11100**; transmit 1101001111100. The receiver's division leaves 00000, so the frame is accepted.
:::

:::q Q50 | paper:20CYS303 End 2024 Q9 | 5 marks · III.2 | numerical
Received with 2-D even parity: 10001101, 01001001, 10110011, 01001101, 00010010. Corrupted? Correctable?
>>>
Rows 2 and 3 and columns 3 and 5 have odd parity: corrupted. Two rows and two columns fail, so at least two bits are wrong and their positions are ambiguous: **detected but not correctable**. Try it in the [parity workbench](visualizations/link/error-detection.html).
:::

:::q Q51 | paper:23CSE302 End 2025 Q7(b,c) | 6 marks · III.4 | numerical
On a 1 Mbps CSMA/CD channel, what is node B's backoff after its 5th collision? What is slotted ALOHA's efficiency with 4 nodes and p = 0.4?
>>>
K ∈ {0 … 31}; 512 bit times = 512 µs; wait K × 512 µs, between 0 and 15.872 ms (e.g. K = 12 → 6.144 ms). Slotted ALOHA: \(4 \times 0.4 \times 0.6^3 = 0.3456\) (34.56%).
:::

:::q Q52 | paper:20CYS303 End 2023 Q4 | 5 marks · III.4 | comparison
Explain pure and slotted ALOHA.
>>>
Slotted: synchronised slots of one frame time; transmit at a slot start; on collision retry each later slot with probability p; efficiency \(Np(1-p)^{N-1}\), max 1/e ≈ 0.37. Pure: transmit immediately with no slots; vulnerable period two frame times; efficiency \(Np(1-p)^{2(N-1)}\), max 1/(2e) ≈ 0.18; simpler, no synchronisation.
:::

:::q Q53 | paper:19CSE301 Jan 2023 Q10 | 5 marks · III.7 | diagram
Hosts A–F on one switch; B→E, E→B, A→B, B→A. Show the switch table and forwarding after each.
>>>
B→E: learn B, flood (A, C, D, E, F). E→B: learn E, forward to B. A→B: learn A, forward to B. B→A: refresh B, forward to A. Final table {A, B, E}. Step through it in the [switch simulator](visualizations/link/switch.html).
:::

:::q Q54 | paper:19CCE304 End 2023 Q7 | 10 marks · III.5 | long
With switch S1 between subnets 1 and 2 and router R1 between subnets 2 and 3: (A) E → F: does E use R1? Addresses? (B) E → B with no ARP entry for B: does E ARP for B? Addresses in the frame to R1?
>>>
(A) No, same subnet: frame src/dst MAC = E/F, IPs = E/F. (B) No ARP for B (other subnet); E needs R1's MAC. Frame to R1: src MAC E, dst MAC R1 (subnet-3 interface), src IP E, dst IP B. See [III.5](#u3-arp) and the [ARP simulator](visualizations/link/arp.html).
:::

:::q Q55 | paper:19CSE301 End 2023 Q5(a) | 10 marks · III.7 | long
Segregate a bank's retail and trading departments on one LAN without a router; give three advantages.
>>>
Configure port-based **VLANs** (with 802.1Q trunks between switches). Advantages: traffic isolation and security (separate broadcast domains), flexible regrouping in software without recabling, and efficient use of the same switches. Inter-VLAN traffic, if ever needed, must go through a router or layer-3 switch with access control.
:::

:::q Q56 | paper:23CSE302 End 2025 Q1 | 4 marks · III.10 | diagram
Draw NRZ, NRZI and Manchester for 0010111101000010 and suggest an encoding for Fast Ethernet.
>>>
See the drawing in [III.10](#u3-datacomm) (state the convention: NRZ-L 0 = +V; NRZ-I invert on 1; Manchester 0 = high→low). Fast Ethernet over copper (100BASE-TX) uses **4B/5B with MLT-3**. Draw your own stream in the [line-coding studio](visualizations/physical-layer/index.html).
:::

:::q Q57 | practice | 5 marks · III.14 | numerical
A channel has bandwidth 2 MHz and SNR 36 dB. Find its capacity and the number of levels needed to send 16 Mbps.
>>>
SNR = \(10^{3.6} = 3{,}981\); \(C = 2\times10^6 \log_2 3{,}982 \approx 23.9\) Mbps. Nyquist: \(16\times10^6 = 2 \times 2\times10^6 \log_2 L\) → \(\log_2 L = 4\) → **L = 16** levels (16 Mbps < C, so it is feasible).
:::

:::q Q58 | practice | 3 marks · III.13 | numerical
A signal passes a cable (−4 dB), an amplifier (+10 dB) and another cable (−3 dB). If 5 mW enters, what leaves?
>>>
Total = −4 + 10 − 3 = +3 dB. \(P_2 = 5 \times 10^{0.3} = 5 \times 1.995 = 9.98\) mW (about double).
:::

:::q Q59 | practice | 4 marks · III.4 | comparison
Compare CSMA/CD and CSMA/CA.
>>>
CSMA/CD (wired Ethernet): listen, transmit, detect collisions while sending, abort with a jam, back off exponentially. CSMA/CA (Wi-Fi): a radio can't detect collisions, so it waits DIFS, counts down a random backoff before every transmission, expects a link-layer ACK, and may reserve the channel with RTS/CTS to handle hidden terminals.
:::

:::q Q60 | practice | 4 marks · III.7 | comparison
Compare a hub, a switch and a router.
>>>
Hub: layer 1, repeats bits to all ports, one collision domain. Switch: layer 2, forwards frames by MAC address using a self-learning table, separate collision domains, plug-and-play, one broadcast domain (unless VLANs). Router: layer 3, forwards datagrams by longest-prefix IP match, separates broadcast domains, needs configuration, supports any topology.
:::

:::html
</div>
:::

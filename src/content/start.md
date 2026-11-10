@@section intro | 23CSE302 · B.Tech CSE · Semester V · Amrita Vishwa Vidyapeetham | Computer Networks | All three units taught from first principles, every examined numerical worked step by step, and simulators for the topics that are hard to picture: RDT, TCP, congestion control, DNS and routing. | Introduction

:::html
<div class="resume" id="dash-resume"></div>
:::

## How to use this course

- Read the units in order. Each topic builds on the one before it; the transport layer leans on the delay ideas from Unit I, and the link layer leans on the physical layer's bit-rate ideas.
- Every topic follows the same pattern: why the idea exists, how it works inside, step-by-step process, examples (an everyday analogy, a real network, a worked numerical), comparisons, exam notes, common mistakes, and a quick revision box.
- An ochre chip such as {{paper:23CSE302 End 2025 Q4}} marks something that was asked in one of your uploaded question papers, and which question it was. A blue chip such as {{gap:Forouzan 1.2}} marks a syllabus topic that your slides and the prescribed Kurose sections don't cover, so it is taught from the named source instead. A green chip such as {{practice:Practice}} marks a question written for practice.
- Blue boxes with an “Open simulator” button lead to interactive visualizations. Each one has Play, Pause, Next step, Previous step, Reset and a speed control, with an explanation of every step.
- Tick “Mark as completed” at the end of each topic, and “Flag for revision” if you want to come back to it. Your progress appears in the contents list and on the [progress dashboard](#revision). It is saved in this browser only.
- Every numerical is laid out the same way: **Given → Required → Formula → Substitution → Calculation → Final answer**. Write your exam answers in the same order; examiners award step marks.

:::note Units and conventions used throughout
- In networking, rates use powers of ten: 1 kbps = 10³ bps, 1 Mbps = 10⁶ bps, 1 Gbps = 10⁹ bps. File sizes in Kurose's problems also use 1 MB = 10⁶ bytes unless a question says otherwise. State your assumption in the exam.
- 1 byte = 8 bits. Most wrong answers in delay questions come from forgetting this.
- Propagation speed in copper or fibre is about 2 × 10⁸ m/s; in free space it is 3 × 10⁸ m/s.
- “Kurose” means Kurose & Ross, *Computer Networking: A Top-Down Approach*, 8th edition. “Forouzan” means Forouzan, *Data Communications and Networking*, 4th edition.
:::

@@section syllabus | Syllabus overview | Syllabus, prescribed portions and what the papers test | What the official syllabus asks for, where each topic is taught from, and which topics the past papers lean on. | Syllabus overview

## Prescribed portions

:::two
#### Kurose & Ross, 8th edition (primary)
- Chapter 1, entire chapter
- Chapter 2, sections 2.1 to 2.6
- Chapter 3, sections 3.1 to 3.7.1
- Chapter 4, sections 4.1, 4.2 and 4.3
- Chapter 5, sections 5.1 to 5.5
- Chapter 6, sections 6.1 to 6.5
---
#### Forouzan, 4th edition (supporting)
- 3.3 Digital signals, 3.4 Transmission impairment, 3.5 Data rate limits
- 4.1 Digital-to-digital conversion (line coding)
- Chapter 19 IP logical addressing
- 23.2 UDP checksum
- Chapter 26 FTP and electronic mail
:::

## Where each syllabus topic is taught from

| Syllabus topic | Main source | Your slides | Status |
|---|---|---|---|
| The Internet, network edge, network core | Kurose 1.1–1.3 | Chapter_1_v8.2 | Covered |
| Network topology, types of networks | Forouzan 1.2 | Not in slides | {{gap:Taught from Forouzan 1.2}} |
| Delay, loss and throughput | Kurose 1.4 | Chapter_1_v8.2, Chapter 1 Problems | Covered |
| Protocol layers and service models | Kurose 1.5 | Chapter_1_v8.2 | Covered |
| Networks under attack, history | Kurose 1.6–1.7 | Chapter_1_v8.2 | Covered (Chapter 1 is prescribed in full) |
| Principles of applications, HTTP | Kurose 2.1–2.2 | Chapter_2_v8.2, quiz 1, Chapter2-Problems | Covered |
| FTP | Forouzan 26.3 | Only named in slides | {{gap:Kurose 8e dropped FTP}} |
| Electronic mail | Kurose 2.3, Forouzan 26.2 | Chapter_2_v8.2 | Covered |
| DNS, P2P, video streaming and CDNs | Kurose 2.4–2.6 | Chapter_2_v8.2 | Covered |
| Transport services, mux/demux, UDP, RDT, TCP, congestion control | Kurose 3.1–3.7.1, Forouzan 23.2 | Chapter_3_v8.2, Chapter3-Problems | Covered |
| Virtual circuit and datagram networks | Forouzan 8.2–8.3 | Not in slides | {{gap:Not in Kurose 8e 4.1–4.3}} |
| Inside a router, IP, forwarding and addressing | Kurose 4.1–4.3, Forouzan 19 | Chapter_4_v8.2, Ip_addressing | Covered |
| Routing algorithms, routing in the Internet | Kurose 5.1–5.4 | Chapter_5_v8.2, Distance_vector_numerical | Covered |
| Introduction to SDN | Kurose 5.5 (and 4.1) | Chapter_5_v8.2 | Covered. Listed on the official syllabus image |
| Broadcast and multicast routing | Kurose 6th ed. 4.7 (older edition) | Not in slides | {{gap:Not in Kurose 8e; no past question}} |
| Link layer services, error detection, multiple access | Kurose 6.1–6.3 | Chapter_6_v8.2 | Covered |
| Link-layer addressing, Ethernet, switches, VLANs | Kurose 6.4 | Chapter_6_v8.2 | Covered |
| Link virtualization: MPLS | Kurose 6.5 | Chapter_6_v8.2 | Covered. Listed on the official syllabus image |
| Digital and analog signals, data communication | Forouzan 3.3, 4.1, 1.1 | PhysicalLayer ppt | Covered |
| Transmission media | Kurose 1.2.2 | Chapter_1_v8.2 | Covered |
| Signal, noise, attenuation, SNR | Forouzan 3.4–3.5 | Not in slides | Covered from the prescribed Forouzan sections |

:::exam What the past papers lean on
Counted across the 15 readable papers in your CN_PYQ'S folder (23CSE302, 19CSE301, 19CCE304 and 20CYS303). Your own course is 23CSE302; its October 2025 end-semester paper had 7 questions for 50 marks, and almost all of them were numerical.

| Topic | Papers it appeared in |
|---|---|
| Delay, store-and-forward and throughput numericals | 9 |
| TCP congestion control (cwnd tables, Tahoe and Reno, graphs) | 8 |
| HTTP timing: persistent vs non-persistent, DNS delay, caching | 8 |
| Link-state routing (Dijkstra table) | 7 |
| RDT finite-state machines (2.0, 2.1, 2.2, 3.0) | 7 |
| Go-Back-N and Selective Repeat timelines | 7 |
| IP subnetting, CIDR, longest prefix match | 6 |
| Email protocols | 6 |
| ARP and MAC/IP addresses across subnets | 6 |
| CRC; DHCP; distance vector; multiple access (ALOHA, CSMA/CD) | 5 each |
| DNS; P2P distribution time; port numbers and demultiplexing; circuit switching; NAT | 4 each |
| Internet checksum; switch self-learning; VLANs | 3 each |
| RTT estimation; FTP; IP fragmentation; SDN | 2 each |
| Line coding | 1 |
| Nyquist, Shannon, SNR | 0, but still on the syllabus |
:::

:::note Two scanned files
`20CYS303_V Sem Mid Term_Odd 2025.pdf` and `Distance_vector_numerical.pdf` are scanned images with no text layer, so questions from them are not quoted in this course.
:::

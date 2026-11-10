@@group Network layer
@@topic u2-netlayer | II.13 | The network layer: overview | The two jobs of the network layer (forwarding and routing), the data plane and the control plane, the traditional and SDN ways of computing forwarding tables, and the best-effort service model. | Kurose §4.1 · Chapter_4_v8.2 slides 2–12

## What the network layer does

The network layer moves **datagrams** from a sending host to a receiving host. At the sender it encapsulates transport-layer segments into datagrams; at the receiver it delivers the segments to the transport layer. Unlike the transport layer, a network-layer protocol runs **in every host and every router**: each router examines the header fields of every IP datagram passing through it.

The network layer has two important functions:

| Forwarding | Routing |
|---|---|
| Move a packet from a router's **input link to the appropriate output link** | Determine the **route or path** packets take from source to destination |
| A **router-local** action | A **network-wide** process |
| Takes nanoseconds; usually done in **hardware** | Takes seconds; done in **software** |
| Implemented in the **data plane** | Implemented in the **control plane** |
| Analogy: passing through a single highway interchange | Analogy: planning the whole trip from source to destination |

A key element in every router is its **forwarding table**. A router forwards a packet by examining the values of one or more header fields of the arriving packet and using them to index into its forwarding table. The value stored there indicates the outgoing link interface.

## Two ways to build the forwarding tables (the control plane)

:::two
#### The traditional approach: per-router control
A **routing algorithm runs in each and every router**; both forwarding and routing functions live in the router. The routing-algorithm components in each router communicate with each other by exchanging routing messages (OSPF, BGP) to compute the forwarding tables.
---
#### The SDN approach: logically centralised control
A physically separate, **remote controller** computes and distributes the forwarding tables to be used by every router. Routers only forward. The controller communicates with the routers by exchanging messages that contain forwarding tables. Because the network is “software-defined” by the controller, this is **software-defined networking (SDN)** (Topic II.20).
:::

## The network service model

The **network service model** defines the characteristics of end-to-end delivery of packets. Services the network layer **could** provide include:

- **Guaranteed delivery**: a packet will eventually arrive.
- **Guaranteed delivery with bounded delay**: delivered within a specified delay bound (such as 100 ms).
- **In-order packet delivery**.
- **Guaranteed minimal bandwidth**: like a link of a given rate between sender and receiver.
- **Security**: encryption of datagrams for confidentiality.

The Internet's network layer provides **a single service, best-effort service**. Packets are neither guaranteed to arrive, nor to arrive in order, nor within any delay, and there is no minimum bandwidth guarantee.

| Architecture | Service model | Bandwidth guarantee | No-loss guarantee | Ordering | Timing |
|---|---|---|---|---|---|
| Internet | Best effort | None | None | Any order possible | Not maintained |
| ATM | Constant bit rate (CBR) | Guaranteed constant rate | Yes | In order | Maintained |
| ATM | Available bit rate (ABR) | Guaranteed minimum | None | In order | Not maintained |
| Internet IntServ | Guaranteed (RFC 1633) | Yes | Yes | Yes | Yes |
| Internet DiffServ | Assured forwarding (RFC 2475) | Possible | Possible | Possible | No |

**Why has best effort survived?** Its simplicity let the Internet be widely deployed; over-provisioning of bandwidth gives good-enough performance for most applications (streaming, conferencing); replicated application-layer services (CDNs, data centres) bring content close to users; and congestion control of elastic services helps. IntServ and DiffServ were designed but are not widely deployed.

:::exam Exam focus
- Forwarding vs routing, data plane vs control plane, per-router vs SDN control: two-mark definitions and comparisons.
- The possible network services, and what the Internet's best-effort model does **not** guarantee.
:::

:::rev Quick revision
- Network layer runs in every host and router; datagrams.
- Forwarding (data plane, local, ns, hardware) vs routing (control plane, network-wide, s, software).
- Forwarding table: header field → output link. Built by per-router routing algorithms or a remote SDN controller.
- Internet service model: best effort, with no delivery, order, delay or bandwidth guarantees.
:::

@@topic u2-vc | II.14 | Virtual-circuit and datagram networks | Two ways a packet-switched network layer can work: connectionless datagram forwarding by destination address, and connection-oriented virtual circuits with per-link VC numbers set up in advance. | {{gap:Forouzan 8.2–8.3}} Not in Kurose 8e §4.1–4.3

:::note Source note
Virtual-circuit and datagram networks are on your syllabus but were removed from Kurose's 8th edition. This topic is taught from Forouzan Chapter 8 (Sections 8.2, Datagram networks, and 8.3, Virtual-circuit networks), in your CN_TEXTBOOK_2.pdf, with the comparison that older Kurose editions gave.
:::

## Connectionless and connection-oriented network layers

Just as the transport layer can offer a connectionless service (UDP) or a connection-oriented one (TCP), so can the network layer.

- A **datagram network** provides only a **connectionless** service: no setup, every packet routed independently.
- A **virtual-circuit (VC) network** provides a **connection-oriented** service: a path is set up before data flows, and every packet of the connection follows it.

Unlike in the transport layer, a network chooses **one** of the two for all its traffic. The Internet is a datagram network; ATM and frame relay are VC networks.

## Datagram networks

In a datagram network, each time an end system wants to send a packet, it stamps the packet with the **address of the destination** and pops it into the network, with **no circuit setup**. Packet switches don't maintain any state about circuits (there are none).

- Each packet is treated **independently** of all others, even packets from the same message; the packets are called **datagrams**.
- Each switch forwards using a **forwarding (routing) table** indexed by **destination address**; the table may change over time as routing protocols update it.
- Packets of one message may take **different routes** and can **arrive out of order**; some may be lost. Upper-layer protocols must reorder or ask for retransmission.
- There is **no setup or teardown phase**, so efficiency is better than a circuit-switched network (resources are allocated only while packets are being transferred), although delay may vary from packet to packet.

## Virtual-circuit networks

A virtual-circuit network is a cross between a circuit-switched network and a datagram network. A VC consists of:

1. a **path** (a series of links and switches) between source and destination;
2. **VC numbers**, one for **each link** along the path;
3. **entries in the forwarding table in each switch** along the path.

A packet belonging to a VC carries a **VC number (VCI, virtual-circuit identifier)** in its header. Because a VC may have a different VC number on each link, **each intervening switch replaces the VC number** of each traversing packet with a new one, obtained from its forwarding table. (This is **label swapping**, and the idea reappears in MPLS, Topic III.8.)

Why not one VC number for the whole path? Because choosing a number locally per link avoids a lot of message exchange to agree on a common number across all switches, and a long path would make a globally unique number much longer.

### The three phases

:::flow
1. VC setup | The source contacts the network layer with the receiver's address; the network finds the path, assigns a VC number on each link and adds an entry to each switch's table. It may also reserve resources (bandwidth, buffers) along the path.
2. Data transfer | Packets flow along the circuit, each carrying the VC number of the link it is on; each switch swaps the number and forwards.
3. VC teardown | The sender (or receiver) asks to end the call; the network removes the table entries in every switch along the path.
:::

Setup uses **signalling messages** (a setup request travels from source to destination, and an acknowledgement comes back), and the protocols that exchange them are **signalling protocols**. Because **every switch along the path** is involved in setup, it keeps **connection state** for every ongoing connection, unlike a datagram router.

### A VC forwarding table

| Incoming interface | Incoming VC # | Outgoing interface | Outgoing VC # |
|---|---|---|---|
| 1 | 12 | 2 | 22 |
| 2 | 63 | 1 | 18 |
| 3 | 7 | 2 | 17 |
| 1 | 97 | 3 | 87 |

A packet arriving on interface 1 with VC 12 leaves on interface 2 with its VC field rewritten to 22.

:::ex From a paper | Datagram vs VC forwarding tables {{paper:19CCE304 End 2023 Q5}}
The paper's figure is a small network: hosts H1 and H2 attach to router A (interfaces 1 and 2); A connects to router B through interface 3 and to router C through interface 4; B and C each connect to router D, which connects to H3. (The interface numbers below follow the usual version of this textbook figure; use the numbers in your paper's figure.)

:::graph The network for the question (numbers next to links are interface numbers).
H1 40 50 host "H1"
H2 40 170 host "H2"
A 190 110 hl
B 360 40 hl
C 360 180 hl
D 520 110 hl
H3 640 110 host "H3"
H1-A 1
H2-A 2
A-B 3
A-C 4
B-D
C-D
D-H3
:::

:::solve
Given: Datagram case: traffic to H3 must leave A on interface 3. VC case: calls H1–H3 and H2–H3; H1's traffic must use interface 3 at A and H2's interface 4.
Required: (A) A's datagram forwarding table; (B) whether a datagram network can split by source; (C) A's VC table; (D) VC tables in B, C and D.
Formula: Datagram: destination → output interface. VC: (in interface, in VC#) → (out interface, out VC#).
Substitution: Choose VC numbers: H1–H3 uses VC 22 on every link; H2–H3 uses VC 17. (Any distinct numbers are fine.)
Calculation: (A) Destination H3 → interface 3. (B) **No**: a datagram router forwards on the **destination address only**, so all datagrams to H3 follow the same entry regardless of source. (C) A: in 1 / VC 22 → out 3 / VC 22; in 2 / VC 17 → out 4 / VC 17. (D) B: in 1 / 22 → out 2 / 22. C: in 1 / 17 → out 2 / 17. D: in 1 / 22 → out 3 / 22; in 2 / 17 → out 3 / 17.
Answer: The datagram table has one row (H3 → 3) and cannot distinguish sources; a VC network can, because each connection has its own table entries.
:::
:::

## Datagram versus virtual-circuit networks

| Feature | Datagram network | Virtual-circuit network |
|---|---|---|
| Connection setup | None | Required (signalling) before data |
| Addressing in each packet | Full destination address | Short VC number, local to each link |
| State in switches | None about connections; only a forwarding table | Per-connection state in every switch on the path |
| Forwarding table indexed by | Destination address | Incoming interface + incoming VC number |
| Routing decision | Made for **every packet** | Made **once**, at setup |
| Path of packets | Each may take a different route | All follow the same path |
| Packet order | May arrive out of order | Arrive in order |
| Effect of a switch failure | Packets reroute around it | All circuits through it are lost |
| Resource reservation and QoS | Hard (best effort) | Easy (reserve at setup) |
| Delay | No setup delay; variable delay | Setup delay; then more uniform delay |
| Examples | The Internet (IP) | ATM, frame relay, X.25; ideas reused in MPLS |

The Internet chose datagrams because it interconnects many different link technologies, and end systems are smart computers that can handle reordering and reliability themselves (TCP); keeping the network core simple made it easy to grow.

:::exam Exam focus
- The comparison table is a standard 5-mark answer.
- The three VC phases and the VC table with per-link number swapping.
- The “trick question”: a datagram network cannot forward by source address.
:::

:::mistake Common mistakes
- Saying a VC network reserves a physical circuit. It is packet-switched; the circuit is virtual (resources may or may not be reserved).
- Giving the same VC number on every link as a rule. Numbers are local and usually change at each switch.
:::

:::rev Quick revision
- Datagram: no setup, destination address in every packet, per-packet forwarding, possible reordering, no switch state (the Internet).
- VC: setup–transfer–teardown; path + per-link VC numbers + switch table entries; label swapping; in-order; state in switches (ATM, frame relay).
:::

@@topic u2-router | II.15 | Inside a router | The four parts of a router, how input ports find the output link with longest-prefix matching, the three kinds of switching fabric, where queues form (including head-of-line blocking), how big buffers should be, and how packets are scheduled. | Kurose §4.2 · Chapter_4_v8.2 slides 13–40

## The four components

:::graph A generic router: input ports and output ports joined by a switching fabric, with a routing processor running the control plane.
in1 80 50 box "Input port"
in2 80 140 box "Input port"
fab 300 95 box "Switching fabric"
out1 520 50 box "Output port"
out2 520 140 box "Output port"
rp 300 200 box "Routing processor"
in1>fab
in2>fab
fab>out1
fab>out2
rp-fab ~
text 230 240 control plane (software, ms)
text 230 18 data plane (hardware, ns)
:::

1. **Input ports**: terminate the incoming physical link (physical layer), interoperate with the link layer at the other end, and perform the crucial **lookup** function: consult the forwarding table to decide the output port.
2. **Switching fabric**: connects the input ports to the output ports. It is a network inside the router.
3. **Output ports**: store packets received from the fabric and transmit them on the outgoing link, performing the link-layer and physical-layer functions.
4. **Routing processor**: performs control-plane functions. In a traditional router it runs the routing protocols, maintains routing tables and computes the forwarding table; in an SDN router it communicates with the remote controller to receive forwarding-table entries. It also performs network management.

The input ports, fabric and output ports form the **data plane**, almost always in hardware: a 100 Gbps link with 64-byte datagrams gives an input port only 5.12 ns to process each one. The control plane runs in software on the routing processor at millisecond or second timescales.

## Input port processing and destination-based forwarding

The forwarding table is computed by the routing processor (or received from an SDN controller) and **copied to each line card**, so forwarding decisions are made locally at each input port without going through the central processor for every packet. The input port also checks the version number, checksum and time-to-live, and updates counters.

With 32-bit IP addresses, a brute-force table with one entry per address is impossible. Instead the table lists **address prefixes**, and the router uses **longest prefix matching**: when there are several matches, it uses the entry with the **longest** matching prefix.

| Prefix (destination address range) | Link interface |
|---|---|
| `11001000 00010111 00010*** ********` | 0 |
| `11001000 00010111 00011000 ********` | 1 |
| `11001000 00010111 00011*** ********` | 2 |
| Otherwise | 3 |

- Destination 11001000 00010111 00010110 10100001 matches only the first entry → **interface 0**.
- Destination 11001000 00010111 00011000 10101010 matches the second **and** third entries; the second has the longer prefix (24 bits vs 21) → **interface 1**.

Lookups must be done at line speed, so routers use fast memory such as **TCAM** (ternary content addressable memory), which returns a lookup result in essentially one clock cycle regardless of table size. Input processing as a whole is “**match plus action**”: match the header, take the action (forward, drop, copy).

:::ex From a paper | Longest prefix match at a CIDR router {{paper:19CSE301 Jan 2023 Q6}}
:::solve
Given: Destination 131.23.151.76. Entries: 131.16.0.0/12 → 3; 131.28.0.0/14 → 5; 131.19.0.0/16 → 2; 131.22.0.0/15 → 1.
Required: The output interface.
Formula: An address matches prefix p/n if its first n bits equal p's first n bits; choose the longest match.
Substitution: The first octet (131) matches everywhere; compare the second octet in binary: 23 = 0001 0111.
Calculation: /12 needs the first 4 bits of octet 2: 16 = **0001** 0000 → 0001 ✓ (covers 131.16–131.31). /14 needs 6 bits: 28 = **000111** 00 vs 000101 ✗. /16 needs all 8: 19 ≠ 23 ✗. /15 needs 7 bits: 22 = **0001011** 0 vs 0001011 ✓ (covers 131.22–131.23).
Answer: Two entries match (/12 and /15); the longest is /15, so the packet leaves on **interface 1**.
:::
:::

:::ex Practice | Ranges behind each interface (Kurose-style, 8-bit addresses)
:::solve
Given: A router with 8-bit host addresses and the table: 00 → 0; 010 → 1; 011 → 2; 10 → 2; 11 → 3 (longest prefix matching).
Required: The address range and number of addresses for each interface.
Formula: A k-bit prefix covers \(2^{8-k}\) addresses.
Substitution: 00****** = 0–63; 010***** = 64–95; 011***** = 96–127; 10****** = 128–191; 11****** = 192–255.
Calculation: Interface 0: 64 addresses. Interface 1: 32. Interface 2: 32 + 64 = 96. Interface 3: 64.
Answer: 0: 00000000–00111111 (64); 1: 01000000–01011111 (32); 2: 01100000–10111111 (96); 3: 11000000–11111111 (64).
:::
:::

## Switching fabrics

The switching fabric is at the very heart of a router. There are three classic designs.

| Fabric | How it works | Limitation | Example |
|---|---|---|---|
| **Switching via memory** | The earliest routers were ordinary computers: an arriving packet is copied into the processor's memory (by an interrupt), the processor finds the output port, and copies the packet to the output port's buffer | Two memory accesses per packet (write then read), so throughput is at most B/2 for memory bandwidth B packets/s; only one packet at a time | First-generation routers; Cisco Catalyst 8500 |
| **Switching via a bus** | The input port transfers the packet directly to the output port over a shared bus, prefixing a label with the output port; all outputs see it but only the matching one keeps it | Only **one packet at a time** can cross the bus; the switching speed is limited by the bus bandwidth | Cisco 6500 (32 Gbps backplane bus) |
| **Switching via an interconnection network** | A **crossbar** of 2N buses connecting N inputs to N outputs; each crosspoint can be opened or closed, so packets to **different** outputs cross **at the same time** (non-blocking); multistage (Clos) networks and parallel switching planes scale further | Two packets for the **same** output must still wait | Cisco 12000 and CRS (multistage) |

:::exam From a paper {{paper:20CYS303 End 2023 Q2}} {{paper:20CYS303 End 2024 Q3}}
“Explain the different types of switching techniques in a router” (5 marks): these three fabrics, a sketch of each, and their limitations.
:::

## Where queues form

Packet queues can form at both input ports and output ports. As queues grow, buffers fill and **packet loss** occurs.

### Input queuing and head-of-line blocking

If the switching fabric is **not fast enough** to transfer all arriving packets through the fabric without delay (it is slower than the input ports combined), packets queue at the input ports. In a crossbar, if two packets at the fronts of two input queues are destined for the **same** output, one must wait. Worse, a packet **behind** the blocked one must wait too, even if its own output port is free. This is **head-of-line (HOL) blocking**: a queued packet in an input queue must wait for transfer through the fabric (even though its output port is free) because it is blocked by another packet at the head of the line. HOL blocking can cap a switch's throughput at about 58% of its capacity under certain assumptions.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 180" role="img" aria-label="Head-of-line blocking at input queues of a crossbar">
<text x="20" y="20" class="c-head">Input queues</text><text x="560" y="20" class="c-head">Outputs</text>
<rect x="40" y="40" width="34" height="26" class="g-host"/><rect x="78" y="40" width="34" height="26" class="g-box"/>
<text x="57" y="57" class="c-text" text-anchor="middle">X</text><text x="95" y="57" class="c-text" text-anchor="middle">Z</text>
<rect x="78" y="100" width="34" height="26" class="g-host"/>
<text x="95" y="117" class="c-text" text-anchor="middle">X</text>
<rect x="250" y="30" width="180" height="110" class="g-node"/><text x="340" y="90" class="c-muted" text-anchor="middle">crossbar fabric</text>
<line x1="114" y1="113" x2="248" y2="113" class="sq-arr" marker-end="url(#ahH)"/>
<rect x="520" y="36" width="120" height="26" class="g-box"/><text x="580" y="54" class="c-text" text-anchor="middle">output X (busy)</text>
<rect x="520" y="104" width="120" height="26" class="g-box"/><text x="580" y="122" class="c-text" text-anchor="middle">output Z (idle)</text>
<line x1="432" y1="113" x2="518" y2="56" class="sq-arr" marker-end="url(#ahH)"/>
<text x="40" y="160" class="c-muted">The lower queue's X wins the fabric. The upper queue's X waits, so the Z behind it waits too,</text>
<text x="40" y="175" class="c-muted">even though output Z is idle: head-of-line blocking.</text>
<defs><marker id="ahH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="m-ink"/></marker></defs>
</svg></div></figure>
:::

### Output queuing

Even with a fabric N times faster than one input port, if packets from all N inputs head for the **same** output, they queue at that output: the output link can send only one at a time. When the output buffer fills, the router must either **drop** an arriving packet (**drop-tail**) or remove an already-queued one. **Active queue management (AQM)** algorithms, such as **RED** (random early detection), drop or **mark** (ECN) packets before the buffer is full, to signal congestion to senders early.

### How much buffering?

The long-standing rule of thumb (RFC 3439) is that the amount of buffering \(B\) should equal an average round-trip time (say 250 ms) times the link capacity \(C\): a 10 Gbps link would need \(0.25 \times 10^{10} = 2.5\) Gbits of buffer. More recent analysis says that with a large number \(N\) of TCP flows, \(B = \text{RTT} \cdot C / \sqrt{N}\) is enough. Too much buffering is harmful too: it causes long delays (**bufferbloat**) for interactive applications.

## Packet scheduling

When several packets are queued at an output port, the **packet scheduler** decides which one to send next.

| Discipline | How it works | Analogy |
|---|---|---|
| **FIFO** (first in, first out, or FCFS) | Packets leave in the order they arrived | A single queue at a bank counter |
| **Priority queuing** | Arriving packets are classified into priority classes (by marking, port number, etc.); the scheduler sends from the **highest-priority non-empty queue**, FIFO within a class. Non-preemptive: a packet being sent isn't interrupted | Emergency patients in a hospital queue |
| **Round robin (RR)** | Packets are sorted into classes; the scheduler **alternates** among classes, sending one packet from each in turn. A **work-conserving** scheduler never leaves the link idle while packets are queued | Dealing cards round the table |
| **Weighted fair queuing (WFQ)** | Like round robin, but each class \(i\) gets a **weight** \(w_i\); in any interval with packets queued, class \(i\) receives at least a fraction \(w_i / \sum_j w_j\) of the link rate | Sharing time in proportion to agreed shares |

:::fx WFQ guaranteed rate for class i on a link of rate R
\[ R_i \ge R \cdot \frac{w_i}{\sum_j w_j} \]
:::

:::tip From a paper {{paper:20CYS303 End 2023 Q3}} {{paper:20CYS303 End 2024 Q4}}
“Which scheduling would you prefer for Amrita students?” A good answer: **WFQ** on the campus gateway, with classes such as academic/AUMS/online exams (weight 4), video lectures (weight 3), general browsing (weight 2) and downloads/updates (weight 1). Each class is guaranteed its share, important traffic gets more, and no class starves (unlike strict priority, where heavy high-priority traffic can starve lower classes). For a 1 Gbps link, academic traffic would be guaranteed at least \(1 \times 4/10 = 400\) Mbps.
:::

:::exam Exam focus
- Router architecture diagram with the four components and the data plane / control plane split.
- Longest prefix matching numericals.
- Three switching fabrics; input vs output queuing; HOL blocking ({{paper:20CYS303 End 2023 Q1(e)}}).
- FIFO, priority, RR and WFQ, with the WFQ share formula.
:::

:::mistake Common mistakes
- Matching the **first** matching entry instead of the **longest**.
- Saying a crossbar can't send any two packets at once. It can, as long as they go to different outputs.
- Calling HOL blocking an output-queue problem. It happens at **input** queues.
:::

:::rev Quick revision
- Router = input ports + switching fabric + output ports (data plane, hardware) + routing processor (control plane).
- Longest prefix matching, done in TCAM; forwarding table copied to each line card.
- Fabrics: memory (≤ B/2, one at a time), bus (one at a time), interconnection network/crossbar (parallel to distinct outputs).
- Input queuing → HOL blocking; output queuing → drop-tail or AQM (RED, ECN marking).
- Buffer ≈ RTT × C (or RTT·C/√N).
- Scheduling: FIFO, priority, round robin, WFQ (share \(w_i/\sum w_j\)).
:::

@@topic u2-ip | II.16 | The Internet Protocol: IPv4 datagrams, fragmentation and IPv6 | Every field of the IPv4 header, how a large datagram is split to fit a smaller MTU (with the offset arithmetic examiners test), and what IPv6 changed and how the Internet is moving to it. | Kurose §4.3.1, §4.3.4 · Chapter_4_v8.2 slides 41–43, 74–80, 100–102

## The IPv4 datagram format

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 290" role="img" aria-label="IPv4 datagram format, 32 bits wide">
<text x="340" y="14" class="c-muted" text-anchor="middle">32 bits</text>
<rect x="100" y="22" width="60" height="28" class="g-box"/><text x="130" y="41" class="c-text" text-anchor="middle">ver</text>
<rect x="160" y="22" width="60" height="28" class="g-box"/><text x="190" y="41" class="c-text" text-anchor="middle">hdr len</text>
<rect x="220" y="22" width="120" height="28" class="g-box"/><text x="280" y="41" class="c-text" text-anchor="middle">type of service</text>
<rect x="340" y="22" width="240" height="28" class="g-box"/><text x="460" y="41" class="c-text" text-anchor="middle">datagram length (bytes)</text>
<rect x="100" y="50" width="240" height="28" class="g-host"/><text x="220" y="69" class="c-text" text-anchor="middle">16-bit identifier</text>
<rect x="340" y="50" width="60" height="28" class="g-host"/><text x="370" y="69" class="c-text" text-anchor="middle">flags</text>
<rect x="400" y="50" width="180" height="28" class="g-host"/><text x="490" y="69" class="c-text" text-anchor="middle">fragment offset (13)</text>
<rect x="100" y="78" width="120" height="28" class="g-box"/><text x="160" y="97" class="c-text" text-anchor="middle">time to live</text>
<rect x="220" y="78" width="120" height="28" class="g-box"/><text x="280" y="97" class="c-text" text-anchor="middle">upper-layer protocol</text>
<rect x="340" y="78" width="240" height="28" class="g-box"/><text x="460" y="97" class="c-text" text-anchor="middle">header checksum</text>
<rect x="100" y="106" width="480" height="28" class="g-box"/><text x="340" y="125" class="c-text" text-anchor="middle">32-bit source IP address</text>
<rect x="100" y="134" width="480" height="28" class="g-box"/><text x="340" y="153" class="c-text" text-anchor="middle">32-bit destination IP address</text>
<rect x="100" y="162" width="480" height="28" class="g-node"/><text x="340" y="181" class="c-text" text-anchor="middle">options (if any)</text>
<rect x="100" y="190" width="480" height="44" class="g-node"/><text x="340" y="216" class="c-text" text-anchor="middle">data (variable length; typically a TCP or UDP segment)</text>
<text x="340" y="258" class="c-muted" text-anchor="middle">Ochre row: fields used for fragmentation. Header without options = 20 bytes.</text>
<text x="340" y="276" class="c-muted" text-anchor="middle">A TCP segment inside an IP datagram carries 40 bytes of header (20 TCP + 20 IP).</text>
</svg></div><figcaption>The IPv4 datagram.</figcaption></figure>
:::

| Field | Bits | Purpose |
|---|---|---|
| Version | 4 | IP version (4); tells the router how to interpret the rest of the header |
| Header length | 4 | Header length in 32-bit words (needed because of options); 5 for a typical 20-byte header |
| Type of service (TOS) | 8 | Distinguishes datagram types (e.g. real-time vs. bulk); 6 bits for differentiated services, 2 for ECN |
| Datagram length | 16 | Total length of the datagram (header + data) in bytes; maximum 65,535, but rarely more than 1,500 |
| Identifier, flags, fragmentation offset | 16, 3, 13 | IP fragmentation (below) |
| Time-to-live (TTL) | 8 | Decremented by one at each router; the datagram is dropped when it reaches 0, so it can't circulate forever |
| Upper-layer protocol | 8 | Which transport protocol gets the data: **6 = TCP, 17 = UDP**. The “glue” between the network and transport layers, as the port number is between transport and application |
| Header checksum | 16 | Detects bit errors in the header only. Recomputed and stored again at **each router**, because the TTL (and possibly options) change |
| Source and destination IP addresses | 32 each | The sender's and receiver's addresses |
| Options | Variable | Rarely used; dropped from IPv6 |
| Data (payload) | Variable | Usually a TCP or UDP segment; can also be ICMP messages |

Why does both TCP and IP have checksums? IP's covers only the header; TCP/UDP's covers the whole segment; and TCP/UDP need not run over IP at all.

## IP fragmentation and reassembly

Not all link-layer protocols can carry packets of the same size. The maximum amount of data a link-layer frame can carry is the **maximum transmission unit (MTU)**: Ethernet's is 1,500 bytes. A router may receive a datagram larger than the MTU of the outgoing link.

The solution is to **fragment** the datagram into two or more smaller IP datagrams, each encapsulated in its own frame. The fragments are **reassembled only at the destination host**, not at routers (to keep routers simple). The header fields that make this possible:

- **Identifier**: all fragments of one original datagram carry the same identifier, so the destination knows which fragments belong together.
- **Flags**: the **more-fragments (MF)** bit is 1 in every fragment except the last, which has MF = 0, so the destination knows when it has the last one. (A don't-fragment bit also exists.)
- **Fragmentation offset**: where the fragment's data fits in the original datagram, in **units of 8 bytes**. So the data in every fragment except the last must be a multiple of 8 bytes.

:::fx Fragmentation rules
- Data per fragment \( \le \text{MTU} - \text{header} \), rounded **down** to a multiple of 8.
- Offset of a fragment \( = \dfrac{\text{byte position of its first data byte}}{8} \).
- Every fragment carries its own header; total length = header + its data.
:::

:::ex Level 1 | Kurose's 4,000-byte example (Additional Chapter 4 slides)
:::solve
Given: A 4,000-byte datagram (20-byte header, 3,980 bytes of data) arrives at a router whose outgoing MTU is 1,500 bytes.
Required: The fragments: length, offset and flag.
Formula: Max data per fragment = 1,500 − 20 = 1,480 (a multiple of 8 ✓).
Substitution: 3,980 = 1,480 + 1,480 + 1,020.
Calculation: Fragment 1: data bytes 0–1,479, length 1,500, offset 0, MF = 1. Fragment 2: bytes 1,480–2,959, length 1,500, offset 1,480/8 = 185, MF = 1. Fragment 3: bytes 2,960–3,979, length 1,040, offset 2,960/8 = 370, MF = 0.
Answer: Three fragments: (1,500, 0, 1), (1,500, 185, 1), (1,040, 370, 0), all with the same identifier.
:::
:::

:::ex From a paper | 5,000 bytes over an MTU of 1,300 {{paper:19CSE301 End 2024 Q4(a)}}
:::solve
Given: Datagram size 5,000 bytes; MTU = 1,300 bytes; assume a 20-byte header (no options).
Required: The number of fragments, and each fragment's details.
Formula: Max data = 1,300 − 20 = 1,280 (multiple of 8 ✓). Total data = 5,000 − 20 = 4,980.
Substitution: \( 4{,}980 = 3 \times 1{,}280 + 1{,}140 \).
Calculation: Fragment 1: data 1,280, length 1,300, offset 0, MF 1. Fragment 2: data 1,280, length 1,300, offset 1,280/8 = 160, MF 1. Fragment 3: data 1,280, length 1,300, offset 320, MF 1. Fragment 4: data 1,140, length 1,160, offset 3,840/8 = 480, MF 0.
Answer: **4 fragments** of 1,300, 1,300, 1,300 and 1,160 bytes, with offsets 0, 160, 320, 480.
:::
:::

:::ex From a paper | A 1,600-byte packet with a 30-byte header {{paper:19CSE301 End 2023 Q4(ii)}}
:::solve
Given: Packet size 1,600 bytes; header 30 bytes (as stated in the question); MTU 1,400 bytes.
Required: Each fragment's header and data size.
Formula: Max data = 1,400 − 30 = 1,370, rounded down to a multiple of 8 = 1,368. Total data = 1,600 − 30 = 1,570.
Substitution: \(1{,}570 = 1{,}368 + 202\).
Calculation: Fragment 1: header 30 + data 1,368 = 1,398 bytes, offset 0, MF 1. Fragment 2: header 30 + data 202 = 232 bytes, offset 1,368/8 = 171, MF 0.
Answer: Two fragments: 1,398 bytes (30 + 1,368) and 232 bytes (30 + 202). (A real IPv4 header length must be a multiple of 4 bytes, so 30 is unusual; follow the question's value.)
:::
:::

## IPv6

In the 1990s it was clear that the 32-bit IPv4 address space would soon run out, so IPv6 was developed. Its designers also took the chance to streamline the header.

### What changed

- **Expanded addressing**: addresses grow from 32 to **128 bits**, so the world won't run out of addresses. IPv6 also adds **anycast** addresses: a datagram is delivered to any one of a group of hosts.
- **A streamlined 40-byte header**: a fixed-length header lets routers process datagrams faster. Options are encoded through the **next header** field.
- **Flow labelling**: a 20-bit **flow label** identifies packets belonging to a “flow” for which the sender requests special handling, such as audio or video.

| IPv6 field | Size | Notes |
|---|---|---|
| Version | 4 bits | 6 |
| Traffic class | 8 bits | Like IPv4's TOS: priority among datagrams |
| Flow label | 20 bits | Identifies a flow |
| Payload length | 16 bits | Bytes after the 40-byte header |
| Next header | 8 bits | Which protocol gets the contents (same values as IPv4's protocol field) |
| Hop limit | 8 bits | Decremented at each router; like TTL |
| Source and destination addresses | 128 bits each | |

### What was removed

- **Fragmentation and reassembly at routers**: IPv6 allows fragmentation only at the source and destination. A router that gets a too-big datagram drops it and sends an ICMP “Packet Too Big” error back to the sender, which resends smaller datagrams. This saves router time.
- **Header checksum**: transport and link layers already check for errors, and recomputing a checksum at every router (as IPv4 must, because TTL changes) was costly.
- **Options**: no longer part of the standard header; they can be carried as “next headers”.

| Feature | IPv4 | IPv6 |
|---|---|---|
| Address length | 32 bits (≈ 4.3 × 10⁹ addresses) | 128 bits (≈ 3.4 × 10³⁸ addresses) |
| Header length | 20–60 bytes (variable) | 40 bytes (fixed) |
| Header checksum | Yes, recomputed at each router | No |
| Fragmentation | By routers and sources | Only at the source; routers send ICMP Packet Too Big |
| Options | In the header | In extension (“next”) headers |
| Flow label | No | Yes (20 bits) |
| TTL / hop limit | TTL | Hop limit |
| Protocol / next header | Protocol | Next header |
| Address notation | Dotted decimal: 192.168.1.10 | Hexadecimal groups: 2001:db8::8a2e:370:7334 |
| Configuration | Manual or DHCP | DHCPv6 or stateless autoconfiguration |
| Broadcast | Yes | No broadcast; multicast and anycast instead |

**Fields in common** (a frequent exam part, {{paper:19CCE304 End 2024 Q5(B)}}): version, the source and destination addresses (with different sizes), and fields with the same role under new names: TOS ≈ traffic class, protocol ≈ next header, TTL ≈ hop limit, datagram length ≈ payload length (which excludes the header in IPv6).

:::tip From a paper {{paper:19CCE304 Jan 2023 Q6(A)}}
How big are the address spaces? MAC: \(2^{48}\) ≈ 2.8 × 10¹⁴. IPv4: \(2^{32}\) ≈ 4.3 × 10⁹. IPv6: \(2^{128}\) ≈ 3.4 × 10³⁸.
:::

### The transition from IPv4 to IPv6

There can be no “flag day” on which every machine switches, because billions of devices are involved. Two approaches:

- **Dual stack**: IPv6 nodes also run IPv4, and use IPv4 to talk to IPv4-only nodes.
- **Tunnelling**: when two IPv6 nodes are connected through intervening IPv4 routers, the IPv6 node on the sending side of the **tunnel** puts the **entire IPv6 datagram into the data field of an IPv4 datagram** (with protocol number 41), addressed to the IPv6 node at the receiving end. The IPv4 routers forward it like any other IPv4 datagram. The receiving node sees that the IPv4 datagram contains an IPv6 datagram, extracts it and routes it onward as IPv6.

:::graph Tunnelling: between B and E, the IPv6 datagram travels inside IPv4 datagrams through IPv4-only routers C and D.
A 50 70 node
B 170 70 hl
C 300 70 node
D 430 70 node
E 560 70 hl
F 660 70 node
A-B
B-C *
C-D *
D-E *
E-F
text 30 120 IPv6
text 240 120 IPv6 inside IPv4 (tunnel)
text 610 120 IPv6
:::

Google reported in 2023 that about 40% of the clients accessing its services did so over IPv6.

:::exam Exam focus
- Draw the IPv4 datagram format and explain the key fields ({{paper:20CYS303 End 2023 Q12}}, which also asks about the IPv4–IPv6 transition).
- Fragmentation numericals appeared in two papers: offsets in units of 8 bytes, MF flags, every fragment with its own header.
- IPv4 vs IPv6 header comparison and common fields.
:::

:::mistake Common mistakes
- Writing the offset in bytes instead of 8-byte units.
- Using data per fragment that isn't a multiple of 8.
- Forgetting to subtract the header from the MTU (and from the original size).
- Saying routers reassemble fragments. Only the destination does.
:::

:::rev Quick revision
- IPv4 header 20 bytes: version, header length, TOS, length, identifier, flags, offset, TTL, protocol (6/17), header checksum, addresses, options.
- Fragmentation: same identifier, MF = 1 except last, offset in 8-byte units; reassembly only at the destination.
- IPv6: 128-bit addresses, 40-byte fixed header, flow label; no router fragmentation, no checksum, options in next headers.
- Transition: dual stack and tunnelling (IPv6 inside IPv4).
:::

@@topic u1-delay | I.6 | Delay, loss and throughput | The four delays a packet suffers at every node, how they add up end to end, when packets are lost, and how fast a file can really be delivered. The most examined numerical topic in your papers. | Kurose §1.4 · Chapter_1_v8.2 slides 44–56 · Chapter 1 Problems

## Why delay matters

Ideally the Internet would move any amount of data between any two hosts instantly and without loss. Physics makes that impossible. Every packet is delayed at every node, packets can be lost, and the rate at which data arrives is limited. To design networks, and to answer most numerical questions in this course, you must know exactly where the time goes.

## The four sources of nodal delay

Follow one packet as it passes through router A on its way to router B. The packet suffers four delays at A.

:::flow
1. Processing | Router A examines the header to decide where to send the packet and checks for bit errors.
2. Queuing | The packet waits in A's output buffer until the packets ahead of it have been sent.
3. Transmission | A pushes all the bits of the packet onto the link, one after another.
4. Propagation | Each bit travels along the link from A to B at the speed of the medium.
:::

### Processing delay, \(d_{\text{proc}}\)

The time to examine the packet's header, look up the forwarding table, and check for bit errors. In high-speed routers this is typically **microseconds or less**.

### Queuing delay, \(d_{\text{queue}}\)

The time the packet waits in the output queue. It is zero if the queue is empty and the link is idle, and large if many packets are already waiting. It depends on how much traffic has arrived earlier, so it varies from packet to packet: from **microseconds to milliseconds** in practice.

### Transmission delay, \(d_{\text{trans}}\)

The time to push **all** the packet's bits onto the link. A packet of \(L\) bits on a link of transmission rate \(R\) bits/s takes

\[ d_{\text{trans}} = \frac{L}{R} \]

For a 1,500-byte packet on a 10 Mbps Ethernet: \(12{,}000 / 10^7 = 1.2\) ms. On a 1 Gbps link: 12 µs. It depends on the **packet length and the link rate**, and **not** on the distance.

### Propagation delay, \(d_{\text{prop}}\)

Once a bit is pushed onto the link, it must travel to router B. The propagation speed \(s\) depends on the medium: about \(2 \times 10^8\) m/s in copper and fibre and \(3 \times 10^8\) m/s in free space. Over a link of length \(d\),

\[ d_{\text{prop}} = \frac{d}{s} \]

It depends on the **distance and the medium**, and **not** on the packet length or the link rate. In a campus LAN it is microseconds; across a continent it is tens of milliseconds.

:::fx Total nodal delay
\[ d_{\text{nodal}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}} \]
:::

### Transmission delay versus propagation delay

These two are the most commonly confused ideas in the subject.

| | Transmission delay | Propagation delay |
|---|---|---|
| What it measures | Time to push the whole packet **onto** the link | Time for one bit to travel **along** the link |
| Formula | \(L / R\) | \(d / s\) |
| Depends on | Packet length \(L\), link rate \(R\) | Distance \(d\), propagation speed \(s\) |
| Independent of | Distance | Packet length, link rate |
| Typical size | µs to ms | µs (LAN) to hundreds of ms (satellite) |
| Reduce it by | A faster link or a smaller packet | A shorter path |

:::analogy The caravan of cars (from your slides)
A caravan of 10 cars drives along a highway with a tollbooth every 100 km. Cars travel at 100 km/h. Each tollbooth serves one car every 12 seconds. The caravan must stay together, so it waits at a tollbooth until all 10 cars have been served.

- Serving all 10 cars at a tollbooth takes \(10 \times 12 = 120\) s = 2 min. This is the **transmission delay**: the cars are bits, the tollbooth is the router pushing them onto the link.
- Driving 100 km to the next tollbooth takes 1 hour. This is the **propagation delay**.
- So the caravan reaches the next tollbooth 62 minutes after it began being served at this one.

Now change the numbers: cars travel at 1,000 km/h and the tollbooth takes 1 minute per car. Serving 10 cars takes 10 minutes, but driving 100 km takes only 6 minutes. The first car reaches the next tollbooth while 3 cars are still queued at the first one. In networks, too, the first bits of a packet can arrive at the next router while the rest are still being transmitted.
:::

!!sim visualizations/core/switching.html | Delay and store-and-forward in motion | See transmission and propagation as separate phases on each link, with your own packet size, rates and distances.

## Queuing delay and traffic intensity

Queuing delay is the most complicated of the four, because it changes from packet to packet. Let

- \(a\) = the average rate at which packets arrive at the queue (packets/s),
- \(L\) = the packet length (bits), and
- \(R\) = the transmission rate (bits/s).

Bits arrive at an average rate of \(La\) bits/s and leave at \(R\) bits/s.

:::fx Traffic intensity
\[ I = \frac{L a}{R} \]
:::

- If \(I > 1\), bits arrive faster than they can be sent. The queue grows without limit and the queuing delay approaches infinity. **Rule one of traffic engineering: design the system so that the traffic intensity is no greater than 1.**
- If \(I \le 1\), the delay depends on how the traffic arrives. If one packet arrives exactly every \(L/R\) seconds, there is never a queue. If packets arrive in bursts, the later packets in a burst wait.
- As \(I\) approaches 1, the average queuing delay rises very steeply. A small increase in traffic near full load produces a large increase in delay.

:::plot How average queuing delay grows with traffic intensity (shape only) | Traffic intensity La/R | Average queuing delay
func : x/(1-x) ; 0 0.93
vline 1 I = 1
xmax 1
ymax 14
:::

## Packet loss

A queue has finite capacity. When a packet arrives to find the queue full, the router **drops** it: the packet is lost. The fraction of lost packets rises as the traffic intensity rises. A lost packet may be retransmitted by the source (TCP does this, Unit II), or simply never arrive (UDP). Performance at a node is therefore measured both by **delay** and by **the probability of packet loss**.

## End-to-end delay

Suppose there are \(N - 1\) routers between source and destination (so \(N\) links), the network is uncongested (no queuing), and every router and link is the same. Then

:::fx End-to-end delay across N identical links
\[ d_{\text{end-end}} = N\,(d_{\text{proc}} + d_{\text{trans}} + d_{\text{prop}}) \]
When links differ, add each link's \(L/R_i + d_i/s_i\), and add \(d_{\text{proc}}\) once for each packet switch.
:::

### Traceroute

**Traceroute** is a program that shows the end-to-end path and measures the delay to each router. For each of the \(N - 1\) routers on the path, the source sends three special packets marked for that router. Each router returns a short message to the source, which records the round-trip time. Because traceroute sends three packets per router, you see three delays per hop; they differ because queuing delay varies. Sometimes a later router shows a **smaller** delay than an earlier one, simply because its packets met less queuing.

## Throughput

**Instantaneous throughput** is the rate (bits/s) at which a host is receiving a file at a given moment. If a file of \(F\) bits takes \(T\) seconds to arrive, the **average throughput** is \(F/T\) bits/s.

For a path from a server (link rate \(R_s\)) through one router to a client (link rate \(R_c\)), with no other traffic, the throughput is the rate of the slower link: the **bottleneck link**.

:::fx Throughput of a path
\[ \text{throughput} = \min(R_1, R_2, \dots, R_N) \qquad \text{transfer time} \approx \frac{F}{\min(R_1, \dots, R_N)} \]
If a link of rate \(R\) is shared equally by \(k\) flows, each flow sees \(R/k\) on it, so the throughput is \(\min(R_s, R_c, R/k)\).
:::

In today's Internet the core is heavily over-provisioned, so the bottleneck is usually the **access network** at the edge (your Wi-Fi or your ISP connection).

:::two
#### Throughput is not bandwidth
**Bandwidth** (link rate) is what one link can carry. **Throughput** is what you actually get end to end, after the bottleneck and sharing. A 1 Gbps Ethernet port behind a 50 Mbps ISP connection gives about 50 Mbps of throughput from the Internet.
---
#### Throughput is not delay
Throughput is a rate (bits per second); delay is a time (seconds). A satellite link can have high throughput and huge delay. A LAN can have low delay and modest throughput.
:::

## Bandwidth-delay product

The number of bits that can be “in flight” on a link at once is

\[ \text{bits in the link} = R \times d_{\text{prop}} \]

On a 2 Mbps link 20,000 km long with \(s = 2.5 \times 10^8\) m/s, \(d_{\text{prop}} = 0.08\) s, so up to \(2 \times 10^6 \times 0.08 = 160{,}000\) bits are in the link at once. The length of one bit in metres is \(s/R\): here \(2.5 \times 10^8 / 2 \times 10^6 = 125\) m.

## Worked numericals

:::ex Level 1 | One packet, one link (Kurose problem, in Chapter 1 Problems)
:::solve
Given: \(L = 1{,}000\) bytes, link length \(d = 2{,}500\) km, \(s = 2.5 \times 10^8\) m/s, \(R = 2\) Mbps.
Required: The time for the packet to reach the other end, and whether it depends on \(L\) and \(R\).
Formula: \(d_{\text{trans}} = L/R\), \(d_{\text{prop}} = d/s\), total \(= d_{\text{trans}} + d_{\text{prop}}\).
Substitution: \(L = 1{,}000 \times 8 = 8{,}000\) bits. \(d_{\text{trans}} = 8{,}000 / (2 \times 10^6)\). \(d_{\text{prop}} = 2.5 \times 10^6 \text{ m} / 2.5 \times 10^8\).
Calculation: \(d_{\text{trans}} = 0.004\) s = 4 ms. \(d_{\text{prop}} = 0.01\) s = 10 ms. Total = 14 ms.
Answer: 14 ms in total. The propagation part (10 ms) does not depend on the packet length or the transmission rate; only the transmission part (4 ms) does.
:::
:::

:::ex From a paper | A point-to-point link {{paper:19CSE301 Jan 2023 Q1}}
:::solve
Given: \(R = 10\) Mbps, \(d_{\text{prop}} = 1\) µs, \(L = 100\) bytes.
Required: The time from the first bit leaving the sender until the receiver has the whole packet, in µs.
Formula: \(t = L/R + d_{\text{prop}}\) (the last bit leaves at \(L/R\) and arrives \(d_{\text{prop}}\) later).
Substitution: \(L = 100 \times 8 = 800\) bits; \(L/R = 800 / 10^7\).
Calculation: \(L/R = 8 \times 10^{-5}\) s = 80 µs. \(t = 80 + 1 = 81\) µs.
Answer: 81 µs. The four delay components the question also asks you to list are processing, queuing, transmission and propagation.
:::
:::

:::ex From a paper | Three links, two switches, and which parameter matters {{paper:23CSE302 End 2025 Q5}}
A packet of length \(L\) crosses three links joined by two store-and-forward switches; each switch adds processing delay \(d_{\text{proc}}\); queuing is ignored.

:::solve
Given: \(L = 1{,}200\) bytes; \(s_1 = s_2 = s_3 = 2.0 \times 10^8\) m/s; \(R_1 = R_2 = R_3 = 5\) Mbps; \(d_{\text{proc}} = 2\) ms; \(d_1 = 4{,}000\) km, \(d_2 = 3{,}000\) km, \(d_3 = 1{,}000\) km.
Required: The end-to-end delay in ms, and which parameter has the largest effect.
Formula: \( d_{\text{end-end}} = \sum_{i=1}^{3}\left(\frac{L}{R_i} + \frac{d_i}{s_i}\right) + 2\,d_{\text{proc}} \)
Substitution: \(L = 1{,}200 \times 8 = 9{,}600\) bits. \(L/R_i = 9{,}600 / (5 \times 10^6)\). \(d_1/s = 4 \times 10^6 / 2 \times 10^8\), \(d_2/s = 3 \times 10^6 / 2 \times 10^8\), \(d_3/s = 1 \times 10^6 / 2 \times 10^8\).
Calculation: Transmission: \(L/R = 1.92\) ms per link, \(3 \times 1.92 = 5.76\) ms. Propagation: \(20 + 15 + 5 = 40\) ms. Processing: \(2 \times 2 = 4\) ms. Total \(= 5.76 + 40 + 4 = 49.76\) ms.
Answer: About 49.76 ms. Propagation is 40 / 49.76 = 80.4% of the total, transmission 11.6%, processing 8.0%. Propagation dominates because the links are thousands of kilometres long while the packet is small. Doubling every link rate would save only 2.88 ms; halving the distances would save 20 ms. So the link lengths (and the medium's speed) have by far the largest effect here.
:::
:::

:::ex From a paper | Message segmentation {{paper:19CCE304 Mid 2023 Q2}} {{paper:19CSE301 Mid 2023 Q5}}
A message of \(8 \times 10^6\) bits goes from a source to a destination through two store-and-forward switches (three links), every link at 2 Mbps. Propagation, queuing and processing are ignored.

:::solve
Given: \(F = 8 \times 10^6\) bits; \(N = 3\) links; \(R = 2\) Mbps. With segmentation: \(P = 800\) packets of \(L = 10{,}000\) bits.
Required: (a) total time without segmentation; (b) time for the first packet to reach the first switch, and when the second packet is fully at the first switch; (c) total time with segmentation.
Formula: (a) \(N \cdot F/R\). (b) \(L/R\) and \(2L/R\). (c) \((N + P - 1) \cdot L/R\).
Substitution: \(F/R = 8 \times 10^6 / 2 \times 10^6\); \(L/R = 10{,}000 / 2 \times 10^6\).
Calculation: (a) \(F/R = 4\) s per link, so \(3 \times 4 = 12\) s. (b) \(L/R = 5\) ms; the second packet is fully at the first switch at \(2 \times 5 = 10\) ms. (c) \((3 + 800 - 1) \times 5\text{ ms} = 802 \times 5 = 4{,}010\) ms.
Answer: (a) 12 s. (b) 5 ms and 10 ms. (c) 4.01 s, about three times faster, because the three links work in parallel like a pipeline. Other reasons to segment: a bit error forces retransmission of one small packet instead of the whole message, and a huge message doesn't block other users' packets at a switch. Drawbacks: every packet carries a header (overhead), and packets must be numbered and reassembled at the destination.
:::
:::

:::ex From a paper | Throughput and transfer time {{paper:19CCE304 Mid 2023 Q1}} {{paper:19CSE301 Jan 2023 Q11(a)}}
:::solve
Given: Three links with \(R_1 = 500\) kbps, \(R_2 = 2\) Mbps, \(R_3 = 1\) Mbps; file = 4 million bytes. In part (c), \(R_2 = 100\) kbps.
Required: The throughput and the approximate transfer time, before and after \(R_2\) drops.
Formula: Throughput \(= \min(R_1, R_2, R_3)\); time \(\approx F / \text{throughput}\).
Substitution: \(F = 4 \times 10^6 \times 8 = 32 \times 10^6\) bits.
Calculation: Original: \(\min(500\text{k}, 2\text{M}, 1\text{M}) = 500\) kbps; time \(= 32 \times 10^6 / 5 \times 10^5 = 64\) s. With \(R_2 = 100\) kbps: throughput = 100 kbps; time \(= 32 \times 10^6 / 10^5 = 320\) s.
Answer: 500 kbps and 64 s; then 100 kbps and 320 s (5 min 20 s). The slowest link always sets the pace. (The 19CSE301 paper wrote “500 KBps”; if that really means kilobytes per second, the bottleneck becomes 1 Mbps on link 3 and the time 32 s. State which reading you use.)
:::
:::

:::ex From a paper | Stop-and-wait over a long link {{paper:19CCE304 End 2023 Q1(A)}}
Hosts A and B are 20,000 km apart on a direct 2 Mbps link with \(s = 2.5 \times 10^8\) m/s. The file is 800,000 bits (the question splits it into 20 packets of 40,000 bits).

:::solve
Given: \(d = 2 \times 10^7\) m, \(R = 2 \times 10^6\) bps, \(s = 2.5 \times 10^8\) m/s, \(F = 800{,}000\) bits; in (b) 20 packets of 40,000 bits, each acknowledged before the next is sent, ACK transmission time negligible.
Required: (a) time to send the file continuously; (b) time with stop-and-wait per packet; (c) comparison.
Formula: (a) \(F/R + d/s\). (b) per packet \(L/R + 2\,d/s\) (data out, ACK back), times 20.
Substitution: \(d/s = 2 \times 10^7 / 2.5 \times 10^8 = 0.08\) s. (a) \(F/R = 800{,}000 / 2 \times 10^6\). (b) \(L/R = 40{,}000 / 2 \times 10^6\).
Calculation: (a) \(0.4 + 0.08 = 0.48\) s. (b) \(L/R = 0.02\) s; per packet \(0.02 + 0.16 = 0.18\) s; \(20 \times 0.18 = 3.6\) s.
Answer: (a) 0.48 s. (b) 3.6 s. (c) Waiting for an acknowledgement after every packet wastes 0.16 s of round trip each time, so stop-and-wait is 7.5 times slower on a long link. This is exactly why TCP sends many packets before waiting (pipelining, Unit II).
:::
:::

:::ex From a paper | When does propagation equal transmission? {{paper:19CCE304 End 2024 Q1(A)}}
:::solve
Given: \(s = 2.5 \times 10^8\) m/s, \(L = 120\) bits, \(R = 56\) kbps.
Required: The distance \(m\) at which \(d_{\text{prop}} = d_{\text{trans}}\). Also, where is the first bit at \(t = d_{\text{trans}}\)?
Formula: \(m/s = L/R \Rightarrow m = s \cdot L/R\).
Substitution: \(L/R = 120 / 56{,}000\).
Calculation: \(L/R = 2.143 \times 10^{-3}\) s. \(m = 2.5 \times 10^8 \times 2.143 \times 10^{-3} = 535{,}714\) m.
Answer: About 536 km. At \(t = d_{\text{trans}}\) the last bit has just left host A. If \(d_{\text{prop}} > d_{\text{trans}}\), the first bit is still on the link, \(s \cdot d_{\text{trans}}\) metres from A. If \(d_{\text{prop}} < d_{\text{trans}}\), the first bit has already reached B.
:::
:::

:::exam Exam focus
- Name and define all four delays, with what each depends on. This appears as a definition question in many papers ({{paper:19CSE301 Jan 2023 Q1}}, {{paper:20CYS303 Mid 2023 Q1(e,f)}}).
- End-to-end delay over several links with different lengths: {{paper:23CSE302 End 2025 Q5}} gave exactly this and asked for analysis. Always show the percentage split.
- Message segmentation and \((N + P - 1) L/R\) appeared in four papers.
- Throughput = bottleneck link. Divide a shared link's rate by the number of flows.
- {{paper:20CYS303 End 2025 Q7}} asked how bandwidth, latency and throughput relate. Bandwidth is capacity, latency is delay, throughput is the achieved rate; high bandwidth doesn't guarantee high throughput if there is a bottleneck or loss, and doesn't reduce propagation latency.
:::

:::mistake Common mistakes
- Forgetting to convert bytes to bits (× 8). Then every transmission delay is 8 times too small.
- Mixing km and m in \(d/s\). Convert distance to metres when \(s\) is in m/s.
- Counting processing delay at the hosts. In these questions \(d_{\text{proc}}\) is added once per packet switch.
- Adding transmission delay once for the whole path. With store-and-forward each link adds its own \(L/R\).
- Writing throughput as the sum or the average of link rates. It is the **minimum**.
:::

:::rev Quick revision
- \(d_{\text{nodal}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}\); \(d_{\text{trans}} = L/R\); \(d_{\text{prop}} = d/s\).
- Traffic intensity \(La/R\); keep it ≤ 1; delay explodes near 1; loss when buffers fill.
- End-to-end, N identical links: \(N(d_{\text{proc}} + L/R + d/s)\). P packets: \((N + P - 1)L/R\) plus propagation.
- Throughput = \(\min(R_i)\); a link shared by \(k\) flows gives \(R/k\) each.
- Bits in flight = \(R \times d_{\text{prop}}\); width of a bit = \(s/R\).
:::

@@topic u1-layers | I.7 | Protocol layers and service models | Why the Internet's work is split into five layers, what each layer does, how a message is wrapped in headers on the way down (encapsulation), and how TCP/IP compares with OSI. | Kurose §1.5 · Chapter_1_v8.2 slides 62–72, 80–82

## Why organise protocols into layers?

The Internet is extremely complicated: many applications, protocols, end systems, packet switches and kinds of link. To make sense of it, designers organise protocols into **layers**. Each layer:

1. provides a **service** to the layer above it (its **service model**), by
2. performing certain actions within the layer, and
3. using the services of the layer directly below it.

:::analogy Air travel
Buying a ticket, checking baggage, going to the gate, take-off, flying the route, landing, leaving the gate, collecting baggage and complaining about the ticket. Each step is a layer: the baggage layer delivers bags from check-in to the carousel, using the gate layer, which uses the runway layer, which uses the aeroplane routing layer. A change at one layer (a new boarding procedure) doesn't affect the others. Networks are layered for the same reason.
:::

| Benefits of layering | Drawbacks of layering |
|---|---|
| **Modularity**: a complex system is broken into parts that can be designed and discussed separately | Layers may **duplicate** work (for example, error recovery both per link and end to end) |
| A layer's implementation can **change without affecting** the rest, as long as its service stays the same | A layer sometimes needs information that only another layer has (for example, a timestamp), which breaks the separation |
| Each layer has a clear job, so protocols are easier to standardise | Extra headers at every layer add overhead |

## The five-layer Internet protocol stack

Taken together, the protocols of the layers are called the **protocol stack**. The Internet's stack has five layers.

:::stack
Application | Supports network applications. Protocols: HTTP, SMTP, IMAP, DNS, FTP. A packet of information here is a **message**.
Transport | Carries application messages between the two end points (processes). Protocols: TCP (reliable, connection-oriented, flow and congestion control) and UDP (connectionless, no frills). Its packet is a **segment**.
Network | Moves datagrams from source host to destination host across routers. Protocols: IP (the one protocol every Internet device runs) and many routing protocols. Its packet is a **datagram**.
Link | Moves a frame from one node to the next node over a single link. Protocols: Ethernet, Wi-Fi (802.11), DOCSIS, PPP. Its packet is a **frame**.
Physical | Moves the individual **bits** of a frame from one node to the next over the actual medium (twisted pair, fibre, radio).
:::

- **Application layer**: an application protocol is distributed over many end systems, which exchange messages. DNS (translating names like www.amrita.edu into addresses) is also an application-layer protocol.
- **Transport layer**: TCP provides guaranteed delivery, flow control and congestion control; UDP provides none of these.
- **Network layer**: the transport layer hands it a segment and a destination address; it delivers the segment to the destination host's transport layer. It is often simply called the **IP layer**.
- **Link layer**: at each node, the network layer passes the datagram down to the link layer, which delivers it to the next node. A datagram may cross Ethernet on one link and Wi-Fi on the next.
- **Physical layer**: its protocols depend on both the link and the medium (Ethernet has different physical-layer protocols for twisted pair, coax and fibre).

## The OSI reference model

In the late 1970s the International Organisation for Standardisation (ISO) proposed a seven-layer model called **OSI** (Open Systems Interconnection). It adds two layers between application and transport:

- **Presentation layer**: lets communicating applications interpret the meaning of exchanged data: **data compression, data encryption and data description** (so applications needn't worry about how data is stored internally).
- **Session layer**: **delimiting and synchronisation** of data exchange, including checkpointing and recovery.

The Internet has no separate presentation or session layer; **if an application needs these services, the application developer builds them in**.

| OSI (7 layers) | TCP/IP Internet (5 layers) |
|---|---|
| Application | Application |
| Presentation | (part of the application) |
| Session | (part of the application) |
| Transport | Transport |
| Network | Network |
| Data link | Link |
| Physical | Physical |

| Feature | OSI model | TCP/IP model |
|---|---|---|
| Developed by | ISO, as a reference model before protocols | Grew from working protocols (ARPAnet) |
| Layers | 7 | 5 (often described as 4, merging link and physical) |
| Presentation and session | Separate layers | Done by applications |
| Use | Teaching and reference | The protocols actually running on the Internet |
| Transport | Connection-oriented and connectionless | TCP (connection-oriented) and UDP (connectionless) |

## Encapsulation: how headers are added and removed

Not every device implements every layer.

- **Hosts** implement all five layers.
- **Routers** implement layers 1 to 3 (physical, link, network).
- **Link-layer switches** implement layers 1 and 2 (physical, link). They don't understand IP addresses.

At each layer, a packet has two kinds of field: **header fields**, added by that layer, and a **payload**, which is the packet from the layer above.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 250" role="img" aria-label="Encapsulation as a message passes from a source host through a link-layer switch and a router to the destination host">
<defs><marker id="ahE" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="m-acc"/></marker></defs>
<text x="195" y="24" class="c-head" text-anchor="middle">Source host</text>
<text x="335" y="24" class="c-head" text-anchor="middle">Switch</text>
<text x="475" y="24" class="c-head" text-anchor="middle">Router</text>
<text x="615" y="24" class="c-head" text-anchor="middle">Destination</text>
<g class="c-text">
<rect x="150" y="36" width="90" height="24" class="g-box"/><text x="195" y="52" class="c-text" text-anchor="middle">application</text>
<rect x="150" y="62" width="90" height="24" class="g-box"/><text x="195" y="78" class="c-text" text-anchor="middle">transport</text>
<rect x="150" y="88" width="90" height="24" class="g-box"/><text x="195" y="104" class="c-text" text-anchor="middle">network</text>
<rect x="150" y="114" width="90" height="24" class="g-box"/><text x="195" y="130" class="c-text" text-anchor="middle">link</text>
<rect x="150" y="140" width="90" height="24" class="g-box"/><text x="195" y="156" class="c-text" text-anchor="middle">physical</text>
<rect x="290" y="114" width="90" height="24" class="g-host"/><text x="335" y="130" class="c-text" text-anchor="middle">link</text>
<rect x="290" y="140" width="90" height="24" class="g-host"/><text x="335" y="156" class="c-text" text-anchor="middle">physical</text>
<rect x="430" y="88" width="90" height="24" class="g-host"/><text x="475" y="104" class="c-text" text-anchor="middle">network</text>
<rect x="430" y="114" width="90" height="24" class="g-host"/><text x="475" y="130" class="c-text" text-anchor="middle">link</text>
<rect x="430" y="140" width="90" height="24" class="g-host"/><text x="475" y="156" class="c-text" text-anchor="middle">physical</text>
<rect x="570" y="36" width="90" height="24" class="g-box"/><text x="615" y="52" class="c-text" text-anchor="middle">application</text>
<rect x="570" y="62" width="90" height="24" class="g-box"/><text x="615" y="78" class="c-text" text-anchor="middle">transport</text>
<rect x="570" y="88" width="90" height="24" class="g-box"/><text x="615" y="104" class="c-text" text-anchor="middle">network</text>
<rect x="570" y="114" width="90" height="24" class="g-box"/><text x="615" y="130" class="c-text" text-anchor="middle">link</text>
<rect x="570" y="140" width="90" height="24" class="g-box"/><text x="615" y="156" class="c-text" text-anchor="middle">physical</text>
</g>
<text x="140" y="52" class="c-text" text-anchor="end">message  M</text>
<text x="140" y="78" class="c-text" text-anchor="end">segment  Ht M</text>
<text x="140" y="104" class="c-text" text-anchor="end">datagram  Hn Ht M</text>
<text x="140" y="130" class="c-text" text-anchor="end">frame  Hl Hn Ht M</text>
<text x="140" y="156" class="c-text" text-anchor="end">bits</text>
<line x1="240" y1="152" x2="290" y2="152" class="c-axis"/>
<line x1="380" y1="152" x2="430" y2="152" class="c-axis"/>
<line x1="520" y1="152" x2="570" y2="152" class="c-axis"/>
<line x1="232" y1="44" x2="232" y2="160" class="sq-ack" marker-end="url(#ahE)"/>
<line x1="298" y1="160" x2="298" y2="122" class="sq-ack" marker-end="url(#ahE)"/>
<line x1="372" y1="122" x2="372" y2="160" class="sq-ack" marker-end="url(#ahE)"/>
<line x1="438" y1="160" x2="438" y2="96" class="sq-ack" marker-end="url(#ahE)"/>
<line x1="512" y1="96" x2="512" y2="160" class="sq-ack" marker-end="url(#ahE)"/>
<line x1="578" y1="160" x2="578" y2="44" class="sq-ack" marker-end="url(#ahE)"/>
<text x="340" y="196" class="c-muted" text-anchor="middle">The switch reads only the link-layer header (Hl). The router reads up to the network header (Hn),</text>
<text x="340" y="212" class="c-muted" text-anchor="middle">writes a new link-layer header for the next link, and never looks at Ht or M.</text>
<text x="340" y="236" class="c-muted" text-anchor="middle">Ht = transport header, Hn = network header, Hl = link header</text>
</svg></div><figcaption>Encapsulation on the way down at the source; decapsulation on the way up at the destination. Each device processes only the layers it implements.</figcaption></figure>
:::

Step by step, for an application message \(M\):

:::flow
1. Application | Creates the message M and passes it to the transport layer.
2. Transport | Adds header Ht (for example port numbers, error-detection bits) → **segment** Ht M.
3. Network | Adds header Hn (source and destination IP addresses) → **datagram** Hn Ht M.
4. Link | Adds header Hl (source and destination MAC addresses) and a trailer → **frame** Hl Hn Ht M.
5. Physical | Sends the frame as bits on the medium.
:::

At the receiving side the process runs in reverse: each layer removes its own header, uses it, and passes the payload up. This is **decapsulation**. At each layer, the packet is like an envelope: a memo (the payload) inside an envelope with an address (the header), placed inside a larger envelope by the next department down.

| Layer | Data unit (PDU) | Address used | Device that works at this layer |
|---|---|---|---|
| Application | Message | Host name (e.g. www.amrita.edu) | Hosts |
| Transport | Segment | Port number (e.g. 80, 443) | Hosts |
| Network | Datagram | IP address (e.g. 172.17.4.25) | Routers, hosts |
| Link | Frame | MAC address (e.g. 1A:2F:BB:76:09:AD) | Switches, routers, hosts |
| Physical | Bits | None | Hubs, repeaters, cables |

:::ex From a paper | An email's journey down the stack {{paper:20CYS303 End 2025 Q3}}
The question asked you to describe an email as it passes through the transport, network and data link layers, naming the data at each layer, the layer's job and the addressing or control it adds.

:::solve
Given: An email (an SMTP message) handed down by the mail client.
Required: Name, function and added addressing at each of the three layers.
Formula: Encapsulation: each layer adds its header to the unit it receives.
Substitution: Transport: TCP, since SMTP needs reliability. Network: IP. Link: Ethernet or Wi-Fi on the first hop.
Calculation: Transport: the data becomes a **segment**; TCP adds source and destination **port numbers** (the client's ephemeral port and server port 25 or 587), sequence and acknowledgement numbers, and a checksum; it provides reliable, in-order, flow- and congestion-controlled delivery between processes. Network: the segment becomes a **datagram**; IP adds **source and destination IP addresses**, TTL and a protocol field (6 for TCP); it routes the datagram host to host across routers. Link: the datagram becomes a **frame**; Ethernet adds **source and destination MAC addresses** (the destination is the next hop, usually the default gateway router) and a CRC trailer for error detection; it delivers the frame across one link.
Answer: Segment (ports, reliability) → datagram (IP addresses, routing) → frame (MAC addresses, CRC, one hop). At every router the frame header is replaced; the datagram's IP addresses stay the same end to end (unless NAT rewrites them).
:::
:::

:::exam Exam focus
- Draw the five-layer stack with the PDU name at each layer. {{paper:19CSE301 Mid 2024 Q4}} asked for the TCP/IP stack from sender to receiver **through a router**, showing encapsulation and decapsulation and the packet name at each layer (5 marks). Draw the figure above with a router (3 layers).
- Explain why layering helps, and give one drawback.
- OSI's extra layers: presentation (compression, encryption, description) and session (synchronisation, checkpointing, recovery).
- Which devices implement which layers: router 1–3, switch 1–2, host 1–5.
- “Encapsulation” is a common one-line definition ({{paper:20CYS303 Mid 2023 Q1(i)}}).
:::

:::mistake Common mistakes
- Mixing up PDU names: message, **segment**, **datagram**, **frame**. (A UDP segment is sometimes called a datagram in older books; in Kurose, “datagram” is the network-layer unit.)
- Drawing a router with all five layers. Routers do not run TCP or applications for forwarded packets.
- Saying the Internet has a session layer. It doesn't; applications handle it.
:::

:::rev Quick revision
- A layer gives a service to the layer above, using the layer below.
- Internet stack: application (message), transport (segment), network (datagram), link (frame), physical (bits).
- OSI adds presentation and session.
- Encapsulation adds Ht, Hn, Hl on the way down; decapsulation removes them on the way up.
- Hosts 5 layers, routers 3, switches 2.
:::

@@topic u1-security | I.8 | Networks under attack, and a short history | The main ways attackers abuse the Internet (malware, botnets, denial of service, sniffing, spoofing), the lines of defence, and the milestones that produced today's Internet. Prescribed because Chapter 1 is in the syllabus in full. | Kurose §1.6–1.7 · Chapter_1_v8.2 slides 57–61, 73–79

## Why security belongs in Chapter 1

The Internet was designed for a group of mutually trusting users on a transparent network. That assumption no longer holds: the same openness that lets anyone build an application lets anyone attack one. Knowing the attacks tells you why later protocols include authentication, encryption and firewalls.

## Malware

**Malware** is malicious software that enters a host over the Internet. It can delete files, install spyware that collects passwords and keystrokes, or turn the host into part of a **botnet**: a network of thousands of compromised devices that an attacker controls, used for spam or for denial-of-service attacks.

- A **virus** needs some user interaction to infect a device, for example opening an email attachment that runs malicious code.
- A **worm** enters a device **without** any explicit user interaction, for example by exploiting a vulnerable network application that accepts the worm's packets.

Most malware is **self-replicating**: once it infects one host, it seeks out more hosts to infect, so it spreads exponentially.

## Denial-of-service (DoS) attacks

A **DoS** attack makes a network, host or other piece of infrastructure unusable by legitimate users. Three categories:

1. **Vulnerability attack**: send a few well-crafted messages to a vulnerable application or operating system, making the service stop or the host crash.
2. **Bandwidth flooding**: send a deluge of packets to the target so its access link becomes clogged and legitimate packets can't reach the server.
3. **Connection flooding**: open a large number of half-open or fully open TCP connections at the target, so it stops accepting legitimate connections.

A single attacking host can rarely flood a large server, because the attacker's own access link is too slow. In a **distributed DoS (DDoS)** attack the attacker controls a botnet of many sources that all send traffic at the target. DDoS attacks using botnets with thousands of hosts are common and much harder to detect and block, because the traffic comes from everywhere.

:::ex From a paper | Botnets and DDoS {{paper:19CCE304 End 2023 Q1(B)}}
:::solve
Given: The question asks how a botnet is created and how it is used for a DDoS attack.
Required: The steps of creation and of the attack.
Formula: Botnet = many compromised hosts under one controller.
Substitution: Creation: (1) the attacker finds a vulnerability (an unpatched service, a weak password, a phishing attachment); (2) malware exploits it and installs a bot program; (3) the bot contacts the attacker's command-and-control server and waits; (4) the bot scans for and infects other vulnerable hosts, so the botnet grows.
Calculation: Attack: the attacker sends one command to the command-and-control server; every bot then floods the victim with traffic (bandwidth flooding) or with connection requests (connection flooding). The combined traffic far exceeds the victim's access-link capacity.
Answer: A botnet is built by self-propagating malware that turns vulnerable hosts into remotely controlled bots; a DDoS attack instructs all bots to send traffic at one target simultaneously, so legitimate users can't get service and the attack is hard to filter because it has thousands of sources.
:::
:::

## Packet sniffing

A **packet sniffer** is a passive receiver that records a copy of every packet passing by. On broadcast media (Wi-Fi, a cable network, an old Ethernet hub), a sniffer near the sender can read every packet, including passwords and private messages. **Wireshark** (the tool in your lab) is a packet sniffer. Because a sniffer is passive (it never injects packets), it is very hard to detect. The best defence is **cryptography**: encrypt what you send.

## IP spoofing

Creating a packet with an arbitrary (false) source address and putting it on the Internet is surprisingly easy. Injecting packets with a false source address is called **IP spoofing**, one way a user can pretend to be another. The defence is **end-point authentication**: a way to be sure a message really comes from where we think it does.

## Lines of defence

| Defence | What it does |
|---|---|
| Authentication | Proves who you are (passwords, certificates) |
| Authorisation | Checks what you are allowed to do |
| Encryption (confidentiality) | Makes sniffed packets unreadable |
| Firewalls | Filter traffic entering or leaving a network by address, port and protocol |
| Intrusion detection systems | Inspect traffic deeply for known attack patterns and alert |

## A short history of the Internet

| Period | Milestones |
|---|---|
| 1961–1972: packet switching | Kleinrock's queuing theory showed packet switching suits bursty traffic; Baran (RAND) and Davies (NPL) developed packet switching independently. ARPAnet's first four nodes were connected in 1969; by 1972 it had 15 nodes and the first host-to-host protocol, NCP. The first email program was written in 1972. |
| 1972–1980: internetworking | ALOHAnet (a radio network in Hawaii), Ethernet (Metcalfe, 1976) and other networks appeared. Cerf and Kahn designed an architecture for interconnecting networks: TCP, later split into TCP and IP, plus UDP. |
| 1980–1990: proliferation | On 1 January 1983 every ARPAnet host switched to TCP/IP. DNS was defined to map host names to IP addresses. The FTP protocol was defined (1985). TCP congestion control (Jacobson, 1988). NSFNET linked universities. |
| 1990s: the Web and commercialisation | ARPAnet ended; NSFNET's restrictions on commercial use were lifted in 1991 and it was decommissioned in 1995, leaving the backbone to commercial ISPs. Tim Berners-Lee invented the World Wide Web (HTML, HTTP, a web server and a browser) at CERN in 1989–1991; Mosaic and Netscape browsers followed. |
| 2000s onward | Broadband home access, Wi-Fi, smartphones (2007), social networks, online video, cloud services and huge private networks run by Google and others, and 4G/5G cellular access. |

:::exam Exam focus
- Botnet + DDoS is a 4-mark explain question ({{paper:19CCE304 End 2023 Q1(B)}}).
- Know the three kinds of DoS attack, and the virus vs worm difference.
- Sniffing (passive, defended by encryption) vs spoofing (false source address, defended by authentication).
:::

:::rev Quick revision
- Malware: virus (needs user action), worm (no user action); botnets of compromised hosts.
- DoS: vulnerability attack, bandwidth flooding, connection flooding; DDoS uses many sources.
- Sniffing reads packets passively; spoofing fakes the source address.
- History: packet switching (1960s), ARPAnet (1969), TCP/IP (1983), DNS (1983), Web (1989–91), commercial Internet (1995).
:::

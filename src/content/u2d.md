@@topic u2-cc-principles | II.11 | Principles of congestion control | What congestion costs (huge delays, wasted retransmissions, wasted upstream work), shown with Kurose's three scenarios, and the two broad ways to control it. | Kurose §3.6 · Chapter_3_v8.2 slides 111–121

## What congestion is

Packet loss usually happens when **router buffers overflow** because the network is congested. Retransmission treats the **symptom** (lost packets) but not the **cause**: too many sources trying to send data at too high a rate. To treat the cause, senders must be **throttled** when the network is congested.

:::note Congestion control vs flow control (again)
Flow control: one sender must not overwhelm **one receiver**. Congestion control: **too many senders, sending too fast**, must not overwhelm **the network**.
:::

## The causes and costs of congestion: three scenarios

### Scenario 1: two senders, a router with infinite buffers

Hosts A and B each send at \(\lambda_{in}\) bytes/s through one router with an outgoing link of capacity \(R\) and an **unlimited** buffer. There is no loss and no retransmission.

- Per-connection throughput rises with \(\lambda_{in}\) up to \(R/2\), and can never exceed \(R/2\) (the two connections share the link).
- But as \(\lambda_{in}\) approaches \(R/2\), the average **queuing delay grows without bound**.

:::plot Scenario 1: delivered throughput levels off at R/2, while delay explodes as the sending rate approaches R/2 | Sending rate λin (as a fraction of R/2) | Normalised value
series Throughput (fraction of R/2): 0,0 0.25,0.25 0.5,0.5 0.75,0.75 1,1 1.2,1
func Delay (shape): 0.12*x/(1.02-x) ; 0 0.97
ymax 4
:::

**Cost 1: large queuing delays** are experienced as the packet-arrival rate nears the link capacity.

### Scenario 2: two senders, a router with finite buffers

Now the buffer is finite, so packets are dropped when it is full, and senders retransmit lost packets. Let \(\lambda_{in}\) be the rate the application sends original data, and \(\lambda'_{in}\) the **offered load**: original data **plus retransmissions**.

- If the sender somehow knew when the buffer had space and sent only then (no loss), throughput would equal \(\lambda'_{in}\) up to \(R/2\).
- If it retransmits only packets known to be lost, then at an offered load of \(R/2\), the rate of data actually delivered to the application (the **goodput**) is lower, say \(R/3\): a share of the transmitted data is retransmissions.
- If it also suffers **premature timeouts**, it retransmits packets that were only delayed. Each such packet may be forwarded twice, so with every packet forwarded twice, goodput approaches \(R/4\).

**Cost 2: the sender must retransmit** to compensate for packets dropped because of buffer overflow. **Cost 3: unneeded retransmissions** (after a large delay) make routers use their link bandwidth to forward unnecessary copies.

### Scenario 3: four senders, multihop paths

Four hosts each send over two-hop paths that overlap, so each router carries traffic that has already crossed another router. As the offered load grows very large, packets that crossed the first router are increasingly dropped at the second, where they compete with “fresh” traffic.

- At high load, end-to-end throughput **falls towards zero**.
- **Cost 4: when a packet is dropped along a path, the transmission capacity used at each upstream link to forward it to the drop point is wasted.**

| Scenario | Setup | Cost of congestion it shows |
|---|---|---|
| 1 | 2 senders, 1 router, infinite buffer | Large queuing delays as the rate approaches capacity |
| 2 | 2 senders, finite buffer, retransmissions | Retransmissions reduce goodput; unneeded retransmissions waste link capacity |
| 3 | 4 senders, multihop paths | Upstream capacity wasted on packets later dropped; throughput can collapse |

## Approaches to congestion control

:::two
#### End-to-end congestion control
The network layer gives **no explicit support**. End systems must **infer** congestion from what they observe: packet loss (a timeout or three duplicate ACKs) and rising delay. This is TCP's classic approach, because IP gives no congestion feedback. TCP decreases its window when it sees loss.
---
#### Network-assisted congestion control
Routers give **explicit feedback** to senders about congestion. The feedback can be a single bit (as in IBM SNA, DEC DECnet and ATM ABR), or an explicit rate the router can support. It can be sent directly as a **choke packet** from the router to the sender, or, more commonly, a router **marks** a field in a packet flowing to the receiver, and the receiver tells the sender. TCP/IP's **ECN** (explicit congestion notification) uses two bits in the IP header and the TCP ECE/CWR flags this way.
:::

:::exam Exam focus
- {{paper:19CCE304 End 2024 Q3(B)}}: explain congestion control with an example. Use scenario 2 or 3 and the costs.
- Know the four costs and the two approaches, with an example of each.
:::

:::rev Quick revision
- Congestion = too many senders too fast for the network; symptoms: loss, delay.
- Costs: queuing delay near capacity; retransmissions cut goodput; unneeded retransmissions waste capacity; dropped packets waste upstream capacity.
- End-to-end (TCP infers from loss/delay) vs network-assisted (routers mark or send choke packets; ECN, ATM ABR).
:::

@@topic u2-tcp-cc | II.12 | TCP congestion control | The congestion window, slow start, congestion avoidance, fast retransmit and fast recovery; TCP Tahoe vs TCP Reno; AIMD and its sawtooth; CUBIC; and every kind of cwnd question set in your papers. | Kurose §3.7–3.7.1 · Chapter_3_v8.2 slides 122–134 · Chapter3-Problems

## The approach

TCP uses **end-to-end** congestion control: each sender limits the rate at which it sends traffic as a function of the congestion it perceives. Three questions: how does a sender limit its rate, how does it perceive congestion, and what algorithm does it use to change the rate?

### How the sender limits its rate: the congestion window

Each side of a connection keeps a variable called the **congestion window, cwnd**. The amount of unacknowledged data at the sender may not exceed the minimum of cwnd and rwnd:

:::fx Sending constraint and approximate rate
\[ \text{LastByteSent} - \text{LastByteAcked} \le \min\{\text{cwnd},\ \text{rwnd}\} \]
Ignoring rwnd (large receive buffer), the sender sends about cwnd bytes per RTT:
\[ \text{rate} \approx \frac{\text{cwnd}}{\text{RTT}} \ \text{bytes/s} \]
:::

### How the sender perceives congestion

A **loss event** is either a **timeout** or the receipt of **three duplicate ACKs**. When there is excessive congestion, router buffers overflow and a datagram (containing a segment) is dropped, causing a loss event. When things are fine, acknowledgements arrive; TCP uses them to **increase** cwnd. Because ACKs pace the increase, TCP is said to be **self-clocking**: if ACKs arrive slowly (a congested path), cwnd grows slowly; if they arrive quickly, it grows quickly.

### The guiding principles

1. **A lost segment implies congestion**, so the sender's rate should be decreased when a segment is lost.
2. **An acknowledged segment indicates the network is delivering**, so the rate can be increased when an ACK for a previously unacknowledged segment arrives.
3. **Bandwidth probing**: TCP keeps increasing its rate on ACKs until a loss occurs, then backs off, then starts probing again to see whether the available rate has changed.

## The TCP congestion-control algorithm (RFC 5681)

It has three components: **slow start**, **congestion avoidance** and **fast recovery**. Slow start and congestion avoidance are mandatory; fast recovery is recommended.

!!sim visualizations/tcp/congestion.html | TCP congestion window simulator | Set the initial cwnd, ssthresh, the rounds where a timeout or triple duplicate ACK occurs, and Tahoe or Reno. The graph animates round by round with every phase coloured, and the table shows cwnd, ssthresh and the cumulative segments sent.

### Slow start

- When a connection begins, cwnd is typically **1 MSS**, so the initial rate is about MSS/RTT (for MSS = 500 bytes and RTT = 200 ms, only 20 kbps).
- In slow start, **cwnd increases by 1 MSS every time a transmitted segment is first acknowledged**. TCP sends 1 segment; when its ACK arrives, cwnd = 2, so it sends 2; when both ACKs arrive, cwnd = 4, and so on.
- So **cwnd doubles every RTT**: the rate starts slow but grows **exponentially**.

Slow start ends in one of three ways:

1. **A timeout**: set `ssthresh = cwnd / 2`, set `cwnd = 1 MSS`, and start slow start again. (`ssthresh` is the **slow-start threshold**.)
2. **cwnd reaches or passes ssthresh**: slow start ends and TCP moves to **congestion avoidance**, because continuing to double might be reckless near the point where congestion was last seen.
3. **Three duplicate ACKs**: TCP performs a **fast retransmit** and enters **fast recovery**.

### Congestion avoidance

Entering congestion avoidance, cwnd is about half its value when congestion was last encountered. Rather than doubling every RTT, TCP now increases **cwnd by just 1 MSS every RTT**: a **linear** increase. A common way to do this is to increase cwnd by \(\text{MSS} \cdot (\text{MSS}/\text{cwnd})\) bytes for each new ACK. (With 10 segments per window, each ACK adds 1/10 MSS, so after one RTT's worth of ACKs cwnd has grown by 1 MSS.)

Congestion avoidance's linear increase ends when:

- **a timeout** occurs: `ssthresh = cwnd / 2`, `cwnd = 1 MSS`, back to slow start (the same as in slow start);
- **three duplicate ACKs** arrive: the network is still delivering some segments, so TCP reacts less drastically: `ssthresh = cwnd / 2`, `cwnd = ssthresh + 3 MSS` (adding 3 MSS for the three duplicate ACKs), and it enters **fast recovery**.

### Fast recovery

In fast recovery, cwnd is **increased by 1 MSS for every duplicate ACK** received for the missing segment that caused TCP to enter this state. When an ACK finally arrives for the missing segment, TCP sets `cwnd = ssthresh` and enters congestion avoidance. If a timeout occurs instead, it does the same as in the other states: `ssthresh = cwnd / 2`, `cwnd = 1`, slow start.

### Summary of the algorithm

| State | Event | Action | Next state |
|---|---|---|---|
| Slow start | New ACK | cwnd += 1 MSS (doubles per RTT) | Slow start, or congestion avoidance if cwnd ≥ ssthresh |
| Slow start | 3 duplicate ACKs | Fast retransmit; ssthresh = cwnd/2; cwnd = ssthresh + 3 | Fast recovery |
| Congestion avoidance | New ACK | cwnd += MSS·(MSS/cwnd) (≈ +1 MSS per RTT) | Congestion avoidance |
| Congestion avoidance | 3 duplicate ACKs | Fast retransmit; ssthresh = cwnd/2; cwnd = ssthresh + 3 | Fast recovery |
| Fast recovery | Duplicate ACK | cwnd += 1 MSS | Fast recovery |
| Fast recovery | New ACK | cwnd = ssthresh | Congestion avoidance |
| Any state | Timeout | ssthresh = cwnd/2; cwnd = 1 MSS; retransmit | Slow start |

## TCP Tahoe versus TCP Reno

| | TCP Tahoe (early version) | TCP Reno (newer version) |
|---|---|---|
| On timeout | ssthresh = cwnd/2, cwnd = 1, slow start | Same |
| On 3 duplicate ACKs | **Treated like a timeout**: ssthresh = cwnd/2, cwnd = 1 MSS, slow start | **Fast recovery**: ssthresh = cwnd/2, cwnd = ssthresh + 3 (textbook graphs often simply show cwnd = ssthresh), then linear growth |
| Fast retransmit | Yes | Yes |
| Fast recovery | **No** | **Yes** |
| Effect | Every loss collapses the window to 1 | Isolated losses only halve the window |

:::plot Kurose's classic example (Problem P40 style): cwnd per transmission round for Reno (solid) and Tahoe (dashed). Initial ssthresh = 8 MSS; a triple duplicate ACK at the end of round 8 | Transmission round | cwnd (segments)
series Reno: 1,1 2,2 3,4 4,8 5,9 6,10 7,11 8,12 9,9 10,10 11,11 12,12 13,13 14,14 15,15
series Tahoe: 1,1 2,2 3,4 4,8 5,9 6,10 7,11 8,12 9,1 10,2 11,4 12,6 13,7 14,8 15,9
ymax 14
:::

In both cases ssthresh becomes 6 after the loss (half of 12). Reno continues linearly from 9 (= 6 + 3) in this plot; Tahoe restarts slow start from 1, doubling 1 → 2 → 4, is capped at ssthresh 6, then grows linearly.

## AIMD and the sawtooth

Ignoring the initial slow start, and assuming losses are signalled by triple duplicate ACKs, TCP's congestion control is **additive increase, multiplicative decrease (AIMD)**: cwnd grows by 1 MSS per RTT and is **halved** on each loss event. The result is the characteristic **sawtooth** pattern of cwnd over time. AIMD was shown (Jacobson, Chiu and Jain) to converge to an efficient and fair sharing of a bottleneck among competing connections.

### Average throughput of a long-lived TCP connection (Reno)

If \(W\) is the window size (in bytes) when a loss occurs, cwnd oscillates between \(W/2\) and \(W\) in a sawtooth, so on average it is \(0.75W\):

:::fx Macroscopic TCP throughput
\[ \text{average throughput} = \frac{0.75\,W}{\text{RTT}} \]
:::

For W = 20 segments of 1,500 bytes and RTT = 100 ms: \(0.75 \times 20 \times 1{,}500 \times 8 / 0.1 = 1.8\) Mbps.

## TCP CUBIC

AIMD's linear increase is cautious. If the bottleneck's state probably hasn't changed much since the last loss, it would be better to climb back quickly towards the rate at which loss occurred and then probe cautiously. **TCP CUBIC** (the default in Linux, widely deployed) does this. Let \(W_{max}\) be cwnd when the last loss was detected. CUBIC grows cwnd as a **cubic function of the time since the loss**: fast when cwnd is far below \(W_{max}\), slowly as it approaches \(W_{max}\), and then increasingly fast again beyond \(W_{max}\), to probe for a new operating point. Increases depend on time rather than on ACK arrivals, so CUBIC is fairer to connections with different RTTs, and it tends to keep the connection near \(W_{max}\) for longer.

## Worked numericals

:::ex From a paper | Tahoe: slow start to 16, then a loss at RTT 10 {{paper:23CSE302 End 2025 Q4}}
:::solve
Given: TCP Tahoe; initial cwnd = 1 MSS; ssthresh = 16 MSS; receiver window large; an ACK for every segment; constant RTT; triple duplicate ACK at the end of RTT 10.
Required: (a) the RTTs needed for cwnd to reach 16, and the packets sent in slow start; (b) cwnd at the start of each RTT up to RTT 14, segments sent and cumulative total; how Tahoe's recovery differs from Reno's.
Formula: Slow start doubles per RTT while cwnd < ssthresh; congestion avoidance adds 1 per RTT; Tahoe on any loss: ssthresh = ⌊cwnd/2⌋, cwnd = 1.
Substitution: Start: cwnd = 1, ssthresh = 16.
Calculation: (a) cwnd at the start of RTTs 1–5: 1, 2, 4, 8, 16. It takes **4 RTTs** of slow start to reach 16; packets sent in slow start = 1 + 2 + 4 + 8 = **15**. (b) From RTT 5 congestion avoidance: 16, 17, 18, 19, 20, 21 (RTT 10). Loss at the end of RTT 10 with cwnd = 21: ssthresh = ⌊21/2⌋ = 10, cwnd = 1. RTTs 11–14 (slow start): 1, 2, 4, 8.
Answer: (a) 4 RTTs; 15 packets. (b) See the table. Tahoe treats the triple duplicate ACK like a timeout and drops cwnd to 1, wasting several RTTs re-growing the window. Reno would perform fast recovery: ssthresh = 10 and cwnd = 10 + 3 = 13 (or 10 in simplified graphs), then grow linearly (13, 14, 15, …), keeping most of its throughput.
:::

| RTT | Phase | cwnd at start (= segments sent) | Cumulative segments |
|---|---|---|---|
| 1 | Slow start | 1 | 1 |
| 2 | Slow start | 2 | 3 |
| 3 | Slow start | 4 | 7 |
| 4 | Slow start | 8 | 15 |
| 5 | Congestion avoidance | 16 | 31 |
| 6 | Congestion avoidance | 17 | 48 |
| 7 | Congestion avoidance | 18 | 66 |
| 8 | Congestion avoidance | 19 | 85 |
| 9 | Congestion avoidance | 20 | 105 |
| !10 | Congestion avoidance (3 dup ACKs at the end) | 21 | 126 |
| 11 | Slow start (ssthresh = 10) | 1 | 127 |
| 12 | Slow start | 2 | 129 |
| 13 | Slow start | 4 | 133 |
| 14 | Slow start | 8 | 141 |
:::

:::ex From a paper | AIMD with a timeout in the fifth transmission {{paper:19CSE301 Jan 2023 Q13(a)}}
:::solve
Given: Window at the start of slow start = 2 MSS; threshold at the first transmission = 8 MSS; a timeout during the 5th transmission.
Required: cwnd at the end of the 10th transmission.
Formula: Slow start doubles (not beyond ssthresh); congestion avoidance +1; on timeout ssthresh = cwnd/2 and cwnd returns to the initial window (2 MSS here).
Substitution: Rounds 1–3: 2, 4, 8 (8 = threshold).
Calculation: Round 4: 9; round 5: 10 → timeout: ssthresh = 10/2 = 5, cwnd = 2. Round 6: 2; round 7: 4; round 8: min(8, 5) = 5 (reaches ssthresh); round 9: 6; round 10: 7.
Answer: **7 MSS** in the 10th transmission.
:::
:::

:::ex From a paper | A timeout during the fifth transmission round, ssthresh 8 {{paper:23CSE302 Mid 2025 Q4}}
:::solve
Given: cwnd starts at 1 MSS; ssthresh = 8 MSS; a timeout occurs during the 5th transmission (round).
Required: cwnd after the acknowledgements of the 9th transmission arrive.
Formula: As above, with cwnd returning to 1 MSS on timeout and ssthresh = ⌊cwnd/2⌋.
Substitution: Rounds 1–4: 1, 2, 4, 8 (reaches ssthresh 8).
Calculation: Round 5: 9 → timeout: ssthresh = ⌊9/2⌋ = 4, cwnd = 1. Round 6: 1; round 7: 2; round 8: 4 (= ssthresh, so congestion avoidance from here); round 9: 5. When all of round 9's ACKs arrive, cwnd increases by 1 MSS.
Answer: cwnd = **5 MSS** during the 9th transmission, and **6 MSS** once its acknowledgements have been received (the value the question asks for). State your interpretation: if you keep ssthresh = 4.5, round 8 is still slow start and the numbers shift slightly.
:::
:::

:::ex From a paper | Reading a Reno cwnd graph {{paper:19CSE301 End 2023 Q3(a)}} {{paper:19CSE301 Jan 2023 Q5}} {{paper:20CYS303 End 2023 Q13}}
These papers reproduce Kurose's Problem P40 graph: cwnd rises 1, 2, 4, 8, 16, 32 (rounds 1–6), then linearly to 42 (round 16), drops to 24 (round 17) and rises linearly to 29 (round 22), then drops to 1 (round 23) and rises 1, 2, 4, 8 (rounds 23–26).

:::plot Kurose P40: TCP Reno cwnd per transmission round | Transmission round | cwnd (segments)
series cwnd: 1,1 2,2 3,4 4,8 5,16 6,32 7,33 8,34 9,35 10,36 11,37 12,38 13,39 14,40 15,41 16,42 17,24 18,25 19,26 20,27 21,28 22,29 23,1 24,2 25,4 26,8
ymax 46
:::

:::solve
Given: The cwnd values above.
Required: (a) slow-start intervals; (b) congestion-avoidance intervals; (c) the loss after round 16; (d) the loss after round 22; (e) ssthresh values; (f) cwnd and ssthresh if a triple duplicate ACK is detected after round 26.
Formula: Exponential growth = slow start; linear = congestion avoidance; drop to about half = triple duplicate ACK; drop to 1 = timeout.
Substitution: Read the shape.
Calculation: (a) Rounds 1–6 and 23–26. (b) Rounds 6–16 and 17–22. (c) cwnd falls from 42 to 24 (= 21 + 3), not to 1, so it was a **triple duplicate ACK**. (d) cwnd falls to 1: a **timeout**. (e) Initial ssthresh = 32 (slow start stops at 32); after round 16, ssthresh = 42/2 = 21; after round 22, ssthresh = ⌊29/2⌋ = 14. (f) At round 26 cwnd = 8: ssthresh = 4, cwnd = 4 + 3 = 7 MSS.
Answer: SS 1–6, 23–26; CA 6–16, 17–22; round 16: triple duplicate ACK; round 22: timeout; ssthresh 32 → 21 → 14; after round 26: ssthresh = 4, cwnd = 7.
:::
:::

:::ex From a paper | Short Reno questions {{paper:20CYS303 End 2025 Q11}}
:::solve
Given: (a) cwnd = 1, ssthresh = 32, two RTTs fully acknowledged. (b) Reno, triple duplicate ACK at cwnd = 50 MSS. (c) The switch from slow start to congestion avoidance.
Required: (a) cwnd at the start of RTT 3; (b) the new ssthresh and the cwnd on entering fast recovery; (c) the condition and the principle.
Formula: Slow start doubles per RTT; Reno: ssthresh = cwnd/2, cwnd = ssthresh + 3.
Substitution: (a) 1 → 2 → 4. (b) 50/2.
Calculation: (a) 4 MSS. (b) ssthresh = 25 MSS; cwnd = 25 + 3 = 28 MSS. (c) When cwnd ≥ ssthresh.
Answer: (a) 4 MSS. (b) 25 MSS and 28 MSS. (c) TCP leaves slow start when cwnd reaches ssthresh: it has come back to half the window at which congestion was last seen, so it stops doubling and probes cautiously with additive increase (the AI of AIMD).
:::
:::

:::exam Exam focus
- TCP congestion control appears in **every end-semester paper**. Practise building the round-by-round table and reading graphs.
- Always write the three rules: timeout → ssthresh = cwnd/2, cwnd = 1; 3 dup ACKs → ssthresh = cwnd/2, cwnd = ssthresh + 3 (Reno) or 1 (Tahoe); cwnd ≥ ssthresh → linear growth.
- Explain Tahoe vs Reno ({{paper:20CYS303 End 2024 Q11}}).
- Throughput ≈ 0.75 W / RTT; rate ≈ cwnd / RTT.
:::

:::mistake Common mistakes
- Letting slow start overshoot ssthresh (8 → 16 when ssthresh is 10). Cap it at ssthresh.
- Resetting ssthresh to the **old** ssthresh/2 instead of the current cwnd/2.
- Treating Reno's triple duplicate ACK like a timeout (that's Tahoe).
- Confusing “transmission round” (one RTT, cwnd segments) with individual segments.
:::

:::rev Quick revision
- Sender limit: unACKed ≤ min(cwnd, rwnd); rate ≈ cwnd/RTT.
- Loss event = timeout or 3 duplicate ACKs. ACKs clock the growth.
- Slow start: cwnd = 1, +1 per ACK, doubles per RTT, until ssthresh.
- Congestion avoidance: +1 MSS per RTT.
- Timeout: ssthresh = cwnd/2, cwnd = 1. Triple dup ACK (Reno): ssthresh = cwnd/2, cwnd = ssthresh + 3, fast recovery. Tahoe: cwnd = 1.
- AIMD sawtooth; average throughput 0.75 W/RTT; CUBIC grows as a cubic of time since loss.
:::

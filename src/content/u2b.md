@@topic u2-rdt-principles | II.4 | Reliable data transfer: the problem and the toolkit | What “reliable” means, the interfaces a reliable protocol sits between, how finite-state machines describe a protocol, and the five tools every reliable protocol is built from. | Kurose §3.4 (intro) · Chapter_3_v8.2 slides 34–40

## The service and the problem

The service a reliable channel provides to the layer above is simple: **no transferred bit is corrupted (flipped) or lost, and all bits are delivered in the order they were sent.** This is exactly what TCP offers to Internet applications.

The difficulty is that the layer **below** the reliable protocol may be unreliable. TCP is a reliable protocol built on top of IP, an unreliable host-to-host service. More generally, the layer below might be a single unreliable physical link. The job of a **reliable data transfer (rdt) protocol** is to provide the reliable service on top of an unreliable channel.

:::graph The rdt protocol turns an unreliable channel into a reliable one for the layers above.
app1 120 40 box "Sending process"
rdts 120 120 box "rdt sender"
rdtr 520 120 box "rdt receiver"
app2 520 40 box "Receiving process"
app1>rdts
rdts>rdtr ~
rdtr>app2
text 230 85 rdt_send(data)
text 470 85 deliver_data(data)
text 320 110 udt_send(packet) → unreliable channel → rdt_rcv(packet)
:::

## The four interface calls

| Call | Where | Meaning |
|---|---|---|
| `rdt_send(data)` | Sending side, called from above | The application hands data to the rdt protocol to be delivered |
| `udt_send(packet)` | Sending side (and receiver, for feedback) | rdt hands a packet to the **unreliable** channel below |
| `rdt_rcv(packet)` | Receiving side, called from below | A packet has arrived from the channel |
| `deliver_data(data)` | Receiving side, upward | rdt delivers data to the application |

We study **unidirectional data transfer**: data flows from sender to receiver only. Control packets (ACKs, NAKs) flow both ways, which is why both sides call `udt_send()`.

## Finite-state machines (FSMs)

Each protocol version is described by two FSMs, one for the sender and one for the receiver.

- A **state** is drawn as a circle. In each state, the next state is uniquely determined by the next **event**.
- An arrow is a **transition** from one state to another, labelled **event / actions**: the event above a horizontal line causes the transition, and the actions below the line are taken when it happens.
- When no action is taken, the action is written **Λ** (lambda). When no event is needed, the event is Λ.
- A dashed arrow marks the **initial state**.

## The toolkit

Reliable protocols are built up step by step, in Topic II.5, by adding one mechanism for each new problem the channel causes:

| Problem in the channel | Mechanism that solves it | First appears in |
|---|---|---|
| Bits may be flipped | **Checksum** (error detection) | rdt2.0 |
| Sender doesn't know whether a packet arrived intact | **Receiver feedback**: positive (ACK) and negative (NAK) acknowledgements | rdt2.0 |
| A corrupted packet must be resent | **Retransmission** | rdt2.0 |
| A retransmission may be a duplicate | **Sequence numbers** | rdt2.1 |
| Packets (or ACKs) may be lost entirely | **Countdown timer** and timeout-driven retransmission | rdt3.0 |
| Waiting for each ACK wastes the link | **Pipelining** with a window of sequence numbers | GBN, SR (II.6) |

Protocols based on retransmission are called **ARQ (Automatic Repeat reQuest)** protocols. ARQ needs three capabilities: **error detection**, **receiver feedback** and **retransmission**.

:::exam Exam focus
- {{paper:20CYS303 End 2023 Q9}} and {{paper:20CYS303 End 2024 Q6}}: “What is RDT? Why is it required?” Answer: a protocol that gives a reliable channel (no corruption, no loss, in order) on top of an unreliable one, required because IP and physical links can corrupt and lose packets.
- Name the four interface calls and the FSM notation (event / action, Λ, dashed initial arrow).
:::

:::rev Quick revision
- Reliable service: no corruption, no loss, in-order delivery, built over an unreliable channel.
- Calls: rdt_send, udt_send, rdt_rcv, deliver_data.
- FSM: states, event/actions transitions, Λ.
- Toolkit: checksum, ACK/NAK, retransmission, sequence numbers, timer, pipelining. ARQ = detection + feedback + retransmission.
:::

@@topic u2-rdt | II.5 | RDT 1.0, 2.0, 2.1, 2.2 and 3.0 | Building a reliable protocol one problem at a time: a perfect channel, bit errors, garbled acknowledgements, removing NAKs, and finally packet loss with a timer. Ends with why stop-and-wait performs so badly. | Kurose §3.4.1 · Chapter_3_v8.2 slides 41–62 · Chapter3-Problems

!!sim visualizations/rdt/index.html | RDT simulator: all five versions | Pick a version and a scenario (corrupted packet, corrupted ACK, lost packet, lost ACK, premature timeout, duplicates) or set your own channel faults. Step forward and back through every event with the sender and receiver FSM states highlighted.

## rdt1.0: a perfectly reliable channel

Assume the channel below is completely reliable: no bit errors, no loss. Then the protocol is trivial.

| Side | State | Event | Actions | Next state |
|---|---|---|---|---|
| Sender | Wait for call from above | `rdt_send(data)` | `packet = make_pkt(data)`; `udt_send(packet)` | Same state |
| Receiver | Wait for call from below | `rdt_rcv(packet)` | `extract(packet, data)`; `deliver_data(data)` | Same state |

Each FSM has just **one state**. There is no need for the receiver to give feedback, because nothing can go wrong, and the receiver is assumed to be able to receive data as fast as the sender sends it.

## rdt2.0: a channel with bit errors

Now bits in a packet may be corrupted (as on real links and in router memory), but packets are still never lost and arrive in order.

:::analogy Dictating a long message
When you dictate a message over a noisy phone line, the listener says “OK” after each sentence heard correctly (a **positive acknowledgement**), and “Please repeat that” when a sentence is garbled (a **negative acknowledgement**). You then repeat that sentence.
:::

rdt2.0 adds the three ARQ capabilities:

1. **Error detection**: a checksum field in each packet (as in UDP), so the receiver can detect bit errors.
2. **Receiver feedback**: the receiver replies with an **ACK** (positive, 1 bit is enough) or a **NAK** (negative).
3. **Retransmission**: a packet received in error is retransmitted by the sender.

| Side | State | Event | Actions | Next state |
|---|---|---|---|---|
| Sender | Wait for call from above | `rdt_send(data)` | `sndpkt = make_pkt(data, checksum)`; `udt_send(sndpkt)` | Wait for ACK or NAK |
| Sender | Wait for ACK or NAK | `rdt_rcv(rcvpkt) && isNAK(rcvpkt)` | `udt_send(sndpkt)` (retransmit) | Wait for ACK or NAK |
| Sender | Wait for ACK or NAK | `rdt_rcv(rcvpkt) && isACK(rcvpkt)` | Λ | Wait for call from above |
| Receiver | Wait for call from below | `rdt_rcv(rcvpkt) && corrupt(rcvpkt)` | `sndpkt = make_pkt(NAK)`; `udt_send(sndpkt)` | Same |
| Receiver | Wait for call from below | `rdt_rcv(rcvpkt) && notcorrupt(rcvpkt)` | `extract`; `deliver_data(data)`; `sndpkt = make_pkt(ACK)`; `udt_send(sndpkt)` | Same |

The sender has **two states**; the receiver has **one**. While the sender waits for an ACK or NAK it **cannot** accept more data from the application. Because the sender sends one packet and then waits, rdt2.0 is a **stop-and-wait** protocol.

:::seq Sender | Receiver
1>2 pkt (data D1)
2: checksum OK: deliver D1
2>1 a ACK
1>2 ! pkt (data D2)
2: corrupt: send NAK
2>1 a NAK
1>2 pkt (data D2), retransmitted
2: OK: deliver D2
2>1 a ACK
:::

### rdt2.0's fatal flaw

rdt2.0 assumes the ACK or NAK itself always arrives intact. But ACK and NAK packets can be corrupted too. If the sender receives a garbled ACK/NAK, it **cannot tell** whether the receiver got the data correctly.

- Asking “what did you say?” leads to an endless loop of garbled questions.
- Adding enough checksum bits to **correct** errors works only for bit errors, not lost packets.
- **Simply resending the packet** when the feedback is garbled works, but introduces **duplicate packets**: the receiver can't tell whether an arriving packet is new data or a retransmission.

:::seq Sender | Receiver
1>2 pkt (D1)
2: OK: deliver D1
2>1 a! ACK
1: ACK garbled: resend to be safe
1>2 pkt (D1) again
2: looks like new data: deliver D1 again!
:::

**The fix is to number the packets**: put a **sequence number** in each data packet. The receiver then only needs to check the number to know whether a packet is a retransmission. For stop-and-wait, a **1-bit** sequence number (0 or 1) is enough.

## rdt2.1: handling garbled ACKs and NAKs

The sender now numbers packets 0, 1, 0, 1, …. The FSMs double in size, because each state must remember which sequence number is expected.

| Side | State | Event | Actions | Next state |
|---|---|---|---|---|
| Sender | Wait for call 0 from above | `rdt_send(data)` | `sndpkt = make_pkt(0, data, checksum)`; `udt_send(sndpkt)` | Wait for ACK or NAK 0 |
| Sender | Wait for ACK or NAK 0 | `rdt_rcv(rcvpkt) && (corrupt(rcvpkt) \|\| isNAK(rcvpkt))` | `udt_send(sndpkt)` | Same |
| Sender | Wait for ACK or NAK 0 | `rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt)` | Λ | Wait for call 1 from above |
| Sender | Wait for call 1 from above | `rdt_send(data)` | `sndpkt = make_pkt(1, data, checksum)`; `udt_send(sndpkt)` | Wait for ACK or NAK 1 |
| Sender | Wait for ACK or NAK 1 | corrupt or NAK | `udt_send(sndpkt)` | Same |
| Sender | Wait for ACK or NAK 1 | notcorrupt and ACK | Λ | Wait for call 0 from above |
| Receiver | Wait for 0 from below | `notcorrupt(rcvpkt) && has_seq0(rcvpkt)` | `extract`; `deliver_data`; send ACK (with checksum) | Wait for 1 from below |
| Receiver | Wait for 0 from below | `corrupt(rcvpkt)` | send NAK | Same |
| Receiver | Wait for 0 from below | `notcorrupt(rcvpkt) && has_seq1(rcvpkt)` (a duplicate) | send **ACK** (do not deliver) | Same |
| Receiver | Wait for 1 from below | (mirror image with 0 and 1 swapped) | | |

- **Sender**: 4 states. It must check whether the ACK/NAK is corrupted, and remember whether the current packet is 0 or 1.
- **Receiver**: 2 states. The state tells it which number it expects. On a duplicate (the wrong number, uncorrupted) it sends an **ACK** again, because the sender evidently missed the previous ACK. The receiver **cannot know** whether its last ACK/NAK was received correctly.

:::seq Sender | Receiver
1>2 pkt0 (D1)
2: OK: deliver D1, now expect 1
2>1 a! ACK
1: garbled: retransmit pkt0
1>2 pkt0 (D1)
2: seq 0 but expecting 1: duplicate, discard
2>1 a ACK
1>2 pkt1 (D2)
2: OK: deliver D2
:::

## rdt2.2: a NAK-free protocol

The same function can be achieved with ACKs only. Instead of a NAK, the receiver sends an **ACK for the last correctly received packet**, and the ACK must **include the sequence number** of the packet being acknowledged. A sender that receives **two ACKs for the same packet** (a **duplicate ACK**) knows the following packet was not received correctly, and retransmits it.

| Side | Change from rdt2.1 |
|---|---|
| Receiver | `make_pkt(ACK, 0, checksum)` / `make_pkt(ACK, 1, checksum)`: every ACK carries the sequence number it acknowledges. On a corrupt packet or a duplicate, it **resends the ACK for the last good packet** (this is what replaces NAK) |
| Sender | Checks `isACK(rcvpkt, 0)` or `isACK(rcvpkt, 1)`. In “Wait for ACK 0”, if the packet is corrupt **or** `isACK(rcvpkt, 1)` (the ACK for the previous packet), it retransmits |

:::seq Sender | Receiver
1>2 pkt0 (D1)
2: deliver D1
2>1 a ACK0
1>2 ! pkt1 (D2)
2: corrupt: re-ACK last good packet
2>1 a ACK0 (duplicate)
1: ACK0 while waiting for ACK1: retransmit pkt1
1>2 pkt1 (D2)
2: deliver D2
2>1 a ACK1
:::

TCP uses exactly this idea: it has no NAKs, and duplicate ACKs signal a missing segment (Topic II.9).

## rdt3.0: a channel with errors and loss

Now the channel can also **lose** packets (data or ACKs), as the Internet does when router buffers overflow. Two new questions: how do we **detect** loss, and what do we **do** about it? Checksums, sequence numbers, ACKs and retransmission already handle what to do. To detect loss, the sender uses a **timer**.

The sender waits “long enough” to be fairly sure a packet has been lost (at least one round trip plus processing time), and then **retransmits**. If a packet is merely delayed, not lost, the sender retransmits anyway, which creates a **duplicate data packet**; but rdt2.2's sequence numbers already handle duplicates.

The sender therefore needs a **countdown timer**: start it each time a packet (first time or retransmission) is sent, respond to a **timer interrupt** (timeout), and stop it when the right ACK arrives.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 400" role="img" aria-label="rdt3.0 sender finite-state machine with four states">
<defs><marker id="ahF" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="m-ink"/></marker></defs>
<ellipse cx="150" cy="100" rx="82" ry="32" class="g-node-hl"/><text x="150" y="96" class="c-head" text-anchor="middle">Wait for call 0</text><text x="150" y="111" class="c-head" text-anchor="middle">from above</text>
<ellipse cx="530" cy="100" rx="82" ry="32" class="g-node"/><text x="530" y="104" class="c-head" text-anchor="middle">Wait for ACK0</text>
<ellipse cx="530" cy="300" rx="82" ry="32" class="g-node"/><text x="530" y="296" class="c-head" text-anchor="middle">Wait for call 1</text><text x="530" y="311" class="c-head" text-anchor="middle">from above</text>
<ellipse cx="150" cy="300" rx="82" ry="32" class="g-node"/><text x="150" y="304" class="c-head" text-anchor="middle">Wait for ACK1</text>
<line x1="234" y1="100" x2="444" y2="100" class="sq-arr" marker-end="url(#ahF)"/>
<text x="340" y="90" class="c-text" text-anchor="middle">rdt_send(data)</text>
<line x1="258" y1="96" x2="422" y2="96" class="c-grid"/>
<text x="340" y="120" class="c-muted" text-anchor="middle">sndpkt = make_pkt(0, data, checksum)</text>
<text x="340" y="134" class="c-muted" text-anchor="middle">udt_send(sndpkt); start_timer</text>
<line x1="530" y1="134" x2="530" y2="264" class="sq-arr" marker-end="url(#ahF)"/>
<text x="520" y="172" class="c-text" text-anchor="end">rdt_rcv(rcvpkt) &amp;&amp; notcorrupt(rcvpkt)</text>
<text x="520" y="186" class="c-text" text-anchor="end">&amp;&amp; isACK(rcvpkt, 0)</text>
<text x="520" y="202" class="c-muted" text-anchor="end">stop_timer</text>
<line x1="446" y1="300" x2="236" y2="300" class="sq-arr" marker-end="url(#ahF)"/>
<text x="340" y="290" class="c-text" text-anchor="middle">rdt_send(data)</text>
<text x="340" y="320" class="c-muted" text-anchor="middle">sndpkt = make_pkt(1, data, checksum)</text>
<text x="340" y="334" class="c-muted" text-anchor="middle">udt_send(sndpkt); start_timer</text>
<line x1="150" y1="266" x2="150" y2="136" class="sq-arr" marker-end="url(#ahF)"/>
<text x="160" y="224" class="c-text" text-anchor="start">rdt_rcv(rcvpkt) &amp;&amp; notcorrupt(rcvpkt)</text>
<text x="160" y="238" class="c-text" text-anchor="start">&amp;&amp; isACK(rcvpkt, 1)</text>
<text x="160" y="254" class="c-muted" text-anchor="start">stop_timer</text>
<line x1="40" y1="40" x2="88" y2="76" class="g-dash" marker-end="url(#ahF)"/>
<text x="340" y="372" class="c-muted" text-anchor="middle">Self-loops (not drawn): in Wait for ACK0, timeout → udt_send(sndpkt), start_timer;</text>
<text x="340" y="388" class="c-muted" text-anchor="middle">corrupt or isACK(rcvpkt,1) → Λ. In Wait for call 0/1, rdt_rcv(rcvpkt) → Λ. Wait for ACK1 mirrors ACK0.</text>
</svg></div><figcaption>The rdt3.0 sender: the four main transitions. Every self-loop is listed in the table below.</figcaption></figure>
:::

| State | Event | Actions | Next state |
|---|---|---|---|
| Wait for call 0 from above | `rdt_send(data)` | `sndpkt = make_pkt(0, data, checksum)`; `udt_send(sndpkt)`; `start_timer` | Wait for ACK0 |
| Wait for call 0 from above | `rdt_rcv(rcvpkt)` (a stray or late ACK) | Λ | Same |
| Wait for ACK0 | `rdt_rcv(rcvpkt) && (corrupt(rcvpkt) \|\| isACK(rcvpkt, 1))` | Λ (just keep waiting for the timer) | Same |
| Wait for ACK0 | `timeout` | `udt_send(sndpkt)`; `start_timer` | Same |
| Wait for ACK0 | `rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt, 0)` | `stop_timer` | Wait for call 1 from above |
| Wait for call 1 / Wait for ACK1 | Mirror images with 0 and 1 swapped | | |

The **rdt3.0 receiver** is the same as the rdt2.2 receiver (ACKs with sequence numbers, re-ACK on duplicate or corruption). Notice that on a corrupt packet or wrong ACK, the rdt3.0 sender does **nothing** and lets the timer expire; it no longer retransmits on duplicate ACKs. Because sequence numbers alternate between 0 and 1, rdt3.0 is also called the **alternating-bit protocol**.

### rdt3.0 in action: the four cases

:::two
#### (a) No loss
:::seq Sender | Receiver
1>2 pkt0
2>1 a ACK0
1>2 pkt1
2>1 a ACK1
1>2 pkt0
2>1 a ACK0
:::
---
#### (b) Packet loss
:::seq Sender | Receiver
1>2 pkt0
2>1 a ACK0
1>2 x pkt1
1: timeout
1>2 pkt1 (resend)
2>1 a ACK1
:::
---
#### (c) ACK loss
:::seq Sender | Receiver
1>2 pkt0
2>1 a ACK0
1>2 pkt1
2>1 ax ACK1
1: timeout
1>2 pkt1 (resend)
2: duplicate: discard
2>1 a ACK1
:::
---
#### (d) Premature timeout
:::seq Sender | Receiver
1>2 pkt0
2>1 a ACK0
1>2 pkt1
2>1 a ACK1 (delayed)
1: timeout: resend pkt1
1>2 pkt1
2: duplicate: re-ACK
2>1 a ACK1
1: 2nd ACK1: ignore
:::
:::

1. **No loss**: every packet is acknowledged before the timer expires.
2. **Packet loss**: pkt1 never arrives, no ACK comes back, the timer expires and the sender retransmits pkt1.
3. **ACK loss**: pkt1 arrives and is delivered, but ACK1 is lost. The timer expires, pkt1 is resent, and the receiver recognises it as a **duplicate** (it expects 0 now), discards it and sends ACK1 again.
4. **Premature timeout**: ACK1 is only delayed, so the timer expires before it arrives. The sender resends pkt1; the receiver discards the duplicate and ACKs again. When the second ACK1 arrives the sender, now waiting for ACK0, **ignores** it.

!!sim visualizations/rdt/index.html#v=3.0&s=acklost | RDT 3.0: ACK lost | The exact scenario above, step by step: pkt0 sent and received, ACK lost, timeout, retransmission, the receiver spotting the duplicate, and the correct ACK returned.

### Comparison of the five versions

| Version | Channel assumption | New mechanism | Sender states | Receiver states | Feedback |
|---|---|---|---|---|---|
| rdt1.0 | Perfectly reliable | None | 1 | 1 | None |
| rdt2.0 | Bit errors | Checksum, ACK/NAK, retransmission | 2 | 1 | ACK, NAK |
| rdt2.1 | Bit errors, incl. in ACK/NAK | Sequence numbers 0/1 | 4 | 2 | ACK, NAK |
| rdt2.2 | Same as 2.1 | ACKs carry sequence numbers; duplicate ACK replaces NAK | 4 | 2 | ACK only |
| rdt3.0 | Bit errors **and loss** | Countdown timer | 4 | 2 | ACK only |

## Performance of stop-and-wait

rdt3.0 is correct, but its performance is very poor because it is stop-and-wait.

Consider two hosts on opposite coasts of the USA with \(\text{RTT} = 30\) ms, connected by a channel of rate \(R = 1\) Gbps, sending packets of \(L = 1{,}000\) bytes (8,000 bits).

:::solve
Given: \(R = 10^9\) bps, \(L = 8{,}000\) bits, RTT = 30 ms.
Required: The fraction of time the sender is busy (utilisation) and the effective throughput.
Formula: \( d_{trans} = L/R \); \( U_{sender} = \dfrac{L/R}{\text{RTT} + L/R} \); throughput \(= L / (\text{RTT} + L/R)\).
Substitution: \( L/R = 8{,}000 / 10^9 \).
Calculation: \( L/R = 8\ \mu\text{s} = 0.008 \) ms. \( U = 0.008 / 30.008 = 0.00027 \). Throughput \( = 8{,}000 \text{ bits} / 30.008 \text{ ms} \approx 267 \) kbps.
Answer: The sender is busy only 2.7 hundredths of 1% of the time. On a 1 Gbps link it achieves about 267 kbps, a striking example of a protocol limiting the hardware.
:::

:::fx Stop-and-wait utilisation
\[ U_{sender} = \frac{L/R}{\text{RTT} + L/R} \]
:::

The fix is to let the sender send several packets without waiting for acknowledgements: **pipelining** (Topic II.6).

## Answers to past-paper questions on RDT

:::ex From a paper | Why checksums, sequence numbers and a timer {{paper:20CYS303 End 2025 Q12}}
:::solve
Given: rdt3.0 uses checksums, 1-bit sequence numbers and a countdown timer.
Required: (a) Why checksums alone were not enough in rdt2.0. (b) A scenario where sequence numbers are essential. (c) Why rdt3.0 needs a timer, and why the timer forces sequence numbers even if only data packets could be lost.
Formula: Match each problem to its mechanism (Topic II.4 table).
Substitution: Use the timelines above.
Calculation: (a) A checksum only **detects** corruption; the receiver must also **tell** the sender (ACK/NAK) and the sender must **retransmit**. Even then, rdt2.0 breaks if the ACK/NAK itself is corrupted. (b) The rdt2.0 “fatal flaw” timeline: ACK garbled → sender resends pkt → receiver, with no numbers, delivers the same data twice. (c) Without a timer, a lost packet or ACK leaves the sender waiting forever. With a timer, a packet that is merely **delayed** causes a premature timeout and a retransmission, so the receiver can get two copies even when nothing is lost; it can only tell them apart by sequence number.
Answer: Checksums detect errors but need feedback and retransmission; feedback can be garbled, so retransmissions can create duplicates, which only sequence numbers expose; loss requires a timer, and timers (premature timeouts) create duplicates too, so sequence numbers remain essential.
:::
:::

:::tip From a paper {{paper:19CCE304 Jan 2023 Q3(A)}}
If the round-trip delay is constant and known to the sender, is a timer still needed in rdt3.0? **Yes.** The sender still has to detect that “one RTT has passed without an ACK”, and that requires measuring time. Knowing the RTT exactly just means the timer can be set precisely, so there will be **no premature timeouts**: when it expires, the packet or its ACK really was lost.
:::

:::ex From a paper | A receiver that sends only duplicate ACKs {{paper:23CSE302 Mid 2025 Q8(a)}}
In a stop-and-wait protocol the receiver is an attacker that sends duplicate ACKs for every packet, so the sender keeps timing out and retransmitting.

:::solve
Given: Every ACK received is a duplicate (for the previous sequence number); timeouts and retransmissions repeat forever.
Required: An idea to protect the server (at most 3 lines) and the changes to the sender's FSM.
Formula: Bound the number of retransmissions of one packet.
Substitution: Add a counter variable `retx` and a limit `MAX_RETX`.
Calculation: Sender FSM changes: in “Wait for call 0/1”, on `rdt_send(data)` set `retx = 0`. In “Wait for ACK 0/1”, on `timeout`: `retx = retx + 1`; if `retx ≤ MAX_RETX` then `udt_send(sndpkt)`; `start_timer`; else `stop_timer`, close the connection and report the peer (move to a new “Closed / blocked” state). Optionally also count duplicate ACKs and treat more than a threshold as an attack.
Answer: Limit retransmissions per packet (and the rate of duplicate ACKs accepted from one peer); after the limit, abort the session and block the misbehaving receiver. FSM: a retransmission counter reset on each new packet, incremented on each timeout, and a new transition to a terminating state when it exceeds the limit.
:::
:::

:::exam Exam focus
- RDT FSMs appeared in 7 papers. Practise drawing: rdt2.0 sender ({{paper:19CSE301 End 2023 Q3(b)(i)}}), rdt3.0 sender and receiver ({{paper:20CYS303 End 2023 Q9}}, {{paper:20CYS303 End 2024 Q6}}), and the differences among rdt2.0, 2.1 and 2.2 with both FSMs ({{paper:20CYS303 Mid 2023 Q6}}).
- Always state each version's channel assumption, and draw the four rdt3.0 cases.
- Stop-and-wait utilisation formula and the 0.00027 example.
:::

:::mistake Common mistakes
- Giving rdt2.0 sequence numbers. It has none; that's its flaw.
- Saying the rdt3.0 sender retransmits on a duplicate ACK. It ignores it and waits for the timeout.
- Forgetting `start_timer` after a retransmission, or `stop_timer` on the correct ACK.
- Writing the receiver's duplicate handling as “discard silently”. It must **re-send the ACK**.
:::

:::rev Quick revision
- 1.0: reliable channel, 1 state each. 2.0: checksum + ACK/NAK + retransmit; stop-and-wait; flaw with garbled ACKs.
- 2.1: 0/1 sequence numbers; sender 4 states, receiver 2; duplicates re-ACKed.
- 2.2: no NAK; ACK carries the sequence number; duplicate ACK = NAK.
- 3.0: + countdown timer for loss; alternating-bit protocol; four cases: no loss, packet loss, ACK loss, premature timeout.
- \(U = (L/R)/(\text{RTT} + L/R)\); 1 Gbps, 1 KB, 30 ms gives 0.00027.
:::

@@topic u2-pipelining | II.6 | Pipelined protocols: Go-Back-N and Selective Repeat | Sending a window of packets before waiting: how pipelining multiplies utilisation, how GBN recovers with cumulative ACKs and one timer, how SR recovers with individual ACKs and buffering, and the window-size limit. | Kurose §3.4.2–3.4.4 · Chapter_3_v8.2 slides 63–76, 148–149

## Pipelining

Instead of stop-and-wait, the sender sends **multiple packets without waiting for acknowledgements**. Because the many in-transit packets can be visualised as filling a pipeline, this is called **pipelining**.

If the sender sends 3 packets before waiting, utilisation triples:

:::fx Utilisation with a window of N packets (as long as N L/R < RTT + L/R)
\[ U_{sender} = \frac{N \cdot L/R}{\text{RTT} + L/R} \]
With N = 3 in the example of II.5: \( U = 0.024 / 30.008 = 0.00081 \).
:::

Pipelining has consequences:

- The **range of sequence numbers** must increase: each in-transit packet needs a unique number.
- The sender and receiver may need to **buffer** more than one packet: the sender buffers packets sent but not yet acknowledged; the receiver may buffer packets received correctly but out of order.
- How lost, corrupted and delayed packets are handled depends on the approach: **Go-Back-N** or **Selective Repeat**.

If the sequence-number field has \(k\) bits, the sequence numbers run from \(0\) to \(2^k - 1\), with arithmetic modulo \(2^k\).

!!sim visualizations/tcp/sliding-window.html | Go-Back-N vs Selective Repeat | Choose GBN or SR, the window size, the number of packets and which packets or ACKs are lost. Watch the sender and receiver windows slide, the timers, and every retransmission.

## Go-Back-N (GBN)

The sender may have at most **N** unacknowledged packets in the pipeline. N is the **window size**, and GBN is a **sliding-window protocol**.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 120" role="img" aria-label="Go-Back-N sender's view of sequence numbers">
<g>
<rect x="20" y="30" width="30" height="30" class="g-host"/><rect x="50" y="30" width="30" height="30" class="g-host"/><rect x="80" y="30" width="30" height="30" class="g-host"/><rect x="110" y="30" width="30" height="30" class="g-host"/>
<rect x="140" y="30" width="30" height="30" class="g-box"/><rect x="170" y="30" width="30" height="30" class="g-box"/><rect x="200" y="30" width="30" height="30" class="g-box"/><rect x="230" y="30" width="30" height="30" class="g-box"/><rect x="260" y="30" width="30" height="30" class="g-box"/>
<rect x="290" y="30" width="30" height="30" class="g-node"/><rect x="320" y="30" width="30" height="30" class="g-node"/><rect x="350" y="30" width="30" height="30" class="g-node"/><rect x="380" y="30" width="30" height="30" class="g-node"/><rect x="410" y="30" width="30" height="30" class="g-node"/><rect x="440" y="30" width="30" height="30" class="g-node"/>
<rect x="470" y="30" width="30" height="30" class="c-grid" fill="none"/><rect x="500" y="30" width="30" height="30" class="c-grid" fill="none"/><rect x="530" y="30" width="30" height="30" class="c-grid" fill="none"/><rect x="560" y="30" width="30" height="30" class="c-grid" fill="none"/>
</g>
<rect x="138" y="24" width="334" height="42" fill="none" class="sq-ack"/>
<text x="140" y="18" class="c-text">base</text><text x="290" y="18" class="c-text">nextseqnum</text>
<text x="305" y="82" class="c-muted" text-anchor="middle">window size N</text>
<text x="20" y="100" class="c-muted">ochre: already ACKed · blue: sent, not yet ACKed · white: usable, not yet sent · grey: not usable</text>
</svg></div><figcaption>The GBN sender's sequence-number space. The window of N slides forward as packets are acknowledged.</figcaption></figure>
:::

- `base` = sequence number of the oldest unacknowledged packet; `nextseqnum` = smallest unused sequence number.
- Numbers in \([0, \text{base} - 1]\) are already acknowledged; \([\text{base}, \text{nextseqnum} - 1]\) are sent but not acknowledged; \([\text{nextseqnum}, \text{base} + N - 1]\) can be used immediately if data arrives from above; numbers \(\ge \text{base} + N\) can't be used until the window slides.

### The GBN sender responds to three events

1. **Invocation from above**: if the window isn't full, create and send a packet and update variables; if it is full, refuse the data (or buffer it).
2. **Receipt of an ACK**: an ACK for packet \(n\) is a **cumulative acknowledgement**: all packets with numbers up to and including \(n\) have been received correctly. The base moves to \(n + 1\).
3. **A timeout event**: GBN uses a **single timer**, for the oldest transmitted but unacknowledged packet. On timeout, the sender **resends all packets that have been sent but not acknowledged**. On an ACK, if packets are still outstanding, the timer restarts; if none are, it stops.

### The GBN receiver is simple

- If packet \(n\) arrives correctly **and in order** (the last packet delivered was \(n - 1\)), the receiver sends an ACK for \(n\) and delivers the data.
- In **every other case**, it **discards** the packet and resends an ACK for the most recently received in-order packet.
- The receiver keeps only one variable, `expectedseqnum`, and **buffers nothing**. Discarding a correctly received out-of-order packet seems wasteful, but it would be retransmitted anyway, and it keeps the receiver simple.

:::seq Sender | Receiver
1>2 pkt0
1>2 pkt1 [+14]
1>2 x pkt2 [+14]
1>2 pkt3 [+14]
2>1 a ACK0
2>1 a ACK1 [+14]
2: pkt3 out of order: discard, re-ACK1
2>1 a ACK1 [+14]
1>2 pkt4 [+14]
1>2 pkt5 [+14]
2: discard pkt4, pkt5; ACK1, ACK1
1: pkt2 timeout: resend 2, 3, 4, 5
1>2 pkt2
1>2 pkt3 [+14]
1>2 pkt4 [+14]
1>2 pkt5 [+14]
2>1 a ACK2
2>1 a ACK3 [+14]
:::

## Selective Repeat (SR)

GBN can perform badly: when the window and the bandwidth-delay product are both large, **a single packet error can cause GBN to retransmit a large number of packets**, many unnecessarily. Selective Repeat avoids this by having the sender **retransmit only those packets it suspects were lost or corrupted**.

- The receiver **individually acknowledges** every correctly received packet, whether or not it is in order.
- Out-of-order packets are **buffered** until the missing packets arrive; then a batch of in-order packets is delivered to the layer above.
- The sender keeps a window of size N, but packets inside it may already be individually acknowledged. **Each packet has its own logical timer**; on a timeout, only that packet is resent.

| SR sender event | Action |
|---|---|
| Data from above | If the next sequence number is within the window, packetise and send; otherwise buffer or refuse |
| Timeout of packet n | Resend packet n only; restart its timer |
| ACK received for n in [send_base, send_base + N − 1] | Mark n as received. If n = send_base, move the base forward to the smallest unacknowledged number, and send any untransmitted packets that now fall inside the window |

| SR receiver event | Action |
|---|---|
| Packet n in [rcv_base, rcv_base + N − 1] arrives correctly | Send ACK(n). If it wasn't received before, buffer it. If n = rcv_base, deliver it and all consecutive buffered packets, and move rcv_base forward |
| Packet n in [rcv_base − N, rcv_base − 1] arrives | Send ACK(n) **again**, even though it was already acknowledged (the earlier ACK may have been lost, so the sender's window can't move) |
| Otherwise | Ignore |

:::seq Sender | Receiver
1>2 pkt0
1>2 pkt1 [+14]
1>2 x pkt2 [+14]
1>2 pkt3 [+14]
2>1 a ACK0
2>1 a ACK1 [+14]
2: pkt3: buffer, ACK3
2>1 a ACK3 [+14]
1>2 pkt4 [+14]
1>2 pkt5 [+14]
2: buffer 4, 5; ACK4, ACK5
1: pkt2 timeout: resend pkt2 only
1>2 pkt2
2: deliver 2, 3, 4, 5; ACK2
2>1 a ACK2
:::

### The SR dilemma: why the window must be small enough

With 4 sequence numbers (0–3) and a window of 3, the receiver **cannot tell** these two situations apart: (a) all three ACKs were lost, and the sender is retransmitting the old packet 0; (b) all three ACKs arrived, the sender sent new packets 3, 0, 1, and the new packet 3 was lost, so a new packet 0 arrives. In both, a packet numbered 0 arrives while the receiver's window is {3, 0, 1}; in (a) it would wrongly accept a duplicate as new data.

:::fx Window-size limits with k-bit sequence numbers
\[ \text{GBN: } N \le 2^k - 1 \qquad \text{SR: } N \le 2^{k-1} \;(\text{half the sequence space}) \]
:::

## GBN versus SR (and stop-and-wait)

| Feature | Stop-and-wait (rdt3.0) | Go-Back-N | Selective Repeat |
|---|---|---|---|
| Packets in flight | 1 | Up to N | Up to N |
| Acknowledgements | Per packet | **Cumulative** | **Individual** |
| Timers | 1 | 1 (oldest unACKed) | One per packet |
| On loss, resend | That packet | **All** unACKed packets from the lost one onward | **Only** the lost packet |
| Receiver buffers out-of-order? | — | **No**, discards | **Yes** |
| Receiver window | 1 | 1 | N |
| Max window (k-bit seq) | 1 | \(2^k - 1\) | \(2^{k-1}\) |
| Complexity | Lowest | Simple receiver | Complex sender and receiver |
| Bandwidth use under errors | Poor | Wastes bandwidth on retransmits | Efficient |

## Worked numericals

:::ex From a paper | Go-back-3, every 6th transmission lost {{paper:19CSE301 Jan 2023 Q12(b)}}
:::solve
Given: Go-Back-N with N = 3; 11 packets to deliver; every 6th transmission is lost (transmissions 6, 12, 18, …); ACKs are not lost.
Required: The number of transmissions needed, with the complete flow.
Formula: Simulate: send while the window has room; a loss makes the receiver discard everything after it until the timeout resends the window.
Substitution: Number transmissions t1, t2, ….
Calculation: t1–t3: packets 1, 2, 3. ACKs slide the window: t4 = 4, t5 = 5, t6 = 6 (**lost**), t7 = 7, t8 = 8 (both discarded, receiver re-ACKs 5). Timeout for 6 → t9 = 6, t10 = 7, t11 = 8 (all arrive). Window slides: t12 = 9 (**lost**), t13 = 10, t14 = 11 (discarded). Timeout for 9 → t15 = 9, t16 = 10, t17 = 11 (all arrive). Done.
Answer: **17 transmissions** for 11 packets.
:::
:::

:::ex From a paper | Frames 4 and 7 lost, window 5 {{paper:19CSE301 End 2024 Q2}}
Ten frames (1–10) are sent with window size 5; frames 4 and 7 are lost on their first transmission only.

:::solve
Given: N = 5; frames 1–10; first transmissions of 4 and 7 lost.
Required: The sequence of transmissions and ACKs for GBN and for SR, and the total transmissions.
Formula: GBN resends the whole outstanding window on timeout; SR resends only the lost frame.
Substitution: Initial window 1–5.
Calculation: **GBN**: send 1–5; 4 lost; ACK1, ACK2, ACK3 arrive; 5 is discarded (ACK3 again). The window slides to 4–8, so 6, 7, 8 are sent; 7 is lost, and 6 and 8 are discarded (ACK3, ACK3). Timeout for 4: resend 4, 5, 6, 7, 8, which arrive (ACK4…ACK8). Window 9–13: send 9, 10; ACK9, ACK10. Total = 5 + 3 + 5 + 2 = **15**. **SR**: send 1–5; 4 lost; ACK1, 2, 3, 5 (5 buffered). Window slides to 4–8: send 6, 7, 8; 7 lost; ACK6, ACK8 (buffered). Timeout for 4: resend 4 → receiver delivers 4, 5, 6; ACK4; sender's base moves to 7, window 7–11: send 9, 10 (buffered, ACKed). Timeout for 7: resend 7 → deliver 7, 8, 9, 10; ACK7. Total = 5 + 3 + 1 + 2 + 1 = **12**.
Answer: GBN needs 15 transmissions, SR needs 12. SR resent only the two lost frames.
:::
:::

:::ex From a paper | GBN sender with a stop-and-wait receiver {{paper:23CSE302 Mid 2025 Q8(b)}}
:::solve
Given: Sender uses GBN with window 4 and 3-bit sequence numbers (0–7); receiver uses stop-and-wait; 6 packets.
Required: Is the combination valid (are all packets accepted and consumed)? Justify with a timeline.
Formula: A GBN receiver has a receive window of 1: it accepts only the next in-order packet and ACKs it.
Substitution: A stop-and-wait receiver also accepts only the next expected packet and acknowledges it, re-ACKing anything else.
Calculation: Sender sends 0, 1, 2, 3. Receiver (expecting 0) accepts 0 → ACK0; then 1 → ACK1; 2 → ACK2; 3 → ACK3. Each ACK slides the sender's window, which sends 4, 5; the receiver accepts them in order → ACK4, ACK5. If a packet were lost, the receiver would discard the following ones and re-ACK the last good packet; the GBN sender's timeout would resend from the lost one, which the receiver then accepts.
Answer: **Yes, valid**, provided the receiver tracks the expected number in the same 3-bit space (mod 8): a stop-and-wait receiver behaves exactly like a GBN receiver (window 1, in-order only, cumulative-style ACK of the last good packet), so all 6 packets are accepted and consumed in order. It would **not** work with a strict 1-bit (alternating 0/1) receiver, which would misread sequence number 2 onwards.
:::
:::

:::ex From a paper | An SR receiver's window and rwnd {{paper:20CYS303 End 2025 Q8}}
:::solve
Given: SR receiver window N = 5, rcv_base = 10; packets 11, 12, 13 arrive correctly and are buffered; 10 is lost and later retransmitted; advertised rwnd = 5 segments; buffer capacity 20 segments.
Required: (a) how the window and buffer evolve; (b) the window before and after 10 arrives; (c) when data is delivered; (d) the new rwnd.
Formula: SR receiver rules (above).
Substitution: Window [10, 14].
Calculation: (a) 11, 12, 13 each arrive inside [10, 14]: each is ACKed individually and buffered; rcv_base stays at 10 because 10 is missing. Free slots in the window: 10 and 14. (b) Before: window [10 … 14] with 11–13 buffered. When 10 arrives, it is ACKed, and 10, 11, 12, 13 are delivered; rcv_base jumps to 14; window [14 … 18]. (c) Nothing is delivered to the application until 10 arrives; then 10–13 are delivered together, in order. (d) After delivery the buffer slots are freed, so the whole window [14 … 18] is free again.
Answer: New rwnd = **5** segments (it had effectively shrunk to 2 free slots while 11–13 were held waiting for 10).
:::
:::

:::exam Exam focus
- GBN/SR timelines appeared in 7 papers ({{paper:19CSE301 Mid 2023 Q7}}, {{paper:20CYS303 Mid 2023 Q7}}, {{paper:19CCE304 End 2023 Q4}} and those above). Practise drawing windows, cumulative vs individual ACKs, and timeouts.
- Window-size limits: GBN \(2^k - 1\), SR \(2^{k-1}\), and the SR dilemma.
- \(U = N(L/R)/(\text{RTT} + L/R)\).
:::

:::mistake Common mistakes
- In GBN, making the receiver buffer out-of-order packets. It discards them.
- In SR, making the sender resend the whole window. It resends only the packet whose timer expired.
- Forgetting that the GBN receiver re-ACKs the **last in-order** packet when it discards.
- Using \(2^k\) as the GBN window limit (it is \(2^k - 1\)).
:::

:::rev Quick revision
- Pipelining: N packets in flight; \(U = N L/R / (\text{RTT} + L/R)\).
- GBN: window N, cumulative ACK, one timer, resend all unACKed on timeout, receiver discards out-of-order.
- SR: individual ACKs, per-packet timers, receiver buffers, resend only the lost packet; re-ACK old packets.
- Windows: GBN ≤ \(2^k - 1\); SR ≤ \(2^{k-1}\).
:::

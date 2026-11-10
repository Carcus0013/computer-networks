@@topic u2-tcp | II.7 | TCP: the connection, the segment, sequence and acknowledgement numbers | What a TCP connection is, every field of the TCP segment, and how byte-stream sequence numbers and cumulative acknowledgement numbers work, with the numericals examiners set on them. | Kurose §3.5.1–3.5.2 · Chapter_3_v8.2 slides 77–85 · Chapter3-Problems

## The TCP connection

TCP is **connection-oriented**: before one process can send data to another, the two must first “handshake”, sending preliminary segments to each other to set up the parameters of the transfer. Both sides then initialise many **TCP state variables**.

- The connection is **logical**: its state lives entirely in the two end systems. Routers in between are unaware of it; they see only datagrams.
- It is **full-duplex**: data can flow from A to B and from B to A at the same time.
- It is **point-to-point**: between exactly one sender and one receiver. Multicasting (one sender to many receivers) is not possible with TCP.

The client sends a special segment, the server replies with a special segment, and the client replies with a third. The first two carry no application data; the third may. Because three segments are exchanged, this is the **three-way handshake** (Topic II.10).

Once the connection is set up, the client process passes a stream of data through its socket. TCP directs the data to the connection's **send buffer**, and from time to time takes chunks from it and passes them to the network layer. The maximum amount of application-layer data in a segment is the **MSS (maximum segment size)**. The MSS is set by first finding the largest link-layer frame the local host can send (the **MTU**, maximum transmission unit), so that one TCP segment plus the TCP/IP headers (typically 40 bytes) fits in one frame. Ethernet's MTU is 1,500 bytes, so a typical MSS is **1,460 bytes**. MSS counts only application data, not headers.

At the other end, each segment's data goes into the connection's **receive buffer**, from which the application reads the stream.

## The TCP segment

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 300" role="img" aria-label="TCP segment structure, 32 bits wide">
<text x="340" y="14" class="c-muted" text-anchor="middle">32 bits</text>
<rect x="100" y="22" width="240" height="28" class="g-box"/><text x="220" y="41" class="c-text" text-anchor="middle">source port # (16)</text>
<rect x="340" y="22" width="240" height="28" class="g-box"/><text x="460" y="41" class="c-text" text-anchor="middle">dest port # (16)</text>
<rect x="100" y="50" width="480" height="28" class="g-host"/><text x="340" y="69" class="c-text" text-anchor="middle">sequence number (32)</text>
<rect x="100" y="78" width="480" height="28" class="g-host"/><text x="340" y="97" class="c-text" text-anchor="middle">acknowledgement number (32)</text>
<rect x="100" y="106" width="60" height="28" class="g-box"/><text x="130" y="125" class="c-text" text-anchor="middle">hdr len</text>
<rect x="160" y="106" width="40" height="28" class="g-box"/><text x="180" y="125" class="c-text" text-anchor="middle">unused</text>
<rect x="200" y="106" width="140" height="28" class="g-box"/><text x="270" y="125" class="c-text" text-anchor="middle">C E U A P R S F</text>
<rect x="340" y="106" width="240" height="28" class="g-box"/><text x="460" y="125" class="c-text" text-anchor="middle">receive window (16)</text>
<rect x="100" y="134" width="240" height="28" class="g-box"/><text x="220" y="153" class="c-text" text-anchor="middle">checksum (16)</text>
<rect x="340" y="134" width="240" height="28" class="g-box"/><text x="460" y="153" class="c-text" text-anchor="middle">urgent data pointer (16)</text>
<rect x="100" y="162" width="480" height="28" class="g-node"/><text x="340" y="181" class="c-text" text-anchor="middle">options (variable length)</text>
<rect x="100" y="190" width="480" height="50" class="g-node"/><text x="340" y="219" class="c-text" text-anchor="middle">application data (variable length)</text>
<text x="340" y="262" class="c-muted" text-anchor="middle">Flags: CWR, ECE (congestion notification), URG, ACK, PSH, RST, SYN, FIN</text>
<text x="340" y="280" class="c-muted" text-anchor="middle">Header without options = 20 bytes</text>
</svg></div><figcaption>The TCP segment: a header of at least 20 bytes followed by the data.</figcaption></figure>
:::

| Field | Size | Purpose |
|---|---|---|
| Source and destination port numbers | 16 bits each | Multiplexing and demultiplexing, as in UDP |
| Sequence number | 32 bits | Byte-stream number of the first data byte in the segment |
| Acknowledgement number | 32 bits | Sequence number of the next byte the sender of this segment expects |
| Header length | 4 bits | Length of the TCP header in 32-bit words (variable because of options; normally 5 words = 20 bytes) |
| Flags | 6 (+2) bits | **ACK**: the acknowledgement field is valid. **RST, SYN, FIN**: connection setup and teardown. **CWR, ECE**: explicit congestion notification. **PSH**: pass data to the upper layer immediately. **URG**: urgent data present |
| Receive window | 16 bits | Flow control: the number of bytes the receiver is willing to accept |
| Checksum | 16 bits | Error detection, computed like UDP's |
| Urgent data pointer | 16 bits | Location of the last byte of urgent data (rarely used) |
| Options | Variable | MSS negotiation, window scaling for high-speed links, timestamps |

## Sequence numbers and acknowledgement numbers

These two fields are the heart of TCP's reliable service.

TCP views data as an **unstructured, but ordered, stream of bytes**. TCP's sequence numbers count **bytes**, not segments. **The sequence number for a segment is the byte-stream number of the first byte in the segment.**

:::ex Worked example | Numbering a file (Kurose)
:::solve
Given: Host A sends a 500,000-byte file to Host B; MSS = 1,000 bytes; the first byte of the stream is numbered 0.
Required: The number of segments and their sequence numbers.
Formula: Segments \( = \lceil 500{,}000 / 1{,}000 \rceil \); segment \(i\) starts at byte \( 1{,}000(i-1) \).
Substitution: 500 segments.
Calculation: Segment 1 → sequence number 0 (bytes 0–999); segment 2 → 1,000 (bytes 1,000–1,999); segment 3 → 2,000; … segment 500 → 499,000.
Answer: 500 segments with sequence numbers 0, 1000, 2000, …, 499000.
:::
:::

**The acknowledgement number that Host A puts in its segment is the sequence number of the next byte Host A is expecting from Host B.**

- If A has received all bytes numbered 0 to 535 from B, and is about to send a segment to B, it puts **536** in the acknowledgement field.
- If A has received bytes 0–535 and 900–1,000, but not 536–899, it still puts **536**: it is still waiting for byte 536. Because TCP acknowledges bytes only up to the first missing byte, it provides **cumulative acknowledgements**.
- What does the receiver do with the out-of-order bytes 900–1,000? The TCP standards leave it to the implementer. In practice receivers **keep them** and wait for the missing bytes.
- In practice both sides choose a **random initial sequence number**, so a segment from an older connection that is still in the network is not mistaken for a valid segment of a new connection between the same ports.

### Telnet: piggybacked acknowledgements

In Telnet (remote login), each character the user types is sent to the server, which echoes it back. Suppose the client's starting sequence number is 42 and the server's is 79, and the user types the single letter “C”.

:::seq Host A (client) | Host B (server)
1>2 Seq=42, ACK=79, data='C'
2: B receives 'C', echoes it
2>1 a Seq=79, ACK=43, data='C'
1: A displays 'C'
1>2 Seq=43, ACK=80
:::

1. A sends seq 42 (first byte it sends), ack 79 (the first byte it expects from B), data “C”.
2. B acknowledges with ack 43 (it has received byte 42) and echoes “C” with its own seq 79. The acknowledgement for A's data is carried **in** a data segment from B to A: it is **piggybacked**.
3. A acknowledges B's echo with ack 80; this segment carries no data but still has a sequence number (43), as every segment must.

!!sim visualizations/tcp/connection.html | TCP connection simulator | Three-way handshake with real initial sequence numbers, data transfer with sequence and ACK numbers on every segment, the sliding send window and receive window (flow control), and the four-segment close.

## Worked numericals

:::ex From a paper | Two back-to-back segments {{paper:19CCE304 End 2023 Q3}}
Host B has received all bytes up through byte 126 from Host A. A then sends two segments back to back with 80 and 40 bytes of data; the first has sequence number 127, source port 302 and destination port 80. B acknowledges every segment it receives.

:::solve
Given: Next expected byte at B = 127. Segment 1: seq 127, 80 bytes (bytes 127–206). Segment 2: 40 bytes.
Required: (A) the second segment's sequence number and ports; (B) the ACK for the first segment: ack number and ports.
Formula: Next seq = previous seq + previous length. ACK number = next byte expected. Replies swap ports.
Substitution: \(127 + 80\).
Calculation: Segment 2: seq = 207, source port 302, destination port 80. After segment 1 arrives, B expects byte 207.
Answer: (A) Seq 207, source port 302, destination port 80. (B) ACK number 207, source port 80, destination port 302. (If the second segment arrived first, B's ACK would carry 127: it still expects byte 127.)
:::
:::

:::ex Level 2 | A window of five segments, some lost (Chapter3-Problems)
:::solve
Given: Initial sequence number 61; the first five segments have sequence numbers 61, 841, 1621, 2401, 3181; segments 2, 3 and 4 are lost.
Required: The segment size, and the ACK numbers the receiver sends.
Formula: Segment size = difference between consecutive sequence numbers. ACK = next byte expected.
Substitution: \(841 - 61\).
Calculation: Each segment carries 780 bytes. Segment 1 arrives → ACK 841. Segments 2–4 never arrive (no ACK). Segment 5 (seq 3181) arrives out of order → the receiver still expects 841 → ACK 841 (a duplicate).
Answer: 780-byte segments; ACKs: 841, x, x, x, 841.
:::
:::

:::ex From a paper | When do TCP sequence numbers run out? {{paper:19CCE304 Jan 2023 Q3(B)}}
:::solve
Given: The sequence-number field has 4 bytes (32 bits); MSS = 536 bytes; 66 bytes of transport, network and link headers per segment; a 155 Mbps link; no flow or congestion control.
Required: (a) the largest file size L that doesn't exhaust the sequence numbers; (b) the time to send it.
Formula: (a) \(L_{max} = 2^{32}\) bytes. (b) Segments \(= \lceil L / 536 \rceil\); total bytes \(= L + 66 \times \text{segments}\); time \(= 8 \times \text{total} / R\).
Substitution: \(2^{32} = 4{,}294{,}967{,}296\) bytes; \(4{,}294{,}967{,}296 / 536 = 8{,}012{,}998.7\).
Calculation: Segments = 8,012,999. Header bytes \(= 66 \times 8{,}012{,}999 = 528{,}857{,}934\). Total \(= 4{,}294{,}967{,}296 + 528{,}857{,}934 = 4{,}823{,}825{,}230\) bytes \(= 38{,}590{,}601{,}840\) bits. Time \(= 38{,}590{,}601{,}840 / (155 \times 10^6) = 249\) s.
Answer: (a) About 4.29 GB (\(2^{32}\) bytes). (b) About 249 seconds.
:::
:::

:::exam Exam focus
- Know every header field and its size, and that the minimum header is 20 bytes (UDP: 8).
- Sequence number = first byte's number; ACK number = next byte expected; cumulative.
- Piggybacking (Telnet example).
- Seq/ACK numericals: add the segment lengths; ACK the first missing byte.
:::

:::mistake Common mistakes
- Numbering segments 0, 1, 2 instead of by bytes.
- Setting the ACK number to the last byte received instead of the **next** byte expected.
- Thinking a pure ACK segment has no sequence number. Every segment has one.
:::

:::rev Quick revision
- TCP: connection-oriented, full-duplex, point-to-point, state only in end systems; send and receive buffers; MSS ≈ 1,460 bytes.
- Header ≥ 20 bytes: ports, 32-bit seq and ack, header length, flags (ACK, RST, SYN, FIN, PSH, URG, CWR, ECE), receive window, checksum, urgent pointer, options.
- Seq = byte number of the first data byte; ACK = next expected byte (cumulative); random initial sequence numbers.
:::

@@topic u2-rtt | II.8 | RTT estimation and the timeout interval | How TCP measures round-trip times, smooths them with an exponentially weighted moving average, measures their variability, and sets the retransmission timeout, including why premature timeouts happen. | Kurose §3.5.3 · Chapter_3_v8.2 slides 86–88 · Chapter3-Problems

## Why the timeout must be chosen carefully

TCP recovers from loss with a timeout-and-retransmit mechanism. The timeout must be **longer than the connection's RTT** (the time from sending a segment until it is acknowledged), or there will be unnecessary retransmissions. But how much longer? If it is far too long, TCP reacts slowly to a lost segment. And the RTT itself varies with router queues and the load on the end systems.

| Timeout too short | Timeout too long |
|---|---|
| **Premature timeout**: the ACK was on its way, but the sender retransmits anyway | Slow reaction to a real loss: the connection sits idle |
| Wasted bandwidth on duplicate segments | Lower throughput |

## Measuring SampleRTT

The **SampleRTT** of a segment is the time from when it is sent (passed to IP) until its acknowledgement is received. Most TCP implementations take **one SampleRTT measurement at a time** rather than one per segment: at any moment, SampleRTT is being measured for only one transmitted but currently unacknowledged segment, giving a new value about once per RTT.

**TCP never computes a SampleRTT for a segment that has been retransmitted**, only for segments sent once. (If an ACK arrives for a retransmitted segment, there is no way to tell whether it acknowledges the first or the second transmission.)

## EstimatedRTT: an exponentially weighted moving average

SampleRTT values fluctuate from segment to segment, so a single sample is atypical. TCP keeps an average:

:::fx Estimated RTT (α = 0.125 is recommended, RFC 6298)
\[ \text{EstimatedRTT} = (1 - \alpha)\cdot \text{EstimatedRTT} + \alpha \cdot \text{SampleRTT} \]
With \(\alpha = 1/8\): \( \text{EstimatedRTT} = 0.875 \cdot \text{EstimatedRTT} + 0.125 \cdot \text{SampleRTT} \).
:::

This is an **exponential weighted moving average (EWMA)**: the weight given to a past sample decays exponentially as new samples arrive, so recent samples count more, reflecting the current congestion more closely.

## DevRTT: how much the RTT varies

:::fx Deviation of the RTT (β = 0.25 is recommended)
\[ \text{DevRTT} = (1 - \beta)\cdot \text{DevRTT} + \beta \cdot \lvert \text{SampleRTT} - \text{EstimatedRTT} \rvert \]
:::

DevRTT is an EWMA of how far SampleRTT strays from EstimatedRTT. If samples vary little, DevRTT is small; if they vary a lot, DevRTT is large.

## The timeout interval

The timeout should be at least EstimatedRTT, plus a safety margin that is large when the RTT varies a lot and small when it is steady:

:::fx Retransmission timeout
\[ \text{TimeoutInterval} = \text{EstimatedRTT} + 4 \cdot \text{DevRTT} \]
- An **initial** TimeoutInterval of **1 second** is recommended.
- When a **timeout occurs**, TimeoutInterval is **doubled** (to avoid a premature timeout for the next segment, which is likely to be acknowledged soon).
- As soon as a segment is received and EstimatedRTT is updated, TimeoutInterval is computed again from the formula.
:::

!!sim visualizations/tcp/rtt.html | RTT and timeout visualizer | Watch segments and ACKs measure SampleRTT, then type your own samples: the table and chart recompute EstimatedRTT, DevRTT and TimeoutInterval, show where a premature timeout would happen, and let you switch between the textbook and RFC update orders.

## Why premature timeouts happen

Suppose the RTT has been steady at 100 ms, so EstimatedRTT ≈ 100 ms and DevRTT is small (say 2 ms): the timeout is about 108 ms. Now a router queue suddenly grows and the next ACK takes 150 ms. The timer expires at 108 ms, **before** the ACK arrives: a premature timeout. TCP resends a segment that wasn't lost. The large SampleRTT will raise DevRTT (and EstimatedRTT a little), widening the margin for the next segment, and the doubling rule widens it immediately after a timeout. This is exactly why the margin uses **DevRTT**: a steady RTT allows a tight timeout; a jumpy RTT needs a loose one.

## Worked numericals

:::ex From a paper | Five samples {{paper:19CCE304 Mid 2023 Q6}} {{paper:19CSE301 End 2024 Q3(a)}}
:::solve
Given: SampleRTTs 106, 120, 140, 90, 115 ms; EstimatedRTT = 100 ms and DevRTT = 5 ms before the first sample; \(\alpha = 0.125\), \(\beta = 0.25\).
Required: EstimatedRTT, DevRTT and TimeoutInterval after each sample.
Formula: \(E \leftarrow 0.875E + 0.125S\); then \(D \leftarrow 0.75D + 0.25\lvert S - E\rvert\) (using the new E, as in Kurose's solutions); \(T = E + 4D\).
Substitution: Sample 1: \(E = 0.875(100) + 0.125(106)\).
Calculation:
  S₁ = 106: E = 87.5 + 13.25 = 100.75; D = 0.75(5) + 0.25(5.25) = 3.75 + 1.3125 = 5.06; T = 100.75 + 20.25 = 121.00.
  S₂ = 120: E = 0.875(100.75) + 15 = 88.16 + 15 = 103.16; D = 0.75(5.06) + 0.25(16.84) = 3.80 + 4.21 = 8.01; T = 103.16 + 32.03 = 135.19.
  S₃ = 140: E = 0.875(103.16) + 17.5 = 107.76; D = 0.75(8.01) + 0.25(32.24) = 6.01 + 8.06 = 14.07; T = 107.76 + 56.26 = 164.02.
  S₄ = 90: E = 0.875(107.76) + 11.25 = 105.54; D = 0.75(14.07) + 0.25(15.54) = 10.55 + 3.89 = 14.43; T = 105.54 + 57.74 = 163.28.
  S₅ = 115: E = 0.875(105.54) + 14.375 = 106.72; D = 0.75(14.43) + 0.25(8.28) = 10.83 + 2.07 = 12.89; T = 106.72 + 51.58 = 158.30.
Answer: See the table. (Values carried at full precision and rounded to 2 decimals; rounding at every step can change the last digit.)
:::

| # | SampleRTT (ms) | EstimatedRTT (ms) | DevRTT (ms) | TimeoutInterval (ms) |
|---|---|---|---|---|
| 1 | 106 | 100.75 | 5.06 | 121.00 |
| 2 | 120 | 103.16 | 8.01 | 135.19 |
| 3 | 140 | 107.76 | 14.07 | 164.02 |
| 4 | 90 | 105.54 | 14.43 | 163.28 |
| 5 | 115 | 106.72 | 12.89 | 158.30 |
:::

:::note A contradiction between your materials, and how to handle it
Your uploaded `Chapter3-Problems.docx` solves its RTT problem (EstimatedRTT 390 ms, DevRTT 21 ms, samples 250, 200, 360 ms) by computing DevRTT with the **old** EstimatedRTT, which is the order in RFC 6298 (the standard implementations follow it). Kurose's own worked solutions, like the five-sample table above, update EstimatedRTT **first** and use the new value in DevRTT. Both follow the same formulas; only the order differs, and the results differ slightly. In the exam, state which order you use and apply it consistently. The RFC-order answer for the uploaded problem:

| # | SampleRTT | DevRTT (old E) | EstimatedRTT | TimeoutInterval |
|---|---|---|---|---|
| 1 | 250 | 0.75(21) + 0.25(140) = 50.75 | 372.50 | 575.50 |
| 2 | 200 | 0.75(50.75) + 0.25(172.5) = 81.19 | 350.94 | 675.69 |
| 3 | 360 | 0.75(81.19) + 0.25(9.06) = 63.16 | 352.07 | 604.70 |
:::

:::ex Practice | Timeout doubling
:::solve
Given: TimeoutInterval = 160 ms. The segment sent at t = 0 is lost; so is its first retransmission.
Required: When are the retransmissions sent?
Formula: After each timeout, TimeoutInterval doubles (until a fresh ACK recomputes it).
Substitution: 160 → 320 → 640 ms.
Calculation: First timeout at 160 ms → retransmit, timer 320 ms. Second timeout at 160 + 320 = 480 ms → retransmit, timer 640 ms.
Answer: Retransmissions at 160 ms and 480 ms; the next timer is 640 ms. This exponential backoff is a mild form of congestion control.
:::
:::

:::exam Exam focus
- The five-sample RTT table appeared in two papers with the same numbers. Learn the layout and the three formulas.
- State α = 0.125 and β = 0.25, the initial timeout of 1 s, and doubling on timeout.
- Explain why SampleRTT is not measured for retransmitted segments, and what a premature timeout is.
:::

:::mistake Common mistakes
- Swapping the weights: the **old** EstimatedRTT gets 0.875 and the new sample 0.125.
- Using \( (S - E) \) without the absolute value in DevRTT.
- Writing \(E + 4\beta\) or \(E + 4S\). The margin is \(4 \times \text{DevRTT}\).
:::

:::rev Quick revision
- SampleRTT: one at a time, never for retransmitted segments.
- \(E = 0.875E + 0.125S\); \(D = 0.75D + 0.25\lvert S - E\rvert\); \(T = E + 4D\).
- Initial timeout 1 s; double on each timeout; recompute on a fresh ACK.
- Premature timeout: the timer fires before a delayed ACK arrives.
:::

@@topic u2-tcp-rdt | II.9 | TCP reliable data transfer, fast retransmit and flow control | How one retransmission timer, cumulative ACKs and the receiver's ACK rules make TCP reliable; how three duplicate ACKs trigger fast retransmit; and how the receive window stops a fast sender from overflowing a slow receiver. | Kurose §3.5.4–3.5.5 · Chapter_3_v8.2 slides 89–100

## TCP's reliable data transfer service

TCP creates a reliable service on top of IP's unreliable one: the data stream a process reads from its receive buffer is **uncorrupted, without gaps, without duplication and in sequence**. Kurose's simplified TCP sender uses **only one retransmission timer**, even when several segments are outstanding (managing one timer per segment is expensive), and it reacts to three events.

| Event at the sender | Actions |
|---|---|
| **Data received from the application** | Create a segment with sequence number `NextSeqNum`; pass it to IP; if the timer isn't running, start it (the timer belongs to the oldest unacknowledged segment); `NextSeqNum += length(data)` |
| **Timer timeout** | Retransmit the **not-yet-acknowledged segment with the smallest sequence number**; restart the timer |
| **ACK received with ACK field value y** | If `y > SendBase`: `SendBase = y` (cumulative: all bytes before y are acknowledged); if there are still unacknowledged segments, restart the timer. Otherwise it is a duplicate ACK (see fast retransmit) |

## Three retransmission scenarios

:::two
#### A lost ACK
:::seq Host A | Host B
1>2 Seq=92, 8 bytes
2>1 ax ACK=100
1: timeout
1>2 Seq=92, 8 bytes (resend)
2: duplicate: discard, ACK
2>1 a ACK=100
:::
---
#### A premature timeout
:::seq Host A | Host B
1>2 Seq=92, 8 bytes
1>2 Seq=100, 20 bytes [+14]
2>1 a ACK=100
2>1 a ACK=120 [+14]
1: timeout for 92: resend
1>2 Seq=92, 8 bytes
2>1 a ACK=120
1: nothing else resent
:::
---
#### A cumulative ACK covers a lost ACK
:::seq Host A | Host B
1>2 Seq=92, 8 bytes
1>2 Seq=100, 20 bytes [+14]
2>1 ax ACK=100
2>1 a ACK=120 [+14]
1: ACK 120 arrives before the timeout:
1: both segments acknowledged, nothing resent
:::
:::

1. **Lost ACK**: B received the segment but its ACK was lost. A times out and resends; B discards the duplicate bytes but sends the ACK again.
2. **Premature timeout**: the ACKs are delayed past the timeout. A resends segment 92 only; when ACK 120 arrives, A knows both segments arrived and doesn't resend segment 100.
3. **Cumulative ACK**: the ACK for the first segment is lost, but the ACK for the second (120) arrives before the timeout. Because ACKs are cumulative, A knows both segments arrived.

### Doubling the timeout interval

Each time TCP retransmits after a timeout, it sets the next timeout to **twice** the previous value, instead of deriving it from EstimatedRTT and DevRTT. The intervals grow exponentially after each retransmission. When a new ACK arrives (or new data from above), the timeout is computed from the formula again. This is a limited form of congestion control: a timeout probably means the network is congested, and retransmitting repeatedly would make it worse.

## The receiver's ACK policy (RFC 5681)

| Event at the receiver | TCP receiver action |
|---|---|
| In-order segment arrives with the expected sequence number; all data up to it is already acknowledged | **Delayed ACK**: wait up to 500 ms for another in-order segment; if none arrives, send the ACK |
| In-order segment arrives with the expected sequence number; one other in-order segment is waiting for its ACK | Immediately send **one cumulative ACK**, acknowledging both segments |
| Out-of-order segment arrives with a higher-than-expected sequence number (a **gap** is detected) | Immediately send a **duplicate ACK**, indicating the next expected byte (the lower end of the gap) |
| A segment arrives that partly or completely fills a gap | Immediately send an ACK, provided the segment starts at the lower end of the gap |

## Fast retransmit

A timeout-triggered retransmission can take a long time, because the timeout is fairly long. But the sender can often detect loss well before the timeout from **duplicate ACKs**: an ACK that re-acknowledges a segment for which the sender has already received an ACK.

Because a TCP sender often sends many segments back to back, if one is lost there will likely be many back-to-back duplicate ACKs. **If the TCP sender receives three duplicate ACKs for the same data, it takes this as a sign that the segment after the ACKed data was lost, and retransmits it before its timer expires.** This is **TCP fast retransmit**.

:::seq Host A | Host B
1>2 Seq=92, 8 bytes
1>2 x Seq=100, 20 bytes [+14]
1>2 Seq=120, 15 bytes [+14]
1>2 Seq=135, 6 bytes [+14]
1>2 Seq=141, 16 bytes [+14]
2>1 a ACK=100
2>1 a ACK=100 (dup 1) [+14]
2>1 a ACK=100 (dup 2) [+14]
2>1 a ACK=100 (dup 3) [+14]
1: 3 duplicate ACKs: fast retransmit Seq=100
1>2 Seq=100, 20 bytes
2>1 a ACK=157
:::

Why three, not one? Segments can be **reordered** in the network; one or two duplicate ACKs may simply mean a segment arrived slightly out of order. Three duplicates make loss much more likely.

## Is TCP Go-Back-N or Selective Repeat?

| Like Go-Back-N | Like Selective Repeat |
|---|---|
| Cumulative acknowledgements | Receivers usually **buffer** correctly received out-of-order segments |
| The sender keeps only SendBase and NextSeqNum | On a timeout, TCP retransmits **only one** segment (the oldest unacknowledged), not the whole window |

TCP's error recovery is best described as a **hybrid of GBN and SR**. The **selective acknowledgement (SACK)** option lets a receiver acknowledge out-of-order segments selectively, making TCP even more like SR.

## Flow control

When TCP receives bytes that are correct and in sequence, it places them in the **receive buffer**. The application reads from this buffer, but **not necessarily the instant data arrives**: it may be busy. If the application is slow to read, the sender can easily **overflow** the receive buffer by sending too much too fast.

TCP provides a **flow-control service** to eliminate this possibility. Flow control is a **speed-matching** service: it matches the rate at which the sender sends to the rate at which the receiving application reads.

:::note Flow control is not congestion control
Both throttle the sender, but for different reasons. **Flow control** protects the **receiver's buffer**. **Congestion control** (II.11–II.12) protects the **network** (router buffers and links). They are entirely different mechanisms with different variables (rwnd versus cwnd).
:::

### How the receive window works

The receiver (Host B) keeps:

- `RcvBuffer` = the size of the receive buffer;
- `LastByteRead` = the number of the last byte read by the application from the buffer;
- `LastByteRcvd` = the number of the last byte that has arrived and been placed in the buffer.

Because TCP may not overflow the buffer: \( \text{LastByteRcvd} - \text{LastByteRead} \le \text{RcvBuffer} \).

:::fx The receive window
\[ \text{rwnd} = \text{RcvBuffer} - (\text{LastByteRcvd} - \text{LastByteRead}) \]
Host B advertises rwnd in the **receive window** field of every segment it sends to A. Host A makes sure that
\[ \text{LastByteSent} - \text{LastByteAcked} \le \text{rwnd} \]
:::

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 120" role="img" aria-label="The receive buffer: buffered data and spare room rwnd">
<rect x="80" y="40" width="520" height="40" class="g-node"/>
<rect x="80" y="40" width="210" height="40" class="g-box"/>
<text x="185" y="65" class="c-text" text-anchor="middle">TCP data in buffer</text>
<text x="445" y="65" class="c-text" text-anchor="middle">spare room = rwnd</text>
<line x1="80" y1="96" x2="600" y2="96" class="c-axis"/>
<text x="340" y="112" class="c-muted" text-anchor="middle">RcvBuffer</text>
<text x="80" y="30" class="c-muted">← to application process (reads from here)</text>
<text x="600" y="30" class="c-muted" text-anchor="end">data from IP arrives here →</text>
</svg></div><figcaption>rwnd is the free space in the receive buffer; it changes as data arrives and as the application reads.</figcaption></figure>
:::

### The zero-window problem

If B's buffer fills, B advertises **rwnd = 0**. Suppose B then has nothing to send A. As B's application empties the buffer, TCP doesn't send new segments with new rwnd values to A (TCP sends a segment only when it has data or an acknowledgement to send). A would never learn that space has opened and would be **blocked forever**. To solve this, the TCP standard requires A to **keep sending segments with one data byte** while rwnd is zero. B acknowledges these, and eventually the buffer starts to empty and the ACKs carry a nonzero rwnd.

:::ex From a paper | A 10 KB receive buffer {{paper:19CSE301 Jan 2023 Q13(b)}}
:::solve
Given: RcvBuffer = 10 KB; the receiver currently has 4 KB of data buffered (received, not yet read).
Required: The flow-control action of receiver and sender.
Formula: \( \text{rwnd} = \text{RcvBuffer} - (\text{LastByteRcvd} - \text{LastByteRead}) \).
Substitution: \( 10 - 4 \).
Calculation: rwnd = 6 KB.
Answer: The receiver advertises **rwnd = 6 KB** in the receive-window field of its next segment. The sender keeps its unacknowledged data (LastByteSent − LastByteAcked) at or below 6 KB. If the application reads more, rwnd grows; if rwnd reaches 0, the sender sends 1-byte probe segments until the window reopens.
:::
:::

:::ex Practice | Following rwnd over time
:::solve
Given: RcvBuffer = 8,000 bytes. 3,000 bytes arrive; the application reads 1,000; then 4,000 more bytes arrive; then the application reads 2,000.
Required: rwnd after each event.
Formula: rwnd = RcvBuffer − buffered.
Substitution: buffered = arrived − read.
Calculation: After 3,000 arrive: 8,000 − 3,000 = 5,000. After reading 1,000: 8,000 − 2,000 = 6,000. After 4,000 more: 8,000 − 6,000 = 2,000. After reading 2,000: 8,000 − 4,000 = 4,000.
Answer: 5,000 → 6,000 → 2,000 → 4,000 bytes.
:::
:::

:::exam Exam focus
- “Fast retransmit” and “cumulative acknowledgement” are common definition questions ({{paper:20CYS303 End 2023 Q1(c,d)}}, {{paper:20CYS303 End 2024 Q7}}). Mention **three duplicate ACKs** and **before the timer expires**.
- Draw the three retransmission scenarios.
- Flow control: the rwnd formula, the sender's constraint, and the zero-window probe.
- Flow control vs congestion control.
:::

:::mistake Common mistakes
- Saying TCP retransmits the whole window on a timeout (that's GBN). TCP resends only the oldest unacknowledged segment.
- Triggering fast retransmit on the first duplicate ACK. It needs three duplicates (four identical ACKs in total).
- Confusing rwnd (receiver's buffer) with cwnd (the network).
:::

:::rev Quick revision
- One timer for the oldest unACKed segment; timeout → resend that segment, double the timeout.
- Receiver: delayed ACK (500 ms), cumulative ACK, immediate duplicate ACK on a gap.
- Fast retransmit: 3 duplicate ACKs → resend immediately.
- TCP = hybrid of GBN and SR; SACK option.
- rwnd = RcvBuffer − (LastByteRcvd − LastByteRead); LastByteSent − LastByteAcked ≤ rwnd; 1-byte probes when rwnd = 0.
:::

@@topic u2-tcp-conn | II.10 | TCP connection management | Opening a connection with the three-way handshake, why two messages aren't enough, closing with FIN and ACK, the TCP state machines, and what RST and SYN floods are. | Kurose §3.5.6 · Chapter_3_v8.2 slides 101–110, 150

## Establishing a connection: the three-way handshake

:::seq Client | Server
1: state: SYN_SENT
1>2 SYN=1, Seq=client_isn
2: allocate buffers; state: SYN_RCVD
2>1 a SYN=1, ACK=1, Seq=server_isn, Ack=client_isn+1
1: state: ESTABLISHED
1>2 SYN=0, ACK=1, Seq=client_isn+1, Ack=server_isn+1 (may carry data)
2: state: ESTABLISHED
:::

1. **Step 1, SYN**: the client sends a special segment with no application data and the **SYN bit set to 1** (a **SYN segment**). It chooses a random initial sequence number, `client_isn`, and puts it in the sequence-number field.
2. **Step 2, SYNACK**: when the SYN arrives, the server **allocates TCP buffers and variables** for the connection and sends a connection-granted segment with **SYN = 1**, **acknowledgement field = client_isn + 1**, and its own random initial sequence number `server_isn`. It says, in effect, “I received your SYN to start a connection with your initial sequence number client_isn. I agree. My initial sequence number is server_isn.”
3. **Step 3, ACK**: the client allocates its buffers and variables and sends a segment acknowledging the server's segment (**ack = server_isn + 1**), with **SYN = 0**, since the connection is now established. This third segment **may carry application data**.

### Why not just two messages?

With a two-way handshake (request, accept), problems arise because messages can be delayed and retransmitted:

- **Half-open connection**: the client's request is delayed, the client times out and retransmits, the connection completes and later closes; then the delayed original request arrives, and the server opens a connection that the client knows nothing about.
- **Duplicate data accepted**: an old retransmitted data segment from a finished connection could be accepted on a new connection.

The third message, and random initial sequence numbers, let each side confirm that the other really is responding to **this** connection's sequence numbers.

:::analogy A human three-way handshake
“Let's talk; I'll start at sentence 42.” → “OK, I heard you're at 42; I'll start at 79.” → “Great, I heard 79.” Only now are both sure the other is listening and knows where the conversation starts.
:::

## Closing a connection

Either side can end the connection. Suppose the client decides to close:

:::seq Client | Server
1: state: FIN_WAIT_1
1>2 FIN=1, Seq=x
2: state: CLOSE_WAIT (can still send data)
2>1 a ACK=1, Ack=x+1
1: state: FIN_WAIT_2
2: state: LAST_ACK
2>1 a FIN=1, Seq=y
1: state: TIME_WAIT (timed wait)
1>2 ACK=1, Ack=y+1
2: state: CLOSED
1: after 2 × max segment lifetime: CLOSED
:::

1. The client sends a segment with the **FIN** bit set to 1.
2. The server acknowledges it (ACK). The server may still send data in the other direction (a half-closed connection).
3. The server sends its own **FIN** segment.
4. The client acknowledges the server's FIN, and enters **TIME_WAIT**. TIME_WAIT lets the client resend the final ACK if it was lost (the server would retransmit its FIN). It typically lasts 30 seconds, 1 minute or 2 minutes (two maximum segment lifetimes). Then the connection formally closes and all resources (including port numbers) are released.

Because four segments are exchanged, this is often called the **four-way handshake** for closing.

!!sim visualizations/tcp/connection.html#phase=close | Opening and closing in the TCP simulator | Step through SYN, SYNACK and ACK with the state names on both sides, then the FIN/ACK/FIN/ACK close and the TIME_WAIT timer.

## The TCP state machines

| Client states (typical) | Server states (typical) |
|---|---|
| CLOSED → (send SYN) → **SYN_SENT** | CLOSED → (listen) → **LISTEN** |
| SYN_SENT → (receive SYNACK, send ACK) → **ESTABLISHED** | LISTEN → (receive SYN, send SYNACK) → **SYN_RCVD** |
| ESTABLISHED → (send FIN) → **FIN_WAIT_1** | SYN_RCVD → (receive ACK) → **ESTABLISHED** |
| FIN_WAIT_1 → (receive ACK) → **FIN_WAIT_2** | ESTABLISHED → (receive FIN, send ACK) → **CLOSE_WAIT** |
| FIN_WAIT_2 → (receive FIN, send ACK) → **TIME_WAIT** | CLOSE_WAIT → (send FIN) → **LAST_ACK** |
| TIME_WAIT → (wait 30 s–2 min) → **CLOSED** | LAST_ACK → (receive ACK) → **CLOSED** |

## When no one is listening: RST

If a host receives a TCP SYN for a port with no socket accepting connections (say port 80 with no web server running), it replies with a special reset segment with the **RST flag set to 1**: “I don't have a socket for that segment; please don't resend it.” (For UDP, the host instead sends a special ICMP datagram.)

A port scanner such as nmap uses this: it sends a SYN to a target port. **SYNACK back** → an application is listening (port open). **RST back** → no application, but no firewall in the way (port closed). **Nothing back** → a firewall probably blocked the SYN.

## The SYN flood attack

In a **SYN flood**, the attacker sends a huge number of TCP SYN segments (often with spoofed source addresses) and never completes the third step. The server allocates and initialises connection state for each, so its resources run out and legitimate clients are denied service. The defence is **SYN cookies**: the server doesn't allocate state on receiving a SYN; it computes its initial sequence number as a hash of the source and destination IPs and ports and a secret number (a cookie), and allocates a connection only when a valid ACK returns whose acknowledgement number matches cookie + 1.

:::ex From a paper | Handshake plus file {{paper:19CSE301 Jan 2023 Q11(b)}}
:::solve
Given: RTT = 10 ms; transferring the file from the server takes 25 ms.
Required: Total time from the start of the TCP connection request until the file is received.
Formula: SYN → SYNACK = 1 RTT; ACK + request → start of response = 1 RTT; then the file's transfer time.
Substitution: \( 10 + 10 + 25 \).
Calculation: 45 ms.
Answer: 45 ms. (Draw the three-way handshake with the HTTP request piggybacked on the third segment, then the response.)
:::
:::

:::exam Exam focus
- {{paper:19CSE301 Jan 2023 Q12(a)}}: the three-way handshake and the four-way close with neat diagrams (4 marks). Label SYN, ACK, FIN bits and sequence/acknowledgement numbers.
- Explain why a two-way handshake fails.
- Know the state names, TIME_WAIT's purpose, RST and SYN flood/SYN cookies.
:::

:::mistake Common mistakes
- Setting the SYNACK's ack number to client_isn. It is **client_isn + 1** (the SYN consumes one sequence number).
- Forgetting that the third segment may carry data.
- Thinking the server closes immediately after the client's FIN. It can keep sending until it sends its own FIN.
:::

:::rev Quick revision
- SYN (client_isn) → SYNACK (server_isn, ack client_isn + 1, buffers allocated) → ACK (ack server_isn + 1, may carry data).
- Two-way handshakes fail on delayed and retransmitted messages.
- Close: FIN → ACK → FIN → ACK; TIME_WAIT then CLOSED.
- RST for a closed port; SYN flood defeated with SYN cookies.
:::

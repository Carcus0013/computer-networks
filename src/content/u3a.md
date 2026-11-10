@@unit u3 | Unit III | Link Layer and Physical Layer | How a frame crosses one link: error detection with parity, checksums and CRC; how many nodes share one channel (ALOHA, CSMA/CD, taking turns); MAC addresses, ARP, Ethernet, switches and VLANs; and underneath it all, the physical layer: signals, line coding, media, attenuation, noise and the Nyquist and Shannon limits.

In past papers this unit supplies the CRC calculation (in almost every end-sem), multiple-access efficiency and backoff, ARP and addressing across subnets, switch self-learning tables and VLANs. Your own 23CSE302 end-sem also asked for line coding (NRZ, NRZI, Manchester).

@@group Link layer
@@topic u3-link-intro | III.1 | The link layer: introduction and services | What the link layer is responsible for, the services it can offer (framing, link access, reliable delivery, error detection and correction), and where it is implemented. | Kurose §6.1 · Chapter_6_v8.2 slides 2–10

## Terminology

- Any device that runs a link-layer protocol is a **node**: hosts, routers, switches and Wi-Fi access points.
- The communication channels that connect adjacent nodes along a path are **links**.
- To move a datagram from source to destination, it must cross each link in the path. Over a given link, a transmitting node encapsulates the datagram in a **link-layer frame** and transmits the frame onto the link.

A datagram may be carried by **different link-layer protocols** on different links of its path: Wi-Fi on the first link, Ethernet on the next, a wide-area link after that. Each protocol may offer different services; for example, one may give reliable delivery and another not.

:::analogy The travel agent
A travel agent plans a trip from Princeton to Lausanne: a limousine from Princeton to JFK airport, a plane from JFK to Geneva, and a train from Geneva to Lausanne. The tourist is the **datagram**; each transportation segment is a **link**; the mode of transport (limo, plane, train) is the **link-layer protocol**; and the travel agent is the **routing protocol**. Each transport company is responsible for moving the tourist across one segment only.
:::

## Link-layer services

| Service | What it means |
|---|---|
| **Framing** | Almost all link-layer protocols encapsulate each network-layer datagram in a frame before sending it on the link. A frame has a data field (the datagram) and header fields; the protocol specifies the frame's structure |
| **Link access** | A **medium access control (MAC)** protocol specifies the rules by which a frame is transmitted onto the link. Trivial on a point-to-point link (send whenever the link is idle); the real problem is when several nodes share one broadcast link: the **multiple access problem** (Topic III.4) |
| **Reliable delivery** | Guarantees that each datagram crosses the link without error, using acknowledgements and retransmissions (like TCP). Used on links with **high error rates**, such as wireless, so errors are corrected locally rather than end to end; often **not** used on low-bit-error links such as fibre, coax and many twisted-pair links |
| **Error detection and correction** | Receivers can decide incorrectly that a bit is 0 when it was 1 because of signal attenuation and electromagnetic noise. The transmitter includes error-detection bits; the receiver checks them. **Error correction** goes further: it determines where the error occurred and corrects it. Done in hardware |

Other features: **flow control** between adjacent nodes, and **half-duplex or full-duplex** operation (in half-duplex, the nodes at both ends can transmit, but not at the same time).

## Where the link layer is implemented

The link layer is implemented in a **network adapter**, also called a **network interface controller (NIC)**, in every host. At the heart of the adapter is the **link-layer controller**, usually a single special-purpose chip that implements many link-layer services (framing, link access, error detection) in **hardware**. Part of the link layer is implemented in **software** on the host CPU: assembling link-layer addressing information and activating the controller hardware.

:::flow
Sending side | The controller takes a datagram from memory, encapsulates it in a frame, fills in the header fields, and transmits the frame onto the link following the link-access protocol.
Receiving side | The controller receives the frame, extracts the datagram and checks for errors. If there are errors, it may drop the frame; otherwise it passes the datagram up to the network layer.
:::

The link layer is therefore the place in the protocol stack where **software meets hardware**.

:::exam Exam focus
- List and explain the four link-layer services. Note that reliable delivery is common on wireless links and rare on wired ones, and why.
- Know that the link layer is implemented in the NIC (hardware) plus some software in the host.
:::

:::rev Quick revision
- Node, link, frame. Different links on a path may use different link protocols.
- Services: framing, link access (MAC), reliable delivery (mainly wireless), error detection and correction; also flow control and half/full duplex.
- Implemented in the NIC's controller chip (hardware) plus host software.
:::

@@topic u3-error-detect | III.2 | Error detection: parity, checksum and CRC | Why receivers need error-detection bits, single and two-dimensional parity, the Internet checksum, and the cyclic redundancy check with full long-division working for every CRC question in your papers. | Kurose §6.2 · Chapter_6_v8.2 slides 11–16 · Chapter3-Problems

## The setup

At the sending node, data **D** is augmented with **error-detection and -correction bits (EDC)**. Both D and EDC are sent in a frame. At the receiver, a sequence of bits D′ and EDC′ is received; they may differ from the originals because of bit flips in transit. The receiver must decide, using only D′ and EDC′, whether D′ is the same as D.

Error-detection techniques allow the receiver to *sometimes, but not always*, detect bit errors: there can be **undetected bit errors**. Larger EDC fields reduce the chance of undetected errors, but cost more bits and more computation.

## Single parity bit

With **even parity**, the sender adds one bit so that the total number of 1s in the \(d + 1\) bits is even. With **odd parity**, the total is odd.

- Example (even parity): D = 0111000110101011 has nine 1s, so the parity bit is **1**, giving ten 1s.
- The receiver counts the 1s. With even parity, an **odd** count means at least one bit error (more precisely, an odd number of bit errors).
- **Weakness**: if an even number of bits are flipped, the error goes **undetected**. Errors in real links tend to come in **bursts**, so with bursty errors the chance of an undetected error with a single parity bit can approach 50%.

## Two-dimensional parity

The \(d\) bits are arranged into \(i\) rows and \(j\) columns. A parity bit is computed for **each row** and **each column**, plus one for the parity bits themselves: \(i + j + 1\) parity bits.

- If **one bit** flips, the parity of **both its row and its column** will be wrong. The receiver can **identify** and **correct** that single bit.
- Any **two-bit** error in the data can be **detected** (but not corrected).

The ability of the receiver to both detect and correct errors is **forward error correction (FEC)** (Topic III.3).

:::ex From a paper | Checking a 2-D even-parity block {{paper:20CYS303 End 2024 Q9}}
:::solve
Given: Received rows (2-D even parity; the last bit of each row is its row parity and the last row is the column-parity row): 10001101, 01001001, 10110011, 01001101, 00010010.
Required: Is the message corrupted? Can it be corrected?
Formula: Every row and every column must contain an even number of 1s.
Substitution: Count the 1s.
Calculation: Row 1: 4 ✓; row 2 (01001001): 3 ✗; row 3 (10110011): 5 ✗; row 4: 4 ✓; row 5: 2 ✓. Columns (left to right): 2, 2, **3** ✗, 2, **3** ✗, 2, 2, 4 → columns 3 and 5 fail.
Answer: **Corrupted**: two rows (2 and 3) and two columns (3 and 5) fail. That pattern means at least **two** bit errors, and it is **ambiguous**: the errors could be at (row 2, col 3) and (row 3, col 5), or at (row 2, col 5) and (row 3, col 3). So 2-D parity **detects** the error but **cannot correct** it; only a single failing row and single failing column identify one bit uniquely.
:::
:::

## The Internet checksum

The checksum (Topic II.3) treats the data as a sequence of 16-bit integers, sums them in one's-complement arithmetic and sends the complement of the sum. It needs little packet overhead, but gives **weak protection** compared with CRC. It is used at the transport layer (and in the IP header) because that is done in **software**, where simplicity and speed matter; the link layer uses CRC, done in dedicated **hardware**, which can perform the more complex calculation quickly.

## Cyclic redundancy check (CRC)

CRC codes, also called **polynomial codes**, are widely used in practice (Ethernet and Wi-Fi use CRC-32).

### The setup

- The sender has \(d\) bits of data, **D**.
- Sender and receiver agree on an \((r + 1)\)-bit pattern called the **generator**, **G**. Its most significant (leftmost) bit must be 1.
- The sender chooses \(r\) additional bits, **R**, and appends them to D, so that the \((d + r)\)-bit pattern \(\langle D, R \rangle\) is **exactly divisible by G** using modulo-2 arithmetic.
- The receiver divides the \(d + r\) received bits by G. If the **remainder is nonzero**, an error has occurred; otherwise the data is accepted.

### Modulo-2 arithmetic

All CRC calculations are done in modulo-2 arithmetic **without carries or borrows**: addition and subtraction are both the **XOR** operation. 1011 XOR 0101 = 1110; 1001 XOR 1101 = 0100.

:::fx Computing R
\[ R = \text{remainder}\left( \frac{D \cdot 2^{r}}{G} \right) \]
In practice: append \(r\) zeros to D, divide by G with XOR long division, and the last \(r\) bits that remain are R. Transmit D followed by R.
:::

### What CRC detects

- **All burst errors of fewer than \(r + 1\) bits** (all consecutive bit errors of \(r\) bits or fewer).
- Under appropriate assumptions, a burst longer than \(r + 1\) bits is detected with probability \(1 - 0.5^{r}\).
- Each of the CRC standards can detect **any odd number of bit errors**.

### Worked CRC calculations

:::ex Level 1 | Kurose's example
:::solve
Given: D = 101110 (d = 6), G = 1001 (r = 3).
Required: R and the transmitted bits.
Formula: Divide D followed by three 0s by 1001; R = the last 3 bits of the remainder.
Substitution: Dividend = 101110**000**.
Calculation:
```
101110000
1001            XOR at position 1
---------
001010000
  1001          XOR at position 3
---------
000011000
    1001        XOR at position 5
---------
000001010
     1001       XOR at position 6
---------
000000011   → remainder 011
```
Answer: R = **011**; transmitted bits = 101110**011**.
:::
:::

:::ex From a paper | Node A's data 1000111, G = 1001 {{paper:23CSE302 End 2025 Q7(a)}}
:::solve
Given: D = 1000111, G = 1001 (r = 3).
Required: The CRC remainder, with steps.
Formula: Remainder of 1000111**000** ÷ 1001 (XOR division).
Substitution: Dividend 1000111000.
Calculation:
```
1000111000
1001            XOR at position 1
----------
0001111000
   1001         XOR at position 4
----------
0000110000
    1001        XOR at position 5
----------
0000010100
     1001       XOR at position 6
----------
0000000110  → remainder 110
```
Check: 1000111110 ÷ 1001 leaves remainder 000 ✓.
Answer: Remainder R = **110**; node A transmits **1000111110**.
:::
:::

:::ex From a paper | Generator x⁵ + x² + 1 {{paper:19CSE301 End 2023 Q5(b)}}
:::solve
Given: Payload D = 11010011; generator \(x^5 + x^2 + 1\).
Required: The CRC at the transmitter, and the check at the receiver.
Formula: Polynomial → bits: coefficients of \(x^5 \dots x^0\) = 1 0 0 1 0 1, so G = 100101 and r = 5. Divide D followed by five 0s.
Substitution: Dividend = 11010011**00000**.
Calculation:
```
1101001100000
100101              XOR at position 1
-------------
0100011100000
 100101             XOR at position 2
-------------
0000110100000
    100101          XOR at position 5
-------------
0000010001000
     100101         XOR at position 6
-------------
0000000111100  → remainder 11100
```
Receiver: divides 1101001111100 by 100101 and gets remainder 00000, so no error is detected. If any bit had flipped (say the 3rd), the remainder would be nonzero and the frame would be discarded.
Answer: CRC = **11100**; transmitted frame = **11010011 11100**.
:::
:::

:::ex From a paper | D = 10011110, G = 1001, r = 3 {{paper:19CSE301 End 2024 Q6(a)}}
:::solve
Given: D = 10011110, G = 1001, r = 3.
Required: R, and the sender and receiver checks.
Formula: Remainder of 10011110**000** ÷ 1001.
Substitution: Dividend = 10011110000.
Calculation:
```
10011110000
1001                XOR at position 1
-----------
00001110000
    1001            XOR at position 5
-----------
00000111000
     1001           XOR at position 6
-----------
00000011100
      1001          XOR at position 7
-----------
00000001110
       1001         XOR at position 8
-----------
00000000111  → remainder 111
```
Receiver: 10011110111 ÷ 1001 → remainder 000 ✓.
Answer: R = **111**; sent: **10011110111**; the receiver's remainder is 000, so the frame is accepted.
:::
:::

:::ex From a paper | Stallings' classic: D = 1010001101, P = 110101 {{paper:19CSE301 Jan 2023 Q15(a)}}
:::solve
Given: Message D = 1010001101 (10 bits); generator P = 110101 (6 bits, so r = 5).
Required: The need for the FCS in an Ethernet II frame, and the final transmitted string.
Formula: Remainder of D followed by five 0s, divided by P.
Substitution: Dividend = 1010001101**00000**.
Calculation: XOR steps at positions 1, 2, 4, 6, 8, 9 (each time the leading bit is 1) leave the remainder **01110**. Check: 101000110101110 ÷ 110101 → remainder 00000 ✓.
Answer: Transmitted string = **101000110101110** (the 10 message bits followed by FCS 01110). The **FCS (frame check sequence)** field carries the CRC so the receiving adapter can detect bit errors introduced on the link and discard corrupted frames.
:::
:::

!!sim visualizations/link/error-detection.html | Error-detection workbench | Type any data and generator to see the CRC long division row by row; flip bits to see which errors are caught. Also: single and 2-D parity (with single-bit correction) and the Internet checksum.

| Method | Overhead | Detects | Corrects | Where used |
|---|---|---|---|---|
| Single parity | 1 bit | Any odd number of bit errors | No | Simple serial links, memory |
| 2-D parity | \(i + j + 1\) bits | All 1-, 2- and 3-bit errors | Single-bit errors | Simple FEC |
| Internet checksum | 16 bits | Most errors; misses compensating errors | No | TCP, UDP, IP header (software) |
| CRC (r bits) | r bits (32 in Ethernet) | All bursts ≤ r bits, all odd numbers of errors | No (detection only) | Ethernet, Wi-Fi (hardware) |

:::exam Exam focus
- **CRC** appeared in 5 papers, including your own end-sem (4 marks). Append r zeros (r = number of generator bits − 1), XOR-divide, show every step, give R and the transmitted frame, and show the receiver's zero remainder.
- Convert a polynomial generator to bits (x⁵ + x² + 1 → 100101).
- 2-D parity: locate and correct a single-bit error; explain why two errors can't be corrected.
- Why the link layer uses CRC but the transport layer uses a checksum (hardware vs software).
:::

:::mistake Common mistakes
- Appending r + 1 zeros instead of r (the generator has r + 1 bits).
- Using binary subtraction with borrows. Modulo-2 subtraction is XOR.
- Skipping a step when the leading bit is 0. When the leading bit is 0, just move on (XOR with 0000).
- Giving the quotient instead of the remainder.
:::

:::rev Quick revision
- Parity: even/odd; single parity detects odd numbers of errors; 2-D parity corrects single-bit errors.
- Checksum: weak, software, transport layer.
- CRC: G has r + 1 bits; R = remainder(D·2ʳ / G) in XOR arithmetic; receiver remainder must be 0; detects bursts ≤ r bits and odd error counts; CRC-32 in Ethernet.
:::

@@topic u3-error-correct | III.3 | Error correction | Locating and fixing errors at the receiver without a retransmission: forward error correction, correcting a bit with 2-D parity, Hamming distance and the Hamming code, and when FEC beats ARQ. | Kurose §6.2.1 (two-dimensional parity, FEC) · supplementary: Hamming code from Forouzan Ch 10 (not prescribed)

## Detection versus correction

**Error detection** tells the receiver *that* a frame is wrong, so it can be discarded (and retransmitted by a higher layer or by the link layer's ARQ). **Error correction** tells the receiver *which* bits are wrong, so it can fix them on the spot. The ability of a receiver to both detect and correct errors is called **forward error correction (FEC)**.

| Error detection (+ retransmission, ARQ) | Error correction (FEC) |
|---|---|
| Few redundant bits | More redundant bits |
| Needs a return channel and retransmission | No retransmission needed |
| Delay of at least one RTT per error | No extra delay |
| Good when errors are rare and RTT is small | Good when errors are frequent, RTT is long, or there's no return path (satellite, broadcast, deep space, real-time audio/video) |
| Examples: CRC in Ethernet, TCP retransmission | Examples: 2-D parity, Hamming codes, Reed–Solomon in CDs and DVB, FEC in Wi-Fi and 4G/5G |

FEC techniques are commonly used in audio storage and playback devices such as CDs. In a network setting, FEC can be used on its own or together with link-layer ARQ. FEC **decreases the number of sender retransmissions** required and allows **immediate correction** at the receiver, avoiding a round-trip delay.

## Correcting a single bit with 2-D parity

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 210" role="img" aria-label="Two-dimensional parity locating a single bit error at the intersection of the failing row and column">
<text x="150" y="20" class="c-head" text-anchor="middle">Sent (even parity)</text>
<text x="500" y="20" class="c-head" text-anchor="middle">Received: one bit flipped</text>
<g class="c-text">
<text x="80" y="50" class="c-text">1 0 1 0 1 | 1</text>
<text x="80" y="75" class="c-text">1 1 1 1 0 | 0</text>
<text x="80" y="100" class="c-text">0 1 1 1 0 | 1</text>
<text x="80" y="122" class="c-muted">----------+--</text>
<text x="80" y="145" class="c-text">0 0 1 0 1 | 0</text>
<text x="430" y="50" class="c-text">1 0 1 0 1 | 1</text>
<text x="430" y="75" class="c-text">1 0 1 1 0 | 0</text>
<text x="430" y="100" class="c-text">0 1 1 1 0 | 1</text>
<text x="430" y="122" class="c-muted">----------+--</text>
<text x="430" y="145" class="c-text">0 0 1 0 1 | 0</text>
</g>
<rect x="424" y="61" width="104" height="20" fill="none" class="sq-bad"/>
<rect x="438" y="34" width="14" height="118" fill="none" class="sq-bad"/>
<text x="560" y="75" class="sq-note">row parity wrong</text>
<text x="445" y="172" class="sq-note" text-anchor="middle">column parity wrong</text>
<text x="340" y="198" class="c-muted" text-anchor="middle">The flipped bit sits where the failing row meets the failing column, so the receiver flips it back.</text>
</svg></div></figure>
:::

## Hamming distance and the Hamming code (supplementary)

:::note Source note
Hamming codes are not in the prescribed Kurose sections or the prescribed Forouzan chapters; they come from Forouzan Chapter 10. They are included because “error correction” is a syllabus heading and Hamming codes are the standard example. Treat this subsection as background.
:::

- The **Hamming distance** between two equal-length words is the number of positions in which they differ: d(10101, 11110) = 3.
- The **minimum Hamming distance** \(d_{min}\) of a code is the smallest distance between any two valid codewords.
- A code can **detect** up to \(s\) errors if \(d_{min} \ge s + 1\), and **correct** up to \(t\) errors if \(d_{min} \ge 2t + 1\).

The **Hamming (7,4) code** sends 4 data bits with 3 parity bits (\(d_{min} = 3\)), so it corrects any single-bit error. Parity bits sit at positions 1, 2 and 4 (powers of two); each checks the positions whose binary index includes that power:

| Parity bit | Checks positions |
|---|---|
| p₁ (position 1) | 1, 3, 5, 7 |
| p₂ (position 2) | 2, 3, 6, 7 |
| p₄ (position 4) | 4, 5, 6, 7 |

:::ex Practice | Encoding and correcting with Hamming (7,4), even parity
:::solve
Given: Data bits 1011 placed at positions 3, 5, 6, 7 (d₃ = 1, d₅ = 0, d₆ = 1, d₇ = 1). The received word is 0110111 (positions 1–7).
Required: (a) the codeword; (b) the corrected word.
Formula: Each parity bit makes its group even. At the receiver, the syndrome (c₄c₂c₁) gives the error position.
Substitution: (a) p₁ = d₃ ⊕ d₅ ⊕ d₇ = 1 ⊕ 0 ⊕ 1 = 0; p₂ = d₃ ⊕ d₆ ⊕ d₇ = 1 ⊕ 1 ⊕ 1 = 1; p₄ = d₅ ⊕ d₆ ⊕ d₇ = 0 ⊕ 1 ⊕ 1 = 0.
Calculation: (a) Positions 1–7: p₁ p₂ d₃ p₄ d₅ d₆ d₇ = 0 1 1 0 0 1 1 → **0110011**. (b) Received 0110111: c₁ = b₁⊕b₃⊕b₅⊕b₇ = 0⊕1⊕1⊕1 = 1; c₂ = b₂⊕b₃⊕b₆⊕b₇ = 1⊕1⊕1⊕1 = 0; c₄ = b₄⊕b₅⊕b₆⊕b₇ = 0⊕1⊕1⊕1 = 1. Syndrome c₄c₂c₁ = 101 = 5.
Answer: (a) 0110011. (b) Bit 5 is wrong; flipping it gives 0110011, the original codeword (data 1011).
:::
:::

:::rev Quick revision
- FEC = detect and correct at the receiver, no retransmission; costs more redundancy; good for long delays, broadcast, real-time media.
- 2-D parity corrects single-bit errors (failing row ∩ failing column).
- Hamming distance; detect s errors needs \(d_{min} \ge s + 1\); correct t errors needs \(d_{min} \ge 2t + 1\); Hamming (7,4) corrects 1 bit.
:::

@@topic u3-mac | III.4 | Multiple access protocols | How many nodes share one broadcast channel: the ideal properties, channel partitioning (TDMA, FDMA, CDMA), random access (slotted ALOHA, pure ALOHA, CSMA, CSMA/CD with binary exponential backoff, and how CSMA/CA differs), and taking-turns protocols (polling, token passing), with every efficiency and backoff numerical. | Kurose §6.3 · Chapter_6_v8.2 slides 17–40

## Point-to-point and broadcast links

- A **point-to-point link** has a single sender at one end and a single receiver at the other (PPP, HDLC). Nothing to coordinate.
- A **broadcast link** can have **multiple sending and receiving nodes all connected to the same, single, shared channel** (old bus Ethernet, cable access, Wi-Fi, satellite). When any node transmits a frame, the channel broadcasts it and every other node receives a copy.

The problem: if two or more nodes transmit at the same time, all receivers get several frames at once: the frames **collide**, and none of them can be recovered. The channel is wasted during the collision. **Multiple access protocols** coordinate the nodes' transmissions.

:::analogy A classroom
The teacher and students share one medium: the air. Rules such as “raise your hand”, “don't interrupt”, “give everyone a chance” and “don't monopolise” are a human multiple access protocol.
:::

### The ideal multiple access protocol

For a broadcast channel of rate R bits/s:

1. When only one node has data, it gets a throughput of **R** bps.
2. When **M** nodes have data, each gets an average throughput of **R/M** bps (over a suitable interval).
3. The protocol is **decentralised**: no master node that is a single point of failure.
4. The protocol is **simple** and inexpensive to implement.

### Three classes (the taxonomy)

| Class | Idea | Examples |
|---|---|---|
| **Channel partitioning** | Divide the channel into fixed pieces (time slots, frequencies, codes) and give one to each node | TDMA, FDMA, CDMA |
| **Random access** | A node always transmits at the full rate R; on a collision, each node retransmits after an independently chosen **random** delay | Slotted ALOHA, pure ALOHA, CSMA, CSMA/CD |
| **Taking turns** | Nodes take turns, so there are no collisions, and a node with a lot to send can take a longer turn | Polling, token passing |

{{paper:20CYS303 End 2024 Q5}} and {{paper:19CCE304 End 2024 Q6(A)}} asked for exactly this classification with examples.

## Channel partitioning protocols

- **TDMA (time-division multiple access)**: time is divided into **frames**, and each frame into N **slots**; each slot belongs to one node. Eliminates collisions and is perfectly fair, but a node is limited to **R/N** even when it is the only node with data, and it must wait for its turn.
- **FDMA (frequency-division multiple access)**: the R bps channel is divided into frequency bands of R/N each. Same advantages and the same drawback.
- **CDMA (code division multiple access)**: each node gets a different **code** and encodes its data bits with it; with carefully chosen codes, nodes can transmit **simultaneously** and receivers still decode their intended sender's data (used in cellular systems; covered in Kurose Chapter 7).

## Random access protocols

### Slotted ALOHA

Assumptions: all frames are L bits; time is divided into slots of L/R seconds (one frame); nodes start transmitting only at the beginning of a slot (they are synchronised); if two or more frames collide in a slot, all nodes detect the collision before the slot ends.

:::flow
1. Send | When a node has a new frame, it waits for the start of the next slot and transmits the entire frame.
2. Success | If there is no collision, the frame got through; the node can prepare a new frame.
3. Collision | If there is a collision, the node detects it before the end of the slot, and retransmits the frame in **each subsequent slot with probability p** until it succeeds.
:::

Advantages: a single active node transmits continuously at full rate R; highly decentralised; simple. Drawbacks: collisions waste slots; **empty slots** occur when every node holds back by probability; clock synchronisation is needed.

**Efficiency** is the long-run fraction of successful slots when there are many active nodes, each always having frames to send. A slot is successful when exactly one node transmits: one node transmits with probability p and the other N − 1 don't.

:::fx Slotted ALOHA efficiency with N active nodes
\[ E(p) = N\,p\,(1-p)^{N-1} \qquad \text{maximised at } p^* = \frac{1}{N}: \quad E = \left(1 - \frac{1}{N}\right)^{N-1} \xrightarrow{N \to \infty} \frac{1}{e} \approx 0.37 \]
At best, the channel is used for successful transmissions only **37%** of the time: a 100 Mbps channel gives under 37 Mbps of useful throughput.
:::

### Pure ALOHA

Unslotted and fully decentralised: when a frame first arrives, the node **immediately transmits** it in full. If it collides, the node (after transmitting the whole collided frame) retransmits it immediately with probability p, otherwise waits one frame time and tries again with probability p.

A frame sent at \(t_0\) collides with any frame begun in the interval \([t_0 - 1, t_0 + 1]\) (in frame times): its **vulnerable period** is **two** frame times. For success, no other node may start in either the preceding or the current frame time.

:::fx Pure ALOHA efficiency
\[ E(p) = N\,p\,(1-p)^{2(N-1)} \qquad \text{maximum} \to \frac{1}{2e} \approx 0.18 \]
Exactly half of slotted ALOHA's: the price of full decentralisation.
:::

:::plot Efficiency of slotted and pure ALOHA as the transmission probability changes (N = 10 nodes) | Transmission probability p | Efficiency
func Slotted ALOHA: 10*x*(1-x)**9 ; 0 0.5
func Pure ALOHA: 10*x*(1-x)**18 ; 0 0.5
ymax 0.42
:::

:::ex From a paper | Slotted ALOHA with p = 0.4 {{paper:23CSE302 End 2025 Q7(c)}}
:::solve
Given: Four nodes A, B, C, D share a 1 Mbps channel using slotted ALOHA; each transmits in a slot with probability p = 0.4.
Required: The efficiency.
Formula: \( E = N p (1-p)^{N-1} \).
Substitution: \( N = 4,\ p = 0.4 \): \( E = 4 \times 0.4 \times 0.6^{3} \).
Calculation: \( 0.6^3 = 0.216 \); \( 4 \times 0.4 = 1.6 \); \( E = 1.6 \times 0.216 = 0.3456 \).
Answer: Efficiency = **0.3456 (34.56%)**, i.e. about 345.6 kbps of useful throughput on the 1 Mbps channel. (The optimum for N = 4 would be p = 1/4, giving \((3/4)^3 = 0.4219\).)
:::
:::

:::ex Practice | Pure ALOHA at the optimum, and the best p
:::solve
Given: N = 5 nodes; pure ALOHA.
Required: (a) efficiency at p = 0.1; (b) the slotted ALOHA optimum for N = 5.
Formula: Pure: \( N p (1-p)^{2(N-1)} \). Slotted optimum: \( (1 - 1/N)^{N-1} \).
Substitution: (a) \( 5 \times 0.1 \times 0.9^{8} \). (b) \( (4/5)^4 \).
Calculation: (a) \( 0.9^8 = 0.4305 \); \( 0.5 \times 0.4305 = 0.2152 \). (b) \( 0.8^4 = 0.4096 \).
Answer: (a) About 21.5%. (b) 40.96% (approaching 36.8% as N grows).
:::
:::

### CSMA: carrier sense multiple access

Two rules that polite humans also follow:

- **Listen before speaking (carrier sensing)**: a node listens to the channel before transmitting. If a frame from another node is being transmitted, it waits until it detects no transmission for a short time, then begins.
- **If someone else begins talking at the same time, stop talking (collision detection)**: a transmitting node keeps listening; if it detects another node transmitting an interfering frame, it stops transmitting.

Why do collisions still happen if everyone listens first? Because of **channel propagation delay**: node B starts transmitting at \(t_0\); node D, some distance away, senses the channel idle at \(t_1 > t_0\) because B's bits haven't reached it yet, and starts transmitting too. The longer the propagation delay, the larger the chance that a node can't sense a transmission that has already begun.

### CSMA/CD and Ethernet

With **collision detection**, a node stops transmitting as soon as it detects a collision, instead of wasting the channel by sending the whole damaged frame. The operation from the viewpoint of an adapter:

:::flow
1. Prepare | The adapter gets a datagram from the network layer, prepares a link-layer frame and puts it in its buffer.
2. Sense | If the channel is idle (no signal energy entering from the channel), it starts transmitting. If it is busy, it waits until it senses no signal energy, then starts.
3. Monitor | While transmitting, it monitors for signal energy from other adapters.
4. Done or abort | If it transmits the entire frame without detecting other energy, it is finished. If it detects a collision, it **stops transmitting** (and sends a 48-bit **jam signal** so every node knows of the collision).
5. Back off | After aborting, it waits a **random** amount of time (binary exponential backoff) and returns to step 2.
:::

:::fx Binary exponential backoff (Ethernet)
After the \(n\)th collision for a frame, the adapter picks \(K\) at random from \(\{0, 1, 2, \dots, 2^{n} - 1\}\), with \(n\) capped at 10, and waits
\[ \text{backoff} = K \times 512 \text{ bit times} \]
- 1st collision: K ∈ {0, 1}. 2nd: K ∈ {0, 1, 2, 3}. 3rd: {0, …, 7}. 10th onwards: {0, …, 1023}.
- One bit time = 1/R. At 10 Mbps, 512 bit times = 51.2 µs; at 100 Mbps, 5.12 µs; at 1 Mbps, 512 µs.
:::

Why exponential? With few colliding nodes, a small range of K suffices; with many, a small range would cause repeated collisions. Doubling the range after each collision adapts to the (unknown) number of colliding nodes.

:::ex From a paper | Backoff after the 5th collision {{paper:23CSE302 End 2025 Q7(b)}}
:::solve
Given: Node B on a 1 Mbps channel, using CSMA/CD; it has suffered its 5th collision for the same frame.
Required: The exponential backoff time (state assumptions).
Formula: \( K \in \{0, \dots, 2^{n} - 1\} \), backoff \(= K \times 512\) bit times, bit time \(= 1/R\).
Substitution: \( n = 5 \Rightarrow K \in \{0, \dots, 31\} \). Bit time \(= 1/10^6 = 1\ \mu\text{s}\), so 512 bit times \(= 512\ \mu\text{s}\).
Calculation: Backoff \(= K \times 512\ \mu\text{s}\), anywhere from 0 to \(31 \times 512 = 15{,}872\ \mu\text{s} = 15.872\) ms. Assume B draws K = 12: \(12 \times 512 = 6{,}144\ \mu\text{s} = 6.144\) ms. The mean is \(15.5 \times 512 = 7.936\) ms.
Answer: B waits K × 512 µs with K chosen uniformly from 0–31: between 0 and 15.872 ms (6.144 ms if K = 12; 7.936 ms on average).
:::
:::

:::ex From a paper | Only A and B on the Ethernet {{paper:19CSE301 Jan 2023 Q15(b)}}
:::solve
Given: A and B are the only stations, each with a steady queue of frames, and both start transmitting at once.
Required: The CSMA/CD procedure that eventually lets both send successfully.
Formula: Binary exponential backoff.
Substitution: First collision: each picks K ∈ {0, 1}.
Calculation: Both detect the collision, send a jam signal and abort. With probability 1/2 they pick different K values (one 0, one 1): the one with K = 0 senses the channel idle and transmits after the jam; the other senses it busy when its backoff ends, waits until it is idle, then transmits. With probability 1/2 they pick the same K and collide again; after the 2nd collision each picks from {0, 1, 2, 3}, so they differ with probability 3/4, and so on. Once one station succeeds, it resets its collision count for its next frame, while the loser keeps its count, which is why one station can capture the channel for a while.
Answer: Both stations eventually succeed: each collision is followed by jam, abort and a random backoff from a doubling range, and the probability that they keep choosing the same K falls quickly (1/2, then 1/4, then 1/8 …).
:::
:::

### Minimum frame size for collision detection

A sender must still be transmitting when news of a collision gets back to it, or it would never know its frame collided. In the worst case, the collision happens just before the far end, and the noise needs another full propagation time to return:

:::fx Collision detection requirement
\[ \frac{L}{R} \ge 2\,d_{prop} \quad\Longrightarrow\quad L_{min} = 2\,d_{prop}\,R \]
For classic 10 Mbps Ethernet this gives the **512-bit (64-byte) minimum frame** and the 51.2 µs slot time.
:::

:::ex Practice | Minimum frame and efficiency
:::solve
Given: A 10 Mbps CSMA/CD bus 2,000 m long, \(s = 2 \times 10^8\) m/s; frames of 1,000 bytes.
Required: (a) the minimum frame size; (b) the efficiency.
Formula: (a) \( L_{min} = 2 d_{prop} R \). (b) \( \text{Efficiency} = \dfrac{1}{1 + 5\, d_{prop}/d_{trans}} \) (Kurose's approximation).
Substitution: \( d_{prop} = 2{,}000 / 2 \times 10^8 = 10\ \mu\text{s} \); \( d_{trans} = 8{,}000 / 10^7 = 800\ \mu\text{s} \).
Calculation: (a) \( 2 \times 10 \times 10^{-6} \times 10^7 = 200 \) bits (25 bytes). (b) \( 1 / (1 + 5 \times 10/800) = 1/1.0625 = 0.941 \).
Answer: (a) 200 bits. (b) About 94%. Efficiency tends to 1 as propagation delay shrinks or frames grow, much better than ALOHA.
:::
:::

### How CSMA/CA (Wi-Fi) differs from CSMA/CD

Wi-Fi (IEEE 802.11, Kurose Chapter 7) uses **CSMA with collision avoidance** instead, because a wireless adapter **cannot detect collisions** while transmitting (its own signal swamps any other, and of hidden terminals it can't hear at all).

| | CSMA/CD (Ethernet) | CSMA/CA (802.11 Wi-Fi) |
|---|---|---|
| Medium | Wired (shared bus, hub) | Wireless |
| Collision handling | **Detects** collisions while transmitting and **aborts** | **Avoids** collisions: can't detect them |
| Before sending | Sense; transmit as soon as the channel is idle | Sense idle for a DIFS, then count down a **random backoff** while idle, then send |
| Confirmation | None at link layer (collision detection suffices) | Receiver returns a link-layer **ACK** after SIFS; no ACK = retransmit |
| Backoff | After a collision | Before every transmission (and doubled after a failure) |
| Hidden terminals | Not an issue on a bus | Optional **RTS/CTS** reservation solves them |
| Efficiency | High on short wired links | Lower (ACKs, idle intervals, backoff) |

## Taking-turns protocols

ALOHA and CSMA satisfy the first property of the ideal protocol (rate R for a single active node) but not the second (R/M each for M nodes). Taking-turns protocols aim for both.

- **Polling**: a **master node** polls each node in round-robin fashion: “node 1, you may send up to N frames”; when node 1 finishes, it polls node 2, and so on. **No collisions or empty slots**, so efficiency is much higher. Drawbacks: **polling delay** (the time to notify a node, which wastes capacity when only one node is active), and the master is a **single point of failure**. Bluetooth uses polling.
- **Token passing**: no master. A small special-purpose frame, the **token**, is passed among the nodes in a fixed order. A node holding the token may transmit up to a maximum number of frames, then forwards the token. A node with nothing to send passes it on at once. **Decentralised and highly efficient**, but the failure of one node can crash the whole channel, and if a node forgets to release the token, recovery procedures are needed. FDDI and IEEE 802.5 token ring used it. With a **very large perimeter**, the token takes a long time to travel around, so nodes wait longer and efficiency drops ({{paper:19CCE304 Jan 2023 Q7(A)}}).

## Comparing the three classes

| | Channel partitioning | Random access | Taking turns |
|---|---|---|---|
| Collisions | None | Yes | None |
| Rate when one node is active | Only R/N (poor) | Full R (good) | Nearly R |
| Behaviour under heavy load | Efficient and fair | Collisions waste capacity | Efficient and fair |
| Central control | No | No | Polling: yes (master); token: no |
| Overheads | Idle slots or bands | Collisions, backoff | Polling delay, token passing |
| Examples | TDMA, FDMA, CDMA (cellular) | ALOHA, CSMA/CD (Ethernet), CSMA/CA (Wi-Fi) | Polling (Bluetooth), token ring, FDDI |

DOCSIS cable access uses all three: FDM for downstream and upstream channels, TDM with mini-slots upstream, random access for requests in contention slots, and the head end (CMTS) assigns turns.

!!sim visualizations/link/multiple-access.html | Multiple access simulator | Animate slotted ALOHA, pure ALOHA and CSMA/CD on a shared channel: watch frames collide, jam signals, and nodes draw random backoffs. Change N and p and compare the measured throughput with the formulas.

:::exam Exam focus
- ALOHA efficiency formulas and their maxima (0.37, 0.18); the derivation idea (exactly one node transmits; vulnerable period 2 for pure ALOHA). Asked in 5 papers.
- CSMA/CD from the adapter's viewpoint (the five steps), and binary exponential backoff calculations.
- Three classes of MAC protocol with examples; pure vs slotted ALOHA ({{paper:20CYS303 End 2023 Q4}}); CSMA/CD ({{paper:20CYS303 End 2023 Q5}}); three random access protocols ({{paper:20CYS303 End 2024 Q13}}).
:::

:::mistake Common mistakes
- Using \((1-p)^{N}\) instead of \((1-p)^{N-1}\) in slotted ALOHA.
- Forgetting the factor 2 in pure ALOHA's exponent.
- Choosing K from {0, …, 2ⁿ} instead of {0, …, 2ⁿ − 1}.
- Saying CSMA prevents all collisions. Propagation delay still allows them.
:::

:::rev Quick revision
- Ideal MAC: R alone, R/M shared, decentralised, simple.
- Partitioning: TDMA, FDMA, CDMA (no collisions, R/N max).
- Slotted ALOHA \(Np(1-p)^{N-1}\), max 1/e ≈ 0.37; pure ALOHA \(Np(1-p)^{2(N-1)}\), max 1/(2e) ≈ 0.18.
- CSMA: listen before talk; collisions from propagation delay. CSMA/CD: abort + jam + backoff K ∈ {0 … 2ⁿ − 1} × 512 bit times; \(L_{min} = 2 d_{prop} R\).
- CSMA/CA: no detection; DIFS, random backoff, ACK, RTS/CTS.
- Taking turns: polling (master, polling delay) and token passing (token loss, large ring delay).
:::

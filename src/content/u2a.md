@@unit u2 | Unit II | Transport Layer and Network Layer | How data is delivered reliably between processes over an unreliable network (UDP, reliable data transfer, TCP, congestion control), and how datagrams find their way across routers (router architecture, IP, addressing, routing).

This unit carries the heaviest exam weight. Every end-semester paper has a TCP congestion-control question and a routing-algorithm question, and RDT, Go-Back-N/Selective Repeat and subnetting appear in most papers. Read the RDT topics slowly and use the simulators: every later idea in TCP is built from them.

@@group Transport layer
@@topic u2-transport | II.1 | Transport-layer services | What the transport layer adds on top of the network layer: logical communication between processes, and the services TCP and UDP offer. | Kurose §3.1 · Chapter_3_v8.2 slides 2–8

## Logical communication between processes

A transport-layer protocol provides **logical communication** between **application processes** running on different hosts. “Logical” means that, from the application's point of view, it is as if the hosts were directly connected, even though they may be on opposite sides of the planet with many routers and links between them.

Transport-layer protocols run **in the end systems, not in routers**:

- At the **sender**, the transport layer converts application messages into transport-layer packets called **segments**: it breaks a long message into smaller chunks, adds a transport header to each, and passes each segment to the network layer, which wraps it in a datagram.
- At the **receiver**, the network layer extracts the segment from the datagram and passes it up; the transport layer processes it and delivers the data to the right application.

Routers act only on the network-layer fields of the datagram; they never look at the segment inside.

## Transport layer vs network layer

The network layer provides logical communication between **hosts**; the transport layer provides logical communication between **processes**.

:::analogy Two houses of cousins (Kurose)
Twelve children in Ann's house in Mumbai write letters to twelve cousins in Bill's house in Coimbatore every week. Ann collects the letters in her house and hands them to the postal service; Bill collects arriving letters in his house and distributes them to his siblings.

| In the analogy | In the network |
|---|---|
| Letters in envelopes | Application messages |
| Cousins | Processes |
| Houses | Hosts |
| Ann and Bill | The transport-layer protocol |
| The postal service | The network-layer protocol |

Ann and Bill work only inside their houses: they don't sort letters in post offices. And if Ann and Bill are replaced by Susan and Harvey, who are younger and sometimes lose letters, the house gets a worse “transport service” even though the postal service hasn't changed. Likewise, the services a transport protocol can offer are limited by the network layer underneath: if the post can't promise a delivery time, Ann and Bill can't promise one either.
:::

Some services can be built on top of a network layer that doesn't offer them. IP doesn't guarantee delivery, but TCP still delivers reliably by retransmitting. IP doesn't encrypt, but a transport layer could. What a transport layer **cannot** add on its own are **delay guarantees** and **bandwidth guarantees**, because those depend on what happens inside the routers.

| | Transport layer | Network layer |
|---|---|---|
| Logical communication between | Processes | Hosts |
| Runs in | End systems only | End systems and every router |
| Unit | Segment | Datagram |
| Addressing | Port numbers | IP addresses |
| Internet protocols | TCP, UDP | IP (+ routing protocols) |

## The Internet's network layer: best effort

The Internet's network-layer protocol, **IP (Internet Protocol)**, provides a **best-effort delivery service**: it makes its “best effort” to deliver segments between hosts, but makes **no guarantees**. It doesn't guarantee delivery, doesn't guarantee in-order delivery, and doesn't guarantee the integrity of the data. IP is therefore an **unreliable service**. Every host has at least one IP address.

## What UDP and TCP add

The most basic job of the transport layer is to **extend IP's host-to-host delivery to process-to-process delivery**. This is called **transport-layer multiplexing and demultiplexing** (Topic II.2). Both UDP and TCP also provide **integrity checking** by including error-detection fields in their headers.

| Service | UDP | TCP |
|---|---|---|
| Process-to-process delivery (mux/demux) | Yes | Yes |
| Error checking (checksum) | Yes | Yes |
| Reliable, in-order delivery | No | Yes: flow control, sequence numbers, acknowledgements, timers |
| Congestion control | No | Yes: prevents any one connection from swamping the links and routers |
| Connection setup | None | Three-way handshake |
| Delay or bandwidth guarantees | No | No |

:::exam Exam focus
- “Transport provides logical communication between processes; network between hosts”: a standard two-mark distinction, best illustrated with the household analogy.
- Know what IP's best-effort service does **not** guarantee, and which of those TCP fixes.
- {{paper:20CYS303 Mid 2023 Q4}}: differentiate TCP and UDP. Use the table above plus header sizes (UDP 8 bytes, TCP 20 bytes) and example applications.
:::

:::rev Quick revision
- Transport = logical communication between processes; runs only in end systems; unit = segment.
- IP = best effort: no guarantee of delivery, order or integrity.
- Both TCP and UDP: mux/demux and checksums. TCP adds reliability, flow control, congestion control and connections.
- No transport protocol can add delay or bandwidth guarantees on its own.
:::

@@topic u2-mux | II.2 | Multiplexing and demultiplexing | How the transport layer delivers each arriving segment to the right socket using port numbers: two-tuples for UDP, four-tuples for TCP, and why a web server has many sockets on port 80. | Kurose §3.2 · Chapter_3_v8.2 slides 9–22

## The problem

A host receives segments for many processes at once: a browser with several tabs, a mail client, a music app, an SSH session. Each process has one or more **sockets**. When a segment arrives, the transport layer must hand it to the **correct socket**.

- **Demultiplexing**: at the receiver, delivering the data in a transport segment to the correct socket.
- **Multiplexing**: at the sender, gathering data chunks from different sockets, encapsulating each with header information (to be used later in demultiplexing), and passing the segments to the network layer.

:::analogy Bill sorting letters
Demultiplexing is Bill taking the letters the postman delivers and handing each to the right sibling by reading the name. Multiplexing is Ann collecting letters from all her siblings and handing them to the postman.
:::

## Port numbers

Each segment carries two special header fields: the **source port number** and the **destination port number**. Each is a **16-bit** number from 0 to 65535. Ports **0 to 1023** are **well-known port numbers**, reserved for well-known application protocols: HTTP 80, HTTPS 443, FTP 21 and 20, SMTP 25, DNS 53, SSH 22, Telnet 23, POP3 110, IMAP 143.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 120" role="img" aria-label="TCP and UDP segment format: 32 bits wide, with source port and destination port in the first word">
<text x="340" y="16" class="c-muted" text-anchor="middle">32 bits</text>
<rect x="140" y="24" width="200" height="28" class="g-box"/><text x="240" y="43" class="c-text" text-anchor="middle">source port #</text>
<rect x="340" y="24" width="200" height="28" class="g-box"/><text x="440" y="43" class="c-text" text-anchor="middle">dest port #</text>
<rect x="140" y="52" width="400" height="28" class="g-host"/><text x="340" y="71" class="c-text" text-anchor="middle">other header fields</text>
<rect x="140" y="80" width="400" height="34" class="g-node"/><text x="340" y="102" class="c-text" text-anchor="middle">application data (message)</text>
</svg></div><figcaption>Every TCP and UDP segment begins with the source and destination port numbers.</figcaption></figure>
:::

To demultiplex, the host's operating system reads the destination port number in the arriving segment and directs it to the corresponding socket. The segment's data then passes through the socket to the attached process.

## Connectionless (UDP) demultiplexing

A UDP socket is fully identified by a **two-tuple**: **(destination IP address, destination port number)**.

- If two UDP segments have **different source IP addresses and/or source ports** but the **same destination IP address and destination port**, they are delivered to the **same** destination process through the same socket.
- The **source port** serves as part of a “return address”: when the receiver wants to reply, it takes the source port from the arriving segment and uses it as the destination port of the reply.
- The client side usually lets the transport layer assign a port automatically from 1024–65535 (an **ephemeral port**); the server side uses a specific port.

:::graph UDP: segments from two different hosts with the same destination port reach the same socket at the server.
B 80 50 host "Host B, port 9157"
C 80 170 host "Host C, port 5775"
A 520 110 box "Host A: UDP socket 6428"
B>A
C>A
text 230 60 source 9157 → dest 6428
text 230 182 source 5775 → dest 6428
:::

## Connection-oriented (TCP) demultiplexing

A TCP socket is identified by a **four-tuple**: **(source IP address, source port number, destination IP address, destination port number)**. When a TCP segment arrives, the host uses **all four values** to direct it to the right socket.

- Two arriving TCP segments with **different source IP addresses or source port numbers** are directed to **two different sockets**, even if they have the same destination port (with one exception: segments carrying the original connection-establishment request).
- A TCP server application has a **welcoming socket** that waits for connection requests on a well-known port (say 6789, or 80 for a web server). When a client's connection-establishment segment arrives, the server creates a **new connection socket** identified by the four-tuple of that client. All later segments from that client, matching all four values, go to that socket.
- So one server host can support many simultaneous TCP connection sockets, **all with the same local port 80**, each identified by its own four-tuple.

:::graph TCP: three clients connect to one web server on port 80; the server keeps a separate socket for each four-tuple.
A 80 40 host "A: IP A, port 26145"
C1 80 130 host "C: IP C, port 7532"
C2 80 220 host "C: IP C, port 26145"
S 520 130 box "Server B, port 80"
A>S
C1>S
C2>S
text 300 40 (A, 26145, B, 80)
text 300 118 (C, 7532, B, 80)
text 300 232 (C, 26145, B, 80)
:::

Notice that A and C both use source port 26145. That's fine: the source IP addresses differ, so the four-tuples differ and the server keeps them apart.

### Web servers and persistent HTTP

Today's high-performance web servers often use one process and create a **new thread** with a new connection socket for each client connection. With **persistent HTTP**, the client and server exchange all messages over the **same** server socket for the connection's lifetime. With **non-persistent HTTP**, a new TCP connection, and therefore a **new socket**, is created and closed for **every** request/response, which can severely affect a busy server's performance.

| | UDP socket | TCP socket |
|---|---|---|
| Identified by | 2-tuple: (dest IP, dest port) | 4-tuple: (source IP, source port, dest IP, dest port) |
| Segments from different senders to the same port | Go to the **same** socket | Go to **different** sockets |
| Server side | One socket serves all clients | A welcoming socket + one connection socket per client |
| How the receiver learns who sent it | From the source IP and port in the datagram (returned with the data) | Implicit: each socket belongs to one connection |

:::ex From a paper | Port numbers for two clients {{paper:19CSE301 Jan 2023 Q3}}
Client A and client B each start an HTTP session with server S at about the same time.

:::solve
Given: HTTP over TCP; server port 80; clients choose ephemeral ports.
Required: Possible source and destination ports for A→S, B→S, S→A, S→B; whether A and B can use the same source port if they are different hosts, and if they are the same host.
Formula: TCP demultiplexes on the 4-tuple; replies swap source and destination.
Substitution: Pick A's port = 26145 and B's port = 7532.
Calculation: A→S: source 26145, destination 80. B→S: source 7532, destination 80. S→A: source 80, destination 26145. S→B: source 80, destination 7532.
Answer: (v) If A and B are different hosts, yes, they may use the same source port, because their IP addresses differ, so the four-tuples differ. (vi) If they are the same host, no: two connections from the same host to the same server port must have different source ports, or the four-tuples (and sockets) would be identical.
:::
:::

:::ex From a paper | One UDP socket, two senders {{paper:19CSE301 Mid 2023 Q4}}
A process in Host A has a UDP socket with port 2893. Hosts B and C each send a UDP segment to Host A with destination port 2893.

:::solve
Given: UDP demultiplexes on (dest IP, dest port) = (A, 2893) for both segments.
Required: Do both go to the same socket? How does the process tell them apart? When would a developer prefer UDP?
Formula: UDP socket = 2-tuple.
Substitution: Both segments have destination (A, 2893).
Calculation: Same 2-tuple → same socket.
Answer: Yes, both are delivered to the same socket. The operating system passes the **source IP address and source port** of each segment up with the data (for example through recvfrom), so the process knows one came from B and the other from C, and can reply to each. UDP is preferred when the application wants finer control over timing (no congestion control throttling), no connection-setup delay, no connection state at a busy server, and small header overhead: DNS, live streaming, Internet telephony, online games, network management (SNMP).
:::
:::

:::ex From a paper | Sockets at a web server {{paper:19CCE304 Mid 2023 Q5}} {{paper:19CSE301 Mid 2024 Q7}}
:::solve
Given: A web server on port 80 at Host C uses persistent connections and is receiving requests from Hosts A and B. In the second question, a client at port 12000 connects to the Apache server at www.cnn.com, and then a second browser on the same client connects too.
Required: Are all requests sent through the same socket at C? Do the sockets have port 80? Give four-tuples.
Formula: TCP connection socket = 4-tuple.
Substitution: A's connection: (A, a, C, 80). B's: (B, b, C, 80). CNN: (client, 12000, cnn, 80) and (client, 12001, cnn, 80).
Calculation: Different source IPs (or source ports) give different four-tuples.
Answer: No: the requests from A and from B pass through **different** sockets at C, but both sockets have local port 80. The two CNN browser instances get separate connections and sockets, (client IP, 12000, cnn IP, 80) and (client IP, 12001, cnn IP, 80); they do not share a connection. (If the same requests used UDP, the server would see one socket, (cnn IP, 80), for both.)
:::
:::

:::tip Port scanning
A program such as nmap sends a TCP connection request to a port (or a UDP segment) on a target host to find which ports have an application listening. Administrators use it to audit their machines; attackers use it to find servers with known vulnerabilities.
:::

:::exam Exam focus
- Port-number and socket questions appeared in four papers. Always write the four-tuple for TCP and the two-tuple for UDP.
- Draw the welcoming socket and per-connection sockets for a TCP server.
- Explain why a server with non-persistent HTTP creates many sockets.
:::

:::mistake Common mistakes
- Saying a server's connection sockets get new port numbers. They all keep the server's port (80); the four-tuples differ.
- Saying UDP segments from different senders go to different sockets. UDP uses only the destination IP and port.
- Swapping source and destination ports in the reply direction.
:::

:::rev Quick revision
- Demultiplexing (receiver): segment → right socket. Multiplexing (sender): sockets' data → segments with headers.
- Ports: 16 bits (0–65535); well-known 0–1023.
- UDP socket = (dest IP, dest port). TCP socket = (source IP, source port, dest IP, dest port).
- A TCP server has a welcoming socket and one connection socket per client, all on the same port.
:::

@@topic u2-udp | II.3 | UDP and the Internet checksum | The no-frills transport protocol: why applications choose it, its 8-byte header, and how the 16-bit one's-complement checksum (with Forouzan's pseudoheader) detects errors. | Kurose §3.3 · Forouzan §23.2 · Chapter_3_v8.2 slides 23–33 · Chapter3-Problems

## What UDP does, and doesn't do

**UDP (User Datagram Protocol, RFC 768)** does just about as little as a transport protocol can: multiplexing/demultiplexing and light error checking. It adds almost nothing to IP. An application that chooses UDP is talking almost directly with IP.

UDP takes messages from the application, attaches the source and destination port fields and two other small fields, and passes the segment to the network layer. There is **no handshaking** between sender and receiver before sending, which is why UDP is called **connectionless**. UDP segments may be lost or delivered out of order to the application.

## Why would anyone choose UDP over TCP?

1. **Finer application control over what data is sent, and when.** As soon as the application hands data to UDP, UDP packages it and passes it to the network layer. TCP, in contrast, has congestion control that may throttle the sender, and keeps resending a segment until it is acknowledged, however long that takes. Real-time applications often need a minimum sending rate, don't want excessive delay, and can tolerate some loss.
2. **No connection establishment.** TCP's three-way handshake adds delay before data flows; UDP adds none. This is the main reason **DNS** runs over UDP. It is also why QUIC (used by HTTP/3) is built on UDP.
3. **No connection state.** TCP keeps receive and send buffers, congestion-control parameters and sequence/acknowledgement numbers per connection. UDP keeps none, so a server can support many more active clients.
4. **Small packet header overhead.** UDP's header is **8 bytes**; TCP's is **20 bytes**.

| Application | Application protocol | Transport |
|---|---|---|
| Email, remote terminal, web, file transfer | SMTP, Telnet/SSH, HTTP, FTP | TCP |
| Name translation | DNS | Typically UDP |
| Network management | SNMP | Typically UDP |
| Streaming multimedia, Internet telephony | Often proprietary | UDP or TCP |
| HTTP/3 | QUIC | UDP |

Running a multimedia app over UDP is controversial, because UDP has no congestion control: if everyone streamed high-rate video over UDP, routers would overflow and few UDP packets would get through, while the TCP sessions sharing those links would slow to a crawl. An application can still get reliable transfer over UDP by **building reliability into the application** itself (acknowledgements and retransmissions), as QUIC does.

## UDP segment structure

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 130" role="img" aria-label="UDP segment: source port, destination port, length, checksum, each 16 bits, then application data">
<text x="340" y="16" class="c-muted" text-anchor="middle">32 bits</text>
<rect x="140" y="24" width="200" height="28" class="g-box"/><text x="240" y="43" class="c-text" text-anchor="middle">source port # (16)</text>
<rect x="340" y="24" width="200" height="28" class="g-box"/><text x="440" y="43" class="c-text" text-anchor="middle">dest port # (16)</text>
<rect x="140" y="52" width="200" height="28" class="g-box"/><text x="240" y="71" class="c-text" text-anchor="middle">length (16)</text>
<rect x="340" y="52" width="200" height="28" class="g-box"/><text x="440" y="71" class="c-text" text-anchor="middle">checksum (16)</text>
<rect x="140" y="80" width="400" height="40" class="g-node"/><text x="340" y="104" class="c-text" text-anchor="middle">application data (message)</text>
</svg></div><figcaption>The UDP header has four 16-bit fields: 8 bytes in total.</figcaption></figure>
:::

- **Source port** and **destination port**: for multiplexing and demultiplexing.
- **Length**: the number of bytes in the UDP segment, **header plus data**. It is needed because the data field size differs from segment to segment.
- **Checksum**: used by the receiver to check whether errors have been introduced into the segment.

:::tip From a paper {{paper:19CSE301 Mid 2024 Q5(b,c)}}
Why does UDP's length field count header plus data, while TCP's header-length field counts only the header? Because a UDP datagram is a self-contained message and the receiver needs its total size, whereas TCP is a byte stream: TCP's header length is needed because TCP has variable-length options, and the amount of data is found from the IP datagram's length minus the headers. Fields common to TCP and UDP: **source port, destination port and checksum**.
:::

## The Internet checksum

**Why does UDP check for errors when many link-layer protocols already do?** Because there is no guarantee that **every** link between source and destination checks for errors, and because bit errors can be introduced while a segment is stored in a router's memory. Since neither link-by-link reliability nor in-memory error detection is guaranteed, UDP must provide error detection **end to end**, if the end-to-end service is to provide it. This is an example of the **end-end principle**: functions placed at low levels may be redundant or of little value compared with providing them at a higher level.

### How to compute it (sender)

1. Divide the data to be checked into **16-bit words**.
2. Add all the words using **one's-complement arithmetic**: add normally, and whenever the sum carries out of the 16th bit, **wrap the carry around** and add it to the least significant bit.
3. Take the **one's complement** of the final sum (flip every bit). That is the checksum, placed in the checksum field.

### How to check it (receiver)

Add all the 16-bit words **including the checksum**. If there are no errors, the result is **1111111111111111** (all ones). If any bit of the result is 0, an error has been detected.

:::fx Internet checksum
\[ \text{checksum} = \overline{\,w_1 \oplus_1 w_2 \oplus_1 \cdots \oplus_1 w_n\,} \]
where \( \oplus_1 \) is 16-bit addition with end-around carry and the bar is bitwise complement. At the receiver: \( w_1 \oplus_1 \cdots \oplus_1 w_n \oplus_1 \text{checksum} = \texttt{FFFF} \).
:::

### The pseudoheader (Forouzan §23.2)

The UDP checksum covers more than the segment. Before computing it, the sender prepends a 12-byte **pseudoheader** taken from the IP header: the **32-bit source IP address**, the **32-bit destination IP address**, 8 bits of zeros, the 8-bit **protocol** field (17 for UDP), and the 16-bit **UDP length**. The pseudoheader is used only in the calculation; it is not sent. It ensures that a datagram delivered to the wrong host (because of an error in the IP address) or to the wrong protocol is caught. If the sender chooses not to compute a checksum, the field is all zeros; so if a computed checksum happens to be all zeros, it is sent as all ones (both mean zero in one's complement).

## Worked numericals

:::ex Level 1 | Two words (Chapter3-Problems)
:::solve
Given: \(w_1 = 01000010\ 00010110\), \(w_2 = 11110101\ 10111000\).
Required: The Internet checksum.
Formula: One's-complement sum with wraparound, then complement.
Substitution: In hex: \(w_1 = \texttt{4216}\), \(w_2 = \texttt{F5B8}\).
Calculation: \(\texttt{4216} + \texttt{F5B8} = \texttt{1 37CE}\). The carry 1 wraps around: \(\texttt{37CE} + 1 = \texttt{37CF}\) = 00110111 11001111. Complement: 11001000 00110000.
Answer: Checksum = 11001000 00110000 (0xC830).
:::
:::

:::ex From a paper | Three words, sender and receiver {{paper:19CSE301 End 2023 Q3(b)(ii)}}
:::solve
Given: \(w_1 = 0110011001100000\), \(w_2 = 0101010101010101\), \(w_3 = 1000111100001100\).
Required: The checksum at the sender, and the check at the receiver.
Formula: Sum with wraparound; complement; receiver sums all four words.
Substitution: \(w_1 + w_2\) first.
Calculation:
  0110011001100000
  + 0101010101010101 = 1011101110110101 (no carry out).
  1011101110110101 + 1000111100001100 = 1 0100101011000001 → wrap: 0100101011000001 + 1 = **0100101011000010**.
  Complement: **1011010100111101**.
  Receiver: 0100101011000010 + 1011010100111101 = 1111111111111111.
Answer: Checksum = 1011010100111101. The receiver's sum of all four words is 1111111111111111, so no error is detected.
:::
:::

:::ex From a paper | Weather balloon, six hex words {{paper:23CSE302 Mid 2025 Q3(b)}}
:::solve
Given: Six 16-bit words: 0x4500, 0x0073, 0x0000, 0x4000, 0x4011, 0xB861.
Required: The UDP checksum value.
Formula: Running one's-complement sum, then complement.
Substitution: Add word by word, wrapping any carry out of 16 bits.
Calculation: 0x4500 + 0x0073 = 0x4573. + 0x0000 = 0x4573. + 0x4000 = 0x8573. + 0x4011 = 0xC584. + 0xB861 = 0x17DE5 → wrap: 0x7DE5 + 0x1 = **0x7DE6**. Complement: 0xFFFF − 0x7DE6 = **0x8219**.
Answer: Checksum = 0x8219 (1000 0010 0001 1001). Check: 0x7DE6 + 0x8219 = 0xFFFF.
:::
:::

:::ex From a paper | A sum that is already all ones {{paper:20CYS303 End 2025 Q5}}
:::solve
Given: Word A = 1110 0011 1011 0100 (0xE3B4); Word B = 0001 1100 0100 1011 (0x1C4B).
Required: (a) The checksum, showing the sum, any wraparound and the complement. (b) Why the checksum is “weak protection”.
Formula: Sum, wrap, complement.
Substitution: 0xE3B4 + 0x1C4B.
Calculation: 1110001110110100 + 0001110001001011 = 1111111111111111 (0xFFFF); no carry out, so no wraparound. Complement: 0000000000000000.
Answer: (a) Checksum = 0x0000 (UDP would transmit it as 0xFFFF, since an all-zero field means “no checksum”). (b) The one's-complement sum is commutative and only adds columns, so it misses errors that keep the sum unchanged: if a bit flips from 0 to 1 in one word and the **same bit position** flips from 1 to 0 in another word, the sum and checksum are identical and the error passes undetected; reordering the words also goes undetected. CRC (Unit III) is far stronger.
:::
:::

!!sim visualizations/link/error-detection.html | Checksum, parity and CRC workbench | Type your own 16-bit words to see the running sum, every wraparound and the complement; then flip bits and see which errors the checksum misses.

:::exam Exam focus
- Internet checksum calculations appeared in three papers, including your own course's mid-term. Show **every** partial sum and **every** wraparound.
- Know all four UDP header fields and what the length field counts.
- Give the four reasons for choosing UDP, and DNS as the classic example.
- Explain why UDP needs a checksum when links have one (end-end principle).
:::

:::mistake Common mistakes
- Dropping the carry instead of wrapping it around.
- Forgetting the final complement (giving the sum as the checksum).
- At the receiver, forgetting to add the checksum itself.
- Saying UDP corrects errors. It only detects them (and usually discards the segment, or passes it up with a warning).
:::

:::rev Quick revision
- UDP: connectionless, unreliable, no congestion control; 8-byte header (src port, dst port, length, checksum).
- Choose UDP for timing control, no setup delay, no state, small header: DNS, SNMP, streaming, QUIC.
- Checksum: 16-bit words, one's-complement sum with wraparound, complement. Receiver sum = all ones.
- UDP checksum also covers a pseudoheader (IP addresses, protocol 17, length).
- Weak: misses compensating bit errors in the same column, and reordering.
:::

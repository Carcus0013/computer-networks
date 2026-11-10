@@group Application layer
@@topic u1-apps | I.9 | Principles of network applications | How applications are organised (client-server or peer-to-peer), how their processes talk through sockets, how a process is addressed, and how to choose between TCP and UDP. | Kurose §2.1 · Chapter_2_v8.2 slides 2–16

## Where applications live

A network application is a set of programs running on **different end systems** that communicate over the network: a browser and a web server; WhatsApp on two phones. You write software only for the end systems, never for the routers. Network-core devices don't run applications; they work only at the network layer and below. This is what lets new applications spread so fast.

## Two application architectures

:::two
#### Client-server
An **always-on host, the server**, serves requests from many other hosts, the **clients**. Clients don't talk directly to each other. The server has a **fixed, well-known IP address**, so a client can always reach it. Popular services use **data centres** with many servers, because one server can't keep up.

Examples: the web, email, FTP, AUMS, online banking.
---
#### Peer-to-peer (P2P)
There is little or no reliance on always-on servers. Pairs of intermittently connected hosts, called **peers**, communicate directly. Peers are owned by users (laptops, desktops), change IP addresses, and come and go.

Its key feature is **self-scalability**: each new peer adds service demand, but also adds service capacity by uploading to others.

Examples: BitTorrent file sharing, some video-calling systems.
:::

| Feature | Client-server | Peer-to-peer |
|---|---|---|
| Who serves data | A dedicated always-on server | The peers themselves |
| Address of the provider | Fixed, well known | Peers change addresses |
| Scalability | Needs more servers or data centres as clients grow | Self-scaling: every peer adds upload capacity |
| Cost | Expensive infrastructure and bandwidth for the provider | Cheap for the provider |
| Management and security | Centralised, easier to secure and control | Hard: peers are untrusted, distributed, intermittent |
| Reliability | The server is a single point of failure | No single point of failure, but peers leave |
| Typical application | Web, email, FTP, banking | BitTorrent, file sharing |

:::exam From a paper {{paper:19CSE301 Jan 2023 Q2}}
“Compare client-server with P2P and give a suitable application for each” (5 marks). Use the table above, and name the web (client-server) and BitTorrent (P2P).
:::

## Processes communicate by exchanging messages

It is not hosts but **processes** (programs being executed) that communicate. Processes on the same host use inter-process communication from the operating system; processes on different hosts exchange **messages** across the network.

In every pair of communicating processes, one is labelled the **client** and the other the **server**: the process that **initiates** the communication is the client; the process that **waits to be contacted** is the server. In P2P file sharing a peer is a client when downloading and a server when uploading.

### The socket: the door between the process and the network

A process sends and receives messages through a software interface called a **socket**. A socket is the interface between the application layer and the transport layer within a host; it is also called the **API** (application programming interface) between the application and the network.

:::analogy A house and its door
A process is like a house and its socket is like the door. To send a message, the process pushes it out of the door. It relies on the transport infrastructure on the other side of the door to carry the message to the door of the destination process. The application developer controls everything inside the house, but outside the door they can only choose the transport protocol (TCP or UDP) and set a few parameters, such as the maximum buffer size.
:::

### Addressing a process

To deliver a message to a process on another host, the sender needs two pieces of information:

1. the **IP address** of the destination host (a 32-bit number in IPv4) to find the host, and
2. a **port number** that identifies the receiving process (socket) on that host.

Popular applications have well-known port numbers: a web server listens on **port 80** (443 for HTTPS), a mail server on **port 25**, a DNS server on **port 53**, FTP control on **port 21**.

## What transport services does an application need?

Applications can be classified by four requirements.

| Requirement | Meaning | Who needs it |
|---|---|---|
| **Reliable data transfer** | Every byte arrives, correct and in order | Email, file transfer, web documents, banking. **Loss-tolerant** apps (audio, video) can live with some loss |
| **Throughput** | A guaranteed minimum rate | **Bandwidth-sensitive** apps such as video at a fixed bit rate. **Elastic** apps (email, file transfer, web) use whatever they get |
| **Timing** | A bound on delay | Internet telephony, video conferencing, multiplayer games (under a few hundred ms) |
| **Security** | Confidentiality, integrity, end-point authentication | Banking, login, private messaging |

| Application | Data loss | Throughput | Time-sensitive |
|---|---|---|---|
| File transfer / download | No loss | Elastic | No |
| Email | No loss | Elastic | No |
| Web documents | No loss | Elastic (few kbps) | No |
| Internet telephony / video conferencing | Loss-tolerant | Audio: few kbps–1 Mbps; video: 10 kbps–5 Mbps | Yes, 100s of ms |
| Streaming stored audio/video | Loss-tolerant | Same as above | Yes, a few seconds |
| Interactive games | Loss-tolerant | Few kbps–10 kbps | Yes, 100s of ms |
| Smartphone messaging | No loss | Elastic | Yes and no |

## The two Internet transport services

:::two
#### TCP
- **Connection-oriented**: client and server exchange control information (a handshake) before data flows; then a full-duplex connection exists between their sockets.
- **Reliable**: delivers all data without error and in the proper order.
- **Congestion control**: throttles the sender when the network is congested.
- Does **not** give throughput or timing guarantees.
---
#### UDP
- **Connectionless**: no handshake.
- **Unreliable**: no guarantee that a message arrives, or arrives in order.
- **No congestion control**: the sender can push data at any rate it likes.
- Lightweight and fast to start.
:::

Neither TCP nor UDP provides encryption. **TLS** (Transport Layer Security) is a layer added on top of TCP, implemented in the application, that provides encryption, data integrity and end-point authentication. HTTPS is HTTP over TLS.

| Application | Application-layer protocol | Transport |
|---|---|---|
| Email | SMTP | TCP |
| Remote terminal access | Telnet, SSH | TCP |
| Web | HTTP 1.1 (HTTP/3 runs over QUIC/UDP) | TCP |
| File transfer | FTP | TCP |
| Streaming multimedia | HTTP (e.g. YouTube, DASH) | TCP |
| Internet telephony | SIP, RTP or proprietary (e.g. Skype) | UDP or TCP |
| Name translation | DNS | Usually UDP |

## What an application-layer protocol defines

1. The **types** of messages exchanged (request and response messages).
2. The **syntax** of each message type: its fields and how they are delimited.
3. The **semantics** of the fields: what the information means.
4. The **rules** for when and how a process sends messages and responds.

Some protocols are **open** and defined in RFCs (HTTP, SMTP), so anyone can build compatible software; others are **proprietary** (Skype, Zoom).

:::ex From a paper | Choosing TCP or UDP {{paper:19CSE301 Mid 2024 Q5(a)}} {{paper:23CSE302 Mid 2025 Q3(a)}}
:::solve
Given: Applications: Apple Mail, Microsoft Edge (web browsing), Skype (voice/video calls), name translation; and in 23CSE302: live video streaming, DNS queries, web browsing, email.
Required: Transport protocol, application protocol and loss tolerance for each; and which suit UDP.
Formula: Use TCP when every byte must arrive; UDP when timeliness matters more than completeness, or for one-message request/reply exchanges.
Substitution: Look up each application's requirement in the tables above.
Calculation: Apple Mail: TCP, SMTP to send and IMAP to read, not loss-tolerant. Edge: TCP, HTTP/HTTPS, not tolerant. Skype: UDP (falls back to TCP), proprietary, loss-tolerant. Name translation: UDP, DNS, not tolerant (it retries instead).
Answer: UDP suits **live video streaming** (a late frame is useless, so retransmission doesn't help; a lost frame just causes a brief glitch) and **DNS queries** (a single short query and reply; no connection setup delay; the client simply resends if no reply arrives). Web browsing and email need TCP because a missing byte corrupts the page or message.
:::
:::

:::mistake Common mistakes
- Saying “the client is the smaller machine”. The client is the process that **initiates** contact.
- Forgetting that a port identifies a **process** (socket), and the IP address a **host**.
- Saying TCP guarantees throughput or delay. It guarantees only reliable, in-order delivery.
:::

:::rev Quick revision
- Architectures: client-server (always-on server, fixed address) vs P2P (peers, self-scalability).
- Client process initiates; server process waits.
- Socket = door between process and transport layer. Process address = IP address + port.
- App needs: reliability, throughput, timing, security.
- TCP: connection-oriented, reliable, congestion control. UDP: none of these. TLS adds security on top of TCP.
:::

@@topic u1-http | I.10 | The Web and HTTP | How a browser fetches a page: objects and URLs, non-persistent and persistent connections and their timing, request and response messages, cookies, web caches, conditional GET, and HTTP/2 and HTTP/3. | Kurose §2.2 · Chapter_2_v8.2 slides 17–53 · quiz 1 · Chapter2-Problems

## The Web in one paragraph

A **web page** consists of **objects**. An object is simply a file (an HTML file, a JPEG image, a JavaScript file, a video clip) addressable by a single URL. Most pages consist of a **base HTML file** and several referenced objects: a page with HTML text and five images has six objects. Each URL has two parts, the **host name** of the server and the object's **path name**:

`http://www.amrita.edu/campus/images/logo.png` → host `www.amrita.edu`, path `/campus/images/logo.png`.

## HTTP overview

**HTTP (HyperText Transfer Protocol)** is the Web's application-layer protocol. It is implemented in two programs, a client (the browser) and a server (a web server such as Apache or Nginx), which talk by exchanging HTTP messages.

- HTTP uses **TCP**. The client opens a TCP connection to the server's **port 80**. Once connected, browser and server access TCP through their sockets. Because TCP is reliable, HTTP doesn't worry about lost data.
- HTTP is **stateless**: the server keeps no information about past client requests. If the same client asks for the same object twice in a few seconds, the server sends it again. (Cookies, below, add state on top.)

## Non-persistent and persistent connections

An application must decide whether each request/response pair goes over its own TCP connection or all requests go over the same one.

- **Non-persistent HTTP**: at most one object is sent over a TCP connection, and the connection is then closed. Downloading several objects needs several connections. (HTTP/1.0.)
- **Persistent HTTP**: the server leaves the connection open after responding, and later requests and responses between the same client and server use the same connection. (HTTP/1.1 default.) With **pipelining**, the client sends requests back to back without waiting for each response.

### Round-trip time and the response time of one object

The **round-trip time (RTT)** is the time for a small packet to travel from client to server and back. It includes propagation, queuing and processing delays.

With non-persistent HTTP, fetching one object takes:

:::seq Client | Server
1>2 TCP SYN (initiate connection)
2>1 a SYN-ACK
1>2 ACK + HTTP GET request
2>1 a HTTP response (file)
1: file received at 2 RTT + transmission time
:::

1. The client initiates a TCP connection (sends a small segment); the server acknowledges. **One RTT** has passed.
2. The client sends the HTTP request together with the third part of the handshake; the server sends the file. **One more RTT**, plus the time the server needs to transmit the file.

:::fx Response time per object
Non-persistent: \( 2\,\text{RTT} + \text{file transmission time} \) for **every** object.

Persistent: \( 2\,\text{RTT} \) for the first object (connection + request), then about **1 RTT** per further object (or 1 RTT for all of them with pipelining).
:::

| Mode (base page + n small objects, RTT dominating) | Total time |
|---|---|
| Non-persistent, no parallel connections | \( 2 + 2n \) RTT |
| Non-persistent, \(k\) parallel connections | \( 2 + 2\lceil n/k \rceil \) RTT |
| Persistent, without pipelining | \( 2 + n \) RTT |
| Persistent, with pipelining | \( 2 + 1 \) = 3 RTT |

Add the DNS lookup time before the first TCP connection if the host name isn't cached.

| Non-persistent HTTP | Persistent HTTP |
|---|---|
| New TCP connection per object | One TCP connection for many objects |
| 2 RTT per object | 1 RTT per object after the first (or less with pipelining) |
| Server must allocate buffers and variables per connection, a heavy load | Less overhead at client and server |
| Often uses parallel connections to compensate | Default in HTTP/1.1 |
| Connection closed after each response | Server closes an idle connection after a timeout |

!!sim visualizations/application/http.html | HTTP request–response timing | Animate DNS lookup, the TCP handshake and every GET for non-persistent, parallel, persistent and pipelined modes, with the RTTs added up as you go.

## HTTP message format

### Request message

```
GET /somedir/page.html HTTP/1.1
Host: www.someschool.edu
Connection: close
User-agent: Mozilla/5.0
Accept-language: fr
```

- The first line is the **request line**: a **method** field, a **URL** field and the **HTTP version**.
- The following lines are **header lines**. `Host` names the server (needed by web caches); `Connection: close` asks for non-persistent behaviour; `User-agent` names the browser; `Accept-language` says the user prefers French.
- A **blank line** (carriage return and line feed) ends the headers, followed by an optional **entity body**.

| Method | Purpose |
|---|---|
| GET | Request an object (the most common). Form input can go in the URL: `/search?q=networks` |
| POST | Send form data in the entity body (e.g. a login form) |
| HEAD | Like GET, but the response carries no object; used for debugging |
| PUT | Upload an object to a given path on the server |
| DELETE | Delete an object on the server |

### Response message

```
HTTP/1.1 200 OK
Connection: close
Date: Tue, 18 Aug 2015 15:44:04 GMT
Server: Apache/2.2.3 (CentOS)
Last-Modified: Tue, 18 Aug 2015 15:11:03 GMT
Content-Length: 6821
Content-Type: text/html

(data data data ...)
```

The **status line** has the protocol version, a status code and a phrase. Then header lines, a blank line and the entity body (the object).

| Code | Meaning |
|---|---|
| 200 OK | Request succeeded; the object is in the body |
| 301 Moved Permanently | The object moved; the new URL is in the `Location:` header |
| 304 Not Modified | The cached copy is up to date (conditional GET); no object sent |
| 400 Bad Request | The server could not understand the request |
| 404 Not Found | The object does not exist on the server |
| 505 HTTP Version Not Supported | The server doesn't support the HTTP version |

:::ex From a paper | Reading a server's response {{paper:19CCE304 End 2023 Q2}}
The paper showed a response beginning `HTTP/1.1 200 OK`, with `Date: Tue, 07 Mar 2008 12:39:45GMT`, `Last-Modified: Sat, 10 Dec2005 18:27:46 GMT`, `Content-Length: 3874`, `Connection: Keep-Alive`, followed by a body starting `<!doctype html ...`.

:::solve
Given: The status line and header lines of the response.
Required: (A) Was the document found, and when was the reply sent? (B) When was it last modified? (C) How many bytes? (D) The first 5 bytes, and was a persistent connection agreed?
Formula: Read the status code and the matching header lines.
Substitution: Status code 200; Date; Last-Modified; Content-Length; Connection and Keep-Alive.
Calculation: 200 OK means found. Date gives the reply time. Content-Length gives the size. The body begins `<!doc`. `Connection: Keep-Alive` (with `Keep-Alive: timeout=...,max=100`) means the server will keep the connection open.
Answer: (A) Yes, 200 OK; sent Tue 07 Mar 2008 at 12:39:45 GMT. (B) Sat 10 Dec 2005, 18:27:46 GMT. (C) 3,874 bytes. (D) `<!doc`; yes, the connection is persistent (Keep-Alive).
:::
:::

## Cookies: adding state to a stateless protocol

HTTP is stateless, but websites want to identify users (to remember a shopping cart, a login, preferences). **Cookies** do this with four components:

1. a `Set-cookie:` header line in the HTTP **response**;
2. a `Cookie:` header line in later HTTP **requests**;
3. a cookie file kept on the user's host and managed by the browser;
4. a back-end **database** at the website.

:::seq Browser | amazon.com server | Back-end database
1>2 usual HTTP request (first visit)
2>3 create entry for ID 1678
2>1 a response + Set-cookie: 1678
1: browser stores "amazon 1678"
1>2 request + Cookie: 1678
2>3 look up 1678: cart, history
2>1 a response tailored to this user
:::

:::ex From a paper | A purchase record with cookies {{paper:19CCE304 Jan 2023 Q2(A)}}
:::solve
Given: An e-commerce site wants a purchase record for each customer.
Required: How cookies achieve this.
Formula: The four cookie components.
Substitution: First visit: no cookie in the request.
Calculation: The server creates a unique ID (say 1678), stores a database entry keyed by it, and replies with `Set-cookie: 1678`. The browser saves it. Each later request carries `Cookie: 1678`; whenever the customer buys something, the server adds the item to the database entry for 1678. Weeks later, the same cookie lets the site show the purchase history and recommendations.
Answer: The cookie ID links every visit to one database record, giving a stateful “session” on top of stateless HTTP. The trade-off is privacy: the site, and third parties whose cookies are embedded in pages, can track browsing behaviour.
:::
:::

## Web caching (proxy servers)

A **web cache**, also called a **proxy server**, is a network entity that satisfies HTTP requests on behalf of an origin server. It has its own disk storage holding copies of recently requested objects. The browser is configured to send all requests to the cache first.

:::flow
1. Request | The browser opens a TCP connection to the cache and sends the HTTP request.
2. Check | The cache checks whether it has a copy. If yes (a hit), it returns the object straight away.
3. Miss | If not, the cache opens a TCP connection to the origin server and requests the object.
4. Store | The origin server replies; the cache stores a copy and forwards the object to the browser.
:::

A cache is **both a server and a client**: a server to the browser, a client to the origin server. Caches are usually installed by ISPs or universities.

**Why use one?** It cuts the response time (the cache is close to the client), reduces traffic on the institution's access link (so it needn't be upgraded as soon), and reduces Internet traffic as a whole.

:::ex Worked example | Do we buy a faster access link or a cache? (Kurose example in your slides)
An institutional network has a 1 Gbps LAN and a 1.54 Mbps access link to the Internet. Browsers request 15 objects per second, each 100 kbits. The RTT from the institutional router to any origin server is 2 s.

:::solve
Given: \(R_{LAN} = 1\) Gbps, \(R_{access} = 1.54\) Mbps, request rate \(a = 15\) /s, object size \(L = 100\) kbits, Internet delay = 2 s.
Required: Access-link utilisation and average delay (a) as is, (b) with a 154 Mbps access link, (c) with a cache of hit rate 0.4.
Formula: Utilisation \(= aL/R\). Average delay \(= h \times d_{cache} + (1-h) \times d_{origin}\).
Substitution: Data rate to browsers \(= 15 \times 100{,}000 = 1.5\) Mbps.
Calculation: (a) Access link: \(1.5 / 1.54 = 0.97\); LAN: \(1.5 / 1000 = 0.0015\). At 0.97 the queuing delay is minutes. (b) \(1.5 / 154 = 0.0097\): delay ≈ 2 s + milliseconds, but the link is expensive. (c) Only 60% of requests cross the access link: \(0.6 \times 1.5 = 0.9\) Mbps, utilisation \(0.9 / 1.54 = 0.58\), queuing delay of milliseconds. Average delay \(= 0.6 \times 2.01 + 0.4 \times (\text{a few ms}) \approx 1.2\) s.
Answer: The cache gives about 1.2 s average delay, lower than the 154 Mbps upgrade (about 2 s), and it is much cheaper.
:::
:::

:::ex From a paper | Cache savings for a university website {{paper:19CSE301 End 2024 Q1(b)}}
:::solve
Given: 60,000 requests per day; hit rate 75%; average object 600 kB; cache latency 40 ms; origin latency 250 ms; cache–client bandwidth 500 Mbps.
Required: Requests served by cache and origin; bandwidth saved per day; average response time before and after.
Formula: Cache requests \(= h \times N\). Saved data \(= \text{cache requests} \times \text{object size}\). Average time \(= h\,t_{cache} + (1-h)\,t_{origin}\).
Substitution: \(h = 0.75\), \(N = 60{,}000\), object = 600 kB.
Calculation: Cache: \(0.75 \times 60{,}000 = 45{,}000\); origin: 15,000. Saved: \(45{,}000 \times 600\text{ kB} = 27{,}000{,}000\) kB = 27 GB (= 216 Gbits) of origin traffic per day. Before: every request goes to the origin, 250 ms. After: \(0.75 \times 40 + 0.25 \times 250 = 30 + 62.5 = 92.5\) ms.
Answer: 45,000 from the cache and 15,000 from the origin; 27 GB saved per day; average response time falls from 250 ms to 92.5 ms. (If you add the object's transmission time to the client, \(4.8\text{ Mbit} / 500\text{ Mbps} = 9.6\) ms, the figures become 259.6 ms and 102.1 ms.)
:::
:::

## The conditional GET

A cached copy may be stale. The **conditional GET** lets a cache (or browser) check freshness without downloading the object again. A request is a conditional GET if it uses the GET method **and** includes an `If-Modified-Since:` header line.

:::seq Cache or browser | Origin server
1>2 GET /fruit/kiwi.gif + If-Modified-Since: Wed, 9 Sep 2015 09:23:24
2>1 a HTTP/1.1 304 Not Modified (empty body)
-- later, after the object changes
1>2 GET /fruit/kiwi.gif + If-Modified-Since: Wed, 9 Sep 2015 09:23:24
2>1 a HTTP/1.1 200 OK + Last-Modified + new object
:::

The first response came with a `Last-Modified:` date, which the cache stored. Next time, it sends that date in `If-Modified-Since:`. If the object hasn't changed, the server replies **304 Not Modified** with no body, saving bandwidth and transmission time. This answers {{paper:19CSE301 End 2024 Q1(a)}}: a news site where users must always see the latest article without re-downloading unchanged resources uses conditional GET.

## HTTP/2 and HTTP/3

**HTTP/1.1** allowed pipelined GETs over one connection, but the server answers them **in order** (first come, first served). A small object can be stuck behind a large one: **head-of-line (HOL) blocking**. A lost TCP segment also stalls everything behind it.

**HTTP/2** (RFC 7540, 2015) keeps the methods, status codes and most header fields, but:

- breaks each message into small **frames** and **interleaves** the frames of different responses on one TCP connection, so a small object isn't stuck behind a large one;
- lets the client set **priorities** for responses;
- allows **server push**: the server sends objects the client will need (images in the page) before they are requested;
- compresses headers.

**HTTP/3** runs HTTP over **QUIC**, a transport protocol built on UDP, which adds reliability, congestion control and security per stream, so a loss on one stream doesn't stall the others. {{paper:20CYS303 End 2025 Q6}} asked for the HTTP communication process and the role of HTTP/3.

## Worked timing numericals

:::ex Level 1 | Counting RTTs {{paper:19CSE301 Mid 2023 Q8}}
A base HTML file references 10 objects. RTT dominates all other times.

:::solve
Given: 1 base object + \(n = 10\) objects; ignore transmission time.
Required: RTTs in four modes.
Formula: Use the mode table above.
Substitution: \(n = 10\); \(k = 10\) parallel connections in (ii).
Calculation: (i) Non-persistent, serial: \(2 + 2 \times 10 = 22\) RTT. (ii) Non-persistent, 10 parallel: \(2 + 2 = 4\) RTT. (iii) Persistent without pipelining: \(2 + 10 = 12\) RTT. (iv) Persistent with pipelining: \(2 + 1 = 3\) RTT.
Answer: 22, 4, 12 and 3 RTTs.
:::
:::

:::ex Level 2 | DNS plus HTTP (Kurose problem in Chapter2-Problems)
Three DNS servers are visited with RTTs of 4, 44 and 8 ms. The web page's base object references 3 very small objects; \(\text{RTT}_{HTTP} = 20\) ms.

:::solve
Given: DNS = 4 + 44 + 8 = 56 ms; \(\text{RTT}_{HTTP} = 20\) ms; 3 extra objects; transmission times zero.
Required: Time until everything is received for (1) the base object only, (2) non-persistent serial, (3) non-persistent with up to 5 parallel connections, (4) persistent.
Formula: Total = DNS + base (2 RTT) + objects.
Substitution: 2 RTT = 40 ms.
Calculation: (1) \(56 + 40 = 96\) ms. (2) \(96 + 3 \times 40 = 216\) ms. (3) \(96 + 40 = 136\) ms (all 3 in parallel). (4) \(96 + 20 = 116\) ms (all 3 pipelined on the open connection).
Answer: 96 ms, 216 ms, 136 ms and 116 ms.
:::
:::

:::ex From a paper | Four parallel connections {{paper:19CSE301 Mid 2024 Q3}}
:::solve
Given: Local DNS cache visited once, \(\text{RTT}_0 = 3\) ms; \(\text{RTT}_{HTTP} = 34\) ms; base object + 10 tiny objects on the same server.
Required: Time in (a) base only, (b) non-persistent serial, (c) non-persistent with at most 4 parallel connections, (d) persistent with at most 4 pipelined requests at a time.
Formula: DNS + 2 RTT for the base, then per mode.
Substitution: \(2\,\text{RTT} = 68\) ms; \(\lceil 10/4 \rceil = 3\) rounds.
Calculation: (a) \(3 + 68 = 71\) ms. (b) \(71 + 10 \times 68 = 751\) ms. (c) \(71 + 3 \times 68 = 275\) ms. (d) \(71 + 3 \times 34 = 173\) ms.
Answer: 71 ms, 751 ms, 275 ms, 173 ms. (If (d) allowed all 10 requests to be pipelined at once, it would be \(71 + 34 = 105\) ms. State your interpretation.)
:::
:::

:::ex From a paper | Medilab: DNS, non-persistent HTTP, then a cache {{paper:23CSE302 Mid 2025 Q7(B,C)}}
The site www.medilab.org has a base page and 5 images. RTT client–local DNS = 6 ms; local DNS to the authoritative server through the .org TLD = 20 ms; client–web server RTT = 40 ms. Then a web cache is added at the ISP (client–cache RTT 10 ms), persistent HTTP is used, and 60% of requests are answered by the cache.

:::solve
Given: Objects = 1 + 5 = 6. DNS = 6 + 20 = 26 ms. \(\text{RTT}_{server} = 40\) ms, \(\text{RTT}_{cache} = 10\) ms, hit share 60%.
Required: (B) total time, non-persistent without parallel connections; (C) total time with the cache and persistent HTTP.
Formula: (B) DNS + 6 × 2 RTT. (C) DNS + [1 RTT setup + requests] to the cache + [1 RTT setup + requests] to the origin (the same counting as your quiz 1 key).
Substitution: (C) 60% of 6 requests = 3.6 to the cache, 2.4 to the origin (expected values).
Calculation: (B) \(26 + 6 \times 2 \times 40 = 26 + 480 = 506\) ms. (C) Cache: \(10 + 3.6 \times 10 = 46\) ms. Origin: \(40 + 2.4 \times 40 = 136\) ms. Total \(= 26 + 46 + 136 = 208\) ms.
Answer: (B) 506 ms. (C) About 208 ms. (If you round to whole objects, 4 from the cache and 2 from the origin, you get \(26 + (10 + 40) + (40 + 80) = 196\) ms; write down whichever assumption you use.)
:::
:::

:::ex From a paper | Five DNS servers and a slow link {{paper:23CSE302 End 2025 Q3}}
Clicking https://my.amrita.edu/index/login visits 5 DNS servers with round-trip times RTT₁ … RTT₅. The page is a base HTML file plus 10 objects, each 200 kbits. The host–server link is 100 kbps, the one-way propagation time is \(T_p\), and TCP control and GET messages are negligible in size.

:::solve
Given: DNS time \(= \sum_{i=1}^{5} \text{RTT}_i\). 11 objects of \(L = 200\) kbits, \(R = 100\) kbps. One RTT to the server \(= 2T_p\).
Required: (a) total time with 11 serial (non-persistent) connections; (b) the time if the link is clicked again 30 minutes later.
Formula: Per object: connection (1 RTT) + request and response (1 RTT) + \(L/R\).
Substitution: \(L/R = 200{,}000 / 100{,}000 = 2\) s. Per object \(= 2T_p + 2T_p + 2 = 4T_p + 2\) s.
Calculation: (a) \( \sum \text{RTT}_i + 11(4T_p + 2) = \sum_{i=1}^{5}\text{RTT}_i + 44\,T_p + 22 \) s. (b) After 30 minutes the name-to-address mapping is still in the DNS cache (its TTL hasn't expired), so the DNS term disappears: \(44\,T_p + 22\) s.
Answer: (a) \(\text{RTT}_1 + \dots + \text{RTT}_5 + 44T_p + 22\) s. (b) \(44T_p + 22\) s. If the browser has also cached the objects and checks them with conditional GETs that return 304, the 22 s of transmission also disappears, leaving about \(44T_p\).
:::
:::

:::ex From a paper | When parallel connections don't help {{paper:19CCE304 End 2024 Q2(A)}}
A 10 m link runs at 150 bits/s in each direction. Data packets are 100,000 bits; control packets (ACK, handshake) are 200 bits. N parallel connections each get 1/N of the bandwidth. The base object references 10 objects of 100 kbits each.

:::solve
Given: \(R = 150\) bps; data 100,000 bits; control 200 bits; propagation \(\approx 10/3\times10^8\) s ≈ 0 (negligible).
Required: Does parallel non-persistent HTTP make sense? Is persistent HTTP much better?
Formula: Each object over a new connection: 3 control packets + 1 data packet. Persistent: 1 control (request) + 1 data per object after the first.
Substitution: Base object at full rate: \(3 \times 200/150 + 100{,}000/150 = 4 + 666.7 = 670.7\) s. Ten parallel connections at 15 bps each: \(3 \times 200/15 + 100{,}000/15 = 40 + 6{,}666.7 = 6{,}706.7\) s.
Calculation: Parallel non-persistent total \(= 670.7 + 6{,}706.7 = 7{,}377\) s. Persistent: \(670.7 + 10 \times (200/150 + 100{,}000/150) = 670.7 + 10 \times 668 = 7{,}351\) s.
Answer: Parallel downloads give no real benefit, because the 10 connections just split the same 150 bps. Persistent HTTP is less than 1% faster (7,351 s vs 7,377 s). When transmission time dominates, saving RTTs hardly matters.
:::
:::

:::exam Exam focus
- HTTP timing appeared in 8 papers. Always draw the timing diagram: SYN, SYN-ACK, ACK+GET, response, and count RTTs.
- Persistent vs non-persistent, with and without parallel connections and pipelining.
- Conditional GET (`If-Modified-Since`, `304 Not Modified`) and web caching calculations.
- Cookie components, status codes, and reading header lines.
- {{paper:19CSE301 End 2023 Q2(d)}}: a page of text and five small images in non-persistent mode needs a **minimum of 6 TCP connections** (one per object).
:::

:::mistake Common mistakes
- Using 1 RTT per object for non-persistent HTTP. It's 2: one to set up the connection, one for the request.
- Forgetting the DNS time, or adding it once per object. DNS happens once, before the first connection.
- Forgetting the initial 2 RTT for the base page in persistent mode.
- Thinking a 304 response carries the object. It carries no body.
:::

:::rev Quick revision
- Page = base HTML + referenced objects; URL = host + path. HTTP over TCP port 80, stateless.
- Non-persistent: 2 RTT + transmission per object. Persistent: one connection; 1 RTT per object; pipelining.
- Request line: method URL version. Status line: version code phrase. Codes 200, 301, 304, 400, 404, 505.
- Cookies: Set-cookie, Cookie, browser file, back-end database.
- Web cache = proxy, both client and server; average delay \(= h\,d_{cache} + (1-h)\,d_{origin}\).
- Conditional GET: If-Modified-Since → 304 Not Modified.
- HTTP/2: frames, interleaving, priorities, server push. HTTP/3: over QUIC/UDP.
:::

@@topic u1-ftp | I.11 | File transfer: FTP | Why FTP uses two TCP connections, what travels on each, its commands and replies, active and passive modes, and why firewalls break file downloads. | {{gap:Forouzan §26.3}} Kurose 8e no longer covers FTP

:::note Source note
Kurose 8th edition dropped FTP; your Chapter 2 slides only list it as an example protocol. FTP is prescribed through Forouzan Chapter 26 (Section 26.3, File transfer), which this topic follows.
:::

## What FTP is for

**FTP (File Transfer Protocol)** is the standard TCP/IP mechanism for copying a file from one host to another. Copying a file sounds simple, but two systems may use different file-name conventions, different ways of representing text and data, and different directory structures. FTP solves these problems in a very simple and elegant way.

A user sits at the local host and wants to transfer files to or from a remote host. To access the remote account, the user must give a user name and password. After that, the user can list directories, change directories, download (get) and upload (put) files.

## The key idea: two separate connections

FTP differs from other client-server applications in that it establishes **two connections** between the hosts:

- The **control connection** uses **TCP port 21** on the server. It carries **commands and responses**: user name, password, “change directory”, “list files”, “send me this file”. It stays open for the **entire user session** (it is persistent).
- The **data connection** uses **TCP port 20** on the server (in active mode). It carries the **file contents** and directory listings. It is opened for **each file transfer** and closed when that transfer finishes (it is non-persistent).

Because the control information travels on a separate connection from the data, FTP is said to send its control information **out-of-band**. (HTTP sends its header lines **in-band**, in the same connection as the file.)

:::graph FTP keeps two TCP connections between client and server.
ui 70 40 host "User interface"
cpc 70 120 box "Client control process"
dtc 70 200 box "Client data process"
cps 560 120 box "Server control process"
dts 560 200 box "Server data process"
ui-cpc
cpc-cps *
dtc-dts ~
text 315 108 control connection: port 21, whole session
text 315 222 data connection: port 20, one per file
:::

### Why separate them?

- Commands are short text lines exchanged interactively, while files are long and are sent in bulk. Separating them lets each be handled appropriately: the control connection needs only **minimal delay**; the data connection needs **maximal throughput**.
- The user can still send commands (for example, abort) while a file transfer is in progress.
- A new data connection per file makes the end of the file obvious: the sender closes the connection.

## How a download works, step by step

!!sim visualizations/application/ftp.html | FTP: control and data connections | Watch login on port 21, then a separate data connection opened and closed for each file, in active and passive mode, including what a firewall blocks.

:::seq FTP client | FTP server (port 21) | FTP server (port 20)
-- control connection (stays open)
1>2 TCP connect to port 21
2>1 a 220 Service ready
1>2 USER alice
2>1 a 331 User name OK, password required
1>2 PASS ****
2>1 a 230 User login OK
1>2 PORT (client's data port), then RETR report.pdf
2>1 a 150 File status OK, opening data connection
-- data connection (one per file)
3>1 TCP connect from port 20 to client's port
3>1 file contents of report.pdf
3>1 close data connection
2>1 a 226 Closing data connection, transfer complete
1>2 QUIT
2>1 a 221 Service closing
:::

1. The client opens the control connection to server port 21 and logs in with `USER` and `PASS`.
2. The client chooses an ephemeral port for data and tells the server with the `PORT` command (active mode), then sends `RETR filename` (retrieve).
3. The server opens the data connection **from its port 20 to the client's announced port**, sends the file and closes the connection.
4. The control connection remains open for further commands, until `QUIT`.

## Commands and responses

Communication on the control connection uses the **NVT ASCII** character set: commands are plain-text lines; each response is a **three-digit code** followed by text.

| Command | Meaning |
|---|---|
| USER, PASS | Send user name and password |
| LIST | Send a directory listing (over a data connection) |
| CWD, PWD | Change / print working directory |
| RETR filename | Retrieve (download) a file |
| STOR filename | Store (upload) a file |
| PORT | Client tells the server which client port to use for data (active mode) |
| PASV | Client asks the server to choose a port and wait (passive mode) |
| TYPE A / TYPE I | ASCII or image (binary) transfer |
| QUIT | Log out |

| Code | Meaning |
|---|---|
| 125 / 150 | Data connection already open / about to open |
| 200 | Command OK |
| 220 | Service ready |
| 221 | Service closing |
| 226 | Closing data connection, transfer complete |
| 230 | User login OK |
| 331 | User name OK, password required |
| 425 | Can't open data connection |
| 450 / 550 | File unavailable |
| 500 | Syntax error, command unrecognised |

The first digit tells the client the type of reply: 1 = positive preliminary, 2 = positive completion, 3 = positive intermediate (send more), 4 = transient error, 5 = permanent error.

## Active and passive mode

| Active mode (default in the original standard) | Passive mode |
|---|---|
| Client sends `PORT` with its own data port | Client sends `PASV` |
| **Server** opens the data connection, from port 20 to the client's port | Server replies with a port number (227 Entering Passive Mode) and waits |
| An **incoming** connection to the client is needed | **Client** opens the data connection to the server's announced port |
| Often blocked by the client's firewall or NAT | Works through client firewalls and NAT, so browsers and most clients use it |

## Data handling: types, structures and modes

To overcome differences between systems, the client defines on the control connection:

- **File type**: ASCII file (text, the default), EBCDIC file (for IBM systems), or image file (binary, sent as a stream of bits with no interpretation, used for compiled programs and images).
- **Data structure**: file structure (a continuous stream of bytes, the default), record structure (text files divided into records) or page structure (pages with page numbers, accessible randomly).
- **Transmission mode**: stream mode (the default; data delivered as a continuous stream of bytes), block mode (data in blocks, each with a header) or compressed mode (run-length compression).

## Kinds of FTP access

| Kind | Description |
|---|---|
| Password-protected FTP | The normal case: a user name and password are required |
| Anonymous FTP | Public file archives: user name `anonymous`, password usually an email address; access is limited to a subset of commands and directories |
| Active and passive FTP | The two ways of opening the data connection, as above |
| Secure variants | FTPS (FTP over TLS) and SFTP (a separate protocol that runs over SSH) encrypt the password and data, which plain FTP sends in clear text |
| TFTP (Trivial FTP) | A tiny file-transfer protocol over UDP with no authentication, used for booting devices |

## FTP compared with HTTP

| Feature | FTP | HTTP |
|---|---|---|
| Connections | Two: control (21) + data (20) | One (port 80) |
| Control information | **Out-of-band**, on its own connection | **In-band**, header lines in the same connection |
| State | **Stateful**: the server tracks the user's login and current directory for the whole session | **Stateless** (cookies add state) |
| Control connection | Persistent for the session | Persistent or non-persistent |
| Data connection | Non-persistent: one per file | Same connection carries headers and body |
| Authentication | Built in (USER, PASS) | Optional (forms, tokens) |
| Message format | Text commands and 3-digit replies | Text request/response with headers |
| Typical use | Bulk upload and download of files | Fetching web objects |

:::ex From a paper | The blocked FTP port {{paper:23CSE302 Mid 2025 Q5}}
An employee logs in to the company's FTP server successfully, but every download fails, and the firewall log shows that an FTP-related port was blocked.

:::solve
Given: Login works; file transfer fails; a firewall blocked an FTP port.
Required: (a) Which connection is blocked and why that breaks the transfer. (b) The roles of the two connections, with a diagram.
Formula: Control on port 21 carries login and commands; data on port 20 (active mode) carries files.
Substitution: Login succeeded, so port 21 and the control connection work.
Calculation: The failing part must be the **data connection**. In active mode the server opens it from port 20 to a port on the client, and the client-side firewall blocks that incoming connection (or the firewall blocks port 20 itself).
Answer: (a) The data connection (port 20 / the client's announced data port) is blocked, so no file contents or listings can flow even though commands and replies on port 21 still work. Switching the client to passive mode, where the client opens the data connection outward, usually fixes it. (b) Draw the two-connection figure: the control connection (port 21) is opened first, stays open for the whole session and carries USER, PASS, RETR, QUIT and the numeric replies; the data connection (port 20) is opened for each file or listing and closed when it ends.
:::
:::

:::exam Exam focus
- {{paper:19CSE301 Mid 2023 Q2}}: “FTP uses separate connections for data and control. True or false? Justify with a diagram and list the types of FTP.” True: control on 21 (persistent), data on 20 (per file).
- Out-of-band vs in-band control: the standard FTP vs HTTP comparison.
- The firewall question from your own course paper. Expect another scenario question.
:::

:::mistake Common mistakes
- Saying the data connection stays open for the whole session. It's the control connection that does.
- Swapping the ports: 21 is control, 20 is data.
- Calling FTP stateless. The server remembers the login and directory throughout the session.
:::

:::rev Quick revision
- FTP over TCP, two connections: control (21, persistent, commands and 3-digit replies), data (20, one per file).
- Out-of-band control; stateful server.
- Active mode: server connects to the client (PORT). Passive mode: client connects to the server (PASV), firewall-friendly.
- File types ASCII/EBCDIC/image; structures file/record/page; modes stream/block/compressed.
:::

@@topic u1-email | I.12 | Electronic mail in the Internet | The three parts of the email system, how SMTP pushes a message from Alice's server to Bob's, the message format and MIME, and how Bob pulls mail with POP3, IMAP or HTTP. | Kurose §2.3 · Forouzan §26.2 · Chapter_2_v8.2 slides 54–60 · Chapter2-Problems

## The three components

:::two
#### User agents
Programs that let users read, reply to, forward, save and compose messages: Microsoft Outlook, Apple Mail, the Gmail app or the Gmail web page. When Alice finishes composing, her user agent sends the message to her mail server.
---
#### Mail servers
The core of the system. Each recipient has a **mailbox** on a mail server. Each server also has an outgoing **message queue** of mail waiting to be sent. Mail servers talk to each other with SMTP.
:::

The third component is **SMTP (Simple Mail Transfer Protocol)**, the principal application-layer protocol for email. It runs over **TCP** (reliable) on **port 25**. Every mail server runs both the client side of SMTP (when sending) and the server side (when receiving).

## Sending a message, step by step

:::graph Alice's message travels through two mail servers. SMTP pushes it twice; Bob pulls it with an access protocol.
ua1 60 60 host "Alice's agent"
ms1 240 60 box "Alice's mail server"
ms2 440 60 box "Bob's mail server"
ua2 620 60 host "Bob's agent"
ua1>ms1
ms1>ms2 *
ms2>ua2 ~
text 140 100 SMTP
text 330 100 SMTP over TCP 25
text 520 100 IMAP / POP3 / HTTP
:::

1. Alice invokes her user agent, gives Bob's address (bob@someschool.edu), composes and asks the agent to send.
2. Her user agent sends the message to **her mail server**, where it is placed in the message queue.
3. The client side of SMTP on Alice's server sees the message and opens a **TCP connection to an SMTP server on Bob's mail server**.
4. After an initial SMTP handshake, the client sends Alice's message into the connection.
5. At Bob's mail server, the server side of SMTP receives it and places it in **Bob's mailbox**.
6. Later, Bob invokes his user agent to read the message.

If Bob's server is down, Alice's server keeps the message in its queue and **retries** (typically every 30 minutes); after several days without success it gives up and notifies Alice. That is why Alice's agent doesn't send straight to Bob's server: Alice's PC may be switched off, but her mail server is always on and can keep retrying.

SMTP normally doesn't use intermediate servers: the TCP connection goes directly from Alice's server to Bob's, even if they are on opposite sides of the world.

!!sim visualizations/application/email.html | Email delivery from Gmail to Yahoo | Step through the user agent, both mail servers, the DNS MX lookup, the SMTP dialogue, and Bob fetching the mail with IMAP or POP3.

## The SMTP dialogue

After the TCP connection is set up, the client (C, Alice's server crepes.fr) and server (S, Bob's server hamburger.edu) exchange text commands and three-digit replies:

```
S: 220 hamburger.edu
C: HELO crepes.fr
S: 250 Hello crepes.fr, pleased to meet you
C: MAIL FROM: <alice@crepes.fr>
S: 250 alice@crepes.fr ... Sender ok
C: RCPT TO: <bob@hamburger.edu>
S: 250 bob@hamburger.edu ... Recipient ok
C: DATA
S: 354 Enter mail, end with "." on a line by itself
C: Do you like ketchup?
C: How about pickles?
C: .
S: 250 Message accepted for delivery
C: QUIT
S: 221 hamburger.edu closing connection
```

The three phases are **handshaking** (HELO, sender and recipient), **transfer** of the message (DATA, ending with a line containing only a full stop) and **closure** (QUIT). SMTP uses **persistent connections**: if Alice's server has several messages for the same server, it sends them all on the same connection, repeating MAIL FROM onwards for each.

## SMTP compared with HTTP

| | SMTP | HTTP |
|---|---|---|
| Direction | **Push**: the sending server pushes the file to the receiving server | **Pull**: the client pulls the object from the server |
| Who opens TCP | The machine that wants to **send** | The machine that wants to **receive** |
| Body encoding | Must be **7-bit ASCII**; binary (images) must be encoded | No such restriction |
| Multiple objects | All parts of a message (text + attachments) in **one** message | Each object in its **own** response message |
| Port | 25 | 80 |

## Mail message format and MIME

A message (RFC 5322) has a **header** and a **body**, separated by a blank line. The header must contain `From:` and `To:` lines and may contain `Subject:` and others:

```
From: alice@crepes.fr
To: bob@hamburger.edu
Subject: Searching for the meaning of life.

(body of the message in ASCII)
```

These header lines are part of the message itself; they are different from the SMTP commands (MAIL FROM, RCPT TO), which belong to the protocol dialogue.

Because SMTP carries only 7-bit ASCII, Forouzan describes **MIME (Multipurpose Internet Mail Extensions)**, a supplementary protocol that lets non-ASCII data (other languages, images, audio, video, programs) be sent through SMTP. MIME transforms non-ASCII data at the sender into ASCII, and back at the receiver. It adds header lines:

| MIME header | Purpose |
|---|---|
| `MIME-Version: 1.0` | Says the message uses MIME |
| `Content-Type: image/jpeg` | The type and subtype of the body (text/plain, image/jpeg, multipart/mixed, ...) |
| `Content-Transfer-Encoding: base64` | How the body was encoded into ASCII (7bit, 8bit, binary, base64, quoted-printable) |
| `Content-Id`, `Content-Description` | Identify and describe the body part |

## Mail access protocols: how Bob reads his mail

Bob's user agent can't use SMTP to **fetch** messages, because getting mail is a pull operation and SMTP is a push protocol. Other protocols do the retrieval.

### POP3 (Post Office Protocol version 3), port 110 (Forouzan)

POP3 is simple and limited. The user agent opens a TCP connection to the mail server on port 110 and goes through three phases:

1. **Authorisation**: the agent sends the user name and password (`user`, `pass`).
2. **Transaction**: the agent retrieves messages (`list`, `retr`) and can mark them for deletion (`dele`).
3. **Update**: after the client sends `quit`, the server deletes the marked messages and the session ends.

POP3 has two modes. In **download-and-delete** mode, messages are deleted from the server after they are retrieved, so a user who reads mail on a laptop can't read it again on another device. In **download-and-keep** mode, the messages stay on the server after download.

### IMAP (Internet Message Access Protocol), port 143 (Kurose and Forouzan)

IMAP keeps messages **on the server** and lets the user manipulate them there: create **folders** on the server, move messages between folders, **search** them, and fetch **only part** of a message (for example just the headers, useful on a slow link). IMAP keeps user state across sessions (folder names and which message is in which folder), so the view is the same on every device. Most mail clients today use IMAP.

### HTTP (webmail)

With Gmail or Yahoo in a browser, the user agent is the web browser, and it talks to the remote mailbox **via HTTP**. The browser uses HTTP to send messages to the mail server too. The mail servers still use **SMTP** between themselves.

| Feature | POP3 | IMAP |
|---|---|---|
| Where mail lives | Downloaded to the device (and usually deleted from the server) | Stays on the server |
| Folders on server | No | Yes |
| Multiple devices | Poor: each device downloads separately | Good: all devices see the same, synchronised mailbox |
| Partial download | No, whole messages | Yes, headers or parts |
| Server storage and complexity | Low | Higher |
| Works offline | Yes, after download | Needs a connection (clients cache copies) |
| Port | 110 | 143 |
| Paradigm | Download and (optionally) delete | Online, server-side mailbox management |

:::ex From a paper | From Gmail to Yahoo {{paper:23CSE302 Mid 2025 Q6}}
:::solve
Given: You send mail from your Gmail account to a friend's Yahoo account.
Required: (a) The protocol at each step: you → Gmail server → Yahoo server → your friend. (b) The role of each.
Formula: Push with SMTP (or HTTP for webmail), relay with SMTP, pull with IMAP/POP3/HTTP.
Substitution: Step 1 depends on the user agent: the Gmail web page uses HTTP; a mail app uses SMTP. Step 2 is always SMTP. Step 3 is IMAP or POP3 for an app, or HTTP for the Yahoo web page.
Calculation: Step 2 also needs DNS: Gmail's server queries DNS for the **MX record** of yahoo.com to find the Yahoo mail server's name and address, then opens TCP to its port 25.
Answer: (a) You → Gmail: HTTP (webmail) or SMTP (mail app). Gmail → Yahoo: SMTP over TCP port 25 (after a DNS MX lookup). Yahoo → friend: IMAP (143) or POP3 (110), or HTTP for webmail. (b) HTTP/SMTP from the agent submits (pushes) the message to the sender's server; SMTP pushes it between servers and handles retries; IMAP/POP3/HTTP let the recipient pull and manage the mail in the mailbox.
:::
:::

:::ex From a paper | Same server or not? {{paper:19CSE301 End 2024 Q7}}
Mail from alice@cb.amrita.edu to bob@am.amrita.edu. Is the message sent and received on the same server?

:::solve
Given: Two different domains: cb.amrita.edu and am.amrita.edu.
Required: Whether one server handles both, and the SMTP messages exchanged.
Formula: The receiving server is whatever host the recipient domain's MX record names.
Substitution: Alice's server looks up the MX record for am.amrita.edu.
Calculation: If both domains' MX records point to the same physical mail server, the server simply moves the message from its queue to Bob's mailbox (no SMTP between servers is needed). If they point to different servers (the normal case for different domains), Alice's server opens TCP port 25 to Bob's server and runs: 220 greeting, HELO, 250, MAIL FROM, 250, RCPT TO, 250, DATA, 354, message lines, ".", 250, QUIT, 221.
Answer: Generally no: different domains have their own mail servers, found through DNS MX records, and SMTP carries the message between them. It is the same server only if the organisation configures both domains on one server. Sending always ends in Bob's mailbox; receiving (reading) uses IMAP, POP3 or HTTP.
:::
:::

:::exam Exam focus
- Email protocols appeared in 6 papers. Draw the Alice→Bob figure and label each hop's protocol.
- SMTP is **push**; IMAP and POP3 are **pull**. SMTP: port 25, TCP; IMAP 143; POP3 110 (from Chapter2-Problems).
- POP3 vs IMAP comparison ({{paper:20CYS303 End 2025 Q1}}), and POP3's download-and-delete vs download-and-keep ({{paper:19CCE304 End 2024 Q2(B)}}).
- The SMTP command sequence (HELO, MAIL FROM, RCPT TO, DATA, QUIT) and reply codes 220, 250, 354, 221.
- {{paper:20CYS303 Mid 2023 Q3}}: the end-to-end delivery of a mail with all protocols and their roles.
:::

:::mistake Common mistakes
- Saying the recipient uses SMTP to read mail. SMTP only pushes; retrieval uses IMAP, POP3 or HTTP.
- Forgetting the DNS MX lookup between the two mail servers.
- Confusing the `From:` header line (part of the message) with the `MAIL FROM` command (part of SMTP).
:::

:::rev Quick revision
- Components: user agents, mail servers (mailboxes, queues), SMTP.
- SMTP: TCP port 25, push, 7-bit ASCII, persistent, phases handshake/transfer/closure.
- Message = header lines (From, To, Subject) + blank line + body; MIME for non-ASCII.
- Access: POP3 (110, authorisation/transaction/update, download-and-delete or keep), IMAP (143, server folders, sync), HTTP (webmail).
:::

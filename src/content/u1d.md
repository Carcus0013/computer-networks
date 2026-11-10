@@topic u1-dns | I.13 | DNS: the Internet's directory service | How names such as www.amrita.edu become IP addresses: why DNS is distributed and hierarchical, the root, TLD, authoritative and local servers, iterative and recursive queries, caching, resource records and how a new domain is registered. | Kurose §2.4 · Chapter_2_v8.2 slides 61–78 · Chapter2-Problems

## The problem DNS solves

People prefer names (www.amrita.edu); routers need numbers (IP addresses such as 104.21.37.56, a 32-bit quantity in IPv4 with a hierarchical structure that routers can process). Something must translate between them. That is the **Domain Name System (DNS)**, which is:

1. a **distributed database** implemented in a hierarchy of **DNS servers**, and
2. an **application-layer protocol** that lets hosts query that database.

DNS servers are often UNIX machines running BIND. DNS runs over **UDP** on **port 53**. Other application protocols (HTTP, SMTP, FTP) use DNS to translate user-supplied host names into IP addresses, so DNS adds delay, sometimes substantial, before the real communication can begin. Caching helps a lot.

## The services DNS provides

| Service | What it means | Example |
|---|---|---|
| **Host name to IP address translation** | The main job | www.amrita.edu → 104.21.37.56 |
| **Host aliasing** | A host with a complicated **canonical** name can have simpler **alias** names; DNS returns the canonical name and address | www.enterprise.com is an alias for relay1.west-coast.enterprise.com |
| **Mail server aliasing** | Email addresses use simple names; DNS (MX records) finds the real mail server | bob@yahoo.com → relay1.west-coast.yahoo.com |
| **Load distribution** | A busy site with many replicated servers has a **set** of IP addresses for one name; DNS returns the whole set but rotates the order, spreading traffic | cnn.com has several addresses |

## Why not one central DNS server?

A single server holding every mapping would be simple, but it would fail badly:

- **Single point of failure**: if it crashes, the whole Internet stops resolving names.
- **Traffic volume**: one server would have to handle every DNS query from hundreds of millions of hosts.
- **Distant centralised database**: it would be far from most clients, causing long delays.
- **Maintenance**: one database would be huge and need updating for every new host.

In one phrase: **a centralised database doesn't scale.** So DNS is distributed by design.

## A distributed, hierarchical database

:::graph The DNS hierarchy (partial). A client finds a host's address by working down from a root server to a TLD server to the domain's authoritative server.
root 340 40 box "Root DNS servers"
com 130 120 box ".com DNS"
org 340 120 box ".org DNS"
edu 550 120 box ".edu DNS"
yahoo 60 200 box "yahoo.com"
amazon 200 200 box "amazon.com"
pbs 340 200 box "pbs.org"
nyu 480 200 box "nyu.edu"
umass 620 200 box "umass.edu"
root-com
root-org
root-edu
com-yahoo
com-amazon
org-pbs
edu-nyu
edu-umass
text 20 120 TLD level
text 20 200 Authoritative
:::

- **Root DNS servers**: more than 1,000 root server instances spread over the world, copies of **13 different root servers**, managed by 12 organisations and coordinated by IANA. A root server returns the IP addresses of TLD servers.
- **Top-level domain (TLD) servers**: one cluster for each top-level domain: com, org, net, edu, gov, and country domains such as in, uk, fr. Verisign runs the .com TLD; Educause runs .edu. A TLD server returns the IP addresses of authoritative servers.
- **Authoritative DNS servers**: every organisation with publicly accessible hosts (web and mail servers) must provide publicly accessible DNS records mapping their names to addresses. An organisation runs its own authoritative server or pays a provider to.
- **Local DNS server**: not strictly part of the hierarchy, but central to it. Each ISP (a university, a company, a residential ISP) has one, also called the **default name server**. When a host connects (via DHCP, Topic II.17), it learns the address of its local DNS server. When the host makes a DNS query, the query goes to the local DNS server, which acts as a **proxy**, forwarding the query into the hierarchy.

## Iterative and recursive queries

Suppose the host cse.nyu.edu wants the IP address of gaia.cs.umass.edu. NYU's local DNS server is dns.nyu.edu and the authoritative server for gaia is dns.umass.edu.

### Iterative query
:::seq Host | Local DNS | Root | TLD (.edu) | Authoritative
1>2 1. gaia.cs.umass.edu?
2>3 2. gaia.cs.umass.edu?
3>2 a 3. try .edu TLD at ...
2>4 4. gaia.cs.umass.edu?
4>2 a 5. try dns.umass.edu at ...
2>5 6. gaia.cs.umass.edu?
5>2 a 7. 128.119.245.12
2>1 a 8. 128.119.245.12
:::

### Recursive query
:::seq Host | Local DNS | Root | TLD (.edu) | Authoritative
1>2 1. gaia.cs.umass.edu?
2>3 2. gaia.cs.umass.edu?
3>4 3. gaia.cs.umass.edu?
4>5 4. gaia.cs.umass.edu?
5>4 a 5. 128.119.245.12
4>3 a 6. 128.119.245.12
3>2 a 7. 128.119.245.12
2>1 a 8. 128.119.245.12
:::

- In an **iterative query**, the contacted server replies with the address of the next server to ask (“I don't know, but ask this one”), and the **local DNS server** does the asking. Messages 2–7 above are iterative.
- In a **recursive query**, the contacted server takes on the job: it asks the next server itself and returns the final answer. The query from host to local DNS server (message 1) is recursive.
- Both examples need **8 messages**. In practice, the query from the requesting host to the local DNS server is recursive and the rest are iterative.

| Iterative | Recursive |
|---|---|
| A server replies with a referral to the next server | A server obtains the full answer on the client's behalf |
| The local DNS server does the work of asking each level | Each level asks the next, so the burden moves up the hierarchy |
| Root and TLD servers stay lightly loaded, so this is the norm for them | Puts heavy load on root and TLD servers, so they usually refuse it |
| Typical between the local DNS server and the hierarchy | Typical between a host and its local DNS server |

!!sim visualizations/dns/index.html | DNS resolution, step by step | Animate a lookup in iterative or recursive mode, then repeat it to see the local DNS cache answer instantly. Change the domain and the RTTs and watch the delay add up.

## DNS caching

DNS makes heavy use of **caching** to cut delay and the number of DNS messages. When a DNS server receives a reply (a mapping of a host name to an address), it stores the mapping in its local memory. If another query for the same name arrives, it answers from the cache, **even if it is not authoritative** for that name. Cached entries are discarded after a period, usually **two days**, set by the record's TTL.

A local DNS server can also cache the addresses of **TLD servers**, so it can bypass the root servers for most queries; root servers are rarely visited.

## Resource records

The DNS servers store **resource records (RRs)**. A resource record is a four-tuple: **(Name, Value, Type, TTL)**. TTL is the time to live (when the record should be removed from caches). The meaning of Name and Value depends on Type.

| Type | Name | Value | Example |
|---|---|---|---|
| **A** | a host name | its IP address | (relay1.bar.foo.com, 145.37.93.126, A) |
| **NS** | a domain | the host name of an authoritative DNS server for it | (foo.com, dns.foo.com, NS) |
| **CNAME** | an alias host name | the canonical host name | (foo.com, relay1.bar.foo.com, CNAME) |
| **MX** | an alias name | the canonical name of a mail server | (foo.com, mail.bar.foo.com, MX) |

- An **authoritative** server for a host holds that host's **type A** record.
- A server that is **not** authoritative for a host holds a **type NS** record for the domain, and a **type A** record giving the address of the DNS server named in the NS record. For example, an edu TLD server holds (umass.edu, dns.umass.edu, NS) and (dns.umass.edu, 128.119.40.111, A).
- MX records let a company use the same alias for its mail server and for another server (such as a web server): a query for the mail server asks for the MX record; a query for the other server asks for the CNAME record.

## DNS messages

Queries and replies have the same format: a 12-byte **header** followed by four sections.

| Part | Contents |
|---|---|
| Header | A 16-bit **identification** number (copied into the reply so the client matches replies to queries) and **flags**: query or reply, authoritative answer, recursion desired, recursion available |
| Question | The name being queried and the type (A, MX, ...) |
| Answer | The resource records for the name (possibly several A records for a replicated server) |
| Authority | Records of other authoritative servers |
| Additional | Other helpful records, such as the type A record for a mail server named in an MX answer |

## Registering a domain

Suppose you start a company, Network Utopia. You register networkutopia.com with a **registrar** (a commercial organisation accredited by ICANN that checks the name is unique and enters it into the DNS database). You give the registrar the names and IP addresses of your primary and secondary authoritative servers, say dns1.networkutopia.com (212.212.212.1). The registrar makes sure a **type NS and a type A record** are entered into the .com TLD servers:

- (networkutopia.com, dns1.networkutopia.com, NS)
- (dns1.networkutopia.com, 212.212.212.1, A)

You also put into **your own** authoritative server a type A record for your web server www.networkutopia.com and a type MX record for your mail server.

:::ex From a paper | Records for a startup {{paper:19CSE301 Mid 2024 Q8}}
Company foo has DNS servers dns1.foo.com (140.112.30.40) and dns2.foo.com (140.112.30.44); a web server foo.com at 140.112.30.55 and 140.112.30.56, also named www.foo.com; and a mail server galaxy.foo.com (140.112.30.60). Emails are username@foo.com.

:::solve
Given: The servers and addresses above. Write records as (name, value, type).
Required: (a) RRs given to the .com registrar; (b) RRs in the company's own DNS server.
Formula: TLD holds NS + A (glue) for the domain's name servers. Authoritative server holds A, CNAME, MX for the company's hosts.
Substitution: Two name servers, two web addresses, one alias, one mail server.
Calculation: (a) (foo.com, dns1.foo.com, NS); (dns1.foo.com, 140.112.30.40, A); (foo.com, dns2.foo.com, NS); (dns2.foo.com, 140.112.30.44, A). (b) (foo.com, 140.112.30.55, A); (foo.com, 140.112.30.56, A); (www.foo.com, foo.com, CNAME); (foo.com, galaxy.foo.com, MX); (galaxy.foo.com, 140.112.30.60, A); plus the server's own (foo.com, dns1.foo.com, NS), (foo.com, dns2.foo.com, NS) and their A records.
Answer: The registrar gets only the NS records and the name servers' A records. The company's server holds the two A records for the web server (load distribution), the CNAME for the www alias, and the MX plus A record for mail.
:::
:::

:::ex From a paper | Medilab's TLD records {{paper:23CSE302 Mid 2025 Q7(A)}}
:::solve
Given: Website www.medilab.org on 140.25.10.20 and 140.25.10.22; authoritative server dns1.medilab.org at 140.25.10.5.
Required: The records the .org TLD server keeps for this scenario.
Formula: A TLD server keeps NS records for each domain and A (glue) records for those name servers. It does not keep the web server's A records.
Substitution: Domain medilab.org; name server dns1.medilab.org.
Calculation: (medilab.org, dns1.medilab.org, NS) and (dns1.medilab.org, 140.25.10.5, A).
Answer: Exactly those two records. The A records for www.medilab.org (140.25.10.20 and 140.25.10.22, plus perhaps a CNAME) live on dns1.medilab.org, the authoritative server.
:::
:::

## DNS over UDP, and lost queries

DNS uses UDP because a query and a reply are each a single short message: there is no connection setup delay and no connection state at busy servers. But UDP doesn't recover lost packets.

:::tip From a paper {{paper:19CSE301 Mid 2023 Q3}}
“DNS uses UDP; if a DNS packet is lost there is no automatic recovery. Is that a problem, and how is it solved?” It would be a problem if nothing were done, but the **DNS client (resolver) itself sets a timer**: if no reply arrives within a timeout, it **retransmits** the query, possibly to another (secondary) DNS server. Reliability is built into the application instead of the transport layer. Caching also reduces the number of queries that can be lost. (Large responses and zone transfers between servers use TCP.)
:::

## DNS security

DNS is a critical piece of infrastructure. Attacks include **DDoS bandwidth-flooding of root servers** (largely unsuccessful because of packet filtering and because local servers cache TLD addresses), **DDoS on TLD servers** (potentially more dangerous), and **spoofing / cache poisoning**, where an attacker sends bogus replies that a DNS server caches. **DNSSEC** adds authentication to DNS records to defend against spoofing.

:::exam Exam focus
- {{paper:19CSE301 End 2023 Q2(a)}}: iterative and recursive resolution of aums.amrita.edu with a neat flow diagram (7 marks). Draw both diagrams with 8 numbered messages and name each server.
- {{paper:19CSE301 End 2023 Q2(b)}}: NS and A records in a TLD for two authoritative servers (prithvi and varuna): (amritanet.edu, prithvi.amritanet.edu, NS), (prithvi.amritanet.edu, IP₁, A), (amritanet.edu, varuna.amritanet.edu, NS), (varuna.amritanet.edu, IP₂, A).
- Know all four record types with an example each, and why DNS is not centralised.
- DNS delay appears in every HTTP timing question (Topic I.10).
:::

:::mistake Common mistakes
- Putting the web server's A record in the TLD server. The TLD holds only NS and glue A records.
- Saying the root server returns the final IP address. It returns TLD server addresses.
- Forgetting that the local DNS server is not part of the hierarchy, but every query goes through it.
:::

:::rev Quick revision
- DNS: distributed hierarchical database + protocol over UDP 53.
- Services: name→address, host aliasing, mail aliasing, load distribution.
- Hierarchy: root (13 servers, 1000+ instances) → TLD → authoritative; local DNS acts as proxy.
- Host→local: recursive; local→hierarchy: iterative; 8 messages in the textbook example.
- Caching with TTL (≈2 days); local servers cache TLD addresses.
- RR = (Name, Value, Type, TTL): A, NS, CNAME, MX.
:::

@@topic u1-p2p | I.14 | Peer-to-peer file distribution | Why distributing a big file from one server gets slower with every client, why P2P doesn't, the two minimum-distribution-time formulas, and how BitTorrent trades chunks. | Kurose §2.5 · Chapter_2_v8.2 slides 79–86 · Chapter2-Problems

## The problem

A server must send a large file (a software update, a video) to a large number of hosts. In client-server distribution the server must send a copy to **every** client, so it carries an enormous burden and its upload rate becomes the limit. In P2P distribution each peer can **redistribute** any portion of the file it has already received to other peers, helping the server.

## The model

- \(F\) = file size in bits; \(N\) = number of peers that want a copy.
- \(u_s\) = the server's upload rate; \(u_i\) = the upload rate of peer \(i\); \(d_i\) = the download rate of peer \(i\); \(d_{min} = \min_i d_i\).
- The Internet core has abundant bandwidth, so all bottlenecks are in access networks.
- The **distribution time** is the time for all \(N\) peers to get a complete copy.

## Client-server distribution time

1. The server must upload \(N\) copies, \(NF\) bits in total, at rate \(u_s\). So it needs at least \(NF/u_s\).
2. The peer with the lowest download rate can't receive the file in less than \(F/d_{min}\).

:::fx Client-server
\[ D_{cs} \ge \max\left\{ \frac{NF}{u_s},\ \frac{F}{d_{min}} \right\} \]
For large \(N\), \(D_{cs}\) grows **linearly** with \(N\).
:::

## P2P distribution time

1. At the start only the server has the file, so it must send every bit at least once: at least \(F/u_s\).
2. The slowest peer still needs \(F/d_{min}\).
3. In total \(NF\) bits must be delivered, and the total upload capacity of the system is the server's plus every peer's: \(u_s + \sum u_i\). So at least \(NF / (u_s + \sum u_i)\).

:::fx P2P
\[ D_{P2P} \ge \max\left\{ \frac{F}{u_s},\ \frac{F}{d_{min}},\ \frac{NF}{u_s + \sum_{i=1}^{N} u_i} \right\} \]
Each new peer adds both demand (\(F\) bits) and capacity (\(u_i\)), so \(D_{P2P}\) stays **bounded** as \(N\) grows: this is self-scalability.
:::

:::plot Minimum distribution time against the number of peers, with F/u = 1 hour, u_s = 10u and d_min ≥ u_s (Kurose's comparison) | N (peers) | Distribution time (hours)
series Client-server: 0,0 5,0.5 10,1 15,1.5 20,2 25,2.5 30,3 35,3.5
func P2P: max(0.1, x/(10+x)) ; 0 35
:::

!!sim visualizations/application/p2p.html | Client-server vs P2P calculator | Change F, N, the server's upload rate and the peers' rates; the solver shows every bound, which one wins, and a graph of both times as N grows.

## Worked numericals

:::ex Level 1 | Practice
:::solve
Given: \(F = 1\) Gbit, \(u_s = 100\) Mbps, \(N = 20\) peers, each with \(d_i = 50\) Mbps and \(u_i = 10\) Mbps.
Required: \(D_{cs}\) and \(D_{P2P}\).
Formula: As above.
Substitution: \(F = 1{,}000\) Mbit. \(NF = 20{,}000\) Mbit. \(\sum u_i = 200\) Mbps.
Calculation: \(D_{cs} = \max(20{,}000/100,\ 1{,}000/50) = \max(200, 20) = 200\) s. \(D_{P2P} = \max(1{,}000/100,\ 20,\ 20{,}000/300) = \max(10, 20, 66.7) = 66.7\) s.
Answer: 200 s client-server; 66.7 s P2P, three times faster.
:::
:::

:::ex From a paper | 1000 MB to 10 peers {{paper:23CSE302 Mid 2025 Q2(A)}}
:::solve
Given: \(u_s = 5\) Mbps; \(F = 1000\) MB; \(N = 10\); \(d_{min} = 2\) Mbps; each \(u_i = 1\) Mbps.
Required: The minimum P2P distribution time.
Formula: \( D_{P2P} = \max\{F/u_s,\ F/d_{min},\ NF/(u_s + \sum u_i)\} \)
Substitution: \(F = 1000 \times 10^6 \times 8 = 8 \times 10^9\) bits = 8,000 Mbit. \(\sum u_i = 10 \times 1 = 10\) Mbps.
Calculation: \(F/u_s = 8{,}000/5 = 1{,}600\) s. \(F/d_{min} = 8{,}000/2 = 4{,}000\) s. \(NF/(u_s + \sum u_i) = 80{,}000/15 = 5{,}333.3\) s.
Answer: \(D_{P2P} = 5{,}333.3\) s ≈ 88.9 minutes, limited by the total upload capacity. (Client-server would take \(\max(80{,}000/5,\ 4{,}000) = 16{,}000\) s ≈ 4.4 hours.)
:::
:::

:::ex From a paper | The full comparison table {{paper:19CSE301 Mid 2024 Q6}}
:::solve
Given: \(F = 10\) Gbits; \(u_s = 1\) Gbps; \(d_i = 200\) Mbps; \(N = 10, 100, 1000\); \(u = 2\) Mbps and 10 Mbps.
Required: Minimum distribution times for both architectures for every combination.
Formula: \(D_{cs} = \max(NF/u_s, F/d)\); \(D_{P2P} = \max(F/u_s, F/d, NF/(u_s + Nu))\).
Substitution: \(F = 10{,}000\) Mbit, \(u_s = 1{,}000\) Mbps. \(F/u_s = 10\) s; \(F/d = 50\) s.
Calculation: Client-server (independent of u): N = 10: max(100, 50) = 100 s; N = 100: 1,000 s; N = 1,000: 10,000 s. P2P with u = 2 Mbps: N = 10: \(100{,}000/1{,}020 = 98.0\) s; N = 100: \(10^6/1{,}200 = 833.3\) s; N = 1,000: \(10^7/3{,}000 = 3{,}333.3\) s. P2P with u = 10 Mbps: N = 10: \(100{,}000/1{,}100 = 90.9\) s; N = 100: \(10^6/2{,}000 = 500\) s; N = 1,000: \(10^7/11{,}000 = 909.1\) s.
Answer: See the table below. Client-server grows tenfold with each tenfold N; P2P grows far more slowly, and faster peer uploads help a lot.
:::

| N | Client-server, u = 2 or 10 Mbps | P2P, u = 2 Mbps | P2P, u = 10 Mbps |
|---|---|---|---|
| 10 | 100 s | 98.0 s | 90.9 s |
| 100 | 1,000 s | 833.3 s | 500 s |
| 1,000 | 10,000 s | 3,333.3 s | 909.1 s |
:::

## BitTorrent

**BitTorrent** is the most popular P2P file-distribution protocol.

- The collection of all peers taking part in distributing a particular file is a **torrent**.
- Peers download equal-sized **chunks** of the file from each other (typically 256 KB).
- Each torrent has an infrastructure node called a **tracker**. A peer joining the torrent registers with the tracker and periodically tells it that it is still there. The tracker sends the new peer a random subset of the participating peers' addresses (say 50); the peer opens TCP connections to them (its **neighbours**).
- **Which chunks to request: rarest first.** A peer asks each neighbour for its list of chunks, then requests the chunks that are rarest among its neighbours, so rare chunks get copied quickly and the copies of every chunk even out.
- **Which neighbours to send to: tit-for-tat.** A peer gives priority to the neighbours that are currently supplying it data at the **highest rate**. Every 10 seconds it picks the **top four**; these are **unchoked** (it sends them chunks). Every 30 seconds it also picks one extra neighbour at random and sends it chunks: this one is **optimistically unchoked**. All other neighbours are **choked** (they receive nothing from this peer).
- Optimistic unchoking lets new peers (with nothing to trade yet) get started, and lets a peer discover better trading partners. Over time, peers that upload at compatible rates find each other.
- A peer may leave once it has the whole file, or stay on to upload (a **seeder**); some peers leave with only part of it.

:::tip From a paper {{paper:20CYS303 Mid 2023 Q2}}
“How are files shared in BitTorrent? What do choked, unchoked and optimistically unchoked mean?” Answer with the tracker → neighbours → rarest-first chunks → tit-for-tat sequence above, and define the three states: unchoked = among the top four uploaders to me, so I upload to them; optimistically unchoked = one random neighbour I upload to every 30 s regardless; choked = everyone else.
:::

:::mistake Common mistakes
- Forgetting the \(F/u_s\) term in the P2P formula: the server must send at least one full copy.
- Using \(N\) peers' upload in the client-server formula. Peers don't upload in client-server.
- Mixing bytes and bits in \(F\).
:::

:::rev Quick revision
- \(D_{cs} \ge \max\{NF/u_s, F/d_{min}\}\), linear in N.
- \(D_{P2P} \ge \max\{F/u_s, F/d_{min}, NF/(u_s + \sum u_i)\}\), bounded: self-scalability.
- BitTorrent: torrent, tracker, 256 KB chunks, rarest first, tit-for-tat (top 4 every 10 s, 1 optimistic unchoke every 30 s).
:::

@@topic u1-video | I.15 | Video streaming | What a compressed video stream is, why streaming over the Internet is hard, how playout buffering hides delay jitter, and how DASH adapts the quality to the bandwidth. | Kurose §2.6.1–2.6.2 · Chapter_2_v8.2 slides 87–96

## Video is the Internet's biggest load

Streamed video (Netflix, YouTube, Hotstar) is by far the largest share of Internet traffic. To stream well, you need to understand three things: what video data looks like, why the network makes streaming hard, and how clients cope.

## Properties of video

- A video is a **sequence of images**, displayed at a constant rate, for example 24 or 30 images (frames) per second.
- An uncompressed digital image is an array of **pixels**, each encoded with bits for luminance and colour.
- Video can be **compressed**, trading quality for bit rate, by exploiting two kinds of redundancy:
  - **spatial** redundancy, within one image (a large area of blue sky can be sent as “N pixels of this colour” instead of N separate values);
  - **temporal** redundancy, from one image to the next (if frame i+1 is almost the same as frame i, send only the differences).
- **CBR (constant bit rate)**: the encoding rate is fixed. **VBR (variable bit rate)**: the rate changes as the amount of spatial and temporal change varies.
- Typical rates: around 100 kbps for low-quality video, over 3 Mbps for HD, and over 10 Mbps for 4K streaming. The same video is usually stored in several versions at different rates.

Higher bit rate gives better quality but needs more average end-to-end throughput; the main performance measure for streaming is **average throughput**, which must be at least the video's bit rate for continuous playout.

## Why streaming is hard

- **Bandwidth varies** over time as other traffic comes and goes, with congestion in the home network, the access network or the core.
- **Packet loss and delay** (jitter): packets arrive with varying delays, and lost packets are retransmitted (by TCP) after a delay.
- **Heterogeneity**: some users are on fast wired links, others on 4G with poor reception.

The basic requirement is the **continuous playout constraint**: once the client begins playing, playback must follow the original timing, so data must arrive in time to be played.

## Playout buffering

The client doesn't start playing the moment the first bytes arrive. It **buffers** a few seconds of video first, then plays from the buffer while more data keeps arriving. The **playout delay** absorbs the variation in network delay: as long as the buffer doesn't run dry, the viewer sees smooth video even when the network briefly slows.

:::ex Practice | How long must the client buffer?
:::solve
Given: A 10-minute video encoded at a constant 4 Mbps. The connection delivers a steady 3 Mbps.
Required: The minimum initial buffering (playout) delay \(t_0\) that avoids any stall.
Formula: By playback time \(t\) after the start, the client has received \(3(t_0 + t)\) Mbit and needs \(4t\) Mbit. Require \(3(t_0 + t) \ge 4t\) for every \(t\) up to 600 s.
Substitution: \(3t_0 \ge t\) must hold at the worst point, \(t = 600\) s.
Calculation: \(t_0 \ge 600/3 = 200\) s.
Answer: The client must wait 200 s before playing. That is unacceptable, which is why real players instead switch to a lower bit-rate version (adaptive streaming) when throughput is below the encoding rate.
:::
:::

:::plot Cumulative data received (3 Mbps) and needed (4 Mbps, starting at t₀ = 200 s) | Time since request (s) | Data (Mbit)
series Received: 0,0 800,2400
series Needed for playout: 0,0 200,0 800,2400
:::

## HTTP streaming

In **HTTP streaming** the video is stored on an HTTP server as an ordinary file with a URL. The client opens a TCP connection, sends a GET, and the server sends the video file as fast as TCP allows. The client buffers the bytes; once the buffer passes a threshold, it starts playing, taking frames from the buffer and decompressing them.

The weakness: **every client receives the same encoding**, whatever its available bandwidth, even though bandwidth differs hugely between clients and changes over time for the same client.

## DASH: Dynamic Adaptive Streaming over HTTP

In **DASH**, the video is encoded into several versions, each with a different bit rate and quality level, and each version is cut into **chunks** (a few seconds each), each with its own URL.

:::flow
1. Manifest | The client first requests a **manifest file**, which lists the URL and bit rate of every version.
2. Measure | The client measures the throughput it is receiving as it downloads.
3. Choose | For each next chunk, a **rate-determination algorithm** picks the highest-quality version the current bandwidth can sustain.
4. Request | The client sends an HTTP GET for that chunk; it can switch version at every chunk.
:::

With DASH, “intelligence” sits at the client. The client decides:

- **when** to request a chunk (so the buffer neither starves nor overflows),
- **what encoding rate** to request (higher quality when more bandwidth is available), and
- **where** to request it from (a nearby, uncongested server, which is where CDNs come in).

:::ex Practice | Choosing a DASH chunk
:::solve
Given: The manifest lists versions at 0.5, 1, 2.5, 5 and 8 Mbps. The client measured 3.2 Mbps over the last chunks, and its buffer is healthy.
Required: Which version to request next, and what changes if throughput falls to 1.4 Mbps.
Formula: Choose the highest bit rate that does not exceed the measured throughput (real players add a safety margin).
Substitution: Versions ≤ 3.2 Mbps: 0.5, 1, 2.5.
Calculation: Highest is 2.5 Mbps. At 1.4 Mbps, versions ≤ 1.4 are 0.5 and 1.
Answer: Request the 2.5 Mbps chunk now; switch down to the 1 Mbps version when throughput drops to 1.4 Mbps, so the buffer doesn't drain and playback never stalls.
:::
:::

| Plain HTTP streaming | DASH |
|---|---|
| One encoding for everyone | Many encodings, chosen per chunk |
| The whole file at one URL | Chunks, each with a URL, listed in a manifest |
| Stalls when bandwidth drops below the video rate | Switches to a lower rate instead of stalling |
| No client decisions | The client decides when, what rate and where |

:::exam Exam focus
- {{paper:20CYS303 End 2023 Q8}}: “How does DASH help HTTP streaming?” (5 marks). Describe versions, chunks, the manifest, client throughput measurement and per-chunk rate selection, and contrast with plain HTTP streaming.
- Define spatial and temporal redundancy, CBR and VBR.
- Explain why a playout buffer is needed.
:::

:::rev Quick revision
- Video = images at a constant rate; compression uses spatial and temporal redundancy; CBR vs VBR.
- Challenges: varying bandwidth, loss, jitter, heterogeneity; continuous playout constraint.
- Playout buffer absorbs delay variation.
- DASH: versions, chunks, manifest; the client picks rate per chunk (when, what, where).
:::

@@topic u1-cdn | I.16 | Content distribution networks | Why one giant data centre can't serve the world's video, how CDNs place servers (enter deep vs bring home), how DNS redirects you to a nearby server, how a cluster is chosen, and how Netflix and YouTube do it. | Kurose §2.6.3–2.6.4 · Chapter_2_v8.2 slides 97–103, 122–123

## The problem

How can one company stream content to millions of users at once? The simplest idea, one huge data centre, fails for three reasons:

1. **Distance**: if the client is far from the data centre, packets cross many links and ISPs; if any of them has low throughput, the video stalls (throughput is the bottleneck link's rate).
2. **Waste**: a popular video is sent many times over the same links, so the company pays its ISP repeatedly for the same bytes.
3. **Single point of failure**: if the data centre or its links go down, nobody gets any video.

## What a CDN is

A **content distribution network (CDN)** manages servers in **many geographically distributed locations**, stores copies of the videos (and other web content, such as documents and images) on them, and directs each user request to a CDN location that will give the best user experience.

- A **private CDN** is owned by the content provider itself: Google's CDN distributes YouTube videos; Netflix has Open Connect.
- A **third-party CDN** distributes content for many content providers: Akamai, Limelight and Level-3.

:::exam From a paper {{paper:23CSE302 Mid 2025 Q2(B)}}
“Define the role of a CDN on the Internet” (2 marks). A CDN stores copies of content on servers distributed close to users and redirects each request to a nearby, lightly loaded server, which reduces delay and stalls for users, cuts repeated traffic over long-haul links and provider costs, and removes the single point of failure of one central data centre.
:::

## Two server-placement philosophies

| Enter deep (Akamai) | Bring home (Limelight and others) |
|---|---|
| Deploy server clusters **in access ISPs**, all over the world | Build **large clusters at a smaller number of sites**, typically at IXPs |
| Gets close to end users: fewer links and routers between user and server, so lower delay and higher throughput | Fewer sites, so much lower maintenance and management overhead |
| Very many clusters are hard to maintain and manage | Somewhat higher delay and lower throughput for users |

Once clusters are in place, the CDN **replicates content** across them. It may not keep every video in every cluster: some videos are rarely viewed in some countries. Many CDNs **pull** content (like a web cache): if a client requests a video the cluster doesn't have, the cluster fetches it from a central repository or another cluster, stores a copy and streams it; when storage fills, it removes videos that aren't requested often. Others **push** content to clusters ahead of time.

## How a CDN intercepts your request (DNS redirection)

Suppose the content provider NetCinema uses the third-party CDN KingCDN. A NetCinema web page contains a link to a video at `http://video.netcinema.com/6Y7B23V`.

:::seq Client | Local DNS | NetCinema auth. DNS | KingCDN auth. DNS | KingCDN server
1>2 DNS query: video.netcinema.com
2>3 query: video.netcinema.com
3>2 a CNAME a1105.kingcdn.com
2>4 query: a1105.kingcdn.com
4>2 a IP of a nearby KingCDN server
2>1 a IP of KingCDN server
1>5 TCP + HTTP GET (DASH manifest, chunks)
5>1 a video chunks
:::

1. The user visits NetCinema's web page.
2. When the user clicks the video link, the host sends a DNS query for video.netcinema.com.
3. The user's local DNS server relays the query to an authoritative DNS server for NetCinema, which sees the string “video” and, instead of an IP address, returns a **host name in KingCDN's domain**, such as a1105.kingcdn.com.
4. From this point the query enters KingCDN's private DNS infrastructure: the local DNS server sends a second query, now for a1105.kingcdn.com, and KingCDN's DNS system eventually returns the **IP address of a KingCDN content server**.
5. The local DNS server passes that address to the user's host.
6. The client opens a TCP connection directly to that server and sends an HTTP GET for the video (with DASH, first the manifest, then chunks of different versions).

## Choosing a cluster

The core of a CDN is its **cluster selection strategy**: dynamically directing clients to a server cluster or data centre. The CDN learns the IP address of the client's **local DNS server** through the DNS lookup, then chooses a cluster based on that address.

- **Geographically closest**: map the local DNS server's address to a location and pick the cluster with the fewest kilometres to it. Works reasonably for most clients, but can fail: the nearest cluster in kilometres may be far in network hops; some users use a local DNS server that is far away from them; and it ignores how delay and bandwidth change over time.
- **Real-time measurements**: clusters periodically send probes (ping messages or DNS queries) to local DNS servers around the world to measure delay and loss, and choose the best-performing cluster.
- **IP anycast** (an alternative): all clusters advertise the same IP address through BGP, and routing delivers each client to the nearest one.

:::tip From a paper {{paper:19CCE304 Mid 2023 Q3}}
Besides delay, loss and bandwidth, what else goes into a CDN's server-selection strategy? **Load balancing** (don't send clients to an overloaded cluster), **diurnal effects** (load follows the time of day in each region), **variations across DNS servers** within one network (clients sharing a far-away local DNS server), **limited availability of rarely watched videos** (the chosen cluster must actually hold the content, or be able to pull it quickly), the **need to relieve hot spots**, and the provider's **delivery cost** (traffic through some ISPs costs more than others).
:::

## Case studies

### Netflix

Netflix runs its website, user accounts, recommendations and video **encoding** (creating many versions of each film for DASH) in Amazon's cloud. To deliver video it built its own private CDN, **Open Connect**: server racks installed in IXPs and inside residential ISPs, in many countries. Netflix uses **push caching**: during off-peak hours it pushes the videos each region is likely to watch into the racks there, rather than pulling them on demand. When a user picks a film, Netflix's software in the cloud tells the client which local CDN servers hold copies, and the client streams the film with DASH.

### YouTube

YouTube uses Google's private CDN, with server clusters in many IXP and ISP locations. Google uses **pull caching** (like a web cache) and DNS redirection, and usually sends a client to the cluster with the lowest RTT, sometimes redirecting to another cluster for load balancing. YouTube uses HTTP streaming, offering a small number of versions of each video with different quality and letting the user (or a simple algorithm) choose.

| | Netflix | YouTube |
|---|---|---|
| CDN | Private (Open Connect) | Private (Google) |
| Server sites | IXPs and inside residential ISPs | IXPs and ISP locations |
| Replication | **Push** during off-peak hours | **Pull** on demand |
| Streaming | DASH | HTTP streaming, a few versions |

:::mistake Common mistakes
- Saying the content provider's DNS returns the CDN server's IP address. It returns a **CNAME in the CDN's domain**; the CDN's own DNS returns the address.
- Assuming geographic closeness means best performance. Network distance, load and the local DNS server's position matter.
:::

:::rev Quick revision
- One data centre fails on distance, repeated traffic and single point of failure.
- CDN = many distributed servers holding copies; private (Google, Netflix) or third-party (Akamai).
- Enter deep (many clusters in access ISPs) vs bring home (few big clusters at IXPs).
- DNS redirection: provider's DNS returns a CNAME in the CDN domain; CDN DNS returns a nearby server.
- Cluster selection: geographically closest, real-time measurements, IP anycast; plus load and availability.
- Netflix: Open Connect, push caching, DASH. YouTube: Google CDN, pull caching.
:::

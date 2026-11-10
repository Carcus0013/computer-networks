@@unit u1 | Unit I | Introduction and Application Layer | What the Internet is made of, how data crosses it, how long that takes, how the work is split into layers, and how the applications you use every day (the web, email, DNS, file sharing, video) are built on top.

The unit has two halves. Topics I.1 to I.8 build the vocabulary of the whole course: hosts, links, packet switches, delay and layers. Topics I.9 to I.16 study the application layer, the layer closest to you. In past papers this unit supplies the delay numericals, the HTTP timing questions, DNS, email, P2P and CDN questions.

@@group Foundations
@@topic u1-internet | I.1 | The Internet: what it is | Two ways of describing the Internet (the parts it is built from, and the services it gives), and the single idea the whole subject rests on: the protocol. | Kurose §1.1 · Chapter_1_v8.2 slides 2–8

## Start from the simplest picture: a network

A **network** is a set of devices, called **nodes**, connected by communication **links**. A node is anything that can send or receive data: a laptop, a phone, a printer, a router. A link is the path between two nodes: a copper cable, a glass fibre, or a radio channel.

Why not simply wire every device to every other device? Because the number of wires explodes. To give each pair of \(n\) devices its own link you need

\[ \text{links} = \frac{n(n-1)}{2} \]

With 4 devices that is 6 links. With 100 devices it is 4,950 links, and every machine needs 99 ports. With the billions of devices on the Internet it is impossible. Real networks therefore **share** links: a few intermediate devices (switches and routers) receive data and pass it on. That single design decision is why the Internet has an *edge* (the devices you use) and a *core* (the shared machinery in the middle).

## View 1: the nuts-and-bolts view (what the Internet is made of)

The Internet is a network of billions of computing devices joined by links and packet switches. It has four kinds of parts.

| Part | What it is | Examples |
|---|---|---|
| **Hosts (end systems)** | Devices at the edge that run applications | Laptops, phones, smart TVs, web servers, cars, sensors |
| **Communication links** | Physical paths that carry bits; each has a **transmission rate** in bits per second | Copper, coaxial cable, optical fibre, radio, satellite |
| **Packet switches** | Devices in the middle that take a packet arriving on one link and send it out on another | **Routers** (in the network core), **link-layer switches** (in access networks) |
| **ISPs** | Internet Service Providers: organisations that own and run networks of links and switches | BSNL, Jio, Airtel, a university campus network, Tata Communications |

When one host has data to send, it breaks the data into chunks and adds a header to each chunk. The resulting bundle is a **packet**. Packets travel through a sequence of links and packet switches called a **route** or **path**. At the destination the packets are put back together.

:::analogy Trucks and warehouses
Think of a factory that ships cargo to a warehouse far away. The cargo is split and loaded onto many trucks (packets). Each truck drives along highways and roads (links) and passes through intersections (packet switches), where it chooses the next road. The trucks may even take different roads. At the warehouse the cargo is unloaded and reassembled. The trucks are like packets, the roads like links, the intersections like switches, and the factory and warehouse like hosts.
:::

### ISPs are arranged in tiers

Your home connects to an **access ISP** (Jio, ACT Fibernet, BSNL). Access ISPs connect to larger **regional ISPs**, and those connect to **tier-1 ISPs**, a small number of global carriers that run fibre between continents. Big content providers such as Google run their own networks too. Every ISP runs the same family of protocols, so a packet can cross many ISPs without any of them caring which application it belongs to. Topic I.3 looks at this structure in detail.

:::graph A simplified Internet. Hosts (ochre) sit at the edge; access ISPs connect them to regional and tier-1 ISPs in the core.
laptop 70 40 host "Laptop"
phone 70 110 host "Phone"
home 210 75 box "Home router"
acc1 360 75 box "Access ISP"
reg 520 75 box "Regional ISP"
t1 520 190 box "Tier-1 ISP"
t1b 360 190 box "Tier-1 ISP"
acc2 200 190 box "Access ISP"
srv 70 190 host "Web server"
laptop-home
phone-home
home-acc1
acc1-reg
reg-t1
t1-t1b
t1b-acc2
acc2-srv
:::

### Protocols and standards

Every activity on the Internet that involves two or more communicating parts is governed by a **protocol**. The two most important are **IP** (Internet Protocol), which defines the format of packets sent between routers and hosts, and **TCP** (Transmission Control Protocol), which gives applications reliable delivery. Together the Internet's main protocols are called **TCP/IP**.

For different vendors' equipment to work together, everyone must agree on what each protocol does. These agreements are **Internet standards**, developed by the **IETF** (Internet Engineering Task Force). IETF standards documents are called **RFCs** (Requests for Comments); HTTP, TCP, IP, SMTP and DNS are all defined in RFCs. Standards for network links, such as Ethernet and Wi-Fi, come from the **IEEE 802** committee.

## View 2: the services view (what the Internet does for applications)

The second way to describe the Internet is by what it offers: it is **an infrastructure that provides services to distributed applications**. A distributed application runs on many hosts that exchange data: the web, email, WhatsApp, online games, video streaming, AUMS.

These applications run on the *hosts*, not on the routers. A router never runs WhatsApp; it only forwards packets. This is why new applications can be invented without changing the network core.

How does a program on one host ask the Internet to deliver data to a program on another host? Through a **socket interface**: a set of rules that says how the sending program must hand data to the Internet. This is like the postal service: you can't just drop a letter out of the window; you must put it in an envelope, write the address in a set format, attach a stamp and put it in a post box. The postal service then offers its delivery service. The Internet offers more than one service (reliable or best-effort), and the application chooses (Topic I.9).

| Nuts-and-bolts view | Services view |
|---|---|
| Describes the **hardware and software parts** | Describes **what the Internet offers** |
| Hosts, links, packet switches, ISPs, protocols | A platform for distributed applications |
| Answers “what is it made of?” | Answers “what can it do for me?” |
| Example answer: “billions of hosts joined by fibre, copper and radio through routers” | Example answer: “it delivers data between programs on different hosts through a socket interface” |

## The protocol: the most important idea in this course

A **protocol** specifies three things:

1. the **format** of the messages exchanged between two or more communicating entities,
2. the **order** in which those messages are sent, and
3. the **actions** taken when a message is sent or received (or when some other event, such as a timer running out, happens).

### A human protocol

When you want the time from a stranger, you follow an unwritten protocol: greet first, wait for a greeting back, ask the question, wait for the answer. If the reply is “Don't bother me”, you don't ask; that reply triggers a different action.

:::seq You | Stranger
1>2 Hi
2>1 a Hi
1>2 Got the time?
2>1 a 2:00
:::

### A network protocol

Now the same pattern between your browser and a web server. The browser first asks to open a TCP connection; the server replies; only then does the browser send the HTTP request for the page, and the server replies with the file. Format, order and actions are all fixed by the TCP and HTTP protocols.

:::seq Your browser | Web server
1>2 TCP connection request
2>1 a TCP connection response
1>2 GET http://www.amrita.edu/index.html
2>1 a <file>
:::

If either side breaks the protocol (sends the GET before the connection exists, or replies in the wrong format), communication fails, just as it would if a stranger answered “Hi” with a page of Japanese.

## Advantages and limitations of building a network of networks

| Advantages | Limitations |
|---|---|
| Any host can reach any other host, regardless of who owns the links | No single owner, so no one can guarantee end-to-end quality |
| New applications only need new software on hosts | Shared links mean congestion, delay and loss (Topic I.6) |
| Standard protocols let equipment from many vendors work together | Attackers share the same network (Topic I.8) |
| Each ISP can grow independently | Changing a core protocol (such as moving from IPv4 to IPv6) takes decades |

:::exam Exam focus
- Define the Internet in both views. Two-mark questions often ask for exactly this.
- Define a protocol using the three words **format, order, actions**. Without all three you lose marks.
- Know that IETF produces RFCs and IEEE 802 produces LAN standards.
- {{paper:19CSE301 Mid 2024 Q1(a)}} gave a picture of a home network and asked you to identify the end systems. Hosts are the devices that run applications (PCs, phones, TVs, servers). The router, modem and switch are **not** end systems.
:::

:::mistake Common mistakes
- Calling a router an end system. Routers and switches are in the network; end systems are at its edge.
- Writing “a protocol is a set of rules” and stopping. Say rules for the format and order of messages and the actions taken.
- Confusing *internet* (any interconnection of networks) with *the Internet* (the specific global one running TCP/IP).
:::

:::rev Quick revision
- Network = nodes + links. Full pairwise wiring needs \(n(n-1)/2\) links, so networks share links through switches.
- Nuts-and-bolts view: hosts, links, packet switches (routers, link-layer switches), ISPs, protocols (TCP/IP), standards (IETF RFCs, IEEE 802).
- Services view: an infrastructure that delivers data between distributed applications through a socket interface.
- Protocol = format + order of messages + actions on sending or receiving.
:::

@@topic u1-edge | I.2 | The network edge | End systems, the access networks that connect them to the first router, and the physical media that carry the bits. | Kurose §1.2 · Chapter_1_v8.2 slides 9–25

## What sits at the edge

Hosts sit at the **edge** of the Internet. Hosts are divided into **clients** (laptops, phones, which request services) and **servers** (more powerful machines that store and send web pages, video and email). Today most large servers live in **data centres**; a single Google data centre can hold over 100,000 servers.

The **access network** is the network that physically connects an end system to the first router on a path to any other end system. That first router is called the **edge router**. Access networks are of three broad kinds: home access, enterprise (and university) access, and wide-area wireless access.

## Home access networks

### DSL (Digital Subscriber Line)

DSL reuses the telephone company's existing twisted-pair copper line to the home. A **DSL modem** in the home and a **DSLAM** (DSL access multiplexer) in the telephone company's local central office exchange data.

The trick is **frequency-division multiplexing**: the one copper line carries three signals in different frequency bands at the same time.

| Band | Use |
|---|---|
| 0 to 4 kHz | Ordinary two-way telephone call |
| 4 kHz to 50 kHz | Upstream data (home to network) |
| 50 kHz to 1 MHz | Downstream data (network to home) |

A **splitter** in the home separates the voice and data signals. Because downstream gets a wider band, DSL is **asymmetric**: faster down than up. DSL standards define downstream rates of 24 Mbps and 52 Mbps and upstream rates of 3.5 Mbps and 16 Mbps, but the achieved rate falls with distance from the central office. Each home has its own line to the DSLAM, so the line is **dedicated**, not shared.

### Cable (HFC)

Cable Internet reuses the cable-television network. Fibre runs from the cable head end to neighbourhood junctions, and coaxial cable runs from there to individual homes, so it is called **hybrid fibre-coax (HFC)**. A **cable modem** in each home talks to a **CMTS** (cable modem termination system) at the head end.

The DOCSIS 2.0 and 3.0 standards define downstream rates of 40 Mbps to 1.2 Gbps and upstream rates of 30 Mbps to 100 Mbps. The crucial difference from DSL: cable is a **shared broadcast medium**. Every packet the head end sends down travels on every link to every home, and homes share the upstream channel, so a multiple access protocol is needed (Unit III). If many neighbours are downloading video at the same time, each gets only a fraction of the downstream rate.

### FTTH (fibre to the home)

An optical fibre runs from the central office to the home. In the common **PON** (passive optical network) design, each home has an **ONT** (optical network terminator) connected to a neighbourhood **optical splitter**, which combines a number of homes (typically fewer than 100) onto one shared fibre to an **OLT** (optical line terminator) at the central office. FTTH can offer gigabit rates. Because of the splitter, the fibre from the splitter to the office is shared.

### Others

**Dial-up** uses an ordinary phone call and a modem at up to 56 kbps, dedicated, but the phone line can't be used for calls at the same time. **Satellite** links reach rural areas at over 100 Mbps today. **5G fixed wireless** sends data by radio from a base station to a modem in the home.

## Enterprise and home LANs: Ethernet and Wi-Fi

On campuses, in companies and increasingly in homes, a **local area network (LAN)** connects end systems to the edge router. **Ethernet** is the dominant wired LAN: users connect over twisted-pair copper to an Ethernet switch at 100 Mbps to tens of Gbps, and servers at 1 Gbps to 10 Gbps. **Wi-Fi** (IEEE 802.11) is the wireless LAN: devices talk to an **access point** within a few tens of metres, at rates above 100 Mbps.

A typical home combines everything: a DSL or cable modem, a router (often with a built-in Wi-Fi access point and Ethernet switch), and the devices.

:::graph A typical home network. The home router connects the Ethernet and Wi-Fi devices to the cable or DSL modem, which connects to the ISP.
pc 70 50 host "Desktop"
tv 70 130 host "Smart TV"
lap 70 210 host "Laptop (Wi-Fi)"
rt 270 130 box "Router + Wi-Fi AP"
mod 450 130 box "Cable/DSL modem"
isp 600 130 box "ISP"
pc-rt
tv-rt
lap-rt ~
rt-mod
mod-isp
text 140 228 dashed = wireless
:::

## Wide-area wireless access: 3G, 4G LTE, 5G

Phones reach the Internet through base stations run by a cellular operator, which can be kilometres away. 4G LTE offers tens of Mbps downstream in practice; 5G offers higher rates and lower latency. Unlike Wi-Fi, you can stay connected while moving across a city.

## Comparison of access technologies

| Technology | Medium | Typical rates | Shared or dedicated? |
|---|---|---|---|
| Dial-up | Telephone twisted pair | Up to 56 kbps | Dedicated |
| DSL | Telephone twisted pair, FDM | 24–52 Mbps down, 3.5–16 Mbps up | Dedicated line to the DSLAM |
| Cable (HFC) | Fibre + coaxial | 40 Mbps–1.2 Gbps down, 30–100 Mbps up | **Shared** among homes in a neighbourhood |
| FTTH (PON) | Optical fibre | Up to Gbps | Shared after the splitter |
| Ethernet LAN | Twisted pair | 100 Mbps–10 Gbps | Dedicated switch port |
| Wi-Fi | Radio | Over 100 Mbps | Shared radio channel |
| 4G/5G | Radio | Tens to hundreds of Mbps | Shared within a cell |

## Physical media: what the bits travel on

Bits travel from one node to the next as electromagnetic waves or optical pulses through a **physical medium**. Media are of two kinds:

- **Guided media**: the waves are guided along a solid medium, such as copper twisted pair, coaxial cable or optical fibre.
- **Unguided media**: the waves travel freely through the atmosphere or space, as in wireless LANs and satellite links.

| Medium | How it works | Rates and distance | Strengths | Weaknesses |
|---|---|---|---|---|
| **Twisted-pair copper** | Two insulated copper wires twisted together to reduce interference; unshielded twisted pair (UTP) is used in LANs | Cat 6a: 10 Gbps over up to about 100 m | Cheapest, easiest to install, dominant in LANs | Rate falls quickly with distance; picks up electrical noise |
| **Coaxial cable** | Two concentric copper conductors; can carry many channels on different frequencies | Hundreds of Mbps, shared | Higher rates than twisted pair; used by cable TV | Shared medium; bulkier |
| **Optical fibre** | Thin glass fibre carrying light pulses; each pulse is a bit | Tens to hundreds of Gbps, over long distances | Very low attenuation, immune to electromagnetic interference, very hard to tap | Optical devices (lasers, transmitters) are expensive |
| **Terrestrial radio** | Radio waves; no wire needed | Short range (Bluetooth), local (Wi-Fi, tens of m), wide area (cellular, km) | Mobility, no cabling | Path loss, shadow fading, interference |
| **Satellite radio** | Geostationary satellites at 36,000 km; low-earth-orbit (LEO) satellites much lower | Hundreds of Mbps | Reaches areas with no wired access | GEO adds about 280 ms of signal delay |

The cost of the wire itself is small; installation labour usually costs far more. That is why builders often lay twisted pair, fibre and coax all at once in new buildings.

:::ex Worked example | Throughput of a home network (based on {{paper:19CSE301 Mid 2024 Q1(c,d)}})
In a home network the DSL modem gives 8 Mbps downstream and 1 Mbps upstream, the Ethernet switch runs at 10 Gbps and the Wi-Fi access point at 54 Mbps.

:::solve
Given: DSL down = 8 Mbps, DSL up = 1 Mbps, Ethernet = 10 Gbps, Wi-Fi = 54 Mbps. File = 5 GB.
Required: (a) the throughput when a Wi-Fi laptop downloads from the Internet; (b) the time to copy the 5 GB file between two wired PCs on the switch.
Formula: Throughput of a path = rate of its slowest link, \( \min(R_1, R_2, \dots) \). Transfer time \( = F / R \).
Substitution: (a) path = Internet → DSL (8 Mbps) → router → Wi-Fi (54 Mbps). (b) \( F = 5 \times 10^9 \times 8 = 40 \times 10^9 \) bits, \( R = 10 \times 10^9 \) bps.
Calculation: (a) \( \min(8, 54) = 8 \) Mbps. (b) \( 40 \times 10^9 / 10 \times 10^9 = 4 \) s. (Splitting into 2,000-byte packets adds only one extra packet time, \( 16{,}000 / 10^{10} = 1.6\ \mu\text{s} \), which is negligible.)
Answer: (a) 8 Mbps, limited by the DSL downstream link. (b) About 4 seconds.
:::
:::

:::exam Exam focus
- Know the three DSL frequency bands and why DSL is asymmetric.
- Know which access networks are **shared** (cable, PON, Wi-Fi, cellular) and which are **dedicated** (DSL, dial-up, switched Ethernet). {{paper:19CCE304 End 2024 Q1(B)}} asked for the rate range of dial-up, HFC, DSL and FTTH and whether each is shared or dedicated.
- {{paper:19CSE301 Mid 2024 Q1(b,e)}} asked you to name the access network in a home picture (in full words, no acronyms) and the medium connecting a switch to end systems (twisted-pair copper).
- Guided vs unguided media, with two examples of each.
:::

:::mistake Common mistakes
- Writing “DSL is shared”. The DSL line is dedicated; cable is the shared one.
- Using acronyms only. Write “Digital Subscriber Line (DSL)” and “Hybrid Fibre-Coax (HFC)” at least once.
- Confusing the access network (home to edge router) with the network core (router to router).
:::

:::rev Quick revision
- Edge = hosts (clients, servers) + access networks + physical media.
- DSL: phone line, FDM bands (0–4 kHz voice, 4–50 kHz up, 50 kHz–1 MHz down), DSLAM, dedicated, asymmetric.
- Cable: HFC, cable modem ↔ CMTS, DOCSIS, shared broadcast medium.
- FTTH/PON: ONT, splitter, OLT; gigabit rates.
- Guided media: twisted pair, coax, fibre. Unguided: terrestrial radio, satellite.
:::

@@topic u1-core | I.3 | The network core | How packets move through the mesh of routers: packet switching with store-and-forward, queuing and loss, forwarding versus routing, circuit switching with FDM and TDM, and the network of networks. | Kurose §1.3 · Chapter_1_v8.2 slides 26–43 · Chapter 1 Problems

## The problem the core solves

Once a packet leaves your home router it enters the **network core**: the mesh of packet switches and links that interconnects the Internet's end systems. There are two basic ways to move data through such a mesh:

- **Packet switching**: send data in packets; each packet uses a link's full rate while it is being transmitted, and nothing is reserved in advance. The Internet works this way.
- **Circuit switching**: reserve a fixed share of every link on the path for the whole conversation, like the traditional telephone network.

## Packet switching

The source breaks a long message into smaller chunks called **packets**. Each packet travels through communication links and packet switches. If a packet of \(L\) bits is sent over a link with transmission rate \(R\) bits/s, the time to push the packet onto the link is

\[ d_{\text{trans}} = \frac{L}{R} \text{ seconds} \]

### Store-and-forward transmission

Most packet switches use **store-and-forward transmission**: the switch must receive the **entire** packet before it can begin to transmit the first bit onto the outgoing link. It buffers (stores) the bits as they arrive, and only when the last bit is in does it start forwarding.

Consider a source sending one packet of \(L\) bits to a destination through one router, with both links at rate \(R\), ignoring propagation delay:

- At time \(L/R\) the router has received the whole packet and starts sending it.
- At time \(2L/R\) the destination has received the whole packet.

Over a path of \(N\) links (\(N - 1\) routers) of rate \(R\):

:::fx End-to-end delay of one packet over N links (no queuing, no propagation)
\[ d_{\text{end-end}} = N \frac{L}{R} \]
:::

If the source sends \(P\) packets back to back, the first arrives after \(N L/R\); after that the packets arrive one every \(L/R\) (the links work like a pipeline). So

:::fx P packets over N equal-rate links (store-and-forward)
\[ d = (N + P - 1)\frac{L}{R} \]
:::

!!sim visualizations/core/switching.html | Packet switching vs circuit switching | Watch store-and-forward happen link by link, then compare with a reserved circuit. Change L, R, the number of links and packets.

### Queuing delays and packet loss

Each packet switch has an **output buffer** (an output queue) for every attached link. If a packet arrives and the outgoing link is busy sending another packet, the arriving packet waits in the buffer. The wait is the **queuing delay**; it varies with how congested the network is. Buffers are finite. If a packet arrives when the buffer is full, a packet is **dropped**: that is **packet loss**.

:::analogy The toll booth
Cars (packets) reach a toll booth (an output link). If the booth is busy, cars queue. If the queue backs up past the entrance ramp (the buffer is full), new cars are turned away (lost).
:::

### Forwarding tables and routing protocols

How does a router know which outgoing link to use? Every packet carries the destination's IP address in its header. Each router has a **forwarding table** that maps destination addresses (or ranges of addresses) to outgoing links. When a packet arrives, the router looks up the destination and sends the packet out on the matching link.

Who fills in the forwarding tables? **Routing protocols** (Topic II.18): routers run algorithms that work out good paths and set up the tables automatically.

| Forwarding | Routing |
|---|---|
| A **local** action at one router | A **network-wide** process |
| Moves a packet from an input link to the right output link | Decides the end-to-end path packets will take |
| Done for every packet, in nanoseconds, in hardware | Done periodically or on changes, in seconds, in software |
| Uses the forwarding table | Builds the forwarding table |
| Analogy: at a junction, reading the signboard and taking the right exit | Analogy: planning the whole trip from Coimbatore to Chennai on a map |

## Circuit switching

In a **circuit-switched** network, the resources needed along a path (buffers, link transmission rate) are **reserved** for the whole duration of the communication session. Before data flows, the network establishes an **end-to-end connection** (a circuit). The traditional telephone network is the classic example: when you dial, the switches reserve a circuit; once it is set up, your voice gets a guaranteed constant rate.

A link carries many circuits at once using **multiplexing**:

- **FDM (frequency-division multiplexing)**: the link's frequency spectrum is divided into bands, and each circuit gets one band for the whole call. Each band has a **bandwidth** (for telephones, 4 kHz). FM radio stations share the airwaves this way.
- **TDM (time-division multiplexing)**: time is divided into **frames** of fixed duration, and each frame into a fixed number of **slots**. Each circuit gets one slot in every frame. The rate of a circuit = frame rate × bits per slot = link rate ÷ number of slots.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 210" role="img" aria-label="FDM gives each circuit a frequency band; TDM gives each circuit a time slot in every frame">
<text x="20" y="22" class="c-head">FDM: each circuit has its own frequency band all the time</text>
<rect x="60" y="34" width="560" height="18" class="g-box"/><text x="340" y="47" class="c-text" text-anchor="middle">circuit 1</text>
<rect x="60" y="54" width="560" height="18" class="g-host"/><text x="340" y="67" class="c-text" text-anchor="middle">circuit 2</text>
<rect x="60" y="74" width="560" height="18" class="g-box"/><text x="340" y="87" class="c-text" text-anchor="middle">circuit 3</text>
<rect x="60" y="94" width="560" height="18" class="g-host"/><text x="340" y="107" class="c-text" text-anchor="middle">circuit 4</text>
<text x="50" y="76" class="c-muted" text-anchor="end">freq</text>
<text x="20" y="140" class="c-head">TDM: each circuit gets one slot in every frame (4 slots per frame)</text>
<g>
<rect x="60" y="152" width="35" height="26" class="g-box"/><rect x="95" y="152" width="35" height="26" class="g-host"/><rect x="130" y="152" width="35" height="26" class="g-box"/><rect x="165" y="152" width="35" height="26" class="g-host"/>
<rect x="200" y="152" width="35" height="26" class="g-box"/><rect x="235" y="152" width="35" height="26" class="g-host"/><rect x="270" y="152" width="35" height="26" class="g-box"/><rect x="305" y="152" width="35" height="26" class="g-host"/>
<rect x="340" y="152" width="35" height="26" class="g-box"/><rect x="375" y="152" width="35" height="26" class="g-host"/><rect x="410" y="152" width="35" height="26" class="g-box"/><rect x="445" y="152" width="35" height="26" class="g-host"/>
<text x="77" y="169" class="c-text" text-anchor="middle">1</text><text x="112" y="169" class="c-text" text-anchor="middle">2</text><text x="147" y="169" class="c-text" text-anchor="middle">3</text><text x="182" y="169" class="c-text" text-anchor="middle">4</text>
<text x="217" y="169" class="c-text" text-anchor="middle">1</text><text x="252" y="169" class="c-text" text-anchor="middle">2</text><text x="287" y="169" class="c-text" text-anchor="middle">3</text><text x="322" y="169" class="c-text" text-anchor="middle">4</text>
<text x="357" y="169" class="c-text" text-anchor="middle">1</text><text x="392" y="169" class="c-text" text-anchor="middle">2</text><text x="427" y="169" class="c-text" text-anchor="middle">3</text><text x="462" y="169" class="c-text" text-anchor="middle">4</text>
</g>
<line x1="60" y1="190" x2="200" y2="190" class="c-axis"/><text x="130" y="204" class="c-muted" text-anchor="middle">frame</text>
<line x1="500" y1="165" x2="620" y2="165" class="sq-arr" marker-end="url(#ahT)"/><text x="560" y="158" class="c-muted" text-anchor="middle">time</text>
<defs><marker id="ahT" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="m-ink"/></marker></defs>
</svg></div><figcaption>FDM splits the frequency range; TDM splits time. Either way, each circuit holds its share even when it is silent.</figcaption></figure>
:::

:::ex Worked example | Sending a file over a TDM circuit (Kurose example, in Chapter 1 Problems)
:::solve
Given: File = 640,000 bits. Link rate = 1.536 Mbps, TDM with 24 slots. Circuit setup time = 500 ms.
Required: Time to send the file.
Formula: Circuit rate \( R_c = R / \text{slots} \). Time = setup + \( F / R_c \).
Substitution: \( R_c = 1.536 \times 10^6 / 24 \).
Calculation: \( R_c = 64{,}000 \) bps = 64 kbps. Transmission = \( 640{,}000 / 64{,}000 = 10 \) s. Total = 10 + 0.5 = 10.5 s.
Answer: 10.5 seconds. The transmission time does not depend on the number of links, because a circuit does not store and forward.
:::
:::

## Packet switching versus circuit switching

Suppose users share a 1 Mbps link. Each user alternates between active periods (generating 100 kbps) and idle periods, and is active only 10% of the time.

- **Circuit switching** must reserve 100 kbps for each user at all times, so the link supports exactly \(1\text{ Mbps} / 100\text{ kbps} = 10\) users.
- **Packet switching**: with 35 users, the probability that more than 10 are active at once is about 0.0004. So 35 users get essentially the same performance that circuit switching gives 10 users. This gain from sharing on demand is called **statistical multiplexing**.

:::fx Probability that exactly n of N users are active (each active with probability p)
\[ P(n) = \binom{N}{n} p^{n} (1-p)^{N-n} \]
:::

| Packet switching | Circuit switching |
|---|---|
| Resources used on demand, nothing reserved | Resources reserved for the whole session |
| No call setup | Call setup delay before data flows |
| Better sharing; supports more users (statistical multiplexing) | Wastes capacity during silent periods |
| Variable, unpredictable delay; possible loss | Guaranteed constant rate and delay |
| Store-and-forward at each switch | Bits flow straight through |
| Simpler, cheaper | Needs complex signalling to set up circuits |
| Best for bursty data | Best for constant-rate traffic (old telephone calls) |
| The Internet | Traditional telephone network |

:::ex From a paper | Choosing the switching method {{paper:23CSE302 Mid 2025 Q1}}
A file of 8,000,000 bits goes from Host A to Host B over three links (A–R1–R2–B), each at 4 Mbps. Circuit switching uses FDM with 8 channels per link and a 300 ms setup time. Packet switching uses 2,000-byte packets that include a 200-byte header, 10 ms propagation delay per link and 5 ms processing delay at each router. Which is faster? Why is transmission delay the significant part?

:::solve
Given: \( F = 8 \times 10^6 \) bits; 3 links at \( R = 4 \) Mbps. Circuit: 8 FDM channels, setup 300 ms. Packet: 2,000 bytes per packet (200 header, 1,800 data), \( d_{prop} = 10 \) ms per link, \( d_{proc} = 5 \) ms per router (2 routers).
Required: Total time for each method, and which is more suitable.
Formula: Circuit: \( t = t_{setup} + F/(R/8) \). Packet: first packet takes \( 3 \frac{L}{R} + 3 d_{prop} + 2 d_{proc} \); every further packet adds \( L/R \).
Substitution: Circuit rate \( = 4 \times 10^6 / 8 = 500 \) kbps. Data per packet \( = 1{,}800 \times 8 = 14{,}400 \) bits, so packets \( = \lceil 8 \times 10^6 / 14{,}400 \rceil = \lceil 555.6 \rceil = 556 \). Packet size \( L = 2{,}000 \times 8 = 16{,}000 \) bits, \( L/R = 16{,}000 / (4 \times 10^6) = 4 \) ms.
Calculation: Circuit: \( 0.3 + 8 \times 10^6 / 5 \times 10^5 = 0.3 + 16 = 16.3 \) s. Packet: first packet \( = 3(4) + 3(10) + 2(5) = 12 + 30 + 10 = 52 \) ms; remaining 555 packets \( = 555 \times 4 = 2{,}220 \) ms; total \( \approx 2{,}272 \) ms \( \approx 2.27 \) s (treating the last, smaller packet as full size).
Answer: Packet switching ≈ 2.27 s versus circuit switching ≈ 16.3 s, so packet switching is more suitable here: it uses the full 4 Mbps of every link, while the circuit gets only one-eighth. Transmission delay dominates because pushing 8 million bits through a 500 kbps (or even 4 Mbps) link takes seconds, while propagation and processing add only milliseconds.
:::
:::

:::ex From a paper | Circuits around a ring {{paper:19CSE301 Mid 2024 Q2(a,b,d)}}
Four circuit switches A, B, C, D form a ring with 19 circuits on A–B, 12 on B–C, 18 on C–D and 19 on D–A.

:::graph The ring of circuit switches (numbers are circuits per link).
A 120 60 hl
B 420 60 hl
C 420 200 hl
D 120 200 hl
A-B 19
B-C 12
C-D 18
D-A 19
:::

:::solve
Given: Circuits: AB = 19, BC = 12, CD = 18, DA = 19. In (b) every connection uses two consecutive hops clockwise: A→C (uses AB, BC), B→D (BC, CD), C→A (CD, DA), D→B (DA, AB). In (d), 34 packet-switching users are each active 10% of the time.
Required: (a) maximum simultaneous connections; (b) the maximum under the two-hop rule; (d) the probability that exactly 4 of 34 users are transmitting.
Formula: (a) each connection can use a single link, so the total is the sum of circuits. (b) Let \(x_1, x_2, x_3, x_4\) be the number of A→C, B→D, C→A, D→B connections; each link's load must not exceed its circuits. (d) \( P(4) = \binom{34}{4}(0.1)^4(0.9)^{30} \).
Substitution: (b) AB: \(x_1 + x_4 \le 19\); BC: \(x_1 + x_2 \le 12\); CD: \(x_2 + x_3 \le 18\); DA: \(x_3 + x_4 \le 19\). Adding the BC and DA constraints: \( x_1 + x_2 + x_3 + x_4 \le 12 + 19 = 31 \).
Calculation: (a) \( 19 + 12 + 18 + 19 = 68 \). (b) The bound 31 is reachable: \(x_1 = 12, x_2 = 0, x_3 = 12, x_4 = 7\) gives AB = 19, BC = 12, CD = 12, DA = 19, all within limits, and a total of 31. (d) \( \binom{34}{4} = 46{,}376 \); \( (0.1)^4 = 10^{-4} \); \( (0.9)^{30} = 0.04239 \); product \( = 46{,}376 \times 10^{-4} \times 0.04239 = 0.1966 \).
Answer: (a) 68 connections. (b) 31 connections. (d) About 0.197.
:::
:::

## A network of networks

End systems reach the Internet through access ISPs, but access ISPs must also be connected to each other, or a Jio customer could not reach an ACT customer. Connecting every access ISP directly to every other is impossible (the \(n(n-1)/2\) problem again), so the Internet evolved a hierarchy:

- **Access ISPs** connect homes and companies.
- **Regional ISPs** connect the access ISPs in a region; access ISPs pay them (they are **customers** of a **provider**).
- **Tier-1 ISPs** (a dozen or so global carriers) connect the regional ISPs and each other. A tier-1 ISP pays no one.
- **PoP (point of presence)**: a group of routers in a provider's network where customer ISPs can connect.
- **Multi-homing**: an ISP connects to two or more providers, so it stays connected if one fails.
- **Peering**: two ISPs at the same level connect directly and exchange traffic **without payment**, which cuts the money each pays its providers.
- **IXP (Internet exchange point)**: a meeting place, often a building with its own switches, where many ISPs peer with each other.
- **Content-provider networks**: companies like Google build private networks that connect their data centres directly to lower-tier ISPs and IXPs, bypassing the upper tiers.

:::tip From a paper {{paper:19CCE304 Jan 2023 Q1(A)}}
Why will two ISPs at the same level peer with each other? Because exchanging traffic directly is free, while sending it through a common provider costs both of them money (and adds delay). How does an IXP earn money? It charges each connected ISP a fee for the port and space it uses, roughly in proportion to the traffic exchanged.
:::

:::exam Exam focus
- Store-and-forward: the switch needs the **whole** packet before it forwards. Know \(N L/R\) and \((N + P - 1) L/R\).
- Packet vs circuit comparison table, and the 10-users-vs-35-users example with the binomial formula.
- FDM vs TDM, and computing the per-circuit rate (link rate ÷ slots).
- Forwarding vs routing appears as a two-mark definition ({{paper:20CYS303 Mid 2023 Q1(c,d)}}).
- {{paper:19CSE301 End 2023 Q1(a)}}: 200 Mbps shared by users needing 20 Mbps each under circuit switching supports \(200/20 = 10\) users.
:::

:::mistake Common mistakes
- Adding the circuit-switching transmission time once per link. A circuit doesn't store and forward; the file goes through all links at the circuit rate once.
- Forgetting to divide the link rate among the FDM channels or TDM slots.
- Counting routers instead of links: a path with 2 routers has 3 links.
- Using the packet size *including* header to count packets. Count packets with the data (payload) size; transmit them with the full size.
:::

:::rev Quick revision
- Packet switching: full link rate per packet, store-and-forward, queuing delay, packet loss when buffers overflow.
- One packet over N links: \(N L/R\). P packets: \((N+P-1)L/R\).
- Forwarding (local, per packet, uses the table) vs routing (global, builds the table).
- Circuit switching: reserved FDM band or TDM slot; setup delay; guaranteed rate.
- Statistical multiplexing lets packet switching serve more bursty users.
- ISP hierarchy: access → regional → tier-1, plus PoPs, multi-homing, peering, IXPs, content-provider networks.
:::

@@topic u1-topology | I.4 | Network topology | The geometric arrangement of links and nodes: mesh, star, bus, ring and hybrids, with the link and port counts that examiners ask you to calculate. | {{gap:Forouzan 1.2}} not in Kurose 8e or the slides

:::note Source note
Network topology is on your syllabus but is not in Kurose 8th edition or your slides. This topic is taught from Forouzan, Section 1.2 (Networks: physical structures), which is in your CN_TEXTBOOK_2.pdf.
:::

## Two building blocks: types of connection

Before studying topologies, notice that a link joins devices in one of two ways.

- **Point-to-point**: a dedicated link between exactly two devices. The whole capacity of the link belongs to that pair. Examples: a cable between your laptop and a switch port; a TV remote's infrared link to the TV.
- **Multipoint (multidrop)**: more than two devices share one link. The capacity is shared either **spatially** (several devices use the link at the same time) or **temporally** (devices take turns). Examples: an old coaxial Ethernet bus; a Wi-Fi channel.

## What a topology is and why it matters

**Physical topology** is the way a network is laid out physically: the geometric relationship of all the links and nodes. The topology decides how much cable is needed, how many ports each device needs, what happens when a link or device fails, and how easy it is to add a device. There are four basic topologies: **mesh, star, bus and ring**.

:::two
:::graph Mesh: every device links to every other.
A 70 40 hl
B 210 40 hl
C 210 170 hl
D 70 170 hl
A-B
A-C
A-D
B-C
B-D
C-D
:::
---
:::graph Star: every device links to a central hub.
H 140 105 box "Hub"
A 40 30 hl
B 240 30 hl
C 240 180 hl
D 40 180 hl
A-H
B-H
C-H
D-H
:::
---
:::graph Bus: one backbone cable with drop lines.
t1 20 110 box "End"
t2 280 110 box "End"
A 70 40 hl
B 150 40 hl
C 230 40 hl
D 110 180 hl
t1-t2
A-A2
B-B2
C-C2
D-D2
A2 70 110 dot
B2 150 110 dot
C2 230 110 dot
D2 110 110 dot
:::
---
:::graph Ring: each device links to exactly two neighbours.
A 150 30 hl
B 260 105 hl
C 150 180 hl
D 40 105 hl
A-B
B-C
C-D
D-A
:::
:::

## Mesh topology

Every device has a dedicated point-to-point link to every other device.

:::fx Fully connected mesh with n nodes
\[ \text{duplex links} = \frac{n(n-1)}{2}, \qquad \text{ports per device} = n - 1 \]
(If each link carried traffic in only one direction you would need \(n(n-1)\) simplex links.)
:::

- **Advantages**: each link carries only its own two devices' traffic, so there are no traffic problems; it is **robust**, because if one link fails the rest of the network still works; it is **private and secure**, because a message travels on a dedicated line that no other device sees; and **faults are easy to locate**.
- **Disadvantages**: the amount of cabling and the number of I/O ports grow with \(n^2\), so installation and reconnection are hard and the hardware is expensive; the bulk of wiring may not even fit.
- **Use**: rarely as the only topology, but common in backbones, for example connecting telephone regional offices or core routers, where each node must reach the others reliably.

## Star topology

Each device has a dedicated point-to-point link only to a central controller, usually a **hub** or a **switch**. Devices don't link directly to each other; all traffic passes through the hub.

- **Links**: \(n\) (one per device); each device needs **one** port.
- **Advantages**: cheaper than mesh; easy to install and reconfigure (moving or adding a device needs only one new link); **robust to link failure**, because if one link fails only that device is affected; easy fault isolation.
- **Disadvantages**: the whole network depends on **one** point, the hub. If the hub fails, everything fails. It also needs more cable than bus or ring, because each device has its own run back to the hub.
- **Use**: almost every modern LAN. Switched Ethernet in your lab is a star.

## Bus topology

A bus is **multipoint**: one long cable (the **backbone**) links all devices. Each device connects by a **drop line** to a **tap** (a connector that pierces the cable). Both ends of the backbone have terminators.

- **Links**: one backbone plus \(n\) drop lines.
- **Advantages**: easy installation; less cable than mesh or star, because the backbone can run along the most efficient path.
- **Disadvantages**: as a signal travels along the backbone, some energy turns into heat and the signal weakens; each tap also causes reflection. This limits the number of taps and the cable length. Fault isolation and reconnection are hard. Most importantly, **a break in the backbone stops all transmission**, even between devices on the same side, because the damaged end reflects signals back.
- **Use**: early Ethernet LANs (coaxial cable). Because all devices share one medium, a bus needs a multiple access protocol such as CSMA/CD (Unit III).

## Ring topology

Each device has a dedicated point-to-point link with only the two devices on either side. A signal passes around the ring in **one direction**, from device to device, until it reaches its destination. Each device includes a **repeater** that regenerates the bits and passes them on.

- **Links**: \(n\); each device needs two ports.
- **Advantages**: relatively easy to install and reconfigure (adding a device changes only two links); fault isolation is simple, because a device that doesn't receive a signal within a set time can raise an alarm.
- **Disadvantages**: traffic is unidirectional, so **a break anywhere** (a failed link or a switched-off device) can disable the whole ring. A **dual ring** (a second ring running the other way) solves this.
- **Use**: IBM's Token Ring LANs, and older fibre rings. Taking-turns MAC protocols such as token passing come from rings ({{paper:19CCE304 Jan 2023 Q7(A)}} asks why token ring becomes inefficient over a very large perimeter: the token takes longer to go round, so stations wait longer before they can send).

## Hybrid topology

Real networks combine topologies: for example, a main star backbone whose branches are buses or smaller stars. A university campus is typically a tree (a hierarchy of stars).

## Physical versus logical topology

Physical topology is how the cables are laid; **logical topology** is how data actually flows. An old Ethernet hub is wired as a physical star but behaves as a logical bus: the hub copies every frame to every port, so all devices share the medium as if they were on one cable. A switch makes the logical topology a true star.

## Comparison

| Feature | Mesh | Star | Bus | Ring |
|---|---|---|---|---|
| Links for n devices | \(n(n-1)/2\) | \(n\) | 1 backbone + \(n\) drops | \(n\) |
| Ports per device | \(n-1\) | 1 | 1 (tap) | 2 |
| Connection type | Point-to-point | Point-to-point | Multipoint | Point-to-point |
| Cost | Highest | Medium | Lowest | Low |
| Effect of one link failing | Only that link | Only that device | Whole network (backbone break) | Whole ring (unless dual ring) |
| Single point of failure | None | The hub | The backbone | Any link or node |
| Fault isolation | Easy | Easy | Difficult | Easy |
| Adding a device | Hard | Easy | Moderate | Moderate |
| Typical use | Backbones | Modern LANs | Early Ethernet | Token Ring, fibre rings |

:::ex Worked example | Counting links and ports
:::solve
Given: (a) 10 devices in a full mesh. (b) The 40 PCs of a lab in a star. (c) The same 40 PCs in a full mesh.
Required: The number of links and the ports per device in each case.
Formula: Mesh: links \(= n(n-1)/2\), ports \(= n-1\). Star: links \(= n\), 1 port per device, \(n\) ports on the hub.
Substitution: (a) \(n = 10\). (b) \(n = 40\). (c) \(n = 40\).
Calculation: (a) \(10 \times 9 / 2 = 45\) links, 9 ports each. (b) 40 links, 1 port per PC, 40 ports on the switch. (c) \(40 \times 39 / 2 = 780\) links, 39 ports per PC.
Answer: (a) 45 links, 9 ports. (b) 40 links, 1 port per PC. (c) 780 links, 39 ports per PC, which shows why LANs are built as stars.
:::
:::

:::ex Practice | Duplex vs simplex links in a mesh
:::solve
Given: A mesh of 6 devices.
Required: The number of links if (a) links are duplex, (b) links are simplex (one direction only).
Formula: Duplex \(= n(n-1)/2\); simplex \(= n(n-1)\).
Substitution: \(n = 6\).
Calculation: (a) \(6 \times 5 / 2 = 15\). (b) \(6 \times 5 = 30\).
Answer: 15 duplex links or 30 simplex links.
:::
:::

:::exam Exam focus
- {{paper:19CSE301 Mid 2023 Q1(b)}} asked you to explain the network topologies with pictorial representations (3 marks). Draw all four, label the hub, backbone, taps and repeaters, and give one advantage and one disadvantage of each.
- Be ready for the mesh formula in a short numerical.
- Point-to-point vs multipoint is a common one-liner.
:::

:::mistake Common mistakes
- Writing \(n(n-1)\) for duplex mesh links. That is the simplex count; duplex is half.
- Saying a star fails when one link fails. Only that device is cut off; the hub is the single point of failure.
- Forgetting that a bus is multipoint and needs a multiple access protocol.
:::

:::rev Quick revision
- Point-to-point (dedicated) vs multipoint (shared).
- Mesh: \(n(n-1)/2\) links, \(n-1\) ports, robust and private, expensive.
- Star: \(n\) links, hub is the single point of failure, used in modern LANs.
- Bus: one backbone + drop lines and taps, cheap, a backbone break stops everything.
- Ring: two neighbours each, one direction, repeaters, a break disables the ring unless it is a dual ring.
:::

@@topic u1-types | I.5 | Types of networks | Networks classified by the area they cover (PAN, LAN, MAN, WAN), how they are switched, and how they combine into an internetwork. | {{gap:Forouzan 1.2}} with Kurose §1.2 for access networks

:::note Source note
Like topology, the classification of networks is taught from Forouzan Section 1.2 (Categories of networks), supported by Kurose Section 1.2 for the modern examples.
:::

## Why classify networks at all?

Networks differ enormously in size, ownership and technology: the Bluetooth link between your phone and earbuds, your hostel's Wi-Fi, a city's cable TV network, and the fibre under the Indian Ocean. Classifying them by the **geographical area** they cover tells you a lot at once: who owns the network, how fast it is, what technology it uses, what it costs and how errors behave.

## LAN: local area network

A LAN is usually **privately owned** and links devices in a single office, building or campus. It can be as small as two PCs and a printer or extend through a whole university.

- **Size**: up to a few kilometres.
- **Ownership**: one organisation.
- **Speed**: high, 100 Mbps to 10 Gbps for wired Ethernet, hundreds of Mbps for Wi-Fi.
- **Technology**: Ethernet (wired, star topology with switches), Wi-Fi (wireless).
- **Errors and delay**: low error rates and very small propagation delay.
- **Purpose**: share resources (printers, files, servers, one Internet connection) and connect users.
- **Examples**: Amrita's computer lab, your home Wi-Fi network.

## MAN: metropolitan area network

A MAN covers a **town or city**, between the size of a LAN and a WAN. It typically serves customers who want high-speed connectivity to the Internet across a city.

- **Size**: up to tens of kilometres.
- **Ownership**: often a service provider or a city; may be shared by many organisations.
- **Examples**: the cable TV network that also delivers cable Internet across a city; a telephone company's high-speed fibre network connecting the offices of a company spread across a city; a city-wide Wi-Fi network.

## WAN: wide area network

A WAN provides long-distance transmission of data across a **country, a continent or the whole world**.

- **Point-to-point WAN**: connects two communicating devices through a transmission medium, such as a leased line connecting a company's office in Chennai to its office in Bengaluru.
- **Switched WAN**: a network with more than two ends, built from many switches. The backbone networks of ISPs are switched WANs.
- **Ownership**: usually created and run by telecom companies and ISPs, and leased to the organisations that use them.
- **Speed and errors**: slower and more error-prone than LANs historically, with much larger propagation delay.

## PAN: personal area network

A PAN connects devices within a few metres of one person, such as a phone, a smartwatch and wireless earbuds over **Bluetooth**. Forouzan covers Bluetooth separately; it is mentioned here because the term often appears beside LAN, MAN and WAN.

## Internetwork

When two or more networks are connected, they become an **internetwork**, or **internet** (lowercase). For example, a company with a LAN in Mumbai and a LAN in Coimbatore can connect them with a point-to-point WAN: three networks joined into one internet. **The Internet** (capital I) is the worldwide internetwork that uses TCP/IP.

:::graph An internetwork: two LANs joined by a point-to-point WAN through their routers.
pc1 50 50 host "PC"
pc2 50 140 host "PC"
sw1 170 95 box "Switch"
r1 290 95 box "Router"
r2 460 95 box "Router"
sw2 580 95 box "Switch"
pc3 650 30 host "PC"
pc4 650 160 host "Server"
pc1-sw1
pc2-sw1
sw1-r1
r1-r2 *
r2-sw2
sw2-pc3
sw2-pc4
text 375 82 WAN link
text 110 190 LAN (Mumbai)
text 560 200 LAN (Coimbatore)
:::

## Comparison of LAN, MAN and WAN

| Feature | LAN | MAN | WAN |
|---|---|---|---|
| Area | Room, building, campus (up to a few km) | City (up to tens of km) | Country, continent, world |
| Ownership | Private (one organisation) | Private or public (provider, city) | Usually public carriers, leased |
| Data rate | High (100 Mbps–10 Gbps) | High to medium | Varies; long links are costly |
| Propagation delay | Very small | Moderate | Large |
| Error rate | Low | Moderate | Higher |
| Setup and maintenance | Easy, cheap | More complex | Most complex and costly |
| Typical technology | Ethernet, Wi-Fi | Fibre rings, cable networks | Leased lines, ISP backbones, satellite |
| Example | College lab | City cable Internet | The Internet backbone |

## Other ways to classify networks

| Basis | Types | Taught in |
|---|---|---|
| Switching technique | Circuit-switched, packet-switched (datagram or virtual circuit) | I.3, II.11 |
| Transmission | Point-to-point, broadcast (multipoint) | I.4, III.4 |
| Architecture | Client-server, peer-to-peer | I.9 |
| Medium | Wired, wireless | I.2 |
| Access setting (Kurose) | Home, enterprise, data centre, wide-area wireless | I.2 |

:::exam Exam focus
- Define LAN, MAN and WAN with one example each, and draw the comparison table.
- Know the two kinds of WAN: point-to-point and switched.
- Be able to explain why connecting LANs and WANs produces an internetwork.
:::

:::mistake Common mistakes
- Classifying by speed alone. The defining feature is the geographical area covered; speed and ownership follow from it.
- Calling Wi-Fi a WAN because it is wireless. Wi-Fi is a wireless LAN; cellular 4G/5G is wide-area wireless access.
:::

:::rev Quick revision
- PAN (metres, Bluetooth) < LAN (building/campus, private, fast) < MAN (city) < WAN (country/world, leased, slower, more errors).
- WANs are point-to-point or switched.
- Connected networks form an internetwork; the Internet is the global one using TCP/IP.
:::

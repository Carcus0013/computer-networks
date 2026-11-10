@@topic u3-arp | III.5 | Link-layer addressing and ARP | MAC addresses and why hosts need them as well as IP addresses, how ARP finds the MAC address for an IP address on the same subnet, and exactly which addresses a frame carries when a datagram is sent to another subnet. | Kurose §6.4.1 · Chapter_6_v8.2 slides 41–56

## MAC addresses

Hosts and routers have link-layer addresses as well as IP addresses. More precisely, it is not hosts and routers but their **adapters** (network interfaces) that have link-layer addresses. A host or router with several interfaces has several link-layer addresses, just as it has several IP addresses. (Link-layer switches do **not** have link-layer addresses on the interfaces that connect to hosts and routers: a switch carries datagrams transparently.)

- A link-layer address is called a **LAN address**, **physical address** or **MAC address**.
- It is **6 bytes (48 bits)** long, giving \(2^{48}\) possible addresses, written in **hexadecimal**, one pair of digits per byte: **1A-2F-BB-76-09-AD**.
- MAC addresses were designed to be **permanent** (burned into the adapter's ROM), although software can now change them.
- No two adapters have the same address: the **IEEE** manages the address space. A company buys a block of \(2^{24}\) addresses; the IEEE fixes the first 24 bits (the organisationally unique identifier) and the company makes the last 24 bits unique.
- A MAC address has a **flat structure** (no hierarchy) and **doesn't change** wherever the adapter goes. An IP address has a **hierarchical** structure (network part and host part) and **changes** when the host moves.

:::analogy Aadhaar number and postal address
A MAC address is like your Aadhaar (or social security) number: flat, and it stays with you wherever you live. An IP address is like your postal address: hierarchical, and it changes when you move. The post office routes by postal address; once the letter is at the right building, the name on it picks you out.
:::

When an adapter sends a frame, it puts the **destination adapter's MAC address** in the frame. On a broadcast LAN, every adapter may receive the frame, but each checks whether the destination address matches its own; if not, it **discards** the frame (without interrupting the host). To reach **all** adapters on the LAN, the sender uses the MAC **broadcast address FF-FF-FF-FF-FF-FF** (48 ones).

### Why have both MAC and IP addresses?

1. LANs are designed for arbitrary network-layer protocols, not just IP. If adapters used IP addresses instead of neutral MAC addresses, they couldn't easily support other network-layer protocols.
2. If adapters used network-layer addresses stored in RAM and reconfigured each time the adapter moved, the link layer and network layer would no longer be independent.
3. Without MAC addresses, every adapter would have to pass every frame up to the network layer to check the destination, interrupting the host for every frame on the LAN.

## ARP: the Address Resolution Protocol

A host knows the **IP address** of the destination (from DNS, for instance) but needs its **MAC address** to build a frame. **ARP** translates between them: given an IP address on the **same subnet**, it returns the corresponding MAC address. (DNS resolves host names anywhere on the Internet; ARP resolves IP addresses only for hosts and router interfaces on the same subnet.)

Each host and router has an **ARP table** in memory:

| IP address | MAC address | TTL |
|---|---|---|
| 222.222.222.221 | 88-B2-2F-54-1A-0F | 13:45:00 |
| 222.222.222.223 | 5C-66-AB-90-75-B1 | 13:52:00 |

The TTL says when each entry will be deleted; a typical lifetime is **20 minutes**. The table doesn't necessarily contain an entry for every host on the subnet.

### How ARP works

Host A (222.222.222.220) wants to send a datagram to host B (222.222.222.222) on the same subnet, but B is not in A's ARP table.

:::seq Host A | Every adapter on the subnet | Host B (222.222.222.222)
1>2 ARP query in a frame to FF-FF-FF-FF-FF-FF: who has 222.222.222.222?
2>3 broadcast frame reaches every adapter
3: B sees its own IP address in the query
3>1 a ARP response (unicast, standard frame): 222.222.222.222 is 49-BD-D2-C7-56-2A
1: A adds (B's IP, B's MAC, TTL) to its ARP table
1>3 the IP datagram, in a frame addressed to 49-BD-D2-C7-56-2A
:::

1. A builds an **ARP packet** with its own IP and MAC addresses and the IP address to be resolved, and asks its adapter to send it in a frame with the **broadcast address** FF-FF-FF-FF-FF-FF.
2. Every adapter on the subnet receives the frame and passes the ARP packet up to its ARP module, which checks whether its own IP address matches the one in the query.
3. The one with a match (B) sends back an **ARP response** containing the desired mapping, in a **standard (unicast) frame** to A.
4. A updates its ARP table and can now send the datagram in a frame addressed to B's MAC address.

Notes: the query is **broadcast**, the response is **unicast**; ARP is **plug-and-play**: the table builds itself and no administrator is needed. ARP sits on the boundary between the link and network layers (its packets are carried in link-layer frames, but it contains both kinds of address).

!!sim visualizations/link/arp.html | ARP and frames across subnets | Watch an ARP broadcast and reply, then follow a datagram from one subnet to another through a router, with the source and destination MAC and IP addresses shown at every hop.

## Sending a datagram to another subnet

Host A (111.111.111.111, MAC 74-29-9C-E8-FF-55) on subnet 1 wants to send a datagram to host B (222.222.222.222, MAC 49-BD-D2-C7-56-2A) on subnet 2. Router R connects the subnets: its interface on subnet 1 is 111.111.111.110 (E6-E9-00-17-BB-4B), and on subnet 2 is 222.222.222.220 (1A-23-F9-CD-06-9B).

:::graph Two subnets joined by a router. Each router interface has its own IP and MAC address.
A 70 60 host "A 111.111.111.111"
A2 70 160 host "111.111.111.112"
R 340 110 box "Router R"
B 610 60 host "B 222.222.222.222"
B2 610 160 host "222.222.222.221"
A-R
A2-R
R-B
R-B2
text 190 108 111.111.111.110
text 420 108 222.222.222.220
:::

1. A uses its forwarding rule: B is not on its subnet, so the datagram must go to its **first-hop (default gateway) router**, 111.111.111.110. A uses **ARP** to get the router interface's MAC address, E6-E9-00-17-BB-4B.
2. A creates a frame: **destination MAC = the router's interface (E6-E9-…), source MAC = A's (74-29-…)**. The datagram inside keeps **source IP = A (111.111.111.111), destination IP = B (222.222.222.222)**.
3. The router's adapter on subnet 1 accepts the frame (it is addressed to it) and passes the datagram up. The router consults its **forwarding table** and finds that the datagram goes out of interface 222.222.222.220.
4. The router uses **ARP** on subnet 2 to find B's MAC address, then builds a **new frame**: **destination MAC = B (49-BD-…), source MAC = the router's subnet-2 interface (1A-23-…)**, with the same IP datagram inside.
5. B's adapter accepts the frame and passes the datagram up.

| Hop | Source MAC | Destination MAC | Source IP | Destination IP |
|---|---|---|---|---|
| A → R | A (74-29-9C-E8-FF-55) | R, subnet 1 (E6-E9-00-17-BB-4B) | 111.111.111.111 | 222.222.222.222 |
| R → B | R, subnet 2 (1A-23-F9-CD-06-9B) | B (49-BD-D2-C7-56-2A) | 111.111.111.111 | 222.222.222.222 |

**The IP addresses stay the same end to end; the MAC addresses change at every hop.** (The exception is NAT, which rewrites IP addresses.)

:::ex From a paper | Switch S1 and router R1 {{paper:19CCE304 End 2023 Q7}} {{paper:20CYS303 End 2023 Q10}} {{paper:19CCE304 End 2024 Q6(B)}}
These papers use Kurose's three-subnet figure: hosts on subnets 1, 2 and 3; the router between subnets 1 and 2 is replaced by a **switch S1**, and the router between subnets 2 and 3 is **R1**. (So subnets 1 and 2 become one IP subnet; R1 is the only router.)

:::solve
Given: E and F are on subnet 3; B is on the other side of R1; E's ARP cache doesn't contain B's MAC.
Required: (A) E → F: does E ask R1 for help? Which addresses are in the frame? (B) E → B: does E ARP for B's MAC? Which addresses are in the frame delivered to R1?
Formula: Same subnet → deliver directly (ARP for the destination). Different subnet → deliver to the gateway (ARP for the router).
Substitution: E and F share subnet 3; B does not.
Calculation: (A) No: E and F are on the same subnet, so E finds F's MAC with ARP (if needed) and sends directly. (B) No ARP for B: B is not on E's subnet, so E needs only R1's MAC on subnet 3 (from its ARP cache, or by ARPing for R1's interface address).
Answer: (A) Frame: source IP = E's IP, destination IP = F's IP, source MAC = E's MAC, destination MAC = F's MAC. (B) E does **not** ARP for B. Frame delivered to R1: source IP = E's IP, destination IP = B's IP, source MAC = E's MAC, destination MAC = R1's interface on subnet 3. (When R1 forwards it on, the new frame has source MAC = R1's other interface and destination MAC = B's MAC, found through S1; the switch itself never appears in any address.)
:::
:::

:::ex From a paper | arp -a and the lost first ping {{paper:19CSE301 Jan 2023 Q9}}
:::solve
Given: PC-A (192.168.1.1/24) and PC-B (192.168.1.2/24) are connected by a crossover cable and have never communicated. On PC-A: `arp -a`, then `ping 192.168.1.2`; replies come back but one packet is lost.
Required: The output of arp -a, and why the first packet is lost.
Formula: ARP tables fill only when traffic needs them.
Substitution: No communication has happened yet.
Calculation: arp -a shows **no entry** for 192.168.1.2 (only static or multicast entries, or “No ARP entries found”). When ping starts, A must first resolve 192.168.1.2 with an ARP broadcast. The first ICMP echo request waits in a queue (or is dropped) while ARP completes, and its timer expires before the reply; once B's MAC is in the cache, the remaining echo requests go straight through.
Answer: Initially the ARP table has no entry for PC-B. The first ping is lost because of **ARP resolution delay**: the first echo request can't be framed until PC-B's MAC address is learned, and it times out. Afterwards arp -a shows 192.168.1.2 with PC-B's MAC address (dynamic).
:::
:::

:::exam Exam focus
- Source and destination MAC and IP addresses at each hop appeared in 6 papers. Make the hop table every time.
- ARP: broadcast query, unicast response, ARP table with TTL, plug-and-play.
- Why both MAC and IP addresses exist; flat vs hierarchical; 48 bits in hex; FF-FF-FF-FF-FF-FF.
- {{paper:20CYS303 End 2024 Q2}} and {{paper:19CCE304 Jan 2023 Q7(B)}}: explain ARP with a flow chart and a case study.
:::

:::mistake Common mistakes
- Putting the final destination's MAC address in the first-hop frame. It's the **router's** MAC.
- Changing the IP addresses at the router.
- Saying ARP works across subnets. It resolves addresses only on the local subnet.
- Saying the ARP reply is broadcast. Only the query is.
:::

:::rev Quick revision
- MAC: 48 bits, hex, flat, permanent, IEEE-managed; broadcast FF-FF-FF-FF-FF-FF.
- ARP: IP → MAC on the same subnet; ARP table (IP, MAC, TTL ≈ 20 min); query broadcast, reply unicast.
- Off-subnet: frame to the gateway router's MAC; IP addresses unchanged end to end; MAC addresses change each hop.
:::

@@topic u3-ethernet | III.6 | Ethernet | How Ethernet evolved from a shared bus to switched stars, the fields of the Ethernet frame, its connectionless unreliable service, and the family of Ethernet standards (including the line coding each uses). | Kurose §6.4.2 · Chapter_6_v8.2 slides 57–62

## Why Ethernet won

Ethernet has pretty much taken over the wired LAN market. It was the first widely deployed high-speed LAN; token ring, FDDI and ATM were more complex and expensive; and Ethernet kept producing versions with equal or higher rates (10 Mbps → 100 Mbps → 1 Gbps → 10, 40, 100 Gbps) while hardware became very cheap.

## The evolution of Ethernet's topology

| Period | Topology | Behaviour |
|---|---|---|
| Original (Metcalfe and Boggs, mid-1970s) | **Bus**: coaxial cable | A broadcast LAN: all frames reach all adapters; collisions handled by CSMA/CD |
| Late 1990s | **Hub-based star**: hosts and routers connect to a **hub** with twisted-pair copper | A hub is a **physical-layer** device acting on individual bits: when a bit arrives on one interface, the hub regenerates it and sends it out on **all** other interfaces. Still a broadcast LAN with collisions |
| Early 2000s onward | **Switch-based star**: the hub is replaced by a **switch** | A switch is collision-less and a bona fide **store-and-forward** packet switch, operating only up to layer 2 |

## The Ethernet frame

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 120" role="img" aria-label="Ethernet frame: preamble, destination address, source address, type, data, CRC">
<rect x="20" y="30" width="100" height="40" class="g-node"/><text x="70" y="54" class="c-text" text-anchor="middle">preamble (8)</text>
<rect x="120" y="30" width="100" height="40" class="g-box"/><text x="170" y="54" class="c-text" text-anchor="middle">dest. addr (6)</text>
<rect x="220" y="30" width="100" height="40" class="g-box"/><text x="270" y="54" class="c-text" text-anchor="middle">source addr (6)</text>
<rect x="320" y="30" width="60" height="40" class="g-host"/><text x="350" y="54" class="c-text" text-anchor="middle">type (2)</text>
<rect x="380" y="30" width="200" height="40" class="g-node"/><text x="480" y="54" class="c-text" text-anchor="middle">data (46–1,500)</text>
<rect x="580" y="30" width="80" height="40" class="g-host"/><text x="620" y="54" class="c-text" text-anchor="middle">CRC (4)</text>
<text x="340" y="96" class="c-muted" text-anchor="middle">Field sizes in bytes. The 802.1Q VLAN tag (4 bytes) is inserted between the source address and type.</text>
</svg></div></figure>
:::

| Field | Size | Purpose |
|---|---|---|
| **Preamble** | 8 bytes | The first 7 bytes are 10101010; the last is 10101011. They wake up the receiving adapters and **synchronise their clocks** to the sender's (the sender's rate drifts slightly from nominal). The two final 1s tell the receiver that the important content is coming |
| **Destination address** | 6 bytes | The destination adapter's MAC address. An adapter passes a frame up only if this matches its own address or is the broadcast address; otherwise it discards it |
| **Source address** | 6 bytes | The sending adapter's MAC address |
| **Type** | 2 bytes | Which network-layer protocol the data belongs to, so the receiver can **demultiplex**: 0x0800 for IPv4, 0x0806 for ARP, 0x86DD for IPv6 (like the protocol field in IP and port numbers in TCP/UDP) |
| **Data** | 46–1,500 bytes | The IP datagram. The maximum (the **MTU**) is 1,500 bytes; larger datagrams must be fragmented. If the datagram is smaller than 46 bytes, it is **padded** to 46 bytes, and the network layer uses the IP length field to remove the padding |
| **CRC** | 4 bytes | Cyclic redundancy check (CRC-32) so the receiver can detect bit errors in the frame |

## Ethernet's service: connectionless and unreliable

- **Connectionless**: no handshaking with the receiving adapter before sending a frame (like IP datagrams and UDP).
- **Unreliable**: when an adapter receives a frame, it runs the CRC check but sends **no acknowledgement** if the frame passes and **no negative acknowledgement** if it fails; a failed frame is simply **discarded**. Gaps in the stream of datagrams are left for higher layers: if the application uses TCP, the TCP receiver won't acknowledge the missing data and the sender will retransmit it; with UDP the gap remains.

This lack of reliable transport keeps Ethernet simple and cheap.

## Ethernet technologies

There are many standards (IEEE 802.3), named like **10BASE-T**, **10BASE-2**, **100BASE-T**, **1000BASE-LX**, **10GBASE-T** and **40GBASE-T**:

- the first part is the **speed**: 10 Mbps, 100 Mbps, 1,000 Mbps (gigabit), 10 Gbps, 40 Gbps;
- **BASE** means **baseband** Ethernet: the physical medium carries only Ethernet traffic;
- the final part is the **medium**: T = twisted-pair copper; 2 = thin coax (about 200 m); F, FX, LX, SX = optical fibre.

All share the same **frame format**; they differ in rate and physical layer. Early 10BASE-2 and 10BASE-5 used coax buses limited to 500 m segments, extended with **repeaters** (physical-layer devices that regenerate the signal). Today, 100 Mbps runs over twisted pair to about 100 m and fibre to several km; gigabit Ethernet keeps the standard frame format, allows both point-to-point links through switches and shared broadcast channels through hubs (using CSMA/CD), and allows full-duplex operation at 1 Gbps in both directions on point-to-point links.

| Standard | Rate | Line coding (Forouzan 4.1) |
|---|---|---|
| 10BASE-T (classic Ethernet) | 10 Mbps | **Manchester** |
| 100BASE-TX (Fast Ethernet, copper) | 100 Mbps | **4B/5B block coding + MLT-3** |
| 100BASE-FX (Fast Ethernet, fibre) | 100 Mbps | **4B/5B + NRZ-I** |
| 1000BASE-T (Gigabit, copper) | 1 Gbps | 4D-PAM5 over four pairs |
| 10GBASE-T | 10 Gbps | PAM-16 (beyond the syllabus) |

:::tip From a paper {{paper:23CSE302 End 2025 Q1}}
“Suggest a suitable encoding technique for the Fast Ethernet standard.” Fast Ethernet over copper (100BASE-TX) uses **4B/5B block coding with MLT-3** line coding: 4B/5B guarantees enough transitions for synchronisation, and MLT-3's three levels reduce the bandwidth needed so 100 Mbps fits on Category 5 twisted pair. (Fibre, 100BASE-FX, uses 4B/5B with NRZ-I.) Manchester would double the baud rate to 200 Mbaud, which is too much for the cable. Line coding itself is taught in Topic III.10.
:::

### CSMA/CD in a switched world

In a switch-based star with full-duplex links, a switch never sends two frames onto the same interface at once, and each link carries frames in both directions independently: **there are no collisions, so no MAC protocol is needed**. CSMA/CD remains part of the standard for shared (hub or bus) segments.

:::exam Exam focus
- Draw and explain the Ethernet frame fields and their sizes (preamble, addresses, type, data 46–1,500, CRC).
- Ethernet is connectionless and unreliable; who recovers lost frames.
- Decode a standard's name (100BASE-TX); line coding for Fast Ethernet.
:::

:::rev Quick revision
- Bus → hub star (layer 1, broadcast) → switch star (layer 2, store-and-forward, no collisions).
- Frame: preamble 8 (7 × 10101010 + 10101011), dest 6, source 6, type 2 (0x0800 IPv4, 0x0806 ARP), data 46–1,500 (padding), CRC 4.
- Connectionless, unreliable: bad frames dropped, no ACK/NAK.
- Names: speed + BASE (baseband) + medium. 10BASE-T Manchester; 100BASE-TX 4B/5B + MLT-3.
:::

@@topic u3-switches | III.7 | Link-layer switches and VLANs | How a switch forwards and filters frames, how its table builds itself (self-learning), why switches beat hubs, how switches compare with routers, and how VLANs split one switched network into isolated broadcast domains with 802.1Q tagging. | Kurose §6.4.3–6.4.4 · Chapter_6_v8.2 slides 63–82

## What a switch does

A switch receives incoming link-layer frames and forwards them onto outgoing links. The switch itself is **transparent** to hosts and routers: a host addresses a frame to another host (not to the switch) and sends it into the LAN, unaware that a switch will receive and forward it. Because frames can arrive faster than an output interface can send them, each switch output interface has **buffers**.

### Forwarding and filtering

- **Filtering** decides whether a frame should be forwarded to some interface or dropped.
- **Forwarding** decides the interface(s) to which a frame should be directed, and moves it there.

Both use a **switch table** with entries of the form (MAC address, interface, time):

| MAC address | Interface | Time |
|---|---|---|
| 62-FE-F7-11-89-A3 | 1 | 9:32 |
| 7C-BA-B2-B4-91-10 | 3 | 9:36 |

When a frame with destination address DD-DD-DD-DD-DD-DD arrives on interface x, the switch looks up DD-DD-…:

1. **No entry** for DD: the switch **forwards copies to all interfaces except x** (it broadcasts, or “floods”, the frame).
2. An entry associates DD with **interface x** (the same one the frame came from): the frame came from a LAN segment that already contains the destination, so the switch **filters** it (discards it).
3. An entry associates DD with **interface y ≠ x**: the switch **forwards** the frame to interface y (puts it in y's output buffer).

### Self-learning

The table is built **automatically, dynamically and autonomously**, with no administrator and no configuration protocol:

1. The switch table is **initially empty**.
2. For each incoming frame received on an interface, the switch stores in its table (a) the MAC address in the frame's **source address** field, (b) the interface from which the frame arrived, and (c) the current time. If every host eventually sends a frame, every host will be recorded.
3. The switch **deletes** an address if no frame is received with that address as source after some period (the **aging time**, for example 60 minutes), so the table tracks hosts that move or are removed.

Switches are therefore **plug-and-play** devices.

:::ex From a paper | A learning switch with six hosts {{paper:19CSE301 Jan 2023 Q10}}
Hosts A to F are star-connected to one Ethernet switch (host X on interface X). The switch table starts empty.

:::solve
Given: Events in order: (i) B sends to E; (ii) E replies to B; (iii) A sends to B; (iv) B replies to A.
Required: The switch table after each event and the links each frame is forwarded on.
Formula: Learn the **source**; look up the **destination**: unknown → flood (all but incoming); known on another port → forward there.
Substitution: Table after each event below.
Calculation: (i) Learn B → port B. E unknown → **flood** to A, C, D, E, F. (ii) Learn E → port E. B known → forward **only to B**. (iii) Learn A → port A. B known → forward **only to B**. (iv) B already in the table (time refreshed). A known → forward **only to A**.
Answer: Table: after (i) {B}; after (ii) {B, E}; after (iii) {A, B, E}; after (iv) {A, B, E}. Only the first frame is flooded, because only then was the destination unknown.
:::

| After event | MAC address | Interface | Frame forwarded on |
|---|---|---|---|
| (i) B → E | B | B | A, C, D, E, F (flooded) |
| (ii) E → B | B; E | B; E | B |
| (iii) A → B | A; B; E | A; B; E | B |
| (iv) B → A | A; B; E | A; B; E | A |
:::

!!sim visualizations/link/switch.html | Self-learning switch | Send frames between hosts on one switch or several interconnected switches, and watch each table learn, flood, filter and forward.

### Self-learning across several switches

Switches can be interconnected (for example, a department switch per building connected to a backbone switch). Self-learning works unchanged: each switch learns which of its own interfaces leads to each source address. When C sends to I through switches S1 and S4, S1 learns C on its host interface and floods; S4 learns C on its interface towards S1, and so on. {{paper:19CSE301 End 2024 Q6(b)}} gave a network of self-learning bridges (bridges behave the same way): for each transmission, apply the learn-source / lookup-destination rule at each bridge the frame reaches.

## Properties of link-layer switching

- **Elimination of collisions**: in a LAN built from switches (and no hubs), no bandwidth is wasted on collisions. Switches buffer frames and never send more than one frame on a segment at any time. The maximum aggregate throughput is the sum of all the interface rates.
- **Heterogeneous links**: a switch isolates links from one another, so different links in the LAN can run at different speeds and over different media.
- **Management**: a switch can detect an adapter that malfunctions and sends continuous frames (“jabbering”) and disconnect it internally; it can gather statistics on bandwidth use, collision rates and traffic types; a cable cut disconnects only one host.
- **Security note**: **switch poisoning** (MAC flooding) sends huge numbers of frames with bogus source addresses to fill the switch table, so that legitimate frames are flooded and a sniffer can capture them.

## Hubs, switches and routers

| Feature | Hub | Switch | Router |
|---|---|---|---|
| Layer | 1 (physical) | 2 (link) | 3 (network) |
| Works on | Bits | Frames, MAC addresses | Datagrams, IP addresses |
| Forwarding | Repeats every bit out of every other port | Forwards to the one port where the destination is (floods if unknown) | Forwards by longest prefix match on the destination IP |
| Collision domain | One shared collision domain | Each port is its own collision domain (none with full duplex) | Each interface separate |
| Broadcast domain | One | One (unless VLANs are used) | Separates broadcast domains |
| Table | None | Self-learning switch table | Forwarding table from routing protocols or a controller |
| Configuration | None | Plug-and-play | Needs IP addresses and routing configured |
| Store-and-forward | No | Yes | Yes |
| Handles loops/topology | No | Needs a spanning tree (no loops allowed) | Any topology; best paths via routing |

### Switches versus routers in more detail

| | Switches | Routers |
|---|---|---|
| Pros | Plug-and-play; relatively high filtering and forwarding rates (process only up to layer 2) | Hierarchical addressing, so packets don't cycle even with redundant paths; any topology with best paths; **firewall protection against layer-2 broadcast storms** |
| Cons | The active topology is restricted to a spanning tree; a large switched network needs large ARP tables and generates much ARP traffic; vulnerable to broadcast storms (one malfunctioning host can collapse the network) | Not plug-and-play (IP addresses must be configured); often slower per packet because they process up to layer 3 |
| Best for | Small networks of a few hundred hosts | Larger networks of thousands of hosts (usually with switches inside each subnet) |

## Virtual LANs (VLANs)

Modern institutional LANs are often configured hierarchically, with each workgroup (department) on its own switched LAN connected to the others through a hierarchy of switches. Three drawbacks:

1. **Lack of traffic isolation**: broadcast traffic (ARP, DHCP, frames to unknown destinations) still crosses the whole institutional network, hurting performance; for security and privacy, it is also desirable to limit traffic to a group.
2. **Inefficient use of switches**: with 10 groups, you would need 10 first-level switches even if each group had only a few people.
3. **Managing users**: when someone moves between groups, the physical cabling must change to connect them to a different switch.

A switch that supports **VLANs** lets **multiple virtual LANs be defined over a single physical LAN infrastructure**. Hosts in a VLAN communicate as if they (and only they) were connected to the switch.

- In a **port-based VLAN**, the network manager divides the switch's ports into groups. Each group is a VLAN, and the ports in each VLAN form a **broadcast domain**: broadcast traffic from one port reaches only the other ports in the same group.
- Moving a person to another group just means reconfiguring which VLAN their port belongs to, in software.
- Traffic **between** VLANs must go through a **router** (often built into the switch as a layer-3 switch), exactly as if the VLANs were separate switches.

:::graph One physical switch configured as two VLANs: ports 2–8 for Electrical Engineering, ports 9–15 for Computer Science. Inter-VLAN traffic goes through the router on port 1.
sw 340 110 box "VLAN switch"
r 340 30 box "Router (port 1)"
ee1 80 70 host "EE host"
ee2 80 150 host "EE host"
cs1 600 70 host "CS host"
cs2 600 150 host "CS host"
r-sw
ee1-sw
ee2-sw
cs1-sw ~
cs2-sw ~
text 140 200 VLAN 10 (ports 2–8)
text 470 200 VLAN 20 (ports 9–15)
:::

### VLAN trunking and 802.1Q

When VLANs span **several switches** (for example, some EE staff are in another building), connecting each VLAN with its own cable between switches doesn't scale. Instead, a special port on each switch is configured as a **trunk port**, and the two switches are joined by a **trunk link** that belongs to **all** VLANs.

How does a switch know which VLAN a frame arriving on a trunk port belongs to? The IEEE defined an extended Ethernet frame, **802.1Q**: a 4-byte **VLAN tag** is added into the header between the source address and type fields, by the sending side of the trunk, and removed by the receiving side.

:::html
<figure><div class="figbox"><svg viewBox="0 0 680 150" role="img" aria-label="802.1Q tagged Ethernet frame">
<rect x="10" y="30" width="80" height="36" class="g-node"/><text x="50" y="52" class="c-text" text-anchor="middle">preamble</text>
<rect x="90" y="30" width="80" height="36" class="g-box"/><text x="130" y="52" class="c-text" text-anchor="middle">dest. addr</text>
<rect x="170" y="30" width="80" height="36" class="g-box"/><text x="210" y="52" class="c-text" text-anchor="middle">source addr</text>
<rect x="250" y="30" width="120" height="36" class="sq-span"/><text x="310" y="52" class="c-text" text-anchor="middle">802.1Q tag (4)</text>
<rect x="370" y="30" width="60" height="36" class="g-host"/><text x="400" y="52" class="c-text" text-anchor="middle">type</text>
<rect x="430" y="30" width="160" height="36" class="g-node"/><text x="510" y="52" class="c-text" text-anchor="middle">data</text>
<rect x="590" y="30" width="80" height="36" class="g-host"/><text x="630" y="52" class="c-text" text-anchor="middle">CRC (new)</text>
<rect x="190" y="96" width="120" height="30" class="g-box"/><text x="250" y="115" class="c-text" text-anchor="middle">TPID 0x8100 (2 B)</text>
<rect x="310" y="96" width="70" height="30" class="g-host"/><text x="345" y="115" class="c-text" text-anchor="middle">priority (3b)</text>
<rect x="380" y="96" width="40" height="30" class="g-host"/><text x="400" y="115" class="c-text" text-anchor="middle">CFI</text>
<rect x="420" y="96" width="110" height="30" class="g-host"/><text x="475" y="115" class="c-text" text-anchor="middle">VLAN ID (12 bits)</text>
<line x1="250" y1="66" x2="250" y2="96" class="c-axis"/><line x1="370" y1="66" x2="530" y2="96" class="c-axis"/>
<text x="340" y="145" class="c-muted" text-anchor="middle">Tag = Tag Protocol Identifier (0x8100) + Tag Control Information (priority, CFI, 12-bit VLAN ID)</text>
</svg></div><figcaption>The 802.1Q frame: the 4-byte tag sits between the source address and type; the CRC is recomputed.</figcaption></figure>
:::

- **Tag Protocol Identifier (TPID)**: 2 bytes, fixed hexadecimal value **0x8100**, marking the frame as tagged.
- **Tag Control Information (TCI)**: 2 bytes: a **12-bit VLAN identifier** (up to 4,094 VLANs), a **3-bit priority** field (like IP's TOS) and a 1-bit CFI flag.
- Because the frame changed, the **CRC is recomputed**.

VLANs can also be defined by MAC address (the manager lists which MAC addresses belong to each VLAN, and the switch looks up the VLAN when a device attaches) or by network-layer protocol (IPv4, IPv6, AppleTalk).

:::ex From a paper | Segregating bank departments without a router {{paper:19CSE301 End 2023 Q5(a)}}
:::solve
Given: All the bank's departments share one LAN with no routers; the manager wants to stop communication between Retail Banking and Trading.
Required: A method without a router, and three advantages.
Formula: Port-based VLANs on the existing switches.
Substitution: Retail ports → VLAN 10; Trading ports → VLAN 20 (and other departments in their own VLANs); trunk ports with 802.1Q tags between switches.
Calculation: Frames, including broadcasts, from a VLAN-10 port are delivered only to other VLAN-10 ports. With no router between VLANs, the two departments cannot exchange traffic at all; any permitted traffic could later be allowed through a firewall or layer-3 switch with access control.
Answer: Configure **VLANs**. Advantages: (1) **traffic isolation and security**: Retail and Trading cannot see each other's frames, and broadcast domains are smaller; (2) **flexibility**: moving an employee to another department is a software change to a port's VLAN, no recabling; (3) **efficient use of hardware**: several logical LANs share the same switches (no separate switch per department), and smaller broadcast domains improve performance.
:::
:::

:::exam Exam focus
- Switch table exercises appeared in 3 papers: learn the source, flood unknown destinations, forward to known ones, filter same-port ones.
- Switch vs router (pros and cons), and hub vs switch vs router.
- VLAN motivation, port-based VLANs, trunking and the 802.1Q tag (TPID 0x8100, 12-bit VLAN ID, 3-bit priority) ({{paper:20CYS303 End 2023 Q6}}, {{paper:19CCE304 End 2023 Q8}}).
:::

:::mistake Common mistakes
- Learning the **destination** address. A switch learns only **source** addresses.
- Forwarding a frame back out of the port it came in on.
- Saying VLANs need no router to communicate. Inter-VLAN traffic must be routed.
:::

:::rev Quick revision
- Filtering and forwarding with a switch table (MAC, interface, time); unknown → flood; same port → filter; other port → forward.
- Self-learning from source addresses; aging; plug-and-play.
- Switch benefits: no collisions, heterogeneous links, management. Weakness: spanning-tree topology, broadcast storms, ARP load.
- VLAN: port-based broadcast domains on shared switches; trunking with the 4-byte 802.1Q tag; routing between VLANs.
:::

@@topic u3-mpls | III.8 | Link virtualisation: a network as a link layer (MPLS) | How Multiprotocol Label Switching forwards IP datagrams by short labels, where its header sits, and why ISPs use it for traffic engineering, fast reroute and VPNs. Listed on your official syllabus image. | Kurose §6.5 · Chapter_6_v8.2 slides 83–89

:::note Source note
The official syllabus image includes “Link Virtualization: A Network as a Link Layer, Multiprotocol Label Switching (MPLS)”. This is the prescribed Kurose Section 6.5.
:::

## A network that IP sees as a single link

So far a “link” has been a physical wire or radio channel. But from IP's point of view, an entire network can serve as one link: the dial-up telephone network connecting two modems, or an ISP's **MPLS** network connecting two IP routers. IP simply sees “a link to the next IP router”, just as it does for an Ethernet. Such a network is a **virtualised link**.

## MPLS: label switching

**Multiprotocol Label Switching (MPLS)** grew out of industry efforts in the late 1990s to improve the forwarding speed of IP routers by borrowing a key idea from virtual-circuit networks: a **fixed-length label**. The aim is not to abandon IP's destination-based datagram forwarding, but to **augment** it, by selectively labelling datagrams and letting routers forward them by label (where possible) instead of by destination IP address.

### The MPLS header

An MPLS-capable router adds a small **MPLS header** between the **layer-2 (e.g. PPP or Ethernet) header** and the **layer-3 (IP) header**:

| Field | Bits | Purpose |
|---|---|---|
| Label | 20 | The label used for forwarding |
| Exp | 3 | Reserved for experimental use (now used for class of service) |
| S | 1 | Marks the end of a **stack** of MPLS headers (labels can be stacked) |
| TTL | 8 | Time to live |

An MPLS-enhanced frame can be sent only between routers that are both MPLS-capable; such a router is a **label-switched router (LSR)**. An LSR forwards a frame by looking up its MPLS label in its forwarding table and immediately passing the frame to the appropriate output interface, **without extracting the destination IP address and doing a longest-prefix match**.

:::seq R4 (entry) | R3 | R2 | R1 (exit)
1>2 label 10 + IP datagram to A
2: swap label 10 → 6
2>3 label 6 + IP datagram
3: swap label 6 → 9
3>4 label 9 + IP datagram
4: pop label; forward by IP to A
:::

| R3's MPLS table | | | |
|---|---|---|---|
| In label | Out label | Destination | Out interface |
| 10 | 6 | A | 1 |
| 12 | 9 | D | 0 |

How does an LSR know labels and routes? MPLS routers advertise reachability with modified link-state routing (extending OSPF), and labels are distributed with a signalling protocol (**RSVP-TE**) along chosen paths.

## Why use MPLS?

The real benefit is not speed (IP longest-prefix lookups are fast today) but **traffic management**:

- **Traffic engineering**: MPLS can forward packets along routes that **standard IP routing cannot**. IP routing sends all packets to a destination along the single least-cost path; with MPLS, an operator can send traffic **from different sources to the same destination along different paths** (for example, R4's traffic to A via one route and R6's via another), balancing load.
- **Fast reroute**: precomputed **backup paths** let an MPLS network switch traffic quickly when a link fails.
- **Virtual private networks (VPNs)**: an ISP can use MPLS to connect a customer's sites, isolating the customer's resources and addressing from other users who cross the same network.

| IP destination-based routing | MPLS |
|---|---|
| Path determined by the destination address only | Path can depend on the source, flow or class |
| Longest-prefix match at every router | Exact match on a short label; labels swapped at each hop |
| One least-cost path per destination | Multiple engineered paths, backup paths |
| Connectionless | Label-switched paths set up in advance (VC-like) |

:::rev Quick revision
- A whole network (telephone network, MPLS network) can be a virtual link for IP.
- MPLS header (32 bits: label 20, Exp 3, S 1, TTL 8) between the layer-2 and IP headers; LSRs forward by label, swapping it at each hop.
- Uses: traffic engineering (source-dependent paths), fast reroute, VPNs. Borrowed from virtual circuits.
:::

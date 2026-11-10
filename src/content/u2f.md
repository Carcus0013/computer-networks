@@topic u2-addressing | II.17 | IPv4 addressing, subnetting, CIDR, DHCP and NAT | What an IP address identifies, how subnets are formed, classful addressing and why it wasted addresses, subnet masks and CIDR (with VLSM worked step by step), how hosts get addresses automatically with DHCP, and how NAT lets a whole home share one public address. | Kurose §4.3.2–4.3.3 · Forouzan Ch 19 · Chapter_4_v8.2 slides 44–73 · Ip_addressing.ppt

## What an IP address identifies

A host typically has a single link into the network; a router has several. The boundary between a host or router and a physical link is an **interface**. Because every host and router can send and receive IP datagrams, **IP requires each interface to have its own IP address**. An IP address is technically associated with an **interface**, not with the host or router containing it.

Each IPv4 address is **32 bits** long (4 bytes), so there are \(2^{32}\) (about 4.3 billion) possible addresses. They are written in **dotted-decimal notation**: each byte is written in decimal and separated by a period. For example, 193.32.216.9 is, in binary, 11000001 00100000 11011000 00001001.

:::ex Level 1 | Converting between binary and dotted decimal
:::solve
Given: (a) 10000001 00001011 00001011 11101111; (b) 172.16.4.25.
Required: (a) dotted decimal; (b) binary.
Formula: Each byte: place values 128 64 32 16 8 4 2 1.
Substitution: (a) 10000001 = 128 + 1; 00001011 = 8 + 2 + 1; 11101111 = 128 + 64 + 32 + 8 + 4 + 2 + 1.
Calculation: (a) 129.11.11.239. (b) 172 = 10101100, 16 = 00010000, 4 = 00000100, 25 = 00011001.
Answer: (a) 129.11.11.239. (b) 10101100 00010000 00000100 00011001.
:::
:::

## Subnets

In IP terms, a group of interfaces connected so that they can reach each other **without passing through a router** forms a **subnet** (also called an IP network). In Kurose's example, three hosts and one router interface on one Ethernet all have addresses 223.1.1.x: their leftmost 24 bits are the same.

IP assigns this subnet the address **223.1.1.0/24**, where the **/24** is the **subnet mask**: the leftmost 24 bits of the 32-bit quantity define the subnet address. Any other host attached to this subnet must have an address of the form 223.1.1.xxx.

:::tip How to find the subnets in a figure (Kurose's recipe)
Detach each interface from its host or router, creating islands of isolated networks, with interfaces terminating the end points of the isolated networks. **Each of these isolated networks is a subnet.** Remember that a point-to-point link between two routers is a subnet too.
:::

## Classful addressing (Forouzan Ch 19)

Before 1993, IPv4 used **classful addressing**: the address space was divided into five classes, A to E, identified by the first bits (or the first byte).

| Class | First bits | First byte range | Default mask | Network bits / host bits | Blocks | Addresses per block | Use |
|---|---|---|---|---|---|---|---|
| A | 0 | 0–127 | 255.0.0.0 (/8) | 8 / 24 | 128 | 16,777,216 | Very large organisations |
| B | 10 | 128–191 | 255.255.0.0 (/16) | 16 / 16 | 16,384 | 65,536 | Mid-size organisations |
| C | 110 | 192–223 | 255.255.255.0 (/24) | 24 / 8 | 2,097,152 | 256 | Small organisations |
| D | 1110 | 224–239 | — | — | 1 | 268,435,456 | Multicast |
| E | 1111 | 240–255 | — | — | 1 | 268,435,456 | Reserved |

In classes A, B and C, an address is divided into a **netid** and a **hostid**. The **network address** (all host bits 0) identifies the block; the **limited broadcast/directed broadcast address** of the block has all host bits 1; neither can be assigned to a host, so a block with \(h\) host bits has \(2^h - 2\) usable host addresses.

**The problem with classes**: they waste addresses badly. A class C block (254 hosts) is too small for most organisations; a class B block (65,534 hosts) is too big for most. An organisation with 2,000 hosts got a class B and left about 63,000 addresses unused. Most class A addresses were wasted. This is what made the address space run out.

## Subnet masks and subnetting

A **mask** is a 32-bit number with \(n\) leftmost 1s and \(32 - n\) 0s. ANDing an address with the mask gives the **network (subnet) address**.

:::fx Key subnet formulas (a block with prefix length n)
\[ \text{addresses in the block} = 2^{32-n} \qquad \text{usable hosts} = 2^{32-n} - 2 \]
\[ \text{network address} = \text{address AND mask} \qquad \text{broadcast address} = \text{network address OR (NOT mask)} \]
Borrowing \(s\) host bits to make subnets gives \(2^s\) subnets, each with \(2^{32-n-s}\) addresses.
:::

| Prefix | Mask | Addresses | Usable hosts |
|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |
| /23 | 255.255.254.0 | 512 | 510 |
| /22 | 255.255.252.0 | 1,024 | 1,022 |
| /20 | 255.255.240.0 | 4,096 | 4,094 |
| /16 | 255.255.0.0 | 65,536 | 65,534 |

:::ex Level 2 | First, last and broadcast address
:::solve
Given: The address 205.16.37.39/28.
Required: The block's network (first) address, broadcast (last) address, the usable range and the number of addresses.
Formula: Network = address AND mask; block size = \(2^{32-28} = 16\).
Substitution: Last byte 39 = 0010 0111; mask's last byte /28 = 1111 0000.
Calculation: 0010 0111 AND 1111 0000 = 0010 0000 = 32. Broadcast = 32 + 16 − 1 = 47.
Answer: Network 205.16.37.32, broadcast 205.16.37.47, usable hosts .33 to .46 (14 hosts), 16 addresses in total.
:::
:::

## CIDR: classless interdomain routing

The Internet's address-assignment strategy since 1993 is **CIDR**. It generalises subnet addressing: the 32-bit address is divided into two parts in dotted-decimal form **a.b.c.d/x**, where **x** is the number of bits in the first part (the **prefix**), and any \(x\) is allowed, not just 8, 16 or 24.

- An organisation is typically assigned a block of **contiguous** addresses with a common prefix. Routers outside the organisation consider only the leading \(x\) prefix bits. This greatly **reduces the size of forwarding tables**: one entry of the form a.b.c.d/x suffices to reach every address in the organisation.
- The remaining \(32 - x\) bits identify devices inside the organisation, which may be further subnetted.

### Route aggregation (address summarisation)

Kurose's example: ISP Fly-By-Night has the block 200.23.16.0/20 and divides it into eight /23 blocks for eight organisations (200.23.16.0/23, 200.23.18.0/23, …, 200.23.30.0/23). To the rest of the Internet it advertises **one** route: “send me anything whose first 20 bits match 200.23.16.0/20”. Using a single prefix to advertise multiple networks is **route aggregation**.

What if Organisation 1 moves to another ISP (ISPs-R-Us, 199.31.0.0/16) but keeps its addresses 200.23.18.0/23? ISPs-R-Us advertises both 199.31.0.0/16 and the **more specific** 200.23.18.0/23. Routers use **longest prefix matching**, so traffic for Organisation 1 goes to ISPs-R-Us while the rest of 200.23.16.0/20 still goes to Fly-By-Night.

### VLSM: subnets of different sizes

With **variable-length subnet masks**, each subnet gets a block just large enough for it. The method:

:::flow
1. Sort | List the subnets from the largest requirement to the smallest.
2. Round up | Round each requirement up to a power of 2 (add 2 for network and broadcast if the requirement is for hosts).
3. Allocate | Give the largest block first, starting at the beginning of the address space; each block must start at a multiple of its own size.
4. Write | For each subnet: prefix, mask, network address, first and last usable address, broadcast address.
:::

:::tip Try it
The [subnet and VLSM calculator](#solver-subnet) in the Important numericals section shows the binary AND for any address/prefix and builds a complete VLSM allocation table, step by step.
:::

## Worked subnetting questions from your papers

:::ex From a paper | Class-based vs classless allocation {{paper:23CSE302 End 2025 Q2}}
An ISP holds ten class C blocks, 193.10.1.0/24 to 193.10.10.0/24. A client needs 5 subnets with 120, 56, 28, 12 and 12 addresses.

:::solve
Given: Requirements 120, 56, 28, 12, 12 addresses; available blocks 193.10.1.0/24 … 193.10.10.0/24.
Required: (a) the blocks assigned under classful and classless addressing; (b) the addresses saved, and the disadvantages of classless addressing.
Formula: Classful: one whole class C block (/24, 256 addresses) per subnet. Classless: block size = next power of 2 ≥ requirement; prefix = 32 − log₂(size).
Substitution: 120 → 128 (/25); 56 → 64 (/26); 28 → 32 (/27); 12 → 16 (/28); 12 → 16 (/28). Total = 128 + 64 + 32 + 16 + 16 = 256, exactly one /24.
Calculation: (a) **Classful**: 193.10.1.0/24, 193.10.2.0/24, 193.10.3.0/24, 193.10.4.0/24, 193.10.5.0/24 (5 × 256 = 1,280 addresses). **Classless (VLSM) inside 193.10.1.0/24**: S1 = 193.10.1.0/25 (.0–.127); S2 = 193.10.1.128/26 (.128–.191); S3 = 193.10.1.192/27 (.192–.223); S4 = 193.10.1.224/28 (.224–.239); S5 = 193.10.1.240/28 (.240–.255). (b) Saved \(= 1{,}280 - 256 = 1{,}024\) addresses (four whole class C blocks remain free for other clients).
Answer: Classful uses five /24 blocks; classless fits everything in 193.10.1.0/24 and saves 1,024 addresses. Disadvantages of classless allocation: the mask can no longer be inferred from the address, so every host and router must be configured with the prefix length (more chance of misconfiguration); address planning and record-keeping are more complex; routers must do longest-prefix matching rather than a simple class lookup; small blocks scattered across organisations make renumbering harder when a customer changes ISP (and break aggregation, adding more-specific routes).
:::
:::

:::ex From a paper | Three sub-blocks of 148.56.0.0/24 {{paper:19CSE301 End 2023 Q4(iv)}}
:::solve
Given: Block 148.56.0.0/24; sub-blocks of 29, 16 and 12 addresses.
Required: (a) class; (b) default mask; (c) addresses for the largest subnet; (d) masks of the three blocks; (e) ranges of blocks 1 and 2.
Formula: Block size = next power of 2 ≥ requirement.
Substitution: 29 → 32; 16 → 16; 12 → 16.
Calculation: (a) First byte 148 is in 128–191: **class B**. (b) **255.255.0.0**. (c) **32** addresses. (d) Block 1: /27 = 255.255.255.224; Block 2: /28 = 255.255.255.240; Block 3: /28 = 255.255.255.240. (e) Block 1: 148.56.0.0 – 148.56.0.31; Block 2: 148.56.0.32 – 148.56.0.47 (Block 3: 148.56.0.48 – 148.56.0.63).
Answer: Class B; 255.255.0.0; 32; /27, /28, /28; 148.56.0.0–.31 and 148.56.0.32–.47.
:::
:::

:::ex From a paper | Three subnets of 45 hosts {{paper:19CSE301 End 2024 Q4(b)}}
:::solve
Given: Network 200.175.14.0; 3 subnets needed; 45 usable hosts each.
Required: Class, default mask, new mask, first and last address of each subnet, hosts per subnet.
Formula: Host bits h with \(2^h - 2 \ge 45\); subnet bits s with \(2^s \ge 3\).
Substitution: \(h = 6\) gives 62 usable; then \(s = 8 - 6 = 2\) gives 4 subnets ≥ 3 ✓.
Calculation: Class C (first byte 200); default mask 255.255.255.0; new mask /26 = **255.255.255.192**. Subnet 1: 200.175.14.0 (network) … .63 (broadcast), usable .1–.62. Subnet 2: .64 … .127, usable .65–.126. Subnet 3: .128 … .191, usable .129–.190. (Subnet 4, .192/26, is spare.)
Answer: Class C; 255.255.255.0 → 255.255.255.192; 62 usable hosts per subnet; first/last usable addresses as listed (network and broadcast addresses also shown).
:::
:::

:::ex From a paper | Quarters and eighths of a class B network {{paper:20CYS303 End 2023 Q15}}
:::solve
Given: Address 150.1.2.5 with its class's default mask; divide into 5 subnets: the first three get one quarter of the addresses each, the last two get half of the remainder each.
Required: For each subnet: gateway IP, total addresses, usable hosts, broadcast address.
Formula: Class B → network 150.1.0.0/16 = 65,536 addresses. A quarter = 16,384 (/18); the remaining quarter split in half = 8,192 each (/19).
Substitution: Allocate in order from 150.1.0.0.
Calculation: S1: 150.1.0.0/18 (150.1.0.0 – 150.1.63.255). S2: 150.1.64.0/18 (– 150.1.127.255). S3: 150.1.128.0/18 (– 150.1.191.255). S4: 150.1.192.0/19 (– 150.1.223.255). S5: 150.1.224.0/19 (– 150.1.255.255).
Answer: See the table (gateway taken as the first usable address, a common convention).
:::

| Subnet | Block | Gateway | Total addresses | Usable hosts | Broadcast |
|---|---|---|---|---|---|
| 1 | 150.1.0.0/18 | 150.1.0.1 | 16,384 | 16,382 | 150.1.63.255 |
| 2 | 150.1.64.0/18 | 150.1.64.1 | 16,384 | 16,382 | 150.1.127.255 |
| 3 | 150.1.128.0/18 | 150.1.128.1 | 16,384 | 16,382 | 150.1.191.255 |
| 4 | 150.1.192.0/19 | 150.1.192.1 | 8,192 | 8,190 | 150.1.223.255 |
| 5 | 150.1.224.0/19 | 150.1.224.1 | 8,192 | 8,190 | 150.1.255.255 |
:::

## Special addresses

| Address | Meaning |
|---|---|
| 255.255.255.255 | Limited broadcast: delivered to all hosts on the same subnet; routers don't forward it |
| 0.0.0.0 | “This host” (used as a source address by a host that doesn't know its address yet, e.g. in DHCP discover) |
| 127.0.0.0/8 | Loopback (127.0.0.1 = this machine) |
| 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 | **Private** addresses: usable only inside a private network (behind NAT) |
| 169.254.0.0/16 | Link-local (assigned to itself by a host that can't reach a DHCP server) |

Address blocks are ultimately managed by **ICANN** (Internet Corporation for Assigned Names and Numbers), which allocates addresses to regional Internet registries (such as APNIC for Asia-Pacific), which allocate to ISPs, which allocate to customers.

## DHCP: obtaining a host address automatically

Once an organisation has a block, it can assign individual addresses to host and router interfaces. Router addresses are usually configured manually. Host addresses are usually assigned with the **Dynamic Host Configuration Protocol (DHCP)**. DHCP lets a host obtain an IP address automatically, either the same address every time it connects, or a **temporary** one that may differ each time. Besides its IP address, DHCP also tells a host its **subnet mask**, its **first-hop router (default gateway)** address and the address of its **local DNS server**. Because it automates connecting a host, DHCP is called a **plug-and-play** or **zeroconf** protocol.

DHCP is a client-server protocol over **UDP** (server port 67, client port 68). If there is no server on a subnet, a **DHCP relay agent** (usually the router) knows the server's address.

:::seq Arriving client | DHCP server (223.1.2.5)
1>2 DHCP discover: src 0.0.0.0:68, dst 255.255.255.255:67, transaction ID 654
2>1 a DHCP offer: yiaddr 223.1.2.4, ID 654, lease 3600 s (broadcast)
1>2 DHCP request: echo offer parameters, ID 655
2>1 a DHCP ACK: yiaddr 223.1.2.4, ID 655, lease 3600 s
:::

1. **DHCP server discovery**: the newly arriving host doesn't know any server's address, so it broadcasts a **DHCP discover** message in a UDP packet to port 67, inside an IP datagram with source address **0.0.0.0** (“this host”) and destination **255.255.255.255** (broadcast).
2. **DHCP server offer(s)**: each server that receives it replies with a **DHCP offer**, broadcast to all nodes on the subnet (the client has no address yet). It contains the transaction ID, the **proposed IP address** for the client, the network mask and an **IP address lease time** (often hours or days).
3. **DHCP request**: the client chooses one offer and responds with a **DHCP request**, echoing back the configuration parameters.
4. **DHCP ACK**: the server confirms the parameters with a **DHCP ACK**.

Once the client receives the ACK, it can use the allocated address for the lease duration, and DHCP lets it **renew** the lease. (Easy to remember: **DORA**: Discover, Offer, Request, Ack.)

:::ex From a paper | When the DHCP server shuts down {{paper:19CSE301 End 2023 Q4(i)}}
:::solve
Given: Clients obtained addresses from a DHCP server, which then shuts down.
Required: The DHCP steps, and what happens to the clients.
Formula: Addresses are leased for a fixed time; clients renew before the lease ends.
Substitution: DORA, then lease timers.
Calculation: Existing clients **keep using their addresses until their leases expire**: a lease is valid without contacting the server. Halfway through the lease a client tries to **renew** directly with the server (unicast); later it tries to **rebind** by broadcasting to any server. Both fail while the server is down. When the lease expires, the client must stop using the address; it loses connectivity (and on many systems assigns itself a link-local 169.254.x.x address). New hosts can't obtain an address at all.
Answer: Nothing happens immediately; clients work until their leases run out, then lose their addresses unless the server (or a backup server) returns. Organisations run redundant DHCP servers for this reason.
:::
:::

:::tip From a paper {{paper:23CSE302 End 2025 Q6(b)}} {{paper:19CSE301 Jan 2023 Q4}}
“After connecting to the corporate Wi-Fi with her credentials, how does the employee's laptop get its IP address, default gateway and DNS server?” This is the same DORA exchange. It runs over UDP broadcast (the laptop has no address yet, so it uses 0.0.0.0 and 255.255.255.255), and the DHCP ACK carries the IP address, subnet mask, default gateway (first-hop router) and DNS server address, plus the lease time. Kurose's “day in the life of a web request” starts exactly this way.
:::

## NAT: network address translation

Every IP-capable device needs an address. Suppose a home with many devices gets only one address from its ISP. **Network address translation (NAT)** solves this.

- All devices in the home network get addresses from a **private** range (such as 10.0.0.0/24). These addresses have meaning only inside that network; hundreds of thousands of home networks use the same range.
- The **NAT-enabled router** does not look like a router to the outside world. It behaves as **one device with a single public IP address** (say 138.76.29.7). All traffic leaving the home carries that source address, and all traffic entering has it as destination.
- The router hides the details of the home network. The home devices typically get their private addresses from the router's own **DHCP server**.

How does the router know which internal host gets an arriving datagram? Through a **NAT translation table** that includes **port numbers** as well as IP addresses.

:::seq Host 10.0.0.1 | NAT router (138.76.29.7) | Server 128.119.40.186
1>2 S: 10.0.0.1, 3345 → D: 128.119.40.186, 80
2: new table entry: WAN 138.76.29.7, 5001 ↔ LAN 10.0.0.1, 3345
2>3 S: 138.76.29.7, 5001 → D: 128.119.40.186, 80
3>2 a S: 128.119.40.186, 80 → D: 138.76.29.7, 5001
2: look up 5001 → 10.0.0.1, 3345
2>1 a S: 128.119.40.186, 80 → D: 10.0.0.1, 3345
:::

| WAN side address | LAN side address |
|---|---|
| 138.76.29.7, 5001 | 10.0.0.1, 3345 |
| 138.76.29.7, 5002 | 10.0.0.2, 4012 |
| 138.76.29.7, 5003 | 10.0.0.3, 3345 |

1. Host 10.0.0.1 requests a web page on 128.119.40.186 (port 80), using source port 3345.
2. The NAT router **replaces** the source IP with its WAN address 138.76.29.7 and the source port with a new port, 5001, not currently in its table, and adds an entry to the table.
3. The server replies to 138.76.29.7, port 5001.
4. The router looks up 5001 in its table, finds 10.0.0.1, 3345, rewrites the destination address and port, and forwards the datagram into the home network.

Because the port field is 16 bits, NAT can support over **60,000 simultaneous connections** with a single WAN address.

**Why NAT is controversial**: port numbers are meant for addressing **processes**, not hosts; routers are supposed to process packets only up to layer 3, but NAT rewrites transport headers (it violates the end-to-end argument); a server **behind** a NAT can't easily be reached from outside (problems for P2P and VoIP; NAT traversal tools exist); and the address shortage should be solved by IPv6. Even so, NAT is everywhere, and it adds some security by hiding internal hosts.

:::ex From a paper | A home Wi-Fi router {{paper:19CCE304 Jan 2023 Q4(A)}}
:::solve
Given: A wireless router connected to a cable modem; the ISP gives the router one IP address dynamically; five PCs connect over 802.11.
Required: How the PCs get addresses; whether the router uses NAT, and why.
Formula: One public address shared by many devices requires NAT.
Substitution: The ISP's DHCP gives the router's WAN interface its one public address.
Calculation: The router runs its own DHCP server and gives the five PCs private addresses (e.g. 192.168.1.2–192.168.1.6), with itself (192.168.1.1) as default gateway and DNS relay.
Answer: The PCs get private addresses from the router's DHCP server. Yes, the router must use NAT: there is only one public address, so it rewrites source addresses and ports on outgoing datagrams and uses its translation table to deliver replies to the right PC.
:::
:::

:::exam Exam focus
- Subnetting (CIDR/VLSM, classful) appeared in 6 papers, including your own course's end-sem (6 marks). Practise: class, default mask, new mask, network/first/last/broadcast addresses, hosts per subnet.
- DHCP: the four messages with addresses and ports, what DHCP provides, and leases. Asked in 5 papers.
- NAT: the translation table, the 4-step example, and why it is needed and controversial ({{paper:20CYS303 End 2023 Q7}}, {{paper:20CYS303 End 2024 Q14}}, {{paper:19CCE304 End 2024 Q4}}).
- {{paper:20CYS303 End 2024 Q1(d)}}: define CIDR.
:::

:::mistake Common mistakes
- Forgetting to subtract 2 (network and broadcast) when counting usable hosts.
- Allocating VLSM blocks from smallest to largest, which leaves misaligned blocks. Always start with the largest.
- Starting a block at an address that isn't a multiple of its size (e.g. a /26 at .32).
- Saying NAT changes only IP addresses. It changes port numbers too.
- Saying DHCP uses TCP. It uses UDP broadcast (67/68).
:::

:::rev Quick revision
- An IP address identifies an interface; 32 bits; dotted decimal.
- Subnet = interfaces reachable without a router; a.b.c.d/x.
- Classful: A /8 (0–127), B /16 (128–191), C /24 (192–223), D multicast, E reserved; wasteful.
- Block of /n: \(2^{32-n}\) addresses, \(2^{32-n} - 2\) hosts; network = AND mask; broadcast = all host bits 1.
- CIDR: any prefix length; route aggregation; longest prefix match for more-specific routes.
- DHCP: Discover (0.0.0.0 → 255.255.255.255), Offer, Request, ACK; gives address, mask, gateway, DNS, lease.
- NAT: private addresses inside, one public address outside; translation table of (WAN IP, port) ↔ (LAN IP, port).
:::

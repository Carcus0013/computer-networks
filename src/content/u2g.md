@@topic u2-routing | II.18 | Routing algorithms: link state and distance vector | How routers find least-cost paths: the graph model, Dijkstra's link-state algorithm with full tables, the Bellman-Ford distance-vector algorithm with iteration tables, count-to-infinity and poisoned reverse, and the LS vs DV comparison. | Kurose §5.1–5.2 · Chapter_5_v8.2 slides 8–48, 118–121 · Distance_vector_numerical.pdf

## The goal and the model

A routing algorithm's goal is to determine **good paths** (routes) from senders to receivers through the network of routers. “Good” usually means **least cost**.

A network is modelled as a **graph** \(G = (N, E)\): \(N\) is the set of nodes (routers) and \(E\) the set of edges (links). Each edge has a **cost** \(c(x, y)\), which may reflect the link's length, its speed or its monetary cost. If \((x, y)\) is not an edge, \(c(x, y) = \infty\). A path's cost is the sum of its edge costs; the **least-cost path** has the smallest such sum.

### Classifying routing algorithms

| Basis | Kinds |
|---|---|
| Global or decentralised information | **Centralised (global)**: every node knows the complete topology and all link costs → **link-state (LS)** algorithms. **Decentralised**: each node knows only its neighbours and the costs to them, and computes iteratively by exchanging information with neighbours → **distance-vector (DV)** algorithms |
| How often routes change | **Static**: routes change slowly, often by human intervention. **Dynamic**: routes change as traffic loads or topology change |
| Sensitivity to load | **Load-sensitive**: link costs reflect current congestion. **Load-insensitive**: costs don't (today's Internet algorithms: OSPF, BGP) |

!!sim visualizations/routing/index.html | Routing visualizer | Run Dijkstra step by step on preset or exam networks (watch N′, D(v) and p(v) update), run distance vector round by round, change a link cost to see good news travel fast and count-to-infinity, switch on poisoned reverse, and forward a packet along the computed path.

## The link-state algorithm: Dijkstra

In a link-state algorithm, the topology and all link costs are known to every node. This is achieved by each node **broadcasting link-state packets** to all other nodes (OSPF does this). Then every node runs the same algorithm and computes the same set of least-cost paths.

**Dijkstra's algorithm** computes the least-cost path from one node (the source, \(u\)) to all other nodes. It is **iterative**: after the \(k\)th iteration, the least-cost paths to \(k\) destination nodes are known.

Notation:

- \(D(v)\): the cost of the least-cost path from the source to \(v\) known so far in this iteration.
- \(p(v)\): the previous node (neighbour of \(v\)) along the current least-cost path from the source to \(v\).
- \(N'\): the set of nodes whose least-cost path from the source is **definitively** known.

:::fx Dijkstra's algorithm at source node u
```
Initialisation:
  N' = {u}
  for all nodes v:
    if v is a neighbour of u: D(v) = c(u,v)
    else: D(v) = ∞
Loop:
  find w not in N' such that D(w) is a minimum
  add w to N'
  for each neighbour v of w not in N':
    D(v) = min( D(v), D(w) + c(w,v) )
    (if the new value is smaller, set p(v) = w)
until N' = N
```
:::

### Kurose's example

:::graph Kurose's six-router network (link costs on the edges). Highlighted edges are u's least-cost tree.
u 60 120 hl
v 200 40 node
w 360 40 node
x 200 200 node
y 360 200 node
z 500 120 node
u-v 2 *
u-x 1 *
u-w 5
v-x 2
v-w 3
x-w 3
x-y 1 *
w-y 1 *
w-z 5
y-z 2 *
:::

| Step | N′ | D(v), p(v) | D(w), p(w) | D(x), p(x) | D(y), p(y) | D(z), p(z) |
|---|---|---|---|---|---|---|
| 0 | u | 2, u | 5, u | **1, u** | ∞ | ∞ |
| 1 | ux | 2, u | 4, x | | **2, x** | ∞ |
| 2 | uxy | **2, u** | 3, y | | | 4, y |
| 3 | uxyv | | **3, y** | | | 4, y |
| 4 | uxyvw | | | | | **4, y** |
| 5 | uxyvwz | | | | | |

- Step 0: only u's neighbours v, w, x have finite costs.
- Step 1: x has the smallest cost (1), so x joins N′. Through x, w drops from 5 to 1 + 3 = 4, and y becomes 1 + 1 = 2.
- Step 2: v and y tie at 2; the tie is broken arbitrarily (y). Through y, w drops to 2 + 1 = 3 and z becomes 2 + 2 = 4.
- Steps 3–5: v, then w, then z join. Nothing improves.

Following the predecessors back from each destination gives the paths: to w, p(w) = y, p(y) = x, p(x) = u, so u → x → y → w. The **forwarding table at u**:

| Destination | Link |
|---|---|
| v | (u, v) |
| w | (u, x) |
| x | (u, x) |
| y | (u, x) |
| z | (u, x) |

**Complexity**: in the first iteration we search all \(n\) nodes, then \(n - 1\), and so on: \(n(n+1)/2\) searches in total, so the algorithm is \(O(n^2)\). With a heap it can be faster (logarithmic per search).

:::ex From a paper | Link state from router A {{paper:23CSE302 End 2025 Q6(a)}}
:::graph The network in the question.
A 60 120 hl
B 220 40 node
C 220 200 node
D 400 40 node
E 400 200 node
A-B 2 *
A-C 5
B-C 1 *
B-D 2 *
C-D 3
C-E 1 *
D-E 4
:::

:::solve
Given: Bidirectional links: A–B 2, A–C 5, B–C 1, B–D 2, C–D 3, C–E 1, D–E 4. Source A.
Required: The least-cost paths from A to every router, by the LS algorithm.
Formula: Dijkstra: repeatedly add the cheapest node not in N′ and relax its neighbours.
Substitution: Initialise: D(B) = 2, D(C) = 5, D(D) = ∞, D(E) = ∞.
Calculation:
  Step 1: add B (2). Relax: C = min(5, 2 + 1) = 3 via B; D = 2 + 2 = 4 via B.
  Step 2: add C (3). Relax: D = min(4, 3 + 3) = 4 (unchanged); E = 3 + 1 = 4 via C.
  Step 3: add D (4) (tie with E, broken alphabetically). Relax: E = min(4, 4 + 4) = 4 (unchanged).
  Step 4: add E (4). Done.
Answer: B: cost 2, A→B. C: cost 3, A→B→C. D: cost 4, A→B→D. E: cost 4, A→B→C→E. A's forwarding table sends traffic for every destination out on link (A, B).
:::

| Step | N′ | D(B), p(B) | D(C), p(C) | D(D), p(D) | D(E), p(E) |
|---|---|---|---|---|---|
| 0 | A | **2, A** | 5, A | ∞ | ∞ |
| 1 | AB | | **3, B** | 4, B | ∞ |
| 2 | ABC | | | **4, B** | 4, C |
| 3 | ABCD | | | | **4, C** |
| 4 | ABCDE | | | | |
:::

### Oscillations with load-sensitive costs

If link cost equals the load carried on the link (congestion-sensitive routing), Dijkstra can **oscillate**. In Kurose's ring example, routers send traffic clockwise or counter-clockwise depending on which direction is currently cheaper; once all of them move to the cheap direction, it becomes the expensive one, so at the next run they all move back, and so on. Solutions: don't use load-sensitive costs (not acceptable if the goal is to avoid congestion), or make sure routers don't all run the algorithm at the same time, for example by **randomising** the time each router sends its link advertisement. {{paper:19CSE301 End 2024 Q5(c)}} asked you to show this oscillation.

## The distance-vector algorithm: Bellman-Ford

The DV algorithm is **iterative, asynchronous and distributed**:

- **Distributed**: each node receives information from one or more directly attached neighbours, performs a calculation, and distributes the results back to its neighbours.
- **Iterative**: the process continues until no more information is exchanged between neighbours (it is **self-terminating**).
- **Asynchronous**: nodes don't need to operate in lockstep.

It rests on the **Bellman-Ford equation**. Let \(d_x(y)\) be the cost of the least-cost path from \(x\) to \(y\). Then

:::fx Bellman-Ford equation
\[ d_x(y) = \min_{v}\,\{\, c(x, v) + d_v(y) \,\} \]
where the minimum is taken over all of \(x\)'s neighbours \(v\). In words: to get from x to y, go to some neighbour v first, then take v's least-cost path to y; choose the neighbour that makes the total smallest.
:::

Each node \(x\) maintains:

- the cost \(c(x, v)\) to each directly attached neighbour \(v\);
- its own **distance vector** \(\mathbf{D}_x = [D_x(y) : y \in N]\), its estimates of its cost to every node;
- the distance vectors of each of its neighbours, \(\mathbf{D}_v\).

:::flow
1. Initialise | \(D_x(y) = c(x, y)\) for neighbours, ∞ otherwise; send \(\mathbf{D}_x\) to every neighbour.
2. Wait | Until a link cost to a neighbour changes, or a neighbour sends a new distance vector.
3. Recompute | For each destination y: \(D_x(y) = \min_v \{c(x, v) + D_v(y)\}\).
4. Notify | If \(\mathbf{D}_x\) changed for any destination, send the new vector to all neighbours. Repeat.
:::

The node's **forwarding table** sends a packet for destination \(y\) to the neighbour \(v^*\) that achieves the minimum: the next hop.

:::ex From a paper | Three routers X, Y, Z {{paper:20CYS303 End 2025 Q9}}
This is also Kurose's own DV example.

:::graph The three-router network.
X 80 120 hl
Y 300 40 node
Z 300 200 node
X-Y 2
Y-Z 1
X-Z 7
:::

:::solve
Given: \(c(X,Y) = 2\), \(c(Y,Z) = 1\), \(c(X,Z) = 7\). All routers exchange vectors simultaneously.
Required: (a) the tables at t = 0; (b) X's and Z's tables at t = 1 with next hops; (c) X's table at t = 2, the final path from X to Z, and why a second iteration is needed.
Formula: \(D_x(y) = \min_v \{c(x,v) + D_v(y)\}\).
Substitution: t = 0 vectors: \(\mathbf{D}_X = [0, 2, 7]\), \(\mathbf{D}_Y = [2, 0, 1]\), \(\mathbf{D}_Z = [7, 1, 0]\) (order: to X, Y, Z).
Calculation:
  t = 1, at X: \(D_X(Y) = \min(2 + 0, 7 + 1) = 2\) via Y; \(D_X(Z) = \min(2 + 1, 7 + 0) = 3\) via Y. New \(\mathbf{D}_X = [0, 2, 3]\).
  t = 1, at Z: \(D_Z(X) = \min(7 + 0, 1 + 2) = 3\) via Y; \(D_Z(Y) = \min(7 + 2, 1 + 0) = 1\) via Y. New \(\mathbf{D}_Z = [3, 1, 0]\).
  t = 1, at Y: \(D_Y(X) = \min(2, 1 + 7) = 2\); \(D_Y(Z) = \min(1, 2 + 7) = 1\). Unchanged \([2, 0, 1]\).
  t = 2, at X (receives \(\mathbf{D}_Y = [2,0,1]\), \(\mathbf{D}_Z = [3,1,0]\)): \(D_X(Y) = \min(2 + 0, 7 + 1) = 2\); \(D_X(Z) = \min(2 + 1, 7 + 0) = 3\). No change.
Answer: Final path X → Y → Z with cost 3 (not the direct link of cost 7). A second iteration is needed because at t = 1 X and Z changed their vectors and must send them to their neighbours; only when the t = 2 computations produce no change does every router know its estimates are final (the algorithm is self-terminating: it stops when no vector changes).
:::
:::

**X's distance table at t = 1** (rows = vectors X knows; columns = destinations):

| From \ cost to | X | Y | Z |
|---|---|---|---|
| X (own, recomputed) | 0 | 2 | **3** |
| Y (received at t = 0) | 2 | 0 | 1 |
| Z (received at t = 0) | 7 | 1 | 0 |

### Link-cost changes: good news travels fast

Suppose \(c(x, y)\) **decreases** from 4 to 1 in Kurose's network (\(c(y, z) = 1\), \(c(z, x) = 50\)). At t₀, y detects the change, updates \(D_y(x) = 1\) and informs its neighbours. At t₁, z receives it and updates \(D_z(x) = 2\), and informs y. At t₂, y's vector doesn't change, so it sends nothing. The algorithm is quiet after just two iterations.

### Bad news travels slowly: the count-to-infinity problem

Now suppose \(c(x, y)\) **increases** from 4 to 60. Before the change, \(D_y(x) = 4\), \(D_z(x) = 5\) (via y).

1. y sees the new cost and computes \(D_y(x) = \min\{60 + 0,\ 1 + D_z(x)\} = \min\{60, 1 + 5\} = 6\). With its stale information, y thinks it can reach x through z at cost 6. **A routing loop**: to reach x, y routes through z, and z routes through y. Packets bounce between them.
2. z hears \(D_y(x) = 6\) and computes \(D_z(x) = \min\{50, 1 + 6\} = 7\).
3. y computes \(\min\{60, 1 + 7\} = 8\); z computes 9; and so on.

The costs climb by 1 at each exchange until z's estimate through y exceeds its direct cost of 50. In Kurose's count this takes **44 iterations**. (The [routing visualizer](visualizations/routing/index.html), which updates every router in lockstep rounds, needs 47 rounds; the exact number depends on how the updates are timed, so state your assumption.) If the direct link were also very expensive (or missing), the counting would go on far longer: this is the **count-to-infinity** problem.

### Poisoned reverse

The trick: **if z routes through y to get to destination x, then z advertises to y that its distance to x is infinity**, \(D_z(x) = \infty\), as long as z keeps routing to x through y. Then y won't try to route to x through z.

With poisoned reverse in the example above, y computes \(D_y(x) = \min\{60, 1 + \infty\} = 60\) and tells z. z computes \(\min\{50, 1 + 60\} = 50\), switches to its direct link, and tells y \(D_z(x) = 50\) (no longer poisoned, since z no longer routes through y). y computes \(\min\{60, 1 + 50\} = 51\). Converged in three steps.

**Limitation**: poisoned reverse prevents loops between **two** neighbours. It does **not** solve the general count-to-infinity problem: loops involving **three or more** nodes are not detected.

:::ex From a paper | Poisoned reverse in a four-router network {{paper:19CCE304 Jan 2023 Q5}}
:::graph The network (costs on links).
x 60 120 hl
y 240 40 node
z 240 200 node
w 420 120 node
x-y 4
x-z 50
y-w 1
z-w 1
y-z 3
:::

:::solve
Given: \(c(x,y) = 4\), \(c(x,z) = 50\), \(c(y,w) = 1\), \(c(z,w) = 1\), \(c(y,z) = 3\). Poisoned reverse is used.
Required: (a) After stabilisation, what distances to x do w, y and z tell each other? (b) If \(c(x,y)\) becomes 60, is there count-to-infinity even with poisoned reverse, and how long until it settles? (c) How should \(c(y,z)\) change so there is no count-to-infinity at all?
Formula: Bellman-Ford; poisoned reverse: advertise ∞ to the neighbour you route through.
Substitution: Stable routes to x: y direct (4); w via y (1 + 4 = 5); z via w (1 + 5 = 6, better than 3 + 4 = 7 via y or 50 direct).
Calculation: (a) **w** routes via y, so it tells **y: ∞** and tells **z: 5**. **y** routes directly, so it tells **w: 4** and **z: 4**. **z** routes via w, so it tells **w: ∞** and tells **y: 6**.
  (b) y now computes \(\min\{60,\ 1 + \infty \text{ (w is poisoned)},\ 3 + 6 \text{ (via z)}\} = 9\) via z. But z's route goes via w, and w's goes via y: the loop **y → z → w → y** has three nodes, so poisoned reverse can't break it. w then computes 1 + 9 = 10 via y; z computes 1 + 10 = 11 via w; y computes 3 + 11 = 14; and so on. Each trip around the loop adds its cost, 3 + 1 + 1 = 5.
  The climb continues until z's cost through w exceeds its direct link (50): z switches to the direct link (50), then w settles at 51 via z and y at 52 via w. In a synchronous simulation in which all routers exchange vectors once per round, this takes about **30 rounds** (the exact count depends on the timing assumptions you state).
  (c) Remove the y–z link (set \(c(y,z) = \infty\)). Then the only loops are between pairs of neighbours, which poisoned reverse handles: y goes to 60, w briefly to 61, z switches to its direct link 50, then w becomes 51 and y 52, settling in a few rounds with no counting.
Answer: (a) w→y: ∞, w→z: 5; y→w: 4, y→z: 4; z→w: ∞, z→y: 6. (b) Yes: a three-node loop (y, z, w) counts up in steps of 5 until the costs pass 50; with synchronous rounds this takes about 30 rounds. (c) Make \(c(y,z) = \infty\) (remove the y–z link).
:::
:::

:::tip From a paper {{paper:19CSE301 Jan 2023 Q8}}
“Route poisoning: which routing algorithm uses it, and how does it work?” **Distance vector** (e.g. RIP). When a route fails, the router that notices advertises that destination with an **infinite** metric (in RIP, 16 hops = unreachable) instead of simply dropping it, so neighbours learn at once that the route is dead rather than continuing to believe stale alternatives. Combined with **poisoned reverse** (advertising ∞ back to the neighbour you route through) and hold-down timers, it limits count-to-infinity.
:::

## Link state versus distance vector

| Feature | Link state (LS) | Distance vector (DV) |
|---|---|---|
| Information each node needs | The complete topology and all link costs | Only costs to its neighbours, plus their vectors |
| What is exchanged, with whom | Link-state advertisements **flooded to all nodes** | Distance vectors exchanged **only with neighbours** |
| Message complexity | Each node must know every link cost: \(O(\lvert N\rvert \lvert E\rvert)\) messages; any change is broadcast to all | Messages only between neighbours; a change is propagated only if it changes a least-cost path |
| Speed of convergence | \(O(\lvert N\rvert^2)\) algorithm, \(O(\lvert N\rvert\lvert E\rvert)\) messages; converges quickly | Can converge slowly; routing loops while converging; count-to-infinity |
| Robustness | A malfunctioning router can broadcast a wrong *link* cost, but each node computes its own table, providing some separation | A malfunctioning router can advertise wrong least-cost *paths* to all destinations, and the error spreads through the whole network |
| Algorithm | Dijkstra | Bellman-Ford |
| Internet example | **OSPF**, IS-IS | **RIP**; BGP is a related path-vector protocol |

:::exam Exam focus
- Dijkstra tables appeared in **7 papers**, including your own end-sem (7 marks). Show N′ and every D(v), p(v) column at every step, then the paths and the forwarding table.
- DV iteration tables appeared in 5 papers. Show each node's table (own vector plus neighbours' vectors) per iteration.
- Count-to-infinity, poisoned reverse and its limitation.
- LS vs DV comparison with an example protocol each ({{paper:19CSE301 Jan 2023 Q7}}).
:::

:::mistake Common mistakes
- In Dijkstra, adding a node to N′ before it has the smallest D among the remaining nodes, or relaxing nodes already in N′.
- Forgetting to record p(v) when D(v) improves.
- In DV, using a neighbour's **new** vector in the same round it was computed (unless the question says updates are sequential). Synchronous exchange uses the previous round's vectors.
- Claiming poisoned reverse eliminates all loops.
:::

:::rev Quick revision
- Graph G = (N, E), costs c(x, y); least-cost paths.
- LS = global info, Dijkstra, N′, D(v), p(v), \(O(n^2)\); oscillation with load-based costs.
- DV = distributed, iterative, asynchronous; \(d_x(y) = \min_v\{c(x,v) + d_v(y)\}\).
- Good news fast; bad news slow (count-to-infinity, routing loops); poisoned reverse fixes 2-node loops only.
- LS: flood to all, fast convergence, more robust. DV: neighbours only, slow convergence, errors spread.
:::

@@topic u2-internet-routing | II.19 | Routing in the Internet: OSPF and BGP | Why the Internet's routing is split into autonomous systems, how OSPF routes inside one, how BGP routes between them (attributes, hot-potato routing, route selection, policy), and why the two are different. | Kurose §5.3–5.4 · Chapter_5_v8.2 slides 49–76

## Why routing is hierarchical

The algorithms of II.18 view the network as a flat collection of identical routers. That is unrealistic for two reasons:

- **Scale**: hundreds of millions of routers can't all store routes to every destination, and the link-state broadcasts or distance-vector iterations would never converge.
- **Administrative autonomy**: the Internet is a network of ISPs, each of which wants to run its routers as it pleases (choosing its own routing algorithm) and hide its internal organisation.

Both problems are solved by organising routers into **autonomous systems (ASes)**: a group of routers under the same administrative control. An ISP may be one AS or several; each AS has a globally unique **AS number (ASN)**, assigned by ICANN's regional registries.

- **Intra-AS routing** (an **interior gateway protocol**): routing within an AS. Routers in the same AS all run the same algorithm. Examples: **OSPF**, RIP, IS-IS, EIGRP.
- **Inter-AS routing**: routing between ASes. All ASes must run the same protocol: **BGP**. Routers at the edge of an AS that connect to routers in other ASes are **gateway routers**.

## OSPF: Open Shortest Path First

OSPF is a **link-state** protocol widely used for intra-AS routing in the Internet (“open” means the specification is publicly available).

- Each router builds a **complete topological map** (a graph) of the entire AS.
- Each router runs **Dijkstra's algorithm** locally to determine a shortest-path tree to all subnets, with itself as the root.
- Link costs are configured by the network administrator: all 1 (minimum hop routing), or inversely proportional to link capacity to discourage traffic on low-bandwidth links. OSPF doesn't set the weights; it gives the mechanism.
- A router **broadcasts link-state information to all other routers in the AS**, not just its neighbours: whenever a link's state changes (cost or up/down), and periodically (at least once every 30 minutes) even if nothing changes. Advertisements are carried directly in IP (upper-layer protocol 89), so OSPF does its own reliable transfer and broadcast.

OSPF's advanced features:

| Feature | What it gives |
|---|---|
| **Security** | Exchanges between routers can be **authenticated** (simple password or MD5 hash), so only trusted routers take part and malicious routers can't inject wrong information |
| **Multiple same-cost paths** | When several paths to a destination have the same cost, OSPF can use them all (traffic is spread instead of forced onto one) |
| **Integrated unicast and multicast** | Multicast OSPF (MOSPF) uses OSPF's link database for multicast routing |
| **Hierarchy within an AS** | An AS can be divided into **areas**, each running its own OSPF with link states broadcast only within the area. **Area border routers** route packets out of an area; exactly one area is the **backbone**, which routes traffic between the other areas. **Boundary routers** connect to other ASes |

## BGP: Border Gateway Protocol

BGP (RFC 4271) is the **glue that holds the Internet together**: the de facto inter-domain routing protocol. It lets each AS:

1. **Obtain prefix reachability information from neighbouring ASes**: learn that a subnet (prefix) such as 138.16.68/22 exists and can be reached through a given neighbour.
2. **Determine the “best” routes to the prefixes**, using the reachability information and **policy**.

In BGP, packets are routed not to specific addresses but to **CIDR prefixes**, each representing a subnet or collection of subnets.

### eBGP and iBGP

Routers exchange routing information over semi-permanent TCP connections (port 179); each connection with all the messages sent over it is a **BGP session**.

- **eBGP (external BGP)** sessions span two ASes, between gateway routers.
- **iBGP (internal BGP)** sessions run between routers in the **same** AS, to spread the externally learned routes to every router inside.

Example: AS3 advertises prefix x to AS2 over eBGP (“AS3 x”); AS2's gateway router spreads it to all AS2 routers over iBGP, then advertises “AS2 AS3 x” to AS1 over eBGP; AS1 spreads it internally over iBGP.

### Route attributes

A prefix advertised with its attributes is a **route**. Two important attributes:

- **AS-PATH**: the list of ASes through which the advertisement has passed. When a prefix passes into an AS, that AS adds its ASN to the existing list. Routers use AS-PATH to **detect and prevent loops**: if a router sees its own AS in the path, it rejects the advertisement. It is also used to choose among multiple paths.
- **NEXT-HOP**: the IP address of the router interface that **begins the AS-PATH** (the gateway router where the route leaves towards the destination).

### Hot-potato routing

Suppose a router in AS1 learns two routes to prefix x, through two different gateways. With **hot-potato routing**, the route chosen is the one whose NEXT-HOP gateway has the **least intra-AS cost** from the router: the router gets the packet **out of its own AS as quickly as possible** (passes the hot potato), without caring about the cost **outside** its AS. Each router in an AS can choose a different gateway. This is a selfish algorithm: it reduces cost in the router's own AS while ignoring the rest of the end-to-end path.

:::tip From a paper {{paper:20CYS303 End 2024 Q1(e)}}
Define hot-potato routing: among several BGP routes to a destination, choose the one whose gateway router (NEXT-HOP) is closest in intra-AS cost, so the packet leaves the AS as soon as possible, regardless of how long the remaining path outside the AS is.
:::

### BGP's route-selection algorithm

When a router has more than one route to the same prefix, it applies these rules in order until one route remains:

1. **Local preference**: the route with the highest local-preference value (a policy decision set by the AS's administrator) is chosen.
2. **Shortest AS-PATH**: among routes with the same local preference, the one with the fewest ASes (BGP then behaves like a DV algorithm with AS hops as the metric).
3. **Closest NEXT-HOP**: hot-potato routing: the route with the least-cost path to its NEXT-HOP router.
4. **BGP identifiers**: if more than one route still remains, a router identifier breaks the tie.

### Policy routing

BGP is above all a **policy** protocol. Consider customer ISPs W, X, Y attached to provider networks A, B, C. A customer network that is **dual-homed** (X, attached to both B and C) does **not** want to carry traffic between B and C, so it advertises to B and C **no** paths to destinations other than itself. Likewise provider B, which learns a path to Y through C, may refuse to advertise it to A, because B gains nothing (it isn't paid) by carrying A's traffic to C's customer. A rule of thumb in commercial ISPs: **any traffic flowing across an ISP's backbone must have a source or destination (or both) in one of that ISP's customer networks**; otherwise the traffic would get a free ride.

### IP anycast with BGP

BGP also implements **IP anycast**, used by CDNs and DNS root servers: several servers in different places are given the **same** IP address, and each advertises it with BGP. A router receiving several routes to that address treats them as different paths to one place and picks the “best” (closest) one, so each client reaches its nearest replica.

## Why different intra-AS and inter-AS protocols?

| Concern | Intra-AS (OSPF, RIP) | Inter-AS (BGP) |
|---|---|---|
| **Policy** | Everything is under one administrator, so policy hardly matters | Policy dominates: an AS controls how its traffic is routed and who routes through it |
| **Scale** | Can be handled by hierarchy (OSPF areas) | Must scale to the whole Internet's prefixes; hierarchy (ASes) reduces table sizes |
| **Performance** | Focus on performance (least cost) | Policy often dominates over performance; route quality is secondary |

:::ex From a paper | Intra-domain vs inter-domain {{paper:20CYS303 End 2025 Q4}}
:::solve
Given: RIP, OSPF and BGP; RIP is distance vector, BGP path vector.
Required: Differentiate intra- and inter-domain routing, categorise the three protocols, and justify BGP's path-vector design versus RIP's distance-vector design.
Formula: Intra-domain = within one AS (one administrator); inter-domain = between ASes.
Substitution: RIP, OSPF → intra-domain; BGP → inter-domain.
Calculation: BGP needs a **path vector** because (1) it must apply **policy**: an AS must see the whole AS-PATH to decide whether it is willing to use or advertise a route (e.g. not through a competitor); (2) the AS-PATH lets it **detect loops** across thousands of ASes, which a bare distance cost can't (DV's count-to-infinity would be disastrous at Internet scale); (3) ASes use **different, non-comparable** internal metrics, so a single summed cost is meaningless across ASes. RIP's DV is sufficient within a small AS because a single administrator wants plain least-cost (hop count) paths, the network is small (max 15 hops), and occasional slow convergence is tolerable.
Answer: Intra: OSPF (link state), RIP (distance vector). Inter: BGP (path vector). BGP carries full AS paths for policy, loop prevention and scale; RIP's simple hop-count DV is enough inside one small administrative domain.
:::
:::

:::exam Exam focus
- Know AS, intra- vs inter-AS routing and why both exist (policy, scale, performance).
- OSPF: link state, flooding to all routers in the AS, Dijkstra, features (security, multiple equal-cost paths, unicast + multicast, areas and backbone).
- BGP: eBGP/iBGP, AS-PATH and NEXT-HOP, hot-potato routing, the selection rules, policy and IP anycast.
:::

:::mistake Common mistakes
- Calling OSPF a distance-vector protocol. It is link state.
- Saying hot-potato routing picks the shortest end-to-end path. It picks the **closest exit**, ignoring cost outside the AS.
- Forgetting that BGP's AS-PATH is how loops are prevented.
:::

:::rev Quick revision
- AS = routers under one administration; intra-AS (OSPF, RIP) vs inter-AS (BGP).
- OSPF: link state, broadcast to the whole AS, Dijkstra, at least every 30 min; authentication, equal-cost paths, areas + backbone.
- BGP: prefixes, eBGP/iBGP over TCP 179, AS-PATH (loops), NEXT-HOP, hot potato; selection: local pref → shortest AS-PATH → closest NEXT-HOP → ID.
- Policy routing; IP anycast.
:::

@@topic u2-sdn | II.20 | The SDN control plane | Software-defined networking: flow-based forwarding, separating the data and control planes, a remote controller and programmable network applications; the SDN architecture, OpenFlow messages, and how it compares with traditional routers. Listed on your official syllabus image. | Kurose §5.5 (and §4.1) · Chapter_5_v8.2 slides 77–96

:::note Source note
The official syllabus image in your folder ends Unit 3 with “Introduction to Software Defined Networks”. SDN is covered by the prescribed Kurose Section 5.5 and appeared in two past papers.
:::

## The four key characteristics of SDN

1. **Flow-based forwarding**: packet forwarding by SDN-controlled switches can be based on **any number of header field values** at the transport, network or link layer, not just the destination IP address. The forwarding rules are specified in a switch's **flow table** (generalised “match-plus-action” forwarding: match header fields, then forward, drop, modify or send to the controller).
2. **Separation of data plane and control plane**: the data plane is the network's switches (relatively simple, fast devices that execute “match plus action” rules). The control plane is the servers and software that determine and manage the switches' flow tables.
3. **Network control functions external to the data-plane switches**: the “software” in SDN runs on servers separate from the switches: an **SDN controller** (a network operating system) and a set of **network-control applications**. The controller is **logically centralised** but typically implemented on several servers for performance and fault tolerance.
4. **A programmable network**: network-control applications (routing, access control, load balancing, firewalls) are programs that use the controller's API to specify and control the data plane.

## The SDN architecture: three layers

:::stack
Network-control applications | The “brains” of the control plane: routing, access control, firewall, load balancing. They use the controller's **northbound API** (e.g. a REST interface) to read network state and to tell it what to do.
SDN controller | A network operating system with three layers: an **interface layer** to the applications (northbound API), a **network-wide state-management layer** (link, switch and host state, flow tables; a distributed database), and a **communication layer** to the switches (southbound API, e.g. **OpenFlow**).
Data-plane switches | Simple, fast packet-forwarding devices (“white boxes”) that implement generalised forwarding in hardware, with flow tables computed and installed by the controller.
:::

### OpenFlow messages (southbound)

| Direction | Message | Purpose |
|---|---|---|
| Controller → switch | Configuration | Query and set a switch's configuration parameters |
| Controller → switch | Modify-state | Add, delete or modify entries in the switch's flow table, and set port properties |
| Controller → switch | Read-state | Collect statistics and counter values from the flow table and ports |
| Controller → switch | Send-packet | Send a specific packet out of a specified port |
| Switch → controller | Flow-removed | Tell the controller a flow-table entry was removed (timeout or modify-state) |
| Switch → controller | Port-status | Tell the controller of a change in port status (e.g. a link going down) |
| Switch → controller | Packet-in | Send a packet that doesn't match any flow-table entry to the controller for processing |

### Example: reacting to a link failure

:::flow
1. Detect | Switch s1 sees that its link to s2 has failed and sends an OpenFlow **port-status** message to the controller.
2. Update | The controller receives it and updates its link-state information.
3. Notify | The Dijkstra routing application, registered to be told of link-state changes, is notified.
4. Recompute | It reads the link-state database and computes new least-cost paths.
5. Install | It asks the flow-table computation component, which uses the controller's southbound side to send **modify-state** messages that update the flow tables in every affected switch.
:::

Examples of SDN controllers: **OpenDaylight (ODL)** and **ONOS**. Google uses SDN in its B4 wide-area network and in its data centres.

## Traditional per-router control vs SDN

| Aspect | Traditional (per-router) control plane | SDN control plane |
|---|---|---|
| Where control logic resides | **In every router**: each runs routing protocols (OSPF, BGP) | In a **logically centralised remote controller** |
| How forwarding tables are computed | Distributed: routers exchange messages and each computes its own table | The controller computes tables for all switches from a network-wide view |
| How tables are installed | Each router installs its own | The controller installs them in switches via OpenFlow |
| Forwarding basis | Destination IP address (longest prefix match) | Any header fields (flow-based, match-plus-action) |
| Changing behaviour | Reconfigure many boxes; vendor-specific; slow | Change software on the controller; programmable |
| Hardware | Integrated, proprietary routers (vertical) | Simple commodity switches; open interfaces (horizontal) |

**Advantages of a centralised, programmable control plane** ({{paper:20CYS303 End 2025 Q10(c)}}):

- **Easier network management** and fewer misconfigurations: the whole network's behaviour is set in one place, with a global view.
- **Programmability and innovation**: new control functions (traffic engineering, load balancing, access control) are just new applications; no need to wait for router vendors.
- **Fine-grained, flexible traffic engineering**: flows can be routed by any header field, not just destination, so traffic can be split or steered in ways OSPF/BGP can't express.
- **Open, vendor-neutral** interfaces and cheaper commodity switches.

**Challenges**: the controller must be robust, scalable and secure (a logically central point of failure and attack), and must be distributed across servers while appearing centralised.

:::exam Exam focus
- {{paper:20CYS303 End 2024 Q8}}: explain SDN, its features, and how it differs from traditional routers.
- {{paper:20CYS303 End 2025 Q10}}: traditional vs SDN control plane; the three layers (planes); roles of the southbound (OpenFlow) and northbound APIs; three advantages.
:::

:::rev Quick revision
- Four characteristics: flow-based forwarding, data/control plane separation, control external to switches, programmable network.
- Three layers: applications → (northbound API) → controller → (southbound API, OpenFlow) → switches.
- OpenFlow: configuration, modify-state, read-state, send-packet; flow-removed, port-status, packet-in.
- Controllers: OpenDaylight, ONOS.
:::

@@topic u2-multicast | II.21 | Broadcast and multicast routing | Delivering one packet to every node (broadcast) or to a group (multicast): N-way unicast, flooding and its storms, sequence-number-controlled flooding, reverse path forwarding and spanning trees; IGMP, group-shared and source-based multicast trees, DVMRP and PIM. | {{gap:Kurose 6th ed. §4.7}} Not in Kurose 8e or your slides; no past question found

:::note Source note
Broadcast and multicast routing is on your syllabus, but it is not in Kurose's 8th edition, your slides, or any uploaded question paper. It is taught here from the treatment in earlier editions of Kurose & Ross (Section 4.7). Expect, at most, a short definition or comparison question.
:::

## Broadcast routing

In **broadcast routing**, the network layer delivers a packet from a source node to **all** other nodes in the network.

### N-way unicast

The simplest approach: the source makes \(N\) copies and sends one to each destination with ordinary unicast routing. Drawbacks: **inefficient** (if the source has one link to the network, N copies cross that same link; better to send one copy and let routers copy it); the source must **know the address of every recipient**; and broadcast is often needed to build unicast routes in the first place (e.g. link-state advertisements), so relying on unicast is circular.

### Uncontrolled flooding

The source sends a copy to all its neighbours; each node that receives a broadcast packet **duplicates it and forwards it to all its neighbours** (except the one it came from). If the graph has cycles, copies circulate forever, and nodes with more than two neighbours create ever more copies: a **broadcast storm** that makes the network useless.

### Controlled flooding

- **Sequence-number-controlled flooding**: the source puts its address and a **broadcast sequence number** in the packet. Each node keeps a list of the (source, sequence number) pairs it has already received and forwarded. When a packet arrives, the node checks the list; if it has seen it, it drops it; otherwise it records it and forwards it to all neighbours except the one it came from. Gnutella used this.
- **Reverse path forwarding (RPF)** (also called reverse path broadcast): when a router receives a broadcast packet with a given source, it forwards it on all its outgoing links (except the receiving one) **only if the packet arrived on the link that is on its own shortest (unicast) path back to the sender**. Otherwise it discards the packet. RPF needs only the unicast routing information the router already has.

:::graph Reverse path forwarding: thick links are the unicast shortest paths back to source A. Router C accepts A's packet only from B (its path to A), and discards the copy arriving from D.
A 60 120 hl
B 200 40 node
C 360 40 node
D 200 200 node
E 360 200 node
F 500 120 node
A-B *
A-D *
B-C *
D-E *
C-F *
B-D
C-E
E-F
:::

### Spanning-tree broadcast

RPF still sends some redundant packets. Ideally every node receives **exactly one** copy. A **spanning tree** of the graph contains every node and no cycles; if each node forwards only along the spanning tree, each node gets one copy. With a **minimum spanning tree**, the total cost is also minimal. A common way to build one is the **center-based** approach: a centre node is chosen; each node sends a tree-join message (by unicast) towards the centre, which travels until it reaches a node already on the tree; the path it took is grafted onto the tree.

## Multicast routing

In **multicast**, a packet is delivered to only a **subset** of nodes: the members of a **multicast group**. Applications include software updates to many hosts, streaming to many viewers, shared data and multiplayer games.

- **Addressing**: a multicast packet carries a **multicast group address** (class D addresses, 224.0.0.0 to 239.255.255.255), an indirection: senders address the group, and the network delivers copies to all members.
- **IGMP (Internet Group Management Protocol)** runs between a host and its **directly attached router**: it lets a host tell the router it wants to join (or leave) a group. Messages: **membership_query** (router to hosts: which groups have you joined?), **membership_report** (host to router: I belong to this group), and **leave_group** (optional). IGMP uses **soft state**: membership is removed by timeout if reports stop.
- **Multicast routing protocols** then coordinate the routers across the network so the packets reach all the routers with attached group members.

### Two approaches to building multicast trees

| Group-shared tree | Source-based trees |
|---|---|
| **One tree** for the whole group, used by all senders | **A separate tree for each sender** in the group |
| Built by the **center-based** approach: a centre (core or rendezvous point) and join messages unicast towards it | Built with **RPF** (from each source), plus **pruning** |
| Fewer trees to maintain | Paths are shortest from each source; more state |

With RPF for multicast, routers with no attached group members would still receive unwanted packets, so a router with no members downstream sends a **prune** message upstream; pruned branches stop receiving the group's packets (until they time out or a member joins).

### Protocols

| Protocol | Approach |
|---|---|
| **DVMRP** (Distance Vector Multicast Routing Protocol) | Source-based trees with RPF and pruning; “flood and prune” |
| **PIM dense mode** | Flood-and-prune RPF, like DVMRP; for groups with members on most routers |
| **PIM sparse mode** | A center-based approach with a **rendezvous point**; routers send join messages towards it; for groups with few, scattered members |
| **MOSPF** | Multicast extension of OSPF, using its link-state database |
| Inter-domain | BGP multicast extensions (MBGP) |

| Unicast | Broadcast | Multicast |
|---|---|---|
| One source → one destination | One source → all nodes | One source (or several) → a group of interested nodes |
| Normal IP addresses | Limited broadcast address 255.255.255.255 (on a subnet) | Class D group addresses, IGMP for membership |
| Example: web browsing | Example: DHCP discover, ARP request | Example: IPTV, software distribution |

:::rev Quick revision
- Broadcast: N-way unicast (wasteful); uncontrolled flooding (broadcast storms); sequence-number-controlled flooding; RPF; spanning tree (center-based).
- Multicast: class D group address; IGMP host↔router (query, report, leave; soft state); group-shared (center-based, RP) vs source-based (RPF + pruning) trees; DVMRP, PIM dense/sparse.
:::

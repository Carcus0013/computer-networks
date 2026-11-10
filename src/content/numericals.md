@@section numericals | Important numericals | Every numerical type, with a step-by-step solver | Each solver below lays its answer out exactly as you should in the exam: Given → Required → Formula → Substitution → Calculation → Final answer. The default values are taken from your past papers or the textbook, so pressing “Solve step by step” first reproduces a known answer. | Important numericals

## How to attack any numerical

:::flow
1. List the givens | Write every value with its unit. Convert at once: bytes → bits (× 8), km → m, ms → s, Mbps → bps.
2. Name the target | Write what is required, in which unit.
3. Pick the formula | Write it symbolically before substituting. This alone earns marks.
4. Substitute | Put the numbers in, keeping units visible.
5. Calculate | Show intermediate values (each link's delay, each partial sum, each table row).
6. Box the answer | With the unit, and one sentence of interpretation (“propagation dominates”, “packet switching is faster”).
:::

## Formula sheet by topic

| Topic | Formula | Where taught |
|---|---|---|
| Transmission delay | \(d_{trans} = L/R\) | [I.6](#u1-delay) |
| Propagation delay | \(d_{prop} = d/s\) | [I.6](#u1-delay) |
| Nodal delay | \(d_{proc} + d_{queue} + d_{trans} + d_{prop}\) | [I.6](#u1-delay) |
| Traffic intensity | \(La/R \le 1\) | [I.6](#u1-delay) |
| End-to-end, N identical links | \(N(d_{proc} + L/R + d/s)\) | [I.6](#u1-delay) |
| P packets, store-and-forward | \((N + P - 1)L/R\) | [I.3](#u1-core) |
| Throughput | \(\min(R_1, \dots, R_N)\); shared link \(R/k\) | [I.6](#u1-delay) |
| Circuit rate | \(R/\text{slots}\) | [I.3](#u1-core) |
| Binomial (packet switching users) | \(\binom{N}{n}p^n(1-p)^{N-n}\) | [I.3](#u1-core) |
| Mesh links | \(n(n-1)/2\) | [I.4](#u1-topology) |
| HTTP non-persistent | \(2\,\text{RTT} + t\) per object | [I.10](#u1-http) |
| Cache average delay | \(h\,d_{cache} + (1-h)\,d_{origin}\) | [I.10](#u1-http) |
| Client-server distribution | \(\max\{NF/u_s,\ F/d_{min}\}\) | [I.14](#u1-p2p) |
| P2P distribution | \(\max\{F/u_s,\ F/d_{min},\ NF/(u_s + \sum u_i)\}\) | [I.14](#u1-p2p) |
| Stop-and-wait utilisation | \((L/R)/(\text{RTT} + L/R)\); window N: \(\times N\) | [II.5](#u2-rdt), [II.6](#u2-pipelining) |
| GBN / SR windows | \(N \le 2^k - 1\) / \(N \le 2^{k-1}\) | [II.6](#u2-pipelining) |
| EstimatedRTT | \((1-\alpha)E + \alpha S\), \(\alpha = 0.125\) | [II.8](#u2-rtt) |
| DevRTT | \((1-\beta)D + \beta\lvert S - E\rvert\), \(\beta = 0.25\) | [II.8](#u2-rtt) |
| Timeout | \(E + 4D\) | [II.8](#u2-rtt) |
| Receive window | \(\text{RcvBuffer} - (\text{LastByteRcvd} - \text{LastByteRead})\) | [II.9](#u2-tcp-rdt) |
| TCP rate | \(\text{cwnd}/\text{RTT}\); average \(0.75W/\text{RTT}\) | [II.12](#u2-tcp-cc) |
| WFQ share | \(R \cdot w_i / \sum w_j\) | [II.15](#u2-router) |
| Block size | \(2^{32-n}\) addresses, \(2^{32-n} - 2\) hosts | [II.17](#u2-addressing) |
| Fragment offset | first data byte / 8 | [II.16](#u2-ip) |
| Bellman-Ford | \(d_x(y) = \min_v\{c(x,v) + d_v(y)\}\) | [II.18](#u2-routing) |
| CRC | \(R = \text{rem}(D \cdot 2^r / G)\) | [III.2](#u3-error-detect) |
| Slotted / pure ALOHA | \(Np(1-p)^{N-1}\) / \(Np(1-p)^{2(N-1)}\); max \(1/e\), \(1/2e\) | [III.4](#u3-mac) |
| CSMA/CD backoff | \(K \in \{0..2^n - 1\}\), wait \(K \times 512\) bit times | [III.4](#u3-mac) |
| Minimum frame | \(L_{min} = 2\,d_{prop}\,R\) | [III.4](#u3-mac) |
| Frequency, period, wavelength | \(f = 1/T\), \(\lambda = c/f\) | [III.9](#u3-signals) |
| Bits per level | \(\log_2 L\) | [III.9](#u3-signals) |
| Baud rate | \(S = c \cdot N / r\) | [III.10](#u3-datacomm) |
| Decibels | \(10\log_{10}(P_2/P_1)\); voltage \(20\log_{10}\) | [III.13](#u3-attenuation) |
| SNR | \(P_s/P_n\); \(10\log_{10}\text{SNR}\) dB | [III.14](#u3-snr) |
| Nyquist | \(2B\log_2 L\) | [III.14](#u3-snr) |
| Shannon | \(B\log_2(1 + \text{SNR})\) | [III.14](#u3-snr) |

## Unit I solvers

:::html
<div class="solver" data-solver="delay"></div>
<div class="solver" data-solver="throughput"></div>
<div class="solver" data-solver="segment"></div>
<div class="solver" data-solver="circuit"></div>
<div class="solver" data-solver="http"></div>
<div class="solver" data-solver="p2p"></div>
:::

## Unit II solvers

:::html
<div class="solver" data-solver="util"></div>
<div class="solver" data-solver="rtt"></div>
<div class="solver" data-solver="tcpseq"></div>
<div class="solver" data-solver="checksum"></div>
<div class="solver" data-solver="subnet"></div>
<div class="solver" data-solver="frag"></div>
:::

The congestion window and routing-algorithm numericals need a full table, so they have their own simulators: the [TCP congestion window simulator](visualizations/tcp/congestion.html) builds the round-by-round cwnd/ssthresh table for any events, and the [routing visualizer](visualizations/routing/index.html) builds the Dijkstra table and the distance-vector tables for any network you type in.

## Unit III solvers

:::html
<div class="solver" data-solver="crc"></div>
<div class="solver" data-solver="aloha"></div>
<div class="solver" data-solver="baud"></div>
<div class="solver" data-solver="db"></div>
<div class="solver" data-solver="shannon"></div>
:::

:::exam Three numericals per topic
Every major numerical topic has at least three worked examples of increasing difficulty in its lesson: delay ([I.6](#u1-delay): seven worked problems), switching ([I.3](#u1-core)), HTTP timing ([I.10](#u1-http): six), P2P ([I.14](#u1-p2p): three), checksum ([II.3](#u2-udp): four), RTT ([II.8](#u2-rtt): three), cwnd ([II.12](#u2-tcp-cc): four), GBN/SR ([II.6](#u2-pipelining): four), subnetting ([II.17](#u2-addressing): six), fragmentation ([II.16](#u2-ip): three), routing ([II.18](#u2-routing): four), CRC ([III.2](#u3-error-detect): five), ALOHA/backoff ([III.4](#u3-mac): five), decibels ([III.13](#u3-attenuation): four) and Nyquist/Shannon ([III.14](#u3-snr): six).
:::

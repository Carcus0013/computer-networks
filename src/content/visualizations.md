@@section viz | Interactive visualizations | Simulators and animations | Seventeen interactive pages. The timeline simulators all share the same controls: Play / Pause, Previous step, Next step, Reset and a speed selector, plus keyboard shortcuts (Space, ←, →, R), and an explanation of every step alongside the animation. | Interactive visualizations

## Transport layer (the most important ones)

:::html
<div class="gallery">
<a href="visualizations/rdt/index.html"><span class="g-k">II.5 · Reliable data transfer</span><span class="g-t">RDT simulator: rdt1.0 → rdt3.0</span><span class="g-d">Real FSM simulation of every version. Corrupted packets, corrupted ACKs and NAKs, lost packets, lost ACKs, premature timeouts, duplicates, or your own fault list. Sender and receiver FSM states highlighted at every step.</span></a>
<a href="visualizations/tcp/sliding-window.html"><span class="g-k">II.6 · Pipelining</span><span class="g-t">Go-Back-N vs Selective Repeat</span><span class="g-d">Windows sliding, cumulative vs individual ACKs, one timer vs per-packet timers. Presets from your papers (every 6th lost, frames 4 and 7 lost).</span></a>
<a href="visualizations/tcp/connection.html"><span class="g-k">II.7, II.9, II.10 · TCP</span><span class="g-t">TCP connection simulator</span><span class="g-d">Three-way handshake, byte-stream sequence and ACK numbers, receive-window flow control with zero-window probes, fast retransmit, and the four-segment close with TIME_WAIT.</span></a>
<a href="visualizations/tcp/rtt.html"><span class="g-k">II.8 · Timeout</span><span class="g-t">RTT and timeout visualizer</span><span class="g-d">Watch SampleRTT being measured; edit the samples and see EstimatedRTT, DevRTT and TimeoutInterval recomputed in a table and chart, with premature timeouts flagged.</span></a>
<a href="visualizations/tcp/congestion.html"><span class="g-k">II.12 · Congestion control</span><span class="g-t">Congestion window simulator</span><span class="g-d">Slow start, congestion avoidance, fast recovery, timeouts; Tahoe vs Reno; animated graph plus the exam-style round table.</span></a>
</div>
:::

## Application layer

:::html
<div class="gallery">
<a href="visualizations/application/http.html"><span class="g-k">I.10 · HTTP</span><span class="g-t">HTTP request–response timing</span><span class="g-d">DNS, handshakes and GETs for non-persistent, parallel, persistent and pipelined modes, with the total time added up.</span></a>
<a href="visualizations/dns/index.html"><span class="g-k">I.13 · DNS</span><span class="g-t">DNS resolution</span><span class="g-d">Host, local DNS, root, TLD and authoritative servers; iterative vs recursive; cached TLD or cached answer; records returned and delay.</span></a>
<a href="visualizations/application/email.html"><span class="g-k">I.12 · Email</span><span class="g-t">Email delivery</span><span class="g-d">Gmail to Yahoo: submission, DNS MX lookup, the full SMTP dialogue, retry when the server is down, and retrieval with IMAP, POP3 or HTTP.</span></a>
<a href="visualizations/application/ftp.html"><span class="g-k">I.11 · FTP</span><span class="g-t">FTP connections</span><span class="g-d">Control connection on port 21, a new data connection per file, active vs passive, and what a firewall blocks.</span></a>
<a href="visualizations/application/p2p.html"><span class="g-k">I.14 · P2P</span><span class="g-t">Client-server vs P2P calculator</span><span class="g-d">All the lower bounds, which one decides, and a chart of both architectures as N grows.</span></a>
</div>
:::

## Network core and network layer

:::html
<div class="gallery">
<a href="visualizations/core/switching.html"><span class="g-k">I.3, I.6 · Core</span><span class="g-t">Packet vs circuit switching</span><span class="g-d">Space–time diagram of store-and-forward packets (transmission bands and propagation slopes) against a reserved FDM/TDM circuit.</span></a>
<a href="visualizations/routing/index.html"><span class="g-k">II.18 · Routing</span><span class="g-t">Routing visualizer</span><span class="g-d">Dijkstra step by step, synchronous distance vector with link-cost changes, count-to-infinity and poisoned reverse, and hop-by-hop forwarding.</span></a>
</div>
:::

## Link and physical layers

:::html
<div class="gallery">
<a href="visualizations/link/error-detection.html"><span class="g-k">III.2 · Error detection</span><span class="g-t">CRC, parity and checksum workbench</span><span class="g-d">Full CRC long division, clickable 2-D parity grid that locates and corrects single-bit errors, and the Internet checksum with wraparound.</span></a>
<a href="visualizations/link/multiple-access.html"><span class="g-k">III.4 · MAC protocols</span><span class="g-t">Multiple access simulator</span><span class="g-d">Slotted ALOHA, pure ALOHA and CSMA/CD with jam and binary exponential backoff; measured vs theoretical efficiency.</span></a>
<a href="visualizations/link/arp.html"><span class="g-k">III.5 · ARP</span><span class="g-t">ARP and addresses across subnets</span><span class="g-d">ARP broadcast and reply, and the MAC and IP addresses in every frame as a datagram crosses a router.</span></a>
<a href="visualizations/link/switch.html"><span class="g-k">III.7 · Switches</span><span class="g-t">Self-learning switch</span><span class="g-d">Learn, flood, filter and forward with one switch or two interconnected switches; tables update frame by frame.</span></a>
<a href="visualizations/physical-layer/index.html"><span class="g-k">III.9–III.14 · Physical</span><span class="g-t">Physical-layer studio</span><span class="g-d">Draw any bit stream in nine line codes; Nyquist, Shannon, decibel and SNR calculators with full working.</span></a>
</div>
:::

:::note Working offline
Every simulator runs locally from your disk with no server. Only the fonts (Google Fonts) and the equation renderer (MathJax) load from the Internet; without a connection the pages still work, with system fonts and equations shown as plain TeX.
:::

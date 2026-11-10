@@group Physical layer
@@topic u3-signals | III.9 | Analog and digital signals | What a signal is, the three properties of a sine wave, the time and frequency domains, composite signals and bandwidth, and digital signals: levels, bit rate, bit length, and baseband versus broadband transmission. | Forouzan §3.1–3.3 (3.3 prescribed) · PhysicalLayer ppt

## Data and signals

To be transmitted, data must be transformed into **electromagnetic signals**. Both data and signals can be **analog** or **digital**.

- **Analog data** takes continuous values (a human voice: as you speak, an analog wave is created in the air). **Digital data** takes discrete values (data stored in memory as 0s and 1s).
- An **analog signal** has infinitely many levels of intensity over a period of time: as it moves from value A to value B, it passes through an infinite number of values. A **digital signal** can have only a **limited number of defined values** (often just two, 0 and 1).

:::plot An analog signal (smooth) and a two-level digital signal (abrupt jumps between fixed levels) | Time | Amplitude
func Analog: 1+0.8*math.sin(2*math.pi*x/4) ; 0 12
series Digital step: 0,0.2 2,1.8 4,0.2 5,1.8 8,0.2 9,1.8 10,0.2 12,0.2
ymax 2.2
:::

| | Analog signal | Digital signal |
|---|---|---|
| Values | Infinitely many, continuous | A limited set of discrete levels |
| Change | Smooth | Jumps abruptly between levels |
| Example | Voice over an old telephone line, AM/FM radio | Data on an Ethernet cable, a USB link |
| Effect of noise | Noise becomes part of the signal and can't be removed | Can be **regenerated** exactly as long as levels are distinguishable |
| Typical channel | Band-pass (a range of frequencies) | Low-pass (from 0 up to some frequency) |

Signals can also be **periodic** (a pattern repeats every period) or **nonperiodic** (no repeating pattern). In data communications, we commonly use **periodic analog signals** and **nonperiodic digital signals**.

## Periodic analog signals: the sine wave

The sine wave is the most fundamental periodic analog signal. It is described by three characteristics:

| Characteristic | Meaning | Unit |
|---|---|---|
| **Peak amplitude** | The absolute value of its highest intensity (proportional to the energy it carries); for electric signals, in volts | V |
| **Frequency** \(f\) | The number of periods in 1 second | Hertz (Hz) |
| **Period** \(T\) | The time to complete one cycle | Seconds |
| **Phase** | The position of the waveform relative to time 0 | Degrees or radians (360° = 2π rad) |

:::fx Frequency, period and wavelength
\[ f = \frac{1}{T} \qquad T = \frac{1}{f} \qquad \lambda = \frac{c}{f} = c \times T \]
\(\lambda\) is the **wavelength**: the distance a simple signal travels in one period, where \(c\) is the propagation speed (\(3 \times 10^8\) m/s in a vacuum).
:::

- Frequency is the rate of change with respect to time: a change in a short span means high frequency; a change over a long span means low frequency.
- If a signal **doesn't change at all**, its frequency is **zero**. If it changes **instantaneously**, its frequency is **infinite**.

:::plot Three sine waves: the same frequency with different amplitudes and phase, and a wave of double frequency | Time (s) | Amplitude (V)
func 5 V, 1 Hz: 5*math.sin(2*math.pi*x) ; 0 2
func 2.5 V, 2 Hz: 2.5*math.sin(2*math.pi*2*x) ; 0 2
func 5 V, 1 Hz, 90° phase: 5*math.sin(2*math.pi*x+math.pi/2) ; 0 2
ymax 6
:::

(Only the positive half is shown on this axis; a full sine wave swings between +A and −A.)

### Time domain and frequency domain

The **time-domain plot** shows amplitude changes over time. A **frequency-domain plot** shows the relationship between amplitude and frequency: a single sine wave appears as one spike at its frequency, with height equal to its peak amplitude. The frequency domain is more compact, especially for signals made of many sine waves.

## Composite signals and bandwidth

A single-frequency sine wave is not useful for data communications; we need **composite signals**, made of many simple sine waves. Fourier analysis shows that **any composite signal is a combination of simple sine waves** with different frequencies, amplitudes and phases. A periodic composite signal decomposes into discrete frequencies; a nonperiodic one into a continuous range of frequencies.

:::fx Bandwidth of a composite signal
\[ B = f_{highest} - f_{lowest} \]
:::

:::ex Level 1 | Sine wave and bandwidth basics (Forouzan examples)
:::solve
Given: (a) Indian mains power has frequency 50 Hz. (b) A period of 100 ms. (c) A periodic signal is made of five sine waves of 100, 300, 500, 700 and 900 Hz. (d) A signal has bandwidth 20 Hz and highest frequency 60 Hz.
Required: (a) the period; (b) the frequency in kHz; (c) the bandwidth; (d) the lowest frequency.
Formula: \(T = 1/f\); \(f = 1/T\); \(B = f_h - f_l\).
Substitution: (a) \(1/50\). (b) \(1/0.1\). (c) \(900 - 100\). (d) \(20 = 60 - f_l\).
Calculation: (a) 0.02 s = 20 ms. (b) 10 Hz = 0.01 kHz. (c) 800 Hz. (d) \(f_l = 40\) Hz.
Answer: 20 ms; 0.01 kHz; 800 Hz; 40 Hz.
:::
:::

## Digital signals (Forouzan 3.3)

Information can also be represented by a digital signal: a 1 can be encoded as a positive voltage and a 0 as zero voltage. A digital signal can have **more than two levels**, and then each level can send **more than 1 bit**.

:::fx Bits per level
\[ \text{bits per level} = \log_2 L \]
where \(L\) is the number of levels. 2 levels → 1 bit; 4 levels → 2 bits; 8 levels → 3 bits.
:::

### Bit rate and bit length

Most digital signals are nonperiodic, so period and frequency are not appropriate. Instead:

- **Bit rate**: the number of bits sent in 1 second, in **bits per second (bps)**.
- **Bit length**: the distance one bit occupies on the transmission medium: \( \text{bit length} = \text{propagation speed} \times \text{bit duration} \).

:::ex Level 2 | Bit rates and bit lengths (Forouzan examples)
:::solve
Given: (a) A digital signal with 8 levels. (b) Download 100 pages of text per minute; each page has 24 lines of 80 characters, 8 bits per character. (c) Digitised voice: 4 kHz analog voice sampled at twice the highest frequency, 8 bits per sample. (d) HDTV: 1920 × 1080 pixels, 30 frames/s, 24 bits per pixel. (e) A 1 Mbps signal on copper with \(s = 2 \times 10^8\) m/s.
Required: (a) bits per level; (b)–(d) required bit rates; (e) bit length.
Formula: \(\log_2 L\); bit rate = items per second × bits per item; bit length = \(s \times (1/R)\).
Substitution: (a) \(\log_2 8\). (b) \(100 \times 24 \times 80 \times 8 / 60\). (c) \(2 \times 4{,}000 \times 8\). (d) \(1920 \times 1080 \times 30 \times 24\). (e) \(2 \times 10^8 \times 10^{-6}\).
Calculation: (a) 3 bits. (b) \(100 \times 24 \times 80 \times 8 = 1{,}536{,}000\) bits per minute = 25,600 bps. (c) 64,000 bps = 64 kbps. (d) 1,492,992,000 bps ≈ 1.5 Gbps (TV stations compress this to 20–40 Mbps). (e) 200 m.
Answer: 3 bits; 25.6 kbps; 64 kbps; ≈ 1.5 Gbps; each bit occupies 200 m of cable.
:::

:::note A slip in the textbook
Forouzan's printed solution to the pages example (Example 3.18) gives “100 × 24 × 80 × 8 = 1,636,000 bps = 1.636 Mbps”. The product is actually 1,536,000, and because the rate is 100 pages per **minute**, the required bit rate is 1,536,000 / 60 = 25.6 kbps. (1.536 Mbps would be the rate for 100 pages per second.) If this appears in an exam, show your working and state the time unit.
:::
:::

### A digital signal is a composite analog signal

A digital signal, with its sudden vertical jumps, is a composite analog signal with an **infinite bandwidth** (a perfect square wave needs infinitely many harmonics). So how can it be sent over a real channel? Two approaches:

| Baseband transmission | Broadband transmission (modulation) |
|---|---|
| Send the digital signal **as is**, without converting it to analog | **Modulate** the digital data onto a carrier: convert it to an analog signal |
| Needs a **low-pass channel** (bandwidth starting from 0) | Uses a **band-pass channel** (a range of frequencies not starting at 0) |
| A dedicated medium for the whole channel, e.g. a LAN cable between two computers | Lets one medium carry many channels, e.g. DSL, cable modems, radio |
| A rough approximation: to send \(N\) bps, the channel needs a bandwidth of at least about \(N/2\) Hz (first harmonic); better quality needs \(3N/2\), \(5N/2\), … | Bandwidth needed depends on the modulation |

Example: to send 1 Mbps by baseband using only the first harmonic, the channel needs at least 500 kHz; using the first and third harmonics, 1.5 MHz.

:::exam Exam focus
- Define amplitude, frequency, period, phase and wavelength; time vs frequency domain; bandwidth.
- Digital signal levels and \(\log_2 L\); bit rate and bit length numericals.
- Baseband vs broadband; why a digital signal has infinite bandwidth.
:::

:::rev Quick revision
- Analog = continuous; digital = discrete levels. Periodic vs nonperiodic.
- Sine wave: peak amplitude, frequency (\(f = 1/T\)), phase; \(\lambda = c/f\).
- Composite signals = sums of sines; bandwidth = \(f_h - f_l\).
- Digital: bits per level \(\log_2 L\); bit rate (bps); bit length = speed × bit duration.
- Baseband (low-pass, needs ≈ N/2 Hz) vs broadband (modulated, band-pass).
:::

@@topic u3-datacomm | III.10 | Data communication and line coding | The components and data-flow modes of data communication, then Forouzan's digital-to-digital conversion: line-coding characteristics (signal rate, baseline wandering, DC, self-synchronisation), every line-coding scheme with drawings, block coding (4B/5B) and scrambling (B8ZS, HDB3). | Forouzan §1.1 and §4.1 (prescribed) · PhysicalLayer-DigitalTransmission ppt

## Data communication

**Data communication** is the exchange of data between two devices via some form of transmission medium. Its effectiveness depends on four characteristics: **delivery** (to the correct destination), **accuracy** (data unaltered), **timeliness** (delivered in time; for video and audio, as produced) and **jitter** (the variation in packet arrival time, which should be low).

### The five components

| Component | Meaning | Example: a WhatsApp “Hi” |
|---|---|---|
| **Message** | The information to be communicated: text, numbers, images, audio, video | The bits for “Hi” |
| **Sender** | The device that sends the message | Your phone |
| **Receiver** | The device that receives it | Your friend's phone |
| **Transmission medium** | The physical path the message travels | Wi-Fi radio, fibre, 4G radio |
| **Protocol** | The set of rules that govern the communication | TCP/IP and WhatsApp's protocol |

### Data flow: simplex, half-duplex, full-duplex

| | Simplex | Half-duplex | Full-duplex |
|---|---|---|---|
| Directions | One only | Both, **one at a time** | Both **simultaneously** |
| Channel capacity | All in one direction | All to whichever device is sending | Shared: two physical paths, or capacity divided between directions |
| Examples | Keyboard → computer, TV broadcast | Walkie-talkie, hub-based Ethernet, Wi-Fi | Telephone call, switched full-duplex Ethernet |

:::ex From a paper | Half-duplex vs full-duplex {{paper:19CSE301 Mid 2023 Q1(a)}}
:::solve
Given: A 100 Mbps link; A must send 50 MB to B and B must send 50 MB to A (1 MB = 10⁶ bytes).
Required: The total time in half-duplex and in full-duplex mode, to show the difference with numbers.
Formula: Time = L/R per direction; half-duplex adds the directions; full-duplex overlaps them.
Substitution: \(L = 50 \times 10^6 \times 8 = 4 \times 10^8\) bits; \(L/R = 4 \times 10^8 / 10^8\).
Calculation: One direction = 4 s. Half-duplex = 4 + 4 = 8 s. Full-duplex = 4 s.
Answer: In half-duplex both stations can send but not at the same time, so the transfers take 8 s; in full-duplex both send simultaneously, finishing in 4 s.
:::
:::

## Line coding: digital-to-digital conversion

**Line coding** is the process of converting **digital data to digital signals**. Data (text, numbers, images, audio, video) stored in a computer as sequences of bits is converted at the sender into a digital signal; at the receiver the digital data is recreated by decoding the signal.

### Data elements, signal elements and rates

- A **data element** is the smallest entity that can represent information: a **bit**. A **signal element** is the shortest unit (timewise) of a digital signal. Data elements are what we need to send; signal elements are what we can send.
- The ratio \(r\) is the number of data elements carried by each signal element.
- The **data rate** \(N\) (bit rate) is the number of data elements sent in 1 s (bps). The **signal rate** \(S\) (pulse rate, modulation rate or **baud rate**) is the number of signal elements sent in 1 s (baud). We want to increase the data rate while decreasing the signal rate (which decreases the bandwidth needed).

:::fx Baud rate and bandwidth (Forouzan)
\[ S_{avg} = c \times N \times \frac{1}{r} \ \text{baud} \qquad B_{min} = c \times N \times \frac{1}{r} \qquad N_{max} = \frac{1}{c} \times B \times r \]
\(c\) is the case factor (worst, best or average case; the average is usually taken as \(c = 1/2\)). The bandwidth (range of frequencies) is proportional to the signal rate.
:::

:::ex Level 1 | Baud rate (Forouzan Example 4.1)
:::solve
Given: A signal carries data in which one data element is encoded as one signal element (r = 1); bit rate N = 100 kbps; c = 1/2.
Required: The average baud rate.
Formula: \(S = c \times N \times 1/r\).
Substitution: \(S = \tfrac{1}{2} \times 100{,}000 \times 1\).
Calculation: \(S = 50{,}000\).
Answer: 50 kbaud. (With r = 2, i.e. 2 bits per signal element, it would be 25 kbaud.)
:::
:::

### What a good line code needs

| Concern | Problem | What a good scheme does |
|---|---|---|
| **Baseline wandering** | The receiver decodes by comparing against a running average of the received power (the baseline). A long run of 0s or 1s shifts the baseline and makes decoding hard | Keeps the average steady |
| **DC components** | When the voltage stays constant for a while, very low frequencies (near zero) appear; channels that can't pass them (transformers, phone lines) distort the signal, and they waste energy | Has no DC component (equal positive and negative energy) |
| **Self-synchronisation** | The receiver's bit intervals must match the sender's. Without transitions, the receiver's clock drifts and it misreads bits | Includes **timing information** (transitions) in the signal itself |
| **Built-in error detection** | — | Some codes detect errors (e.g. AMI violations) |
| **Immunity to noise** | — | Levels well separated |
| **Complexity** | More levels or rules cost more | Simple where possible |

## Line-coding schemes

:::ex From a paper | NRZ-L, NRZ-I and Manchester for 0010111101000010 {{paper:23CSE302 End 2025 Q1}}
The figure below draws the paper's 16-bit stream with Forouzan's conventions: **NRZ-L**: 0 = positive level, 1 = negative level. **NRZ-I**: a 1 means invert the level at the start of the bit; a 0 means no change (starting level assumed positive). **Manchester** (IEEE 802.3, as in Forouzan): 0 = high-to-low in the middle of the bit, 1 = low-to-high.

:::wave 0010111101000010 | nrzl nrzi manchester
Bit stream 0010111101000010 in NRZ-L, NRZ-I and Manchester. Dashed lines mark bit boundaries.
:::

Some textbooks draw NRZ-L with 1 = high, or Manchester with the opposite convention (G. E. Thomas). Examiners accept either if you **state your convention** in the answer. The paper also asked for Fast Ethernet's encoding: **4B/5B with MLT-3** (100BASE-TX), see below.
:::

!!sim visualizations/physical-layer/index.html | Line-coding studio | Type any bit stream and see unipolar, NRZ-L, NRZ-I, RZ, Manchester, differential Manchester, AMI, pseudoternary and MLT-3 drawn bit by bit, with the conventions switchable. Also Nyquist, Shannon and decibel calculators.

### Unipolar scheme

All signal levels are on one side of the time axis. **Unipolar NRZ** (non-return-to-zero): 1 = positive voltage, 0 = zero voltage; the signal doesn't return to zero in the middle of the bit. It is **costly**: its normalised power (power needed per unit line resistance) is double that of polar NRZ. Normally not used in data communications today.

### Polar schemes

The voltages are on **both sides** of the time axis.

- **NRZ-L (NRZ-Level)**: the **level** of the voltage determines the bit value (Forouzan: 0 positive, 1 negative).
- **NRZ-I (NRZ-Invert)**: the **change or lack of change** in level determines the bit: if there is **no change**, the bit is **0**; if there is a **change** (inversion), the bit is **1**.

Both NRZ schemes have average signal rate **N/2** baud. Both have a **DC component** problem. NRZ-L suffers baseline wandering and loss of synchronisation for long runs of **0s or 1s**; NRZ-I only for long runs of **0s** (a run of 1s produces transitions). A sudden change of polarity (e.g. twisted-pair wires swapped) inverts all NRZ-L bits, but NRZ-I is immune to it.

- **RZ (return-to-zero)**: uses three values (positive, negative, zero). The signal changes **in the middle of the bit** to zero and stays there until the next bit: 1 = positive then zero, 0 = negative then zero. It provides synchronisation, but needs **two signal changes per bit**, so more bandwidth, and three levels are more complex. Not used today; replaced by Manchester.

:::wave 01001110 | nrzl nrzi rz
Polar NRZ-L, NRZ-I and RZ for 01001110 (Forouzan's example data).
:::

### Biphase: Manchester and differential Manchester

- **Manchester** combines RZ (transition in the middle of the bit) and NRZ-L: the bit duration is divided into two halves; the voltage stays at one level in the first half and moves to the other in the second. **The transition in the middle of every bit provides synchronisation.**
- **Differential Manchester** combines RZ and NRZ-I: there is **always** a transition in the middle of the bit, but the bit value is determined at the **beginning** of the bit: if the next bit is **0**, there is a transition at the start; if it is **1**, there is none.

Both overcome NRZ-L's and NRZ-I's problems: **no baseline wandering, no DC component**, and **self-synchronising**. The cost: the minimum bandwidth is **twice** that of NRZ (signal rate N baud). **Manchester is used in 10 Mbps Ethernet** (10BASE-T); **differential Manchester in token ring** LANs.

:::wave 01001110 | manchester diffman
Manchester and differential Manchester for 01001110.
:::

### Bipolar (multilevel binary) schemes

Three voltage levels: positive, negative and zero.

- **AMI (alternate mark inversion)**: binary **0** = **zero** voltage; binary **1** = **alternating** positive and negative voltages.
- **Pseudoternary**: the reverse: 1 = zero voltage, 0 = alternating positive and negative.

Bipolar coding has the same signal rate as NRZ (N/2) but **no DC component** (positive and negative 1s cancel). A long run of 0s in AMI still loses synchronisation, which **scrambling** fixes. A violation of the alternation rule indicates an error, giving simple error detection.

:::wave 01001110 | ami pseudo
Bipolar AMI and pseudoternary for 01001110.
:::

### Multilevel schemes

These increase the number of bits per baud by encoding a pattern of \(m\) data elements into a pattern of \(n\) signal elements with \(L\) levels (**mBnL** coding; B = binary, T = ternary, Q = quaternary).

- **2B1Q** (two binary, one quaternary): 2 bits per signal element, four levels; signal rate **N/4**. Used in DSL technology.
- **8B6T** (eight binary, six ternary): 8 bits encoded as 6 ternary signal elements; used in 100BASE-4T.
- **4D-PAM5** (four-dimensional five-level pulse amplitude modulation): used in Gigabit Ethernet over four twisted pairs.

### Multitransition: MLT-3

**MLT-3** (multiline transmission, three level) uses three levels (+V, 0, −V) and three rules: if the next bit is **0**, there is **no transition**; if the next bit is **1** and the current level is not 0, the next level is 0; if the next bit is **1** and the current level is 0, the next level is the opposite of the last nonzero level. In effect, each 1 moves the signal one step around the cycle 0 → +V → 0 → −V → 0. Its signal rate is about **N/3**, so it suits 100 Mbps on copper together with 4B/5B (100BASE-TX).

:::wave 01001110 | mlt3
MLT-3 for 01001110.
:::

### Summary of line-coding schemes (Forouzan Table 4.1)

| Category | Scheme | Bandwidth (average) | Characteristics |
|---|---|---|---|
| Unipolar | NRZ | B = N/2 | Costly, no self-synchronisation for long 0s or 1s, DC |
| Polar | NRZ-L | B = N/2 | No self-synchronisation for long 0s or 1s, DC |
| Polar | NRZ-I | B = N/2 | No self-synchronisation for long 0s, DC |
| Polar | Biphase (Manchester, differential Manchester) | B = N | Self-synchronisation, no DC, high bandwidth |
| Bipolar | AMI | B = N/2 | No self-synchronisation for long 0s, DC-free |
| Multilevel | 2B1Q | B = N/4 | No self-synchronisation for long runs of the same double bits |
| Multilevel | 8B6T | B = 3N/4 | Self-synchronisation, no DC |
| Multilevel | 4D-PAM5 | B = N/8 | Self-synchronisation, no DC |
| Multiline | MLT-3 | B = N/3 | No self-synchronisation for long 0s |

## Block coding: 4B/5B

We need **redundancy** to ensure synchronisation and to detect errors. **Block coding** changes a block of \(m\) bits into a block of \(n\) bits (\(n > m\)): **mB/nB**. It is done in three steps: divide the stream into m-bit groups, substitute each m-bit group with an n-bit group from a table, and line-code the result.

**4B/5B** is designed to be used with NRZ-I. NRZ-I has good signal rate but loses synchronisation on long runs of 0s. 4B/5B replaces each 4-bit group with a 5-bit code chosen so that **no code has more than one leading 0 and no more than two trailing 0s**; so in any sequence of codes there are **never more than three consecutive 0s**, and NRZ-I stays synchronised. The cost: 5 bits are sent for every 4, so the signal rate rises by 25%: 100 Mbps of data needs 125 Mbps (125 Mbaud with NRZ-I). Unused 5-bit codes serve as control codes and error detection.

| Data (4B) | Code (5B) | Data | Code |
|---|---|---|---|
| 0000 | 11110 | 1000 | 10010 |
| 0001 | 01001 | 1001 | 10011 |
| 0010 | 10100 | 1010 | 10110 |
| 0011 | 10101 | 1011 | 10111 |
| 0100 | 01010 | 1100 | 11010 |
| 0101 | 01011 | 1101 | 11011 |
| 0110 | 01110 | 1110 | 11100 |
| 0111 | 01111 | 1111 | 11101 |

## Scrambling: B8ZS and HDB3

Biphase schemes are unsuitable for long-distance links because of their wide bandwidth, and AMI loses synchronisation on long runs of 0s. **Scrambling** modifies AMI without increasing the bit count, substituting long zero-level pulses with a combination of other levels during encoding:

- **B8ZS (bipolar with 8-zero substitution)**, used in North America: eight consecutive zero-level voltages are replaced by **000VB0VB**, where **V** is a **violation** (a nonzero voltage that breaks the AMI rule: the same polarity as the previous nonzero pulse) and **B** is a normal **bipolar** pulse (following the AMI rule). The receiver recognises the violation pattern and restores the 8 zeros.
- **HDB3 (high-density bipolar 3-zero)**, used outside North America: four consecutive zeros are replaced by **000V** or **B00V**: if the number of nonzero pulses since the last substitution is **odd**, use 000V; if **even**, use B00V. This keeps the number of positive and negative pulses balanced (no DC).

:::exam Exam focus
- {{paper:23CSE302 End 2025 Q1}} (your own course): draw NRZ, NRZ-I and Manchester for a given bit stream and name the encoding for Fast Ethernet. State your conventions, mark bit boundaries, and label voltage levels.
- Know which schemes are self-synchronising and DC-free, and each scheme's bandwidth (Table 4.1).
- Signal rate vs data rate and the formula \(S = c \times N / r\).
- The five components and the three data-flow modes (2-mark definitions; {{paper:19CSE301 Mid 2023 Q1(a)}}).
:::

:::mistake Common mistakes
- In NRZ-I, encoding a 1 as “high”. A 1 means **change**; a 0 means **no change**.
- In Manchester, forgetting the transition in the **middle** of every bit.
- In differential Manchester, putting the extra transition at the start for a 1 instead of a 0.
- Not stating the assumed starting level for NRZ-I, differential Manchester and AMI.
:::

:::rev Quick revision
- Data communication: 5 components; delivery, accuracy, timeliness, jitter; simplex, half-duplex, full-duplex.
- Data element vs signal element; \(S = c \cdot N / r\) baud; bandwidth ∝ signal rate.
- Concerns: baseline wandering, DC, self-synchronisation, error detection, noise immunity, complexity.
- NRZ-L (level), NRZ-I (1 = invert), RZ, Manchester (mid-bit transition; Ethernet), differential Manchester (0 = transition at start; token ring), AMI (1s alternate), pseudoternary, 2B1Q, 8B6T, 4D-PAM5, MLT-3.
- 4B/5B (≤ 3 consecutive 0s, +25% rate); B8ZS (000VB0VB), HDB3 (000V / B00V).
:::

@@topic u3-media | III.11 | Transmission media and their characteristics | Guided media (twisted pair, coaxial cable, optical fibre) and unguided media (radio, microwave, infrared, satellite): how each works, its characteristics, and how they compare. | Kurose §1.2.2 (prescribed) · Chapter_1_v8.2 slides 24–25 · background from Forouzan Ch 7

## Guided and unguided media

A bit travelling from one end system to another passes through a series of transmitter–receiver pairs. For each pair, the bit is sent as electromagnetic waves or optical pulses across a **physical medium**.

- **Guided media**: the waves are guided along a **solid medium**: twisted-pair copper, coaxial cable, optical fibre.
- **Unguided media**: the waves propagate **in the atmosphere and in outer space**: wireless LANs, cellular, satellite channels.

The actual cost of a physical link (copper wire, fibre) is often small compared with other networking costs; the **labour cost of installation** can be orders of magnitude higher, so builders often install twisted pair, fibre and coax in every room of a new building.

## Twisted-pair copper wire

The least expensive and most commonly used guided medium, used for over a hundred years by telephone networks (more than 99% of the wired connections from a telephone handset to the local switch).

- Two insulated copper wires, each about 1 mm thick, arranged in a regular spiral. The wires are **twisted together to reduce electrical interference** from similar pairs close by (crosstalk) and external noise: the twisting makes both wires pick up roughly the same noise, which the receiver cancels.
- A number of pairs are bundled in a cable, wrapped in a protective shield; each pair is a single communication link.
- **Unshielded twisted pair (UTP)** is common for LANs. Data rates range from 10 Mbps to 10 Gbps, depending on the wire thickness and the distance. Category 6a cable reaches **10 Gbps** at distances up to a hundred metres.
- Twisted pair is also used for residential Internet access (DSL) over the existing telephone wiring.

## Coaxial cable

- Two copper conductors that are **concentric** rather than parallel: an inner conductor, an insulating layer, an outer conductor (braided shield) and a plastic jacket.
- With this construction and special insulation, coax can achieve **high data rates**, and it is common in cable television systems.
- Coax can be used as a **guided shared medium**: many end systems can be connected directly to the cable, each receiving whatever is sent by the others (the cable modem system).

## Optical fibre

- A thin, flexible medium that conducts **pulses of light**, each pulse representing a bit. A single fibre can support enormous bit rates, **tens or even hundreds of Gbps**.
- Light stays inside the glass **core** because of total internal reflection at the boundary with the **cladding**, which has a lower refractive index.
- **Immune to electromagnetic interference**, has **very low signal attenuation up to 100 km**, and is **very hard to tap**. These characteristics make fibre the preferred **long-haul** guided medium, particularly for overseas links and the backbone of the Internet.
- The high cost of optical devices (transmitters, receivers, switches) has hindered deployment for short-haul transport such as LANs or residential access.
- Types (Forouzan): **multimode** fibre (many light beams bounce along different paths; step-index or graded-index; cheaper, shorter distances) and **single-mode** fibre (a very thin core, light travels almost straight; highest bandwidth over the longest distances).

## Terrestrial radio channels

Radio channels carry signals in the electromagnetic spectrum. They need **no physical wire**, can **penetrate walls**, provide connectivity to a **mobile** user, and can carry signals over long distances. Their characteristics depend on the propagation environment and the distance:

- **Path loss** and **shadow fading** (signal strength decreases with distance and around or through obstructing objects);
- **Multipath fading** (the signal reflects off interfering objects and arrives by several paths);
- **Interference** from other transmissions and electromagnetic signals.

Three groups: **very short distance** (a metre or two: wireless headsets, keyboards), **local area** (ten to a few hundred metres: Wi-Fi), and **wide area** (tens of kilometres: cellular access).

Forouzan's frequency-based classification:

| Kind | Frequencies | Properties | Uses |
|---|---|---|---|
| Radio waves | 3 kHz – 1 GHz | Mostly omnidirectional; penetrate walls; long range (low frequencies) | AM/FM radio, TV, cordless phones |
| Microwaves | 1 – 300 GHz | Unidirectional; need line of sight; higher frequencies can't penetrate walls | Cellular, satellite, wireless LANs, point-to-point links |
| Infrared | 300 GHz – 400 THz | Short range; can't penetrate walls (no interference between rooms) | Remote controls, short-range device links |

## Satellite radio channels

A communication satellite links two or more ground stations (microwave transmitter/receivers). It receives on one frequency band, regenerates the signal with a repeater, and transmits on another.

- **Geostationary (GEO) satellites** stay permanently above the same spot on Earth, at **36,000 km**. That distance introduces a substantial **signal propagation delay of about 280 ms**. They can still operate at hundreds of Mbps, and are used where there's no wired access.
- **Low-earth orbiting (LEO) satellites** are much closer to Earth and **don't stay above one spot**; they rotate around Earth and communicate with each other and with ground stations. Providing continuous coverage needs many of them (satellite constellations).

## Comparing the media

| Characteristic | Twisted pair | Coaxial cable | Optical fibre | Terrestrial radio | Satellite (GEO) |
|---|---|---|---|---|---|
| Signal | Electrical | Electrical | Light | Electromagnetic waves | Microwaves |
| Bandwidth / data rate | Low to medium (up to 10 Gbps short) | Medium to high | Very high (100s Gbps) | Medium | Medium to high |
| Attenuation | High; rises with frequency | Moderate | Very low (repeaters ~50 km+) | Path loss with distance | Very long path |
| Interference / noise | Susceptible (EMI, crosstalk) | Shield reduces it | Immune to EMI | Interference, fading | Weather affects some bands |
| Security (tapping) | Easy to tap | Moderate | Very hard to tap | Easy to intercept | Easy to intercept |
| Distance | ~100 m (LAN) | Hundreds of m to km | Up to 100 km without amplification | m to tens of km | Global |
| Cost | Lowest | Medium | Cable cheap, optical devices expensive | No cable | Very high |
| Typical use | LANs, DSL, telephone | Cable TV, cable Internet | Backbones, undersea, FTTH | Wi-Fi, cellular | Remote areas, broadcast |

:::exam Exam focus
- Guided vs unguided media with examples, and why twisted pair is twisted.
- The advantages and disadvantages of optical fibre.
- Satellite delay (GEO ≈ 280 ms) and LEO.
- {{paper:19CSE301 Mid 2024 Q1(e)}}: the medium connecting an Ethernet switch to end systems is twisted-pair copper (UTP).
:::

:::rev Quick revision
- Guided: twisted pair (cheap, twisted against interference, up to 10 Gbps over 100 m), coax (concentric, shared, cable TV), fibre (light, huge rates, low attenuation, EMI-immune, hard to tap).
- Unguided: terrestrial radio (path loss, fading, interference; short/local/wide area), satellite (GEO 36,000 km ≈ 280 ms; LEO).
- Installation labour usually costs more than the cable.
:::

@@topic u3-noise | III.12 | Signal and noise: transmission impairment | Why the signal at the end of a medium is not the signal that was sent: the three impairments (attenuation, distortion, noise), the kinds of noise, and how impairments limit performance. | Forouzan §3.4 (prescribed)

## Why impairment matters

Signals travel through transmission media, which are **not perfect**. The imperfection causes signal **impairment**: the signal at the beginning of the medium is not the same as the signal at the end. What is sent is not what is received. There are three causes: **attenuation, distortion and noise**.

:::graph The three causes of impairment.
src 100 60 box "Sent signal"
imp 340 60 box "Transmission medium"
dst 580 60 box "Received signal"
att 180 160 host "Attenuation"
dis 340 160 host "Distortion"
noi 500 160 host "Noise"
src>imp
imp>dst
att>imp
dis>imp
noi>imp
:::

## Attenuation

**Attenuation** means a **loss of energy**. When a signal travels through a medium, it loses some energy overcoming the resistance of the medium: that is why a wire carrying an electric signal gets warm, if not hot, after a while. Some of the electrical energy is converted to heat. To compensate, **amplifiers** are used to boost the signal. Attenuation is measured in **decibels** (Topic III.13).

## Distortion

**Distortion** means the signal **changes its form or shape**. It can occur in a composite signal made of different frequencies. Each component has its own **propagation speed** through a medium and therefore its own delay in arriving at the final destination. Differences in delay may create a difference in **phase** if the delay is not exactly the same as the period. The signal components at the receiver therefore have phases different from what they had at the sender, and the shape of the composite signal is no longer the same.

## Noise

**Noise** is another cause of impairment: unwanted energy added to the signal. Several types of noise may corrupt a signal:

| Type | Cause |
|---|---|
| **Thermal noise** | The random motion of electrons in a wire, which creates an extra signal not originally sent by the transmitter |
| **Induced noise** | Comes from sources such as motors and appliances, which act as sending antennas while the medium acts as the receiving antenna |
| **Crosstalk** | The effect of one wire on another: one wire acts as a sending antenna and the other as the receiving antenna |
| **Impulse noise** | A spike (a signal with high energy in a very short time) from power lines, lightning and so on |

The effect of noise is measured by the **signal-to-noise ratio** (Topic III.14). Noise is what makes the receiver occasionally decide a 1 was a 0, which is why the link layer adds error detection (III.2).

## Digital signals tolerate noise better

An analog signal that has picked up noise can't be cleaned: the noise is now part of the waveform, and an amplifier boosts it along with the signal. A digital signal can be **regenerated** by a repeater: as long as the receiver can still tell which level each bit was meant to be, it re-creates a perfect new signal. This is a key reason for digital transmission.

:::exam Exam focus
- Name and explain attenuation, distortion and noise, with the four kinds of noise. A common 5-mark question.
- Why amplifiers fix attenuation but not noise; why digital regeneration helps.
:::

:::rev Quick revision
- Impairments: attenuation (energy loss, amplifiers, dB), distortion (frequency components arrive with different delays/phases), noise (thermal, induced, crosstalk, impulse).
- Noise is measured by SNR; digital signals can be regenerated.
:::

@@topic u3-attenuation | III.13 | Attenuation and decibels | Measuring signal loss and gain with decibels, adding losses along a path, dBm, and voltage ratios, with step-by-step numericals. | Forouzan §3.4 (prescribed)

## The decibel

To show that a signal has lost or gained strength, engineers use the **decibel (dB)**. The decibel measures the **relative strengths of two signals**, or of one signal at two different points.

:::fx Decibels
\[ \text{dB} = 10 \log_{10} \frac{P_2}{P_1} \]
\(P_1\) and \(P_2\) are the powers of a signal at points 1 and 2. A **negative** value means the signal is **attenuated** (loss); a **positive** value means it is **amplified** (gain). In terms of voltage (since power ∝ V²):
\[ \text{dB} = 20 \log_{10} \frac{V_2}{V_1} \]
:::

Why decibels? Because they **add**: when a signal passes through several stages, the overall gain or loss is just the **sum** of the decibel values of the stages, instead of a product of ratios.

| Power ratio \(P_2/P_1\) | dB |
|---|---|
| 1/2 (half the power) | −3 dB |
| 1/10 | −10 dB |
| 2 (double) | +3 dB |
| 10 | +10 dB |
| 100 | +20 dB |
| 1,000 | +30 dB |

## dBm: absolute power

Sometimes decibels measure signal power relative to **1 milliwatt**; the unit is **dBm**:

\[ \text{dB}_m = 10 \log_{10} P_m \]

where \(P_m\) is the power in milliwatts. 1 mW = 0 dBm; 10 mW = 10 dBm; 1 µW = −30 dBm.

## Worked numericals

:::ex Level 1 | Half the power (Forouzan Example 3.26)
:::solve
Given: A signal travels through a medium and its power is reduced to one half: \(P_2 = 0.5 P_1\).
Required: The attenuation in dB.
Formula: \( \text{dB} = 10 \log_{10}(P_2/P_1) \).
Substitution: \( 10 \log_{10}(0.5\,P_1 / P_1) = 10 \log_{10} 0.5 \).
Calculation: \( \log_{10} 0.5 = -0.301 \); \( 10 \times (-0.301) = -3.01 \).
Answer: About **−3 dB**: losing half the power is a 3 dB loss.
:::
:::

:::ex Level 2 | An amplifier, then a chain of stages (Forouzan Examples 3.27–3.28)
:::solve
Given: (a) An amplifier increases the power 10 times: \(P_2 = 10 P_1\). (b) A signal passes from point 1 to point 4 through: a cable (−3 dB), an amplifier (+7 dB), another cable (−3 dB).
Required: (a) the gain in dB; (b) the overall change.
Formula: dB = 10 log₁₀(P₂/P₁); decibels add along a chain.
Substitution: (a) \(10 \log_{10} 10\). (b) \(-3 + 7 - 3\).
Calculation: (a) \(10 \times 1 = 10\) dB. (b) \(+1\) dB.
Answer: (a) **+10 dB**. (b) **+1 dB**: the signal ends up slightly stronger than it started.
:::
:::

:::ex Level 3 | Loss per kilometre and output power (Forouzan Example 3.30)
:::solve
Given: A cable loses 0.3 dB/km. A 2 mW signal enters a 5 km length.
Required: The output power, in mW and in dBm.
Formula: Total dB = loss/km × length; \(P_2 = P_1 \times 10^{\text{dB}/10}\); dBm = \(10 \log_{10} P_{mW}\).
Substitution: dB = \(-0.3 \times 5 = -1.5\). \(P_2 = 2 \times 10^{-0.15}\).
Calculation: \(10^{-0.15} = 0.708\); \(P_2 = 1.416\) mW. dBm \(= 10 \log_{10} 1.416 = 1.51\) dBm. (Check: input 2 mW = 3.01 dBm; 3.01 − 1.5 = 1.51 dBm ✓.)
Answer: About **1.42 mW**, i.e. **1.51 dBm**.
:::
:::

:::ex Level 3 | Using dBm and voltage ratios (Forouzan Example 3.29 and practice)
:::solve
Given: (a) The power of a signal is −30 dBm. (b) A voltage drops from 10 V to 5 V.
Required: (a) the power in watts; (b) the change in dB.
Formula: \(P_m = 10^{\text{dB}_m/10}\) mW; voltage dB \(= 20 \log_{10}(V_2/V_1)\).
Substitution: (a) \(10^{-30/10} = 10^{-3}\) mW. (b) \(20 \log_{10}(5/10)\).
Calculation: (a) \(10^{-3}\) mW = \(10^{-6}\) W. (b) \(20 \times (-0.301) = -6.02\) dB.
Answer: (a) 1 µW. (b) About −6 dB (halving the voltage quarters the power).
:::
:::

:::exam Exam focus
- Use dB = 10 log₁₀(P₂/P₁) for power, 20 log₁₀(V₂/V₁) for voltage; negative = loss.
- Add decibels along a path.
- Convert between mW and dBm.
:::

:::mistake Common mistakes
- Putting the larger power on top regardless of direction: always \(P_2\) (later point) over \(P_1\) (earlier point), so loss comes out negative.
- Using 20 log for power ratios (that is for voltage).
- Multiplying dB values along a chain instead of adding them.
:::

:::rev Quick revision
- Attenuation = energy loss; amplifiers compensate.
- dB = 10 log₁₀(P₂/P₁); −3 dB = half; +10 dB = ×10; voltages: 20 log₁₀.
- dB values add along a chain; dBm is relative to 1 mW.
:::

@@topic u3-snr | III.14 | Signal-to-noise ratio and data-rate limits | Measuring noise with SNR (as a ratio and in dB), then the two limits on how fast data can go: Nyquist's bit rate for a noiseless channel and Shannon's capacity for a noisy one, and how to use them together. | Forouzan §3.4–3.5 (prescribed)

## Signal-to-noise ratio (SNR)

To find the theoretical bit-rate limit we need the ratio of the signal power to the noise power. The **signal-to-noise ratio** is

:::fx SNR
\[ \text{SNR} = \frac{\text{average signal power}}{\text{average noise power}} \qquad \text{SNR}_{dB} = 10 \log_{10} \text{SNR} \]
:::

SNR is the ratio of what is wanted (signal) to what is not wanted (noise). A **high SNR** means the signal is less corrupted by noise; a **low SNR** means it is more corrupted. Because SNR is a ratio of two powers, it is often given in decibels.

:::ex Level 1 | SNR from powers (Forouzan Examples 3.31–3.32)
:::solve
Given: (a) Signal power 10 mW, noise power 1 µW. (b) A noiseless channel.
Required: SNR and SNR_dB.
Formula: SNR = P_signal / P_noise; SNR_dB = 10 log₁₀ SNR.
Substitution: (a) \(10{,}000\ \mu\text{W} / 1\ \mu\text{W}\). (b) Noise power = 0.
Calculation: (a) SNR = 10,000; SNR_dB = \(10 \log_{10} 10^4 = 40\) dB. (b) SNR = signal/0 = ∞.
Answer: (a) 10,000, i.e. **40 dB**. (b) Infinite (we can never achieve this in practice).
:::
:::

## Data-rate limits

A very important consideration is how fast we can send data, in bits per second, over a channel. The data rate depends on three factors:

1. the **bandwidth** available,
2. the **number of signal levels** we use, and
3. the **quality of the channel** (the level of noise).

Two theoretical formulas: **Nyquist** for a noiseless channel and **Shannon** for a noisy channel.

### Noiseless channel: the Nyquist bit rate

:::fx Nyquist bit rate
\[ \text{BitRate} = 2 \times B \times \log_2 L \]
\(B\) = bandwidth of the channel (Hz), \(L\) = number of signal levels used to represent data, bit rate in bps.
:::

Given a specific bandwidth, we can have any bit rate we want by increasing the number of levels? In theory, yes; in practice, **no**: more levels make it harder for the receiver to distinguish them, which increases the error probability, especially when the channel is not perfect.

### Noisy channel: the Shannon capacity

In reality we can't have a noiseless channel. In 1944, Claude Shannon introduced a formula, the **Shannon capacity**, for the highest data rate of a noisy channel:

:::fx Shannon capacity
\[ C = B \times \log_2(1 + \text{SNR}) \]
\(B\) = bandwidth (Hz), SNR = signal-to-noise ratio (**as a ratio, not dB**), \(C\) = capacity (bps). For high SNR, \(\text{SNR} \gg 1\), a useful approximation is \( C \approx B \times \dfrac{\text{SNR}_{dB}}{3} \).
:::

The Shannon formula has **no number of levels** in it: no matter how many levels we use, we **cannot achieve a data rate higher than the capacity** of the channel. The formula defines a characteristic of the channel, not of the transmission method.

### Using both limits

In practice we need both: **Shannon gives the upper limit; Nyquist tells us how many signal levels we need.**

:::plot Shannon capacity of a 1 MHz channel as the SNR rises | SNR (dB) | Capacity (Mbps)
func C = B log2(1 + SNR): math.log2(1+10**(x/10)) ; 0 40
:::

## Worked numericals

:::ex Level 1 | Nyquist (Forouzan Examples 3.34–3.35)
:::solve
Given: (a) A noiseless channel of bandwidth 3,000 Hz with two signal levels. (b) The same channel with four levels.
Required: The maximum bit rates.
Formula: BitRate = 2 × B × log₂ L.
Substitution: (a) \(2 \times 3{,}000 \times \log_2 2\). (b) \(2 \times 3{,}000 \times \log_2 4\).
Calculation: (a) \(6{,}000 \times 1 = 6{,}000\) bps. (b) \(6{,}000 \times 2 = 12{,}000\) bps.
Answer: (a) 6 kbps. (b) 12 kbps: doubling the levels' bits doubles the rate.
:::
:::

:::ex Level 2 | How many levels? (Forouzan Example 3.36)
:::solve
Given: We need to send 265 kbps over a noiseless channel with a bandwidth of 20 kHz.
Required: The number of signal levels.
Formula: \(265{,}000 = 2 \times 20{,}000 \times \log_2 L\).
Substitution: \(\log_2 L = 265{,}000 / 40{,}000\).
Calculation: \(\log_2 L = 6.625\); \(L = 2^{6.625} = 98.7\) levels.
Answer: 98.7 is not a power of 2, so we either use **128 levels** (giving 280 kbps) or **64 levels** (giving 240 kbps).
:::
:::

:::ex Level 2 | Shannon (Forouzan Examples 3.37–3.39)
:::solve
Given: (a) An extremely noisy channel with SNR ≈ 0. (b) A regular telephone line: bandwidth 3,000 Hz (300 to 3,300 Hz), SNR = 3,162. (c) A channel with SNR_dB = 36 and bandwidth 2 MHz.
Required: The capacities.
Formula: \(C = B \log_2(1 + \text{SNR})\); convert dB first: SNR = \(10^{\text{SNR}_{dB}/10}\).
Substitution: (a) \(B \log_2 1\). (b) \(3{,}000 \log_2 3{,}163\). (c) SNR = \(10^{3.6} = 3{,}981\); \(2 \times 10^6 \log_2 3{,}982\).
Calculation: (a) \(\log_2 1 = 0\) → C = 0. (b) \(\log_2 3{,}163 = 11.62\); \(C = 34{,}860\) bps. (c) \(\log_2 3{,}982 = 11.96\); \(C = 23.92\) Mbps ≈ 24 Mbps (the approximation \(2 \times 36/3 = 24\) Mbps agrees).
Answer: (a) 0: we can't receive any data through such a channel, whatever the bandwidth. (b) ≈ 34.86 kbps: to send faster over a phone line we must either increase the bandwidth or improve the SNR. (c) ≈ 24 Mbps.
:::
:::

:::ex Level 3 | Shannon then Nyquist (Forouzan Example 3.41)
:::solve
Given: A channel with a 1 MHz bandwidth and SNR = 63.
Required: An appropriate bit rate and the number of signal levels.
Formula: First Shannon for the upper limit, then Nyquist for the levels.
Substitution: \(C = 10^6 \log_2(1 + 63) = 10^6 \log_2 64\).
Calculation: \(C = 6\) Mbps (upper limit). For better performance choose something lower, say 4 Mbps. Nyquist: \(4 \times 10^6 = 2 \times 10^6 \times \log_2 L\) → \(\log_2 L = 2\) → \(L = 4\).
Answer: Use **4 Mbps with 4 signal levels** (Shannon's 6 Mbps is the theoretical ceiling).
:::
:::

:::ex Practice | Combining dB, Shannon and Nyquist
:::solve
Given: A 4 kHz channel; signal power 1 W; noise power 1 mW.
Required: SNR (ratio and dB), the Shannon capacity, and the levels needed to reach about half that capacity with Nyquist.
Formula: SNR = P_s/P_n; dB = 10 log₁₀ SNR; \(C = B \log_2(1 + \text{SNR})\); \(L = 2^{R/2B}\).
Substitution: SNR = 1/0.001 = 1,000. C = \(4{,}000 \log_2 1{,}001\).
Calculation: SNR_dB = 30 dB. \(\log_2 1{,}001 = 9.97\); C ≈ 39.9 kbps. Half ≈ 20 kbps: \(\log_2 L = 20{,}000 / 8{,}000 = 2.5\) → L = 5.66 → use **8 levels** (24 kbps) or 4 levels (16 kbps).
Answer: SNR 1,000 (30 dB); C ≈ 39.9 kbps; 8 levels give 24 kbps (safely below capacity).
:::
:::

| Nyquist | Shannon |
|---|---|
| Noiseless channel | Noisy channel |
| BitRate = 2B log₂ L | C = B log₂(1 + SNR) |
| Depends on the number of levels | Independent of levels; a property of the channel |
| More levels → higher rate (in theory) | No method can exceed C |
| Tells you how many levels to use | Tells you the maximum rate possible |

:::exam Exam focus
- These formulas are on your syllabus even though no uploaded paper has asked them yet; expect a straightforward numerical.
- Always convert SNR from dB to a ratio before using Shannon.
- Use Shannon for the ceiling, then Nyquist for the levels.
:::

:::mistake Common mistakes
- Plugging SNR in dB straight into \(\log_2(1 + \text{SNR})\).
- Writing \(B \log_2 L\) for Nyquist (the factor 2 is essential).
- Choosing a non-power-of-2 number of levels without rounding to a practical value.
:::

:::rev Quick revision
- SNR = signal power / noise power; SNR_dB = 10 log₁₀ SNR.
- Nyquist (noiseless): BitRate = 2B log₂ L.
- Shannon (noisy): C = B log₂(1 + SNR); approximately B × SNR_dB/3 for high SNR.
- Shannon gives the ceiling; Nyquist gives the levels.
:::

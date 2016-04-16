== 20160401

Assessment test `>_<` 10mns
1 - ? X
2 - ? X
3 - B /
4 - E X
5 - D X
6 - A,C X
7 - A X
8 - D X
9 - ? X
10 - D X
11 - D /
12 - D X
13 - A X
14 - B X
15 - B X
16 - B X
17 - C X
18 - B /
19 - D /
20 - E,G X
21 - A /
22 - ? X
23 - B X
24 - C X
25 - C X
26 - A,C /
27 - C /
28 - A X
29 - ? X
30 - B X
31 - D X
32 - D X
33 - ? X
34 - A X
35 - C X

Chapter 1 - 20mns
OSI = Open Systems Interconnection

LAN with 1 hub - 1 collision domain + 1 broadcast domain
Network segmentation - breaking up a large network insto smaller ones

What can LAN traffic congestion be caused by?
* too many ohsts in a collision/broadcast domain
* broadcast storms
* too much multicast traffic
* low bandiwth
* adding hubs for connectivity
* a bunch of ARP broadcasts

Hubs - don't segment network, just connect network segments
Routers - by default, break up a broadcast domain (don't fwd broadcasts by default) (can break collision domain too)
Switch - each host connected to its own collision domain

V.35 - serial interface for WAN on routers

Things routers can do:
* packet switching
* packet filtering (L3 info, such as IP address)
* internetwork communication
* path selection

Internetwork - when routers connect two or more networks and use logical addressing (IP/IPv6)

L2 switches - don't break up broadcast domains by default
Collision domain - one device -> packet -> netw segment, all other devices forced to listen. If another device transmits at the same time, collision!

**switches -> separate collision domains within single broadcast domain
**routers -> separate broadcast domain for each interface

VLAN - logically breaking up broadcast domains in a L2 switched network

Advantages of OSI model:
* divides process into smaller/simpler components -> easier troubleshooting/design
* multiple-vendor dev through standardisation
* prevents changes in one layer from affecting other layers -> faster dev

OSI is a *logical* model, not a physical one

Menmonic - Please Do Not Touch Sally's PA

== 20160404 - 20mns

OSI Layer functions:
* Application -> file, print, msg, db, app serv
* Presentation -> data encryption, compression
* Session -> dialog control
* Transport -> end-to-end connection
* Network -> routing
* Data Link -> framing
* Physical -> topology

Apps like Word don't reside in the app layer - they interface with app layer protocols.
Presentation can be converting the data into a standard format (like ASCII).
Session has 3 modes - simplex (one-way), half-duplex (two-way, one at a time), and full-duplex (two-way, any time).
Transport - segments/reassembles data into a single data stream. ACK, SEQ, ...
Network is L3, decides on the best way to move data. Routers are L3. Usually composed of 2 kinds of packets - data (e.g. IP/IPv6) + route (RIP, OSPF, ...).
Data Link provides physical transmission, handles error notification *but not correction*, network topo... formats messages in data frames with customised header with hw dest/src addresses.
Physical is sending/receiving bits. DTE, DCE, CSU/DSU

Latency = time measured from when a frame enters a port to when it exists a port

!! switch receives a frame with destn hw address not in its table, it will fwd it to all connected segments and update its table if it gets a reply

!! Hosts on the same physical segment locate one another with MAC addresses, while IP addresses are used when they reside on different LAN segments or subnets.

!! Ethernet breaks up one of the layers into two (c.f. review questions)

== 20160405 13mns

=== Lab 1.1

1. Session X Application
2. Physical /
3. Network (L3) /
4. Presentation /
5. Session /
6. Transport X Datalink
7. Network X Transport
8. Transport (IP?) X Transport
9. Physical /
10. Datalink /
11. Session /
12. Datalink /
13. Network X Transport
14. Transport X Network
15. Physical /
16. Bits -> Frames -> Segments -> Packets X Bits -> Frames -> Packets -< Segments
17. Transport /
18. Datalink /
19. Network /
20. 40 bits, HH:HH:HH:HH X 48 bits!

Total score: 12/20
Review: transport vs network layer

=== Lab 1.2

1. Switch X Router
2. Network X Transport
3. Switch /
4. Network X Datalink+Physical
5. Transport /
6. Router /
7. Network /
8. Datalink /
9. Hub /
10. Switch /
11. Hub /
12. Router /

Total score: 9/12
Review: Ethernet, network vs transport

=== Lab 1.3

A. one collision, one broadcast
B. one collision, multiple broadcast X
C. multiple collision, multiple broadcast X
D. multiple collision, multiple broadcast /

** Exhibit missing!

Total score: 2/4
Review: bridge

== 20160405 11mns

=== Review questions

1. A /
2. B /
3. C /
4. C /
5. Bits -> Physical, Frame -> Data Link, Packet -> Network, Segment -> Transport /
6. C /
7. C X
8. Data Link -> Framing, Physical -> Bits -> Network -> Routing, Transport -> E2E connection /
9. D /
10. B /
11. A,C,D X B
12. A X C
13. B /
14. A, B, C, D X A
15. all true X C
16. A X B ?? ERRATA
17. C /
18. A X B
19. A, B, C, D X A
20. A /

Total score: 13/20
Review: ?

== 20160406 19mns

Ethernet - contention-based media access method
CSMA/CD - Carrier Sense Multiple Access with Collision Detection (protocol)
If host notices another signal whilst transmitting, sends jam signal (informs everyone of collision) -> random backoff
Each host has equal priority

Half-duplex - one pair of wires for both transmission & reception
Full-duplex - no collision, different pairs for received/transmitted data -> uses point-to-point between transmitter & receiver

Full-duplex port, when powered on, will check capabilities on the other side (auto-detect).

Ethernet Addressing
MAC - 48 bits, split in half
* First 24 = I/G (1) G/L (1) OUI (22)
* Second 24 = vendor assigned

I/G -> Individual Group. 0 for a device, 1 if it's a broadcast/multicast address in Ethernet
G/L (a.k.a U/L) -> Global/Local, or Universal/Local. 0 if address is globally administered (c.f. IEEE), 1 if it's locally administered

Binary Value | Decimal Value
--- | ---
10000000 | 128
11000000 | 192
11100000 | 224
11110000 | 240
11111000 | 248
11111100 | 252
11111110 | 254
11111111 | 255

Frames are used at the DL layer - encapsulate packets from the Network layer for transmission

MAC frame format. Includes Cyclic Redundancy Check (CRC)
!! error detection, *not* correction

Tunneling - encapsulating a frame within a different type of frame

Ethernet_II format

Preamble (7) - alternating 1,0 pattern, 5MHz clock
SFD (1) - Start Frame Delimiter - 10101011. Last pair of 1's indicate the beginning of the data
Dest (6) - Least Significant Bit first. Can be an individual, broadcast, or multicast MAC address. For a broadcast address this would be all 1's
Src (6) - Source address, LSB first. Can't be a multicast/broadcast format.
Type (2) - or length for 802.3. For Eth_II, this is the network layer protocol
Data/padding (46-1500) - duh
FCS (4) - holds the CRC. Doesn't include the preamble or SFD.

== 20160408 22mns + 11mns

Cable types:
* 10Base-T - 100m
* 100Base-TX - 100m
* 100Base-FX - 412m
* 1000Base-CX - 25m
* 1000Base-T - 100m
* 1000Base-SX - multimode fibre (MMF) - 220m
* 1000Base-LX - singlemode fibre - 3 to 10km

Cat 5 cable has more wire twists per unit length, so less crosstalk (each pair is twisted at a different 'frequency'). If you don't want Electo-Magnetic Interference (EMI), use fibre optic!

Multimode fibre (MMF), like 62.5|50/125(mu)m has a larger diametral core -> multiple modes of light. 850nm laster, ~220/550m respectively
Singlemode fiber, 9/125(mu)m - single mode of light. 1300nm laster, 3-10km

Straight-through cable. Pins (1,2) and (3,6). Used for Switch <-> Client or Router <-> Switch
Cross-over cable. Pins (1,2)->(3,6) and (3,6)->(1,2) on the other side. Used for Client <-> Router, Switch <-> Switch, Router <-> Router. Gigabit UTP crossover is Pins (1,2)->(3,6), (4,7)->(7,4), (5,8)->(8,5)

Auto-MDIX - a mechanism by which Cisco hw knows how to decide which pins are receiving/transmitting.

Encapsulation at each layer:
Transport = TCP Header + Upper-layer data
Network = IP Header + Upper-layer data
Frame = MAC | LLC + Upper-layer data + FCS

Cisco 3-layer hierarchical model:
* Core layer - switch traffic as fast as possible, small # of units, desgined for high reliability
* Distribution/Workgroup - routing, filtering, WAN access
* Access/Desktop - segmentation (separate collision domains)

== 20160411 13mns + 24mns

Lab 2.1

1.

192.11000000 /
168.10101000 /
10.00001010 /
15.00001111 /

172.10101100 /
16.00010000 /
20.00010100 /
55.00110111 /

10.00001010 /
11.00001011 /
12.00001100 /
99.01100011 X 01100111

2.

11001100.128+64+8+4=204 /
00110011.32+16+2+1=51 /
10101010.128+32+8+2=170 /
01010101.64+16+4+1=85 /

11000110.128+64+4+2=198 /
11010011.128+64+16+2+1=211 /
00111001.32+16+8+1=57 /
11010001.128+64+16+1=209 /

10000100.128+4=132 /
11010010.128+64+16+2=190 X 210 (can't add -\_-)
10111000.128+32+16+8=184 /
10100110.128+32+4+2=166 /

3.

8421

1101 1000.xD8 /
0001 1011.x1B /
0011 1101.x3D /
0111 0110.x76 /

11001010.xCA /
11110101.xF5 /
10000011.x83 /
11101011.xEB /

10000100.x84 /
11010010.xD2 /
01000011.x43 /
10110011.xB3 /

Total: 35/36
Takeaway: learn how to add...

Lab 2.2

4 2 3 1

Total: 4/4

Lab 2.3

1. C /
2. S /
3. C /
4. C /
5. S /
6. C /
7. C /
8. R /

Total: 8/8
Takeaway: this needs to make it into a flashcard. Feels a bit like fluke

Lab 2.4

3 5 2 1 4

Total: 5/5

Review Q

1. D /
2. A /
3. A /
4. B /
5. D X B
6. D /
7. D /
8. B,C /
9. B /
10. ? X
11. D /
12. B /
13. D X B
14. A /
15. B /
16. ? X (THIS NEEDS TO BE ON A FLASHCARD!)
17. B /
18. B /
19. 00011100 - 1C A /
20. A /

Total: 16/20
Takeaway: learn which standards match which cable types. Also some 'router connection' settings over a rolled cable

== 20160412 ? + 9mns

TCP/IP = Transmission Control Protocol/Internet Protocol

DoD -> OSI Model:
* Process/Application -> Application, Session, Presentation
* Host-to Host -> Transport
* Internet -> Network
* Network Access -> Data Link/Physical

Telnet: 8-bit, byte-oriented connection over TCP, clear text
SSH: over TCP/IP, all encrypted
FTP: protocol *and* program. For file transfer
TFPT: Trivial FTP. Stripped down version of FTP, no directory browsing abilities. Only used to send/receive files. No auth either
SNMP: Simple Network Management Protocol. Polls devices from a Network Management Station (NMS) at fixed/random intervals. No issue -> baseline. V3 is the standard.
HTTP: HyperText Transfer Protocol
HTTPS: as above, but encrypted
NTP: Network Time Protocol - used for synchronization
DNS: Domain Name Service. Forwards happen over TCP
DHCP: Dynamic Host Configuration Protocol. Not the same as BootP (Bootstrap Protocol). Can provide a variety of information to clients (IP, subnet, domain, gateways, DNS, WINS, ...). Clients sending out DHCP Discover messages send broadcast at L2 and L3 (L2: ff:ff:ff:ff:ff:ff, L3: 255.255.255.255 - all networks, all hosts). Uses UDP, off port 67 by default. Usually a 4 step process (DHCPDiscover, DHCPOffer, DCHPRequest, DHCPACK). Host uses a gratuitous ARP
!! more time to be spent on DHCP
APIPA: Automatic Private IP Addressing - Windows. 169.254.0.1 to 169.254.255.254 (class B, mask of 255.255.0.0)

Host-to-Host Layer protocols

TCP + UDP (Transmission Control Protocol, User Datagram Protocol)

TCP - numbers and sequences each segment, waits for an ACK, and retransmits any segments that aren't acknowledged.
Virtual circuit - handshake, which includes window size.
Costly network overhead

TCP segment format:
        16bit source port | 16bit destn port
        32bit seq number
        32bit ack number
        4bit header length, reserved, code bits/flags | 16bit window size
        16bit TCP checksum (CRC) | 16bit urgent pointer (only if urgent flag set)
        Options
        Data

Header length is a multiple of 32bits. TCP header length is always 0 mod 32 (bit)

UDP is connectionless (no circuit). Fire and forget, no ack, no ordering, ...

UDP segment format:
        16bit source port | 16bit desn port
        16bit length | 16bit checksum
        Data

Sample apps/port #s:
* FTP:21, TCP
* telnet:23, TCP
* POP3:110, TCP
* NTP:123, TCP
* IMAP4:143, TCP
* DNS:53, TCP/UPDP
* TFTP:69 UDP
* BootPS:67 UDP
* SNMP:161 UDP

Ports below 1024 are defined in RFC 3232

!! Session layer keeps application layer data separate (e.g. different 'tabs' in your browser, to the same domain)

== 20160414 17mns + 21mns

Internet Protocol (IP) - internet layer.

IP Header
Version (4b) | Header length (4b) | Priority and type of service (8b) | Total length (16, inc header)
Identification (16) | Flags (3b) | Fragmented offset (13b)
TTL (8b) | Protocol 0x06 for TCP, 0x17 for UDP (8b) | Header checksum - CRC (16b)
Source IP (32b)
Destination IP (32b)
Options (0 or 32b)
Data

Protocol numbers are available here: www.iana.org/assignments/protocol-numbers

ICMP - Internet Control Message Protocol

Encapsulated within IP datagrams
- Destination unreachable: if a router can't send an IP datagram any further
- Buffer full/source quench: if a router's memory buffer for incoming datagrams is full
- Hops/time exceeded: TTL = 0
- Ping: Packet Internet Groper
- Traceroute: discover full path using ICMP time-outs

!! you can sometimes tell what OS sent a ping request by looking at the data. Usually it's 100 bytes of the alphabet, but Windows stops at W before looping back to A

ARP - address resolution protocol

Finds a hardware address from a known IP address

IP Addressing

Hierarchical. Very useful for routing (vs flat).

Network address: 172.16.30.56 -> 172.16
Node address: 172.16.30.35 30.56

Class A: N.H.H.H
Class B: N.N.H.H
Class C: N.N.N.H
Class D: Multicast
Class E: Research

Class A
* first bit is always 0
* 0 - 127
* 0 and 127 reserved, so 2^24 (3 bytes for node addresses)-2 potential node addresses

Class B
* first bit is always 1, second is always 0
* 10000000 - 10111111 = 128 to 191
* 2^16 (2 bytes for node addresses) - but because it should be 1 followed by 0, that's 2^14-2 (for all 0s/1s)=65,534

Class C
* first 2 bits are always 1, 3rd bit is always off
* 11000000 - 11011111 = 192 to 223
* one byte for note addresses, but 110 start so 2^8-2 -> 254 node addresses *for each class C network*

Class D
* 224 to 239 - multicast

Class E
* 240 to 255

Reserved IP address:
* Network address all 0 -> this network segment
* Network address all 1 -> all networks
* 127.0.0.1 -> loopback
* Node address all 0 -> any host on a specified network
* Node address of all 1 -> all nodes (e.g. 128.2.255.255 is all nodes on 128.2)
* All 0 -> Cisco default route
* All 1 -> broadcast to all nodes on current network (255.255.255.255)

NAT - Network Address Translation

Converts private IP address for use on the internet

Class A: 10.0.0.0 - 10.255.255.255
Class B: 172.16.0.0 - 172.31.255.255
Class C: 192.168.0.0 - 192.168.255.255

Layer 2 broadcast
a.k.a. hardware broadcasts, won't go past LAN boundary (router)

Layer 3 broadcast
Network broadcast, all host bits are on

Unicast
Directed to a single address

Multicast
Point to multipoint
Via group address
Routers forward to interfaces that have hosts subscribed to a group address

== 20160415 28mns

Lab 3.1

1. 1100 0000 to 1101 1111 = 192 to 223 /
2. ? X
3. 0000 0000 to 0111 1111 = 0 to 127 (though 0 and 127 are reserved) /
4. loopback - used for testing /
5. replace the host address with 0 /
6. replace the host address with 1b (so 255) /
7. X 10.0.0.0 to 10.255.255.255
8. X 172.16.0.0 to 172.31.255.255
9. X 192.168.0.0 to 192.168.255.255
10. A-F /

Total: 6/10
Takeway: learn the private address spaces for each network!

Lab 3.2

1. I
2. H2H
3. P/A
4. P/A
5. I
6.
7.
8.
9.
10.
11.
12.
13.
14.
15.
16.
17.

Total: pfff /17
Takeaway: didn't think it was relevant, I was wrong. DoD model needs to be learnt!

Review questions

1. C /
2. B /
3. C /
4. A X
5. D,E,F X
6. C /
7. D X
8. C X
9. ?? X
10. B,D,E /
11. C /
12. C /
13. C /
14. A /
15. C /
16. C,E /
17. B /
18. B, C /
19. C /
20. Request, Discover, Offer, Ack X


Total:  14/20
Takeaway: brush up on DHCP, as well as the DoD model


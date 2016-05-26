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

Subnetting offsets

  0 +0
  128 +1 - /9,/17,/25
  192 +2 - /10,/18,/26
  224 +3
  240 +4
  248 +5
  252 +6
  254 +7
  255 +8 - /16,/24

  == 20160418 37mns

  Subnet mask  - 32-bit value that allows the device that's receiving IP packets to distinguish the network ID from the host ID portion of the IP address. The differentiation is done by splitting the 1's and 0's (1's = network ID, 0's = host IDs)

  Classless Inter-Domain Routing (CIDR)

  Largest subnet is /30 as we need at least 2 bits for host bits

  What are the possible subnets per network class?
  * A - /8 to /15
  * B - /16 to /23
  * C - /24 to /30

  `ip subnet-zero` - assuming a mask has been set up, use the first and last subnet in your network design.
  http://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13711-40.html#subnetzero
  default from IOS 12.x

  Subnetting questions:
  * how many subnets
  * how many hosts/subnet
  * what are the valid subnets
  * what's the broadcast address for each subnet
  * what are the valid hosts

  e.g. 255.255.255.128/25 - Class C network address 192.168.10.0

  1 bit for subnetting, 7 bits for hosts.
  * how many subnets - 2^1 = 2
  * how many hosts/subnet - 2^7-2 = 126
  * what are the valid subnets - 256 - 128 -> 0, 128 = 2 subnets
  * what's the broadcast address for each subnet - 192.168.10.127 & 192.168.10.255
  * what are the valid hosts - 1->127, 129->254

  `show ip route` to show the routing table. `C` -> directly connected network

  e.g. 255.255.255.192/26 - Class C network address 192.168.10.0

  2 bit for subnetting, 6 bits for hosts.
  * how many subnets - 2^2 = 4
  * how many hosts/subnet - 2^6-2 = 62
  * what are the valid subnets - 256 - 192 -> 0, 64, 128, 192 = 4 subnets <- block size is 64
  * what's the broadcast address for each subnet - 192.168.10.63, 192.168.10.127, 192.168.10.191, 192.168.10.254
  * what are the valid hosts - 1->63,65->126,129->190,192-254

  !! 255.255.255.240 mask is often asked!

  What do we know about a /26 subnet?
  * 192 mask (1111111.11111111.11111111.11000000)
  * 2 bits on, 6 off
  * 4 subnets (2^2)
  * block size is 256-192 = 64 (alternatively, 256/4 = 64)
  * 4 subnets, 64-2=62 hosts in each

  !! Any number between the subnet number and the broadcast address is always a valid host.

  == 20160419 18mns 6mns

  Subnetting class B networks
  16 bits available for hosts, can use 14 bits. 255.255.0.0 is /16 (16 bits set), +14 -> all the way to /30.
  Anything in excess of /24 will be exactly like class C.
  Anything before and you subnet in the 3rd octet

  e.g. 255.255.128.0/17 - Class B with network address 172.16.0.0 and subnet mask 255.255.128.0
  * how many subnets - 2^1 = 2
  * how many hosts/subnet - 2^15-2 = 32766
  * what are the valid subnets - 256 - 128 -> 0, 128 - in the 3rd octet
  * what's the broadcast address for each subnet - 172.16.127.255 & 172.16.255.255
  * what are the valid hosts - 172.16.0.1->172.16.127.254,172.16.128.1->172.16.255.254

  !! in this example, 172.16.10.0 is a valid host address, and so is 172.16.10.255

  e.g. 255.255.255.128/25 - Class B with network address 172.16.0.0 and subnet mask 255.255.255.128
  * how many subnets - 2^9 = 512
  * how many hosts/subnet - 2^7-2 = 126
  * what are the valid subnets - 256 - 255 -> 0,1,2,3... in the 3rd octet and one extra bit in the 4th octet (so 0,128). You get 255x2+2
  * what's the broadcast address for each subnet - 172.16.127.255 & 172.16.255.255
  * what are the valid hosts - 172.16.0.1->172.16.127.254,172.16.128.1->172.16.255.254

  Subnetting class A networks
  The masks are from /8 to /30

  What are the advantages of subnetting?
  * reduced network traffic
  * optimised network performance
  * simplified management

  == 20160420 25mns 17:31

  Labs 4.1

  1. 192.168.100.25/30
  Subnet mask: 255.255.255.252 - 4 hosts/subnet (-2 for network address + broadcast) /
  Valid subnet: 192.168.100.24 /
  Broadcast address: 192.168.100.27 (next subnet is .28) /
  Host range: 192.168.100.25->26 /

  2. 192.168.100.37/28
  4 network bits -> 128+64+32+16 - 240
  Subnet mask: 255.255.255.240 /
  Valid subnet: 256-240 -> 16 block size -> 192.168.100.32 /
  Broadcast address: 192.168.100.63 X 47
  Host range: 192.168.100.33->63 X 46

  3. 192.168.100.66/27
  3 network bits -> 128+64+32 - 224
  Subnet mask: 255.255.255.224 /
  Valid subnet: 256-224 -> 32 block size -> 192.168.100.64 /
  Broadcast address: 192.168.100.95 /
  Host range: 192.168.100.65-94 /

  4. 192.168.100.17/29
  5 network bits -> 128+64+32+16 - 248
  Subnet mask: 255.255.255.248 /
  Valid subnet: 256-248 -> 8 block size -> 192.168.100.16
  Broadcast address: 192.168.100.31 X 23
  Host range: 192.168.100.17->32 X 22

  5. 192.168.100.99/26
  2 network bits -> 128+64 - 192
  Subnet mask: 255.255.255.192 /
  Valid subnet: 256-192 -> 64 block size -> 192.168.100.64 /
  Broadcast address: 192.168.100.127 /
  Host range: 192.168.100.65->126 /

  6. 192.168.100.99/25
  1 network bits -> 128
  Subnet mask: 255.255.255.128 /
  Valid subnet: 256-128 -> 128 block size -> 192.168.100.0 /
  Broadcast address: 192.168.100.127 /
  Host range: 192.168.100.0->126 /

  7. 255.255.224.0 X 2^4 = 16, 2^5 = 32 -> 5 bits. /21
  8. 192.168.192.10/29 - 255.255.255.248, 8 -> 192.168.192.15 /
  9. 2^3-2 = 6 /
  10. 10.16.3.65/23 - 7 bits in 3rd octet - 256-2 = 254 - 10.16.3.64 X block size is 2 (256-254). 3.255, in 2.0 subnet

  Total: 22/30
  Takeaway: Class A subnetting. Mental arithmetic -_-

  Labs 4.2

  /16   255.255.0.0               65536-2
  /17   255.255.128.0             32768-2
  /18   255.255.192.0             16384-2
  /19   255.255.224.0             8192-2
  /20   255.255.240.0             4096-2
  /21   255.255.248.0             2048-2
  /22   255.255.252.0             1024-2
  /23   255.255.254.0             512-2
  /24   255.255.255.0             256-2
  /25   255.255.255.128   128-2
  /26   255.255.255.192   64-2
  /27   255.255.255.224   32-2
  /28   255.255.255.240   16-2
  /29   255.255.255.248   8-2
  /30   255.255.255.252   4-2

  Labs 4.3

  10.25.66.154/23 A       2^15,2^9-2=510 /
  172.31.254.12/24        B       2^8=256,2^8-2=254 /
  192.158.20.123/28       C       2^4=16,2^4-2=14 /
  63.24.89.21/18  A       2^10=1024,2^6-2=62 X 2^14-2=16382
  128.1.1.254/20  B       2^4=16,2^12-2=4094 /
  208.100.54.209/30       C       2^6=64,2^2-2=2 /

  Total: 5/6
  Takeaway: Pesky A networks...

  == 20160421 33mns

  Review Questions
  1.
  224 -> 256-224 = 32 = block size
  224 = 128+64+32 - 3 bits network, 5 bits host -> 2^5-1 = 30 hosts
  D /
  2. 29 subnets - 32 - 2^5 -> 5 bits, D /
  3. /28 - 4 bits - .240 - 16 block size -> 32, 48, 64 - C /
  4. /19 172 is a class B. 2^3-1 subnets, 2^13-2 - F (no zero subnet by default) /
  5. .254 mask - A, D X B,D
  6. 172.16.45.14/30 - 6 bits - 2^2 block size -> D /
  7. E X D
  8. /21 - 3 bits = 224 - 32 -> C /
  9. /29 - 3 bits for host - 2^3-2 = 6 -> A /
  10. /29 on class C - 248, 8 block size -> C /
  11. A /
  12. 2^4 = 16 - 2^5-2 = 30 -> 3 bits for network -> 255.255.255.224 -> B /
  13. C /
  14. /25 in class B - 1 bit, 128 block size-> B X
  15. 192.168.10.0/28 - 4 bits, 240 -> block size is 16 - -> 192.168.10.254 X
  16. 192.168.10.0/28 - C /
  17. E /
  18. 172.16.17.0/22 - class B, 6 bits for network - 252.0 - E /
  19. 172.16.2.1/23 - 7 bits - 254 -> subnet size 2, B&C X D,E
  20. C /

  Total: 16/20
  Takeaway: subnetting is *hard*!

== 20160505 8mns

Lab 6

1. clock rate 1000000 # clock rate is in bits /
2. configure vty 0 4;password <password>; login X no login
3. no shutdown /
4. erase startup-config /
5. line console 0;enable password todd;login /
6. enable secret cisco;login /
7. show controllers /
8. ? X show terminal
9. reload /
10. conf t;hostname Sales /

Total: 8/10
Takeaway: brush up on simple (but not frequently used) commands!

== 20160506

Review questions

1. many input/CRC errors - D /
2. C /
3. C, E X
4. C /
5. user -> limited, priv -> all other; global -> entire; specific -> int/proc; setup -> inter /
6. A X 100MB
7. B / 
8. C /
9. C /
10. C /
11. D /
12. C, D X D
13. D /
14. B /
15. C /
16. C /
17. C X D
18. B /
19. D X B, D
20. A /

Total: 15/20
Takeaway: watch out for the router name, and the mode in which a command gets executed.
If a cmd is unfamiliar, maybe it's because they made it up!

== 20160511 8mns

Lab 7.1

1. copy start run /
2. show cdp neighbors /
3. show cdp entry * /
4. ctrl+shift+6 - X /
5. show sessions /
6. copy flash:|start run /
7. ntp /
8. ? UDP broadcast X ip helper-address
9. ntp ? X ntp server <ip> version 4 (or no version
10. show ntp status

Total: 8/10
Takeaway: Learn those pesky ntp commands and brush on cdp

Lab 7.2

1. flash /
2. NVRAM X ROM
3. NVRAM /
4. ROM /
5. DRAM /
6. DRAM /
7. ROM / 
8. DRAM X ROM
9. NVRAM X DRAM
10. DRAM

Total: 7/10
Takeaway: that's important stuff

== 20160512

Review questions

1. B LLDP /
2. C /
3. B /
4. A/B (?) X C!
5. D /
6. C /
7. C /
8. C /
9. C /
10. B/E? X C
11. D /
12. B,D /
13. A,D /
14. B,C,D X tracert vs traceroute
15. D /
16. C /
17. terminal monitor /
18. C X E
19. D /
20. B, D /

Total: 16/20
Takeaway: read the questions carefully! (e.g. tracert vs traceroute)

=== 20160518

Lab 8

1. en/conf t: ip route 171.16.10.0 255.255.255.0 172.16.20.1 150 /
2. IP of remote PC, MAC of gateway /
3. en/conf t: ip route 0.0.0.0 0.0.0.0 172.16.40.1 /
4. one with one exit interface / (stub network)
5. show ip route
6. interface
7. False
8. True
9. ? X router rip;passive-interface s1
10. True - sends submask

Total: 9/10
Takeaway: review routing commands!

=== 20160519

Review Questions

1. show ip route /
2. B / 
3. A,D X A,B
4. C,F / 
5. B /
6. B /
7. MAC, IP /
8. B,E /
9. B,C /
10. A X C
11. A,C /
12. B /
13. D /
14. A /
15. A /
16. D X C
17. B X C
18. A,B,C X D (misread the question...)
19. C /
20. B /

Total: 15/20
Takeaway: review different kinds of routing protocols, and read questions properly (read twice, answer once)

=== 20160524

Lab 9

1. router ospf 101
2. show ip ospf
3. show ip ospf int g0/0
4. show ip ospf database X show ip ospf neigh
5. show ip proto X show ip route ospf

Total: 3/5
Takeaway: brush up on all the `show ip` commands related to ospf

=== 20160525

Wildcard mask of 0.0.0.0 - this is used to specify an interface.
E.g.:
* network 0.0.0.0 255.255.255.255 area 0 - all interfaces participate in OSPF
* network 172.16.0.1 0.0.0.0 area 0 - only the interface with that ip participates in OSPF
* network 172.16.0.0 0.0.255.255 area 0 - any matching interfaces participate

Review Questions

1. lowest AD - EIGRP /
2. ABR? ABC? / - ABR - Area Border Router
3. A,C /
4. B,C X B
5. C /
6. A /
7. D X A
8. D /
9. A /
10. A /
11. C X A
12. D /
13. Des rout-> elec, Topo-> contains all, Hell-> provides, Rout -> contains only /
14. passive-interface fa0/1 /
15. E,F X B,G 
16. B X A
17. A,B,D X C
18. show ip ospf interface f0/0 /
19. A /
20. B /

Total: 14/20
Takeaway: Learn to read the output of the show commands!

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



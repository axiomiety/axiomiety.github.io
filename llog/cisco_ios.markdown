---
layout: default
title: llog - cisco ios
category: pages
---

#### Prompts

`>` is user exec mode (usermode). Usually used to view stats. `#` is privileged exec mode. Accessed using `enable`.

    Switch>enable
    Switch#

Come out with `disable`.

    Switch#disa
    Switch>

#### Login

Type `logout` to log out.

#### Configuration modes

To make global changes, you need to be in privileged mode and type `configure terminal`. This enters the global configuration mode.

    Switch>config terminal
    ^
    % Invalid input detected at '^' marker.
      
    Switch>en
    Switch#config t
    Enter configuration commands, one per line.  End with CNTL/Z.
    Switch(config)#

Changes done there *are only applicable to the running config (DRAM)*. To make the changes permanent, they need to be copied to NVRAM (non-volatile RAM) - otherwise they won't survive a reboot.

Note that you can change the clock in privileged mode (no need to be in global conf mode).

To configure a particular interface, use the `interface` cmd when in global conf mode:

    Switch(config)#interface ?
      Ethernet         IEEE 802.3
      FastEthernet     FastEthernet IEEE 802.3
      GigabitEthernet  GigabitEthernet IEEE 802.3z
      Port-channel     Ethernet Channel of interfaces
      Vlan             Catalyst Vlans
      range            interface range command

Need to specify the type and port:

    Switch(config)#int fa ?
      <0-9>  FastEthernet interface number
    Switch(config)#int fa 0?
    /  
    Switch(config)#int fa 0/?
      <0-24>  FastEthernet interface number
    Switch(config)#int fa 0/1
    Switch(config-if)#

Interfaces can also be updated in bulk (range):

    Switch(config)#interface ?
      Ethernet         IEEE 802.3
      FastEthernet     FastEthernet IEEE 802.3
      GigabitEthernet  GigabitEthernet IEEE 802.3z
      Port-channel     Ethernet Channel of interfaces
      Vlan             Catalyst Vlans
      range            interface range command
    Switch(config)#interface range fa0/1 - 10
    Switch(config-if-range)#no shutdown

You can also configure the `line` used (console, VTY):

    Switch(config)#line console ?
      <0-0>  First Line number
    Switch(config)#line console 0
    Switch(config-line)#

`line console 0` is a global (major) command.

#### Privelged mode commands

Set the clock with `clock set 14:01:04 1 december 2020`.

#### Global configuration mode commands

Set the hostname with `hostname batcave`:

    Switch(config)#hostname batcave
    batcave(config)#

Set the login banner:

    batcave(config)#banner ?
      motd  Set Message of the Day banner
    batcave(config)#banner motd ;
    Enter TEXT message.  End with the character ';'.
    waza
    ;

If you then do a logout, you'll see 'waza'. You can also do it on one line `banner motd ; waza ;`.

Setting passwords:

batcave(config)#enable ?
  password  Assign the privileged level password
  secret    Assign the privileged level secret

Don't use password (like enable password foobar) - it's unencrypted and will show via `show running-config`:

    batcave#show running-config
    Building configuration...
    
    Current configuration : 1035 bytes
    !
    version 12.1
    no service timestamps log datetime msec
    no service timestamps debug datetime msec
    no service password-encryption
    !
    hostname batcave
    !
    enable password foobar

SSH can be set up:

    Router(config)#hostname home
    home(config)#ip domain-name home.com
    home(config)#username foo password bar
    home(config)#crypto key generate rsa
    The name for the keys will be: home.home.com
    Choose the size of the key modulus in the range of 360 to 2048 for your
      General Purpose Keys. Choosing a key modulus greater than 512 may take
      a few minutes.
    
    How many bits in the modulus [512]: 
    % Generating 512 bit RSA keys, keys will be non-exportable...[OK]

    home(config)#ip ssh version 2
    *Mar 1 0:4:55.88:  RSA key size needs to be at least 768 bits for ssh version 2
    *Mar 1 0:4:55.89:  %SSH-5-ENABLED: SSH 1.5 has been enabled 
    Please create RSA keys (of at least 768 bits size) to enable SSH v2.
    home(config)#crypto key generate rsa
    % You already have RSA keys defined named home.home.com .
    % Do you really want to replace them? [yes/no]: yes
    The name for the keys will be: home.home.com
    Choose the size of the key modulus in the range of 360 to 2048 for your
      General Purpose Keys. Choosing a key modulus greater than 512 may take
      a few minutes.
    
    How many bits in the modulus [512]: 1024
    % Generating 1024 bit RSA keys, keys will be non-exportable...[OK]
    
    *Mar 1 0:6:6.411:  %SSH-5-ENABLED: SSH 1.99 has been enabled 
    home(config)#ip ssh version 2
    home(config)#line vty 0 15
    home(config-line)#transport input ssh

However passwords will still be kept in clear unless:

    home(config)#service password-encryption 

This is a service that needs to run - otherwise `show run` will list the passwords in clear (apart from the secret one - which is not so secret, there are a number of tools that can decrypt it on-the-fly). You turn off the service by prefixing it with `no`. If the service wasn't running when passwords were being set, you need to do a `show run` *before* turning it off (as in, it doesn't to run all the time).

#### Line configuration mode

Set the console password with `line console 0`:

    batcave(config)#line console 0
    batcave(config-line)#password console
    batcave(config-line)#login

If you follow this by a logout, it'll ask you for the password to log in. *This is not the same password to enter privileged mode* - just a password to log into the switch. And yes, it'll still be in clear in the config.

By default users get logged out from the consol after 10 minutes. `exec-timeout 0 0` ensures it never does. 

We can also set a login *telnet* password on the virtual terminals:

    batcave(config)#line vty 0 15
    batcave(config-line)#password telnet
    batcave(config-line)#login

The switch can still access connections without password by using `no login`.

Ditto for the `aux` line (`line aux 0`). Note it's not available on all devices.

#### Interface configuration mode

There are a number of interfaces - particularly on a router.

    home>en
    home#conf t
    Enter configuration commands, one per line.  End with CNTL/Z.
    home(config)#int
    home(config)#interface ?
      Dot11Radio        Dot11 interface
      Ethernet          IEEE 802.3
      FastEthernet      FastEthernet IEEE 802.3
      GigabitEthernet   GigabitEthernet IEEE 802.3z
      Loopback          Loopback interface
      Serial            Serial
      Tunnel            Tunnel interface
      Virtual-Template  Virtual Template interface
      Vlan              Catalyst Vlans
      range             interface range command
    home(config)#interface fa 0/1
    home(config-if)#description Sales trunk link
    home(config-if)#^Z

You can view the interface with either `show run` or `show interfaces`:

    home#show int f0/1
    FastEthernet0/1 is administratively down, line protocol is down (disabled)
      Hardware is Lance, address is 0009.7ce3.8e02 (bia 0009.7ce3.8e02)
      Description: Sales trunk link

There is a condensed mode available - `show int description` which displays everything in a tabluar format.

We can set the speed and duplex mode (bypassing auto-detect):

    batcave(config)#interface fa0/1
    batcave(config-if)#speed 100
    batcave(config-if)#duplex full

Interfaces are usually administratively down. They can be brought up as follows:

    home(config)#int f0/0
    home(config-if)#no shutdown 
    
    %LINK-5-CHANGED: Interface FastEthernet0/0, changed state to up
    
    home(config-if)#do show in f0/0
    FastEthernet0/0 is up, line protocol is down (disabled)

To set an IP address:

    home>en
    home#conf t
    Enter configuration commands, one per line.  End with CNTL/Z.
    home(config)#int f0/1
    home(config-if)#ip address 172.16.10.2 255.255.255.0
    home(config-if)#no shutdown
    
    home(config-if)#
    %LINK-5-CHANGED: Interface FastEthernet0/1, changed state to up
    home(config-if)#do show ip int brief
    Interface              IP-Address      OK? Method Status                Protocol
    FastEthernet0/0        unassigned      YES unset  up                    down
    FastEthernet0/1        172.16.10.2     YES manual up                    down
    Vlan1                  unassigned      YES unset  administratively down down

You can add a secondary IP address to an interface (not recommended, but it does work) by adding the `secondary` parameter.

To set up a serial link:

    home(config)#int serial 0/3/0
    home(config-if)#clock rate 10000
    Unknown clock rate
    home(config-if)#clock rate ?
    Speed (bits per second
      1200           
      2400           
      4800           
      9600           
      19200          
      38400          
      56000          
      64000          
      72000          
      125000         
      128000         
      148000         
      250000         
      500000         
      800000         
      1000000        
      1300000        
      2000000        
      4000000        
      <300-4000000>  Choose clockrate from list above
    home(config-if)#clock rate 9600

Clock rates should only be added if your DTE (Date Terminal Equipment) needs to behave like a DCE (Data Communication Equipment). You can view more information via `show controllers`.

Bandwidth is set as follows:

    home(config-if)#bandwidth ?
      <1-10000000>  Bandwidth in kilobits
    home(config-if)#bandwidth 1000

Note this is in *kilobits per seconds*, unlike the clock rate (which is in *bits per second*). Bandwidth is used by some routing protocol to calculate the cost of a path. RIP disregards that because it only relies on hop count.

#### Show commands

`show history` - last 20 commands by default.

`show terminal` - term config

`terminal history size <0-256>` - set terminal history size.

Show the status of interfaces:
    
    batcave#sh ip interface brief
    Interface              IP-Address      OK? Method Status                Protocol
    FastEthernet0/1        unassigned      YES manual down                  down
    FastEthernet0/2        unassigned      YES manual down                  down

You can use the `|` to scroll through to the relevant section - like `sh run | begin interface`.

`show running-config` is for the config being run *right now*, versus `show startup-config` which is for... the startup configuraiton.

`show protocols` show layer 1 and 2 information on all interfaces.

`show clock` for the time set on the router.

`show logging` to see logging information (like if logs are forwarded to a syslog server).

`show processes`:

    SW_SUBNET_A#show processes
    CPU utilization for five seconds: 0%/0%; one minute: 0%; five minutes: 0%
     PID QTy       PC Runtime (ms)    Invoked  uSecs     Stacks TTY Process
       1 Csp 602F3AF0            0       1627       0 2600/3000   0 Load Meter 
       2 Lwe 60C5BE00            4        136      29 5572/6000   0 CEF Scanner 
       3 Lst 602D90F8         1676        837    2002 5740/6000   0 Check heaps 
       4 Cwe 602D08F8            0          1       0 5568/6000   0 Chunk Manager 
       5 Cwe 602DF0E8            0          1       0 5592/6000   0 Pool Manager 

#### MAC

You can take a look at the MAC addresses with:

    S2#show mac address-table 
              Mac Address Table
    -------------------------------------------
    
    Vlan    Mac Address       Type        Ports
    ----    -----------       --------    -----
    
       1    0090.2b3c.b611    DYNAMIC     Fa0/1
      10    0090.2b3c.b611    DYNAMIC     Fa0/1
      20    0090.2b3c.b611    DYNAMIC     Fa0/1

You can assign an address onto that table with `mac address-table static aaaa.bbbb.cccc vlan 1 int fa0/1`.

##### Interface stats

    Router#show in fa0/1
    FastEthernet0/1 is administratively down, line protocol is down (disabled)
      Hardware is Lance, address is 0030.a378.2702 (bia 0030.a378.2702)
      MTU 1500 bytes, BW 100000 Kbit, DLY 100 usec,
         reliability 255/255, txload 1/255, rxload 1/255
      Encapsulation ARPA, loopback not set
      ARP type: ARPA, ARP Timeout 04:00:00, 
      Last input 00:00:08, output 00:00:05, output hang never
      Last clearing of "show interface" counters never
      Input queue: 0/75/0 (size/max/drops); Total output drops: 0
      Queueing strategy: fifo
      Output queue :0/40 (size/max)
      5 minute input rate 0 bits/sec, 0 packets/sec
      5 minute output rate 0 bits/sec, 0 packets/sec
         0 packets input, 0 bytes, 0 no buffer
         Received 0 broadcasts, 0 runts, 0 giants, 0 throttles
         0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored, 0 abort
         0 input packets with dribble condition detected
         0 packets output, 0 bytes, 0 underruns
         0 output errors, 0 collisions, 1 interface resets
         0 babbles, 0 late collision, 0 deferred
         0 lost carrier, 0 no carrier
         0 output buffer failures, 0 output buffers swapped out

MTU is the Maximum Transmission Unit - which essentially is the max packet size. BW is bandwidth, used for routing protocols (apart from RIP).

If `0 output errors, 0 collisions` is increasing, it suggests issues at the Physical or Datalink layer (often as a result of half-duplex on one end and full-duplex on the other).

If `0 input errors, 0 CRC` is increasing, it could be an issue with the Physical layer - like the cable receiving excessive interference. Interfernce usually manifests itself with increasing CRC/input errors but the collision counter stays the same.

`0 no buffer` is good - means we're processing all incoming packets and don't have to drop any.

`0 ignored` is also good. Will increase in conjunction with `no buffer` - dropped packets essentially.

`runts` is for frames that are not at least 64 bytes (minimum). Usually caused by collisions

`griants` - big frames, greater than 1518 bytes.

`input errors` = `runts` + `giants` + `no buffer` + `CRC` + `frame` + `overrun` + `ignored`.

`CRC` - the checksum in the `FCS` portion of the frame.

`frame` represents incomplete/illegal frames.

`late collision` - all collisions should occur by the 64th byte of a frame, as per Ethernet specs. If not, usually points to a duplex mismatched or an excessive cable length (greater than specifications).

    home#sh int s0/3/0
    Serial0/3/0 is administratively down, line protocol is down (disabled)
      Hardware is HD64570
      MTU 1500 bytes, BW 1000 Kbit, DLY 20000 usec,
         reliability 255/255, txload 1/255, rxload 1/255
      Encapsulation HDLC, loopback not set, keepalive set (10 sec)
    ...

The first part relates to the Physical layer, the 2nd to the datalink layer. For serial interfaces, the latter being down is usually an issue clocking (keepalive) or framing. In the above keepalive is set to 10 seconds. This means the router sends a keepalive message to its neighbhour every 10 seconds. Both the router and its neighbhours must have the same keepalive value.

Counters are cleared with `clear counters <interface>`. Useful if you just fixed an issue and want a clean slate.

For layer 3 stats, use `sh ip interface`. Includes things like whether an access list has been set. Use `sh ip int brief` for a quick overview.

#### Managing configurations

NVRAM is non-volatile RAM. For a config to survive a powerdown, it needs to be somewhere other than RAM (DRAM).

    home>en
    home#copy runn
    home#copy running-config ?
      flash:          Copy to flash file
      ftp:            Copy to current system configuration
      startup-config  Copy to startup configuration
      tftp:           Copy to current system configuration
    home#copy running-config s
    home#copy running-config startup-config 
    Destination filename [startup-config]? 
    Building configuration...
    [OK]

Use `erase startup-config` to remove the startup config (note: cmd has to be typed in full!). Use `reload` afterwards.

You can copy to/from other locations:

    batcave#copy running-config flash:
    Destination filename [running-config]? foo
    %Warning:There is a file already existing with this name
    Do you want to over write? [confirm] 
    Building configuration...
    [OK]
    batcave#show flash: 
    
    System flash directory:
    File  Length   Name/status
      3   33591768 c2900-universalk9-mz.SPA.151-4.M4.bin
      5   1007     foo
      2   28282    sigdef-category.xml
      1   227537   sigdef-default.xml
    [33848594 bytes used, 221895406 available, 255744000 total]
    249856K bytes of processor board System flash (Read/Write)

And the other way around (you should be able to specify the filename?):

    batcave#copy flash: startup-config 
    Source filename []? foo
    Destination filename [startup-config]? 
    [OK]
    
    1007 bytes copied in 0.416 secs (2420 bytes/sec)

Interfaces are shut down by default - so if you erase, reload, and restore a config from somewhere, you'll still need to enable those with a `no shutdown`.

#### Misc

The appliances should have their own versions of `ping` and `traceroute`. The former has some funnky options that allow you to set things like the datagram size.

`telnet` is also included.

`logging synchronous` stops the console from overriding what you are typing.

A router will not (usually) allow a telnet user to enter privilege mode *unless* `enable password` or `enable secret` has been set. That's sensible!

All interfaces are shut down on a router by default.

By default, debug messages aren't shown on a remote console. Use `terminal monitor` to enable, and `terminal no monitor` to disable (consistency FTW!).

##### Fancy session multiplexing

Use `Ctrl+Shift+6, X` to detach, and `resume`/`disconnect` to resume/disconnect (duh).

    SW_SUBNET_A#telnet 192.168.1.1
    Trying 192.168.1.1 ...Open
    
    
    User Access Verification
    
    Password: 
    RT_SALES>en
    Password: 
    RT_SALES#sh sessions
    % No connections open
    RT_SALES#
    SW_SUBNET_A#show sessions
    Conn Host                Address             Byte  Idle Conn Name
    *  1 192.168.1.1         192.168.1.1            0     0 192.168.1.1
    SW_SUBNET_A#resume ?
      <1-16>  The number of an active network connection
      WORD    The name of an active network connection or Connection options
      <cr>
    SW_SUBNET_A#resume 1
    [Resuming connection 1 to 192.168.1.1 ... ]
    
    RT_SALES#

#### DHCP

You sohuld be able to set the lease with `lease`:

    batcave(config)#ip dhcp excluded-address 192.168.10.1 192.168.10.10
    batcave(config)#ip dhcp pool SALES
    batcave(dhcp-config)#?
      default-router  Default routers
      dns-server      Set name server
      exit            Exit from DHCP pool configuration mode
      network         Network number and mask
      no              Negate a command or set its defaults
      option          Raw DHCP options
    batcave(dhcp-config)#network 192.168.10.0 255.255.255.0
    batcave(dhcp-config)#default-router 192.168.10.1
    batcave(dhcp-config)#dns-server 8.8.8.8

The pool can be removed with `no ip dhcp pool SALES`.

You can also forward UDP broadcasts (of which DHCPDiscover is one):

    batcave(config)#int g0/0
    batcave(config-if)#ip ?
      access-group     Specify access control for packets
      address          Set the IP address of an interface
      authentication   authentication subcommands
      flow             NetFlow Related commands
      hello-interval   Configures IP-EIGRP hello interval
      helper-address   Specify a destination address for UDP broadcasts
      mtu              Set IP Maximum Transmission Unit
      nat              NAT interface commands
      ospf             OSPF interface commands
      proxy-arp        Enable proxy ARP
      split-horizon    Perform split horizon
      summary-address  Perform address summarization
    batcave(config-if)#ip helper-address 10.10.10.254

##### `show ip dhcp`

`binding`

`pool [poolname]`

`server statistics`

`conflict`

#### Logging

To log to  a syslog server:

    Switch(config)#logging host 172.16.10.1
    Switch(config)#service timestamps ?
      debug  Timestamp debug messages
      log    Timestamp log messages
    Switch(config)#service timestamps log?
    log  
    Switch(config)#service timestamps log ?
      datetime  Timestamp with date and time
    Switch(config)#service timestamps log datetime ?
      msec  Include milliseconds in timestamp
    Switch(config)#service timestamps log datetime msec

#### NTP

Often a good idea so all devices are synchronised.

    batcave(config)#ntp ?
      authenticate        Authenticate time sources
      authentication-key  Authentication key for trusted time sources
      server              Configure NTP server
      trusted-key         Key numbers for trusted time sources
      update-calendar     Configure NTP to update the calendar.
    batcave(config)#ntp server 10.1.1.4

Some versions of IOS allow you to specify the version number (`ntp server <ip> version 4` say).

You can verify the status as such:

    batcave#show ntp status
    Clock is unsynchronized, stratum 16, no reference clock
    nominal freq is 000.0000 Hz, actual freq is 000.0000 Hz, precision is 0**00
    reference time is 00000000.00000000 (00:00:00.000 UTC Mon Jan 1 1990)
    clock offset is 0.00 msec, root delay is 0.00  msec
    root dispersion is 0.00 msec, peer dispersion is 0.00 msec.

#### Cisco Discovery Protocol (CDP)

    batcave#sh cdp
    Global CDP information:
        Sending CDP packets every 60 seconds
        Sending a holdtime value of 180 seconds
        Sending CDPv2 advertisements is enabled

It's turned on/off with `cdp run`/`no cdp run`.

Useful to map the network:

    batcave#show cdp neighbors 
    Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                      S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone
    Device ID    Local Intrfce   Holdtme    Capability   Platform    Port ID
    Switch       Gig 0/0          130            S       2960        Gig 0/1

And add more details as required:

Switch#show cdp neighbors detail

    Device ID: batcave
    Entry address(es): 
      IP address : 192.168.0.1
    Platform: cisco C2900, Capabilities: Router
    Interface: GigabitEthernet0/1, Port ID (outgoing port): GigabitEthernet0/0
    Holdtime: 176
    
    Version :
    Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.1(4)M4, RELEASE SOFTWARE (fc2)
    Technical Support: http://www.cisco.com/techsupport
    Copyright (c) 1986-2012 by Cisco Systems, Inc.
    Compiled Thurs 5-Jan-12 15:41 by pt_team
    
    advertisement version: 2
    Duplex: full

This is identical to `show cdp entry *`.

There's a non proprietary discovery protocol called Link Layer Discovery Protocol (802.1AB).

#### Host table

You can add a static mapping:

    SW_SUBNET_B(config)#ip host RT_SALES 192.168.1.17
    SW_SUBNET_B(config)#do show hosts
    Default Domain is not set
    Name/address lookup uses domain service
    Name servers are 255.255.255.255
    
    Codes: UN - unknown, EX - expired, OK - OK, ?? - revalidate
           temp - temporary, perm - permanent
                  NA - Not Applicable None - Not defined
    
                  Host                      Port  Flags      Age Type   Address(es)
                  RT_SALES                  None  (perm, OK)  0   IP      192.168.1.17

`perm` means the entry was added manually, and `temp` means it was resolved by DNS.

Removal is done via `no ip host`.

#### DNS

    SW_SUBNET_A(config)#ip domain-lookup
    SW_SUBNET_A(config)#ip name-server ?
     A.B.C.D  Domain server IP address
      SW_SUBNET_A(config)#ip name-server 192.168.1.11
      SW_SUBNET_A(config)#end
      SW_SUBNET_A#
      %SYS-5-CONFIG_I: Configured from console by console

      SW_SUBNET_A#ping foo
      Translating "foo"...domain server (192.168.1.11)
      Type escape sequence to abort.
      Sending 5, 100-byte ICMP Echos to 192.168.1.1, timeout is 2 seconds:
      !!!!!
      Success rate is 100 percent (5/5), round-trip min/avg/max = 0/0/1 ms

You can see it resolved `foo` via our DNS (192.168.1.11). A `show hosts` will list the entry (as `temp`, as it is not static):

    SW_SUBNET_A#show hos
    Default Domain is not set
    Name/address lookup uses domain service
    Name servers are 192.168.1.11
    
    Codes: UN - unknown, EX - expired, OK - OK, ?? - revalidate
           temp - temporary, perm - permanent
                  NA - Not Applicable None - Not defined
    
                  Host                      Port  Flags      Age Type   Address(es)
                  foo                       None  (temp, OK)  0   IP      192.168.1.1

Technically you should add `ip domain-name yourdomain` so as not to type fully qualified domain names (like `foo.yourdomain.com`).

#### Debug

Enable in privileged mode with `debug ?`. A `debug all` will be a drag on system resources.

    SW_SUBNET_A#debug ip icmp
    ICMP packet debugging is on
    SW_SUBNET_A#ping foo
    
    Type escape sequence to abort.
    Sending 5, 100-byte ICMP Echos to 192.168.1.1, timeout is 2 seconds:
    !
    ICMP: echo reply rcvd, src 192.168.1.1, dst 192.168.1.2
    !
    ICMP: echo reply rcvd, src 192.168.1.1, dst 192.168.1.2
    !
    ICMP: echo reply rcvd, src 192.168.1.1, dst 192.168.1.2
    !
    ICMP: echo reply rcvd, src 192.168.1.1, dst 192.168.1.2
    !
    Success rate is 100 percent (5/5), round-trip min/avg/max = 0/0/1 ms
    
    SW_SUBNET_A#
    ICMP: echo reply rcvd, src 192.168.1.1, dst 192.168.1.2

### OSPF

You can reset OSPF with `clear ip ospf process`.


`show ip ospf interface <int>` provides important information, like the network type. A BROADCAST type would have a DR and BDR. Note the `State BDR` below, indicating what the *current* router is.

    Router1# show ip ospf interface ethernet 0
    Ethernet0 is up, line protocol is up 
      Internet Address 10.10.10.1/24, Area 0 
      Process ID 1, Router ID 192.168.45.1, Network Type BROADCAST, Cost: 10
      Transmit Delay is 1 sec, State BDR, Priority 1 
      Designated Router (ID) 172.16.10.1, Interface address 10.10.10.2
      Backup Designated router (ID) 192.168.45.1, Interface address 10.10.10.1
      Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
        Hello due in 00:00:06
      Index 1/1, flood queue length 0
      Next 0x0(0)/0x0(0)
      Last flood scan length is 2, maximum is 2
      Last flood scan time is 0 msec, maximum is 4 msec
      Neighbor Count is 1, Adjacent neighbor count is 1 
        Adjacent with neighbor 172.16.10.1  (Designated Router)
      Suppress hello for 0 neighbor(s)

The priority of an interface (above is `Priority 1`) dictates which router is selected as the DR. Default is 1, can be 255. If 0, it isn't considered. It is set as follows:

    LabC(config)#int g0/0
    LabC(config-if)#ip ospf ?
      authentication      Enable authentication
      authentication-key  Authentication password (key)
      cost                Interface cost
      dead-interval       Interval after which a neighbor is declared dead
      hello-interval      Time between HELLO packets
      message-digest-key  Message digest authentication password (key)
      priority            Router priority
    LabC(config-if)#ip ospf priority ?
      <0-255>  Priority
    LabC(config-if)#ip ospf priority 4

We can also learn about the OSPF neighbours:

    Router2# show ip ospf neighbor 
    
    Neighbor ID     Pri    State      Dead Time    Address     Interface
    192.168.45.1    1      FULL/DR    00:00:36     10.0.0.1    Ethernet0

`Pri` is the priority discussed above. `State` indicates Router2 is FULLy adjacent, and `DR` is what it is.

#### Gotchas

All OSPF routers in the same area must have the same timer intervals - to the second. Otherwise they won't be able to form adjacencies.

### Switchport

Switchport can only be enabled on `access` or `trunk` ports. By default ports are set to `dynamic` (they can be either `access` or `trunk`).

Note that to enable it in the first place, you need to enter `switchport port-security <cr>`. You can check the status via `show port-security int <int>`:

    S3(config-if-range)#do show port-sec int f0/5
    Port Security              : Disabled
    Port Status                : Secure-down
    ...

If `Port Security` is `Disabled`, it means it wasn't enabled. A port will become `Secure-up` when a host is connected.

Setting `switchport port-security mac-address sticky` will force the switch to learn the MAC addresses it sees on a port and store them as `STATIC`:

              Mac Address Table
    -------------------------------------------
    
    Vlan    Mac Address       Type        Ports
    ----    -----------       --------    -----
    
       1    0060.704b.ade0    DYNAMIC     Fa0/2
       1    00e0.a3b8.9824    STATIC      Fa0/1

To make this permanent, a `copy run start` is required.

You can see a switchport status with `show port-security`:

    SW1#show port-security 
    Secure Port MaxSecureAddr CurrentAddr SecurityViolation Security Action
                   (Count)       (Count)        (Count)
    --------------------------------------------------------------------
            Fa0/1        1          1                 0         Shutdown

If the security action is `Shutdown` and a security violation occurs, the port needs to be reset with `shut;no shut`.

Using `violation restrict` and `violation protect` both drop unauthorised frames once the maximum number of MAC addresses has been reached. However `restrict` increases the `SecurityViolation` counter, and along with `shutdown` they will send SNMP alerts.


### Trunking

If an interface isn't showing up in `show vlan`, it's probably because it's in `trunk` mode.

Do trunk frames communicate over the native VLAN? I think they do - over the native VLAN.

### ACLs

When using wildcards, each block size must start at either 0 or a multiple. E.g. if the block size is 32, you can't start at 5.

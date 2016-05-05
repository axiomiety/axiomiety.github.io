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

#### Misc

The appliances should have their own versions of `ping` and `traceroute`. The former has some funnky options that allow you to set things like the datagram size.

`telnet` is also included.

`logging synchronous` stops the console from overriding what you are typing.

A router will not (usually) allow a telnet user to enter privilege mode *unless* `enable password` or `enable secret` has been set. That's sensible!

All interfaces are shut down on a router by default.


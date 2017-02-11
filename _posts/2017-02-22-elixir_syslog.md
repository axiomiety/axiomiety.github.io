---
layout: post
title: Elixir-Syslog
excerpt: "Creating a custom syslog logger for Elixir."
categories: [tech]
tags: [elixir, howto]
comments: false
---

Elixir has a Logger module used for, well, logging. By default however there is no integration with syslog. Thankfully for us, the syslog protocol is both simple and lenient. We'll build a small implementation to seamlessly send our logging messages to syslog.

The RFC for syslog is available here: https://tools.ietf.org/html/rfc5424#section-6.1

## Syslog preliminaries

The first thing to check is whether you have `syslog` listening for incoming messages.

``` shell
vagrant@vagrant:~$ netstat -a -u
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
udp        0      0 *:bootpc                *:*
```

`syslog` listens on UDP port 514, and clearly it's not open. If you're using Debian/Ubuntu you'll need to update `/etc/rsyslog.conf` and uncomment the last 2 lines of the section below:

``` shell
# provides UDP syslog reception
#module(load="imudp")
#input(type="imudp" port="514")
```

Followed by a `service rsyslog restart`. Running the same command above, we see we're now listening in!

``` shell
vagrant@vagrant:~$ netstat -a -u
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
udp        0      0 *:syslog                *:*
udp        0      0 *:bootpc                *:*
udp6       0      0 [::]:syslog             [::]:*
```

Now that we have this out of the way, how do we exactly publish a message? That's where `nc` comes in. As per the protocol defined [here](https://tools.ietf.org/html/rfc5424) a message *must* start with `<facility*8+severity>`, where `facility` and `severity` are both numbers from 0 to 23 and 0 to 7 respectively (the meanings of which are defined in the RFC).

``` shell
vagrant@vagrant:/shared/crashburn$ echo '<14>the quick brown fox' | nc -v -w1 -u localhost 514
Connection to localhost 514 port [udp/syslog] succeeded!
vagrant@vagrant:/shared/crashburn$ tail -1 /var/log/syslog
Feb 11 06:47:45 the quick brown fox
```

(If you're generating a lot of messages, you're probably better off using `tail -f`)

First we need to make sure we have syslog up and running.

We can tail our logs and make sure this works as expected:


``` shell
echo ...
tail var log ...
```

So in theory, sending messages to syslog shouldn't be much more complex than that!

## Creating a UDP connection to syslog

To make things simple


## Wiring this up with the logger

https://hexdocs.pm/logger/Logger.html

## Validation

Logger.add_backend

https://github.com/onkel-dirtus/logger_file_backend
http://reganmian.net/blog/2015/08/26/email-notifications-about-errors-in-elixir/


## References
https://github.com/elixir-lang/elixir/blob/master/lib/logger/lib/logger/backends/console.ex
http://andrealeopardi.com/posts/handling-tcp-connections-in-elixir/
http://stackoverflow.com/questions/15015450/erlang-gen-udp-sending-packets-to-ip-address


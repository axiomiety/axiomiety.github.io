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

Note that if you're generating a lot of messages, you're probably better off using `tail -f`. So in theory, sending messages to syslog shouldn't be much more complicated than opening a UDP connection to 514 and sending in a message (famous last words!).

## Creating a UDP connection to syslog

To connect to the syslog server we'll need to create a UDP connection. For this we leverage Erlang's `gen_udp` module:

``` shell
iex(10)> {ok, Socket} = :gen_udp.open(514)
** (MatchError) no match of right hand side value: {:error, :eacces}
```

Woops - it turns out that 514 is a privileged port! As such we can either start `iex` as root or create a pipe from a non-privilege port to 514. Either option works but the latter meant I didn't have to restart the shell. To kick this off, run `socat udp4-listen:5514,reuseaddr,fork udp4-sendto:127.0.0.1:514` which will redirect port 5514 to 514 on localhost. With this in place, let's try again:

``` shell
iex(8)> {:ok, socket} = :gen_udp.open(5514, [:binary, reuseaddr: true])
{:ok, #Port<0.4894>}
iex(9)> :gen_udp.send(socket, {127,0,0,1}, 514, "<14>pluto elixir is sending a message")
:ok
```

And looking at syslog:

``` shell
vagrant@vagrant:~$ tail -1 /var/log/syslog
Feb 11 18:15:59 pluto elixir is sending a message
```

We now need to integrate the above with the `Logger` module.

## Wiring this up with the logger

This isn't a tutorial on the `Logger` module but in a nutshell it can be used as such:

``` shell
iex(10)> require Logger
Logger
iex(11)> Logger.info("this is a message at the info level")

18:20:36.895 [info]  this is a message at the info level
:ok
```

The module is documented [here](https://hexdocs.pm/logger/Logger.html) and by default uses the `:console` backend. We'll use the [source code](https://github.com/elixir-lang/elixir/blob/master/lib/logger/lib/logger/backends/console.ex) for `:console` as a template. We start by creating `init` and `terminate` methods:

``` erlang
defmodule SyslogLogger do

  @behaviour :gen_event

  def init(o) do
    IO.puts("init received #{inspect o}")
    {:ok, {}}
  end

  def terminate(_reason, _state) do
    :ok
  end

end
```

Which, as expected, doesn't do much at all:

``` shell
iex(26)> Logger.add_backend(SyslogLogger)
init received SyslogLogger
{:ok, #PID<0.158.0>}
iex(27)> Logger.remove_backend(SyslogLogger)
:ok
```

Custom backends implement `gen_event`. We change that to take a port number as a configuration option, and create a UDP connection:

``` erlang
defmodule SyslogLogger do

  @behaviour :gen_event

  def init({__MODULE__, portnumber}) do
    IO.puts("init received #{inspect portnumber}")
    state = %{socket: nil, port: nil}
    {:ok, init(portnumber, state)}
  end

  defp init(portnumber, state) do
    {:ok, socket} = :gen_udp.open(portnumber, [:binary, reuseaddr: true])
    %{state | port: portnumber, socket: socket}
  end

  def handle_event(_event, state) do
    {:ok, state}
  end

  def terminate(_reason, %{socket: socket} = state) do
    IO.puts("closing the socket: #{inspect socket}")
    :gen_udp.close(socket)
  end

end
```

Again, not much to see - the meat of the logger is in the `hande_event` call, which we define as follows:

``` erlang
  def handle_event({level, _gl, {Logger, msg, ts, md}}, state) do
    IO.puts("sending #{msg} to syslog")
    ret = :gen_udp.send(state.socket, {127,0,0,1}, state.port, "<14>#{msg}")
    {:ok, state}
  end
```

This does nothing more than send `msg` across to syslog, with a pre-canned loglevel. We confirm this works as expected:

``` erlang
ex(89)> Logger.add_backend({SyslogLogger, 5514})
init received 5514
connected to 5514 with socket #Port<0.4836>
{:ok, #PID<0.237.0>}
iex(90)> Logger.info("foobar")

21:05:17.205 [info]  foobar
sending foobar to syslog
:ok
iex(91)> Logger.remove_backend({SyslogLogger, 5514})
closing the socket: #Port<0.4836>
:ok
```

And looking at syslog:

``` shell
vagrant@vagrant:/shared/crashburn$ tail -1 /var/log/syslog                                               │
Feb 12 21:05:17 foobar   
```

# Conclusion

This is a very crude logger that does not even respect the log level - it simply forwards messages to syslog with a canned severity level - and making the necessary changes to take this into account (as well as logging to a remote syslog server) is left as an exercise to the reader (!). Regardless it should hopefully highlight the simplicity with which one can plug in their own backends into the `Logger` module.

## References

  * https://github.com/elixir-lang/elixir/blob/master/lib/logger/lib/logger/backends/console.ex
  * http://elixir-lang.org/getting-started/mix-otp/task-and-gen-tcp.html
  * http://andrealeopardi.com/posts/handling-tcp-connections-in-elixir/
  * https://github.com/onkel-dirtus/logger_file_backend
  * http://reganmian.net/blog/2015/08/26/email-notifications-about-errors-in-elixir/

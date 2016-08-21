---
layout: default
title: writeups/bandit
category: pages
---

[overthewire / bandit](http://www.overthewire.org/wargames/bandit/)

When I first took a look at bandit, I thought it'd be too easy. But I didn't want to miss out on the opportunity to (re)learn a thing or two, so there it is.

## Level 0 ##

Not much to say there - used to bootstrap the game.

## Level 1 ##

As it says on the tin.

## Level 2 ##

This is getting a bit more interesting as `-` is an alias for standard input. My first thought was to read the file using its inode number - but it seems that's not entirely doable (well, you can use `ls -i` and then `find -inum`, but it's not much use). However specifying the full path of the file to `cat` did the trick (`cat ./-`).

## Level 3 ##

Use double-quotes when you have spaces in filenames (I make sure all my files use underscores instead - so much simpler...)

## Level 4 ##

File is hidden - and will show with the `-a` switch.

## Level 5 ##

A quick `ls -l` shows all files have the same size (heh - worth a try). But leveraging xargs makes it easy to identify the correct one: `ls -1 | xargs -i sh -c 'echo {}; cat ./{}'`

## Level 6 ##

For this one, it's worth reading the brief - we're told the file is 1033 bytes in size and non executable. Just use this as the filter for find: `find . -size 1033c ! -perm -o+x` (pretty cool way to negate permissions - hadn't seen that before).

## Level 7 ##

Along the same lines as above: `find / -size 33c -user bandit7 -group bandit6`

## Level 8 ##

Now it's turn to use grep: `grep millionth data.txt`

## Level 9 ##

There are 1001 lines in data.txt - but a quick `cat data.txt | sort | uniq -c`, to show the occurrence count, and we're on our way to the next level.

## Level 10 ##

Strings is our friend: `strings data.txt | grep ^=` though this doesn't yield the password straight away, because somehow the line with the password starts with G. I think that's a typo...

## Level 11 ##

Nothing fancy - file is encoded using base64. A simple `base64 -d data.txt` yields the password.

## Level 12 ##

Back to rot13! (cf krypton). `cat data.txt | tr [N-ZA-M] [A-Z] | tr [n-za-m] [a-z]`

## Level 13 ##

This is a little more fun - we start with a hex dump. I didn't you know xxd could (-r)everse it back into a binary, which is pretty cool. Using `file myfile` to examine the contents (or file header really), we end up with a series of gzip'ed files inside tar'd and bzip2's archives. After repeatedly uncompressing those, we finally end up with a text file containing the password.

## Level 14 ##

That's a bit of a weird one. Instead of a password, we're given a private key - which will allow us to log in as bandit14. The hint about localhost is a bit misleading - what I did was copy the private key locally into a file in `/var/tmp` (get the perms right - otherwise ssh will complain the key is 'too readable'), then specify it with `ssh -i /var/tmp/bandit14.key bandit14@bandit.labs.overthewire.org`.

## Level 15 ##

Do a `telnet localhost 30000` and input the password for level 14.

## Level 16 ##

When I first read the description, I thought I had it figured out. Turned out I was wrong. I never used openssl as a command line tool - anyhow, all that's required is `openssl s_client -connect localhost:30001` - and input the password for level 15. That's pretty cool though - I can definitely see how that'd be handy to test services over ssl.

## Level 17 ##

Right - now this getting interesting. There are a bunch of servers listening on a range of ports. Some of those support SSL, and we need to find out which. Sounds like nmap time!
So a `nmap localhost -p 31000-32000` yields 5 open ports. Iterating through those with the openssl command above and using our current password as input, we quickly find the one that returns the not a password, but another private key >_< So connecting like we did for level 14, we finally get hold of a password (`/etc/bandit_pass/bandit17` so we don't always have to use the private key).

## Level 18 ##

A quick diff on password.new and password.old shows two lines that differ. By a process of elimination, we obtain the password for bandit18.

## Level 19 ##

That one's a bit weird. So .bashrc has been modified to log you out as soon as you log in. But a quick ctrl+c prevents this from being executed and drops you in a shell. But I think the proper way to do this is to pass a command to ssh (eg, /bin/sh) to bypass the interactive login. Whatever works right?

## Level 20 ##

We are provided with a setuid binary. We use this to escalate our privileges by: `./bandit20-do /bin/sh` - this drops us into a shell with the group permissions of bandit20, allowing us to read `/etc/bandit_pass/bandit20`

## Level 21 ##

A wee bit more involved. I got confused by the 'you need to log in twice bit' before finally understanding this level requires you to do two things. First, run a netcat server locally (`nc -l localhost 12345`). Then running the setuid binary to connect to 12345. From your netcat server, input the password for bandit20. The binary will read it and send back the password for bandit21.

## Level 22 ##

This level requires us to take a look at the cronjob run as bandit22. The job definition is straight forward - it cats the bandit22 password to a temp file. We just need to read the temp file and voila.

## Level 23 ##

Along the same lines as 22, we have a cronjob that executes a script. Looking at the script, we see the password gets written to a file defined by the md5 hash of the output of a command. Executing that particular command yields the name of the file in /tmp. It's worth remembering this script runs as bandit23 - not bandit22.

## Level 24 ##

In this level, a cron file executes all scripts in a particular directory before removing them. Examining the crontab, we see it'll run every minute of every day - forever (`* * * * *` in the time specifier). The job executes everything in `/var/spool/bandit24` before deleting everything. All we need to do is write a short script that'll cat the bandit24 password to an area we can read freely:

    #!/bin/sh
    cat /etc/bandit_pass/bandit24 > /tmp/myuniquefile

Copy that script into `/var/spool/bandit24`, wait a minute or so and myuniquefile will contain the desired password.


### Takeaway Notes ###

Although short-lived, this was a lot of fun. It's not particularly complicated, but I definitely learnt a thing or two (xxd, openssl, ...) so mission accomplished!



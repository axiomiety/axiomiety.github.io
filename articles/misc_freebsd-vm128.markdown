---
layout: default
title: articles/freebsd-vm128
category: pages
---

## Installing FreeBSD 9.1 on a KVM VPS with 128MB RAM ##

I have a VPS with 128MB's worth of RAM. It's a KVM so it's as much as I'll ever get. I installed FreeBSD 9.0 on the box a while ago but decided it was time for a fresh start. As I was going through the installation process I came across this:

![out of swap space](../images/freebsd_vm128/vm128_freebsd9.1_out_of_swap_space.png)

I was stomped. Not enough swap? This was a minimal install and I had just created a 512MB swap partition during the installation process - it was only unpacking the kernel.

A bit of research led to me to understand that even though the swap parition was alive and well, it wasn't being used - and the 128MB of RAM was getting used up in no time.

Now FreeBSD is nothing if not flexible, so here is how I worked around the issue.

When asked about disk paritioning, drop in the shell. If you're used to fancy GUIs it's a bit like a cold shower - but it's really powerful.

![paritioning prompt](../images/freebsd_vm128/vm128_freebsd9.1_2.png)

First thing first - we remove whatever was left behind and create a brand new label (note there's only one disk, so it simplifies things a bit):

![gpart 1](../images/freebsd_vm128/vm128_freebsd9.1_5.png)

We then create the partitions. Now YMMV but my needs are pretty simple. I just need a boot partition, a swap one, and one for `/`. Note that I left the `-s` out for the `gptroot` partition so it fills up the remaining space:

![gpart 2](../images/freebsd_vm128/vm128_freebsd9.1_7.png)

Format `/` using `newfs` and mount it - otherwise the installer will stall with some weird error regarding `user=0`:

![gpart 3](../images/freebsd_vm128/vm128_freebsd9.1_8.png)

Finish off by enabling the swap parition:

    # swapon /dev/gpt/gptswap
    
and voila! The installer will continue and use the swap partition as and when required.

_`gpart` help found from [wonkity](http://www.wonkity.com/~wblock/docs/html/disksetup.html)_

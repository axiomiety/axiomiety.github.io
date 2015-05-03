---
layout: default
title: articles/vagrant-into
category: pages
---

So it turns out that building VMs from scratch is a thing of the past. Instead, [vagrant](http://www.vagrantup.com) is the way to go!

### First steps

Get vagrant from the link above - it's an install which, if you're on Windows, will require you to reboot. I should note, you'll need to have virtualbox installed first. I'm pretty sure you can use other VM providers, but this one is pretty standard and well supported.

I like to keep things (somewhat) organised, so I changed the default working directory for vagrant to `VAGRANT_HOME=u:\virt\vagrant` (under Windows you can set those permanently via Control Panel -> Environment Variables). You can find more about vagrant's environment variables [here](http://docs.vagrantup.com/v2/other/environmental-variables.html).

Once done, add a default box:

    vagrant box add precise64 http://files.vagrantup.com/precise64.box

Which will show something like:

    C:\bin\Console2>vagrant box add precise64 http://files.vagrantup.com/precise64.box
    ==> box: Adding box 'precise64' (v0) for provider:
        box: Downloading: http://files.vagrantup.com/precise64.box
        box: Progress: 1% (Rate: 465k/s, Estimated time remaining: 0:17:47))

Go grab a coffee in the meantime.

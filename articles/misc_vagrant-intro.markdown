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

Once all of that is ready, you'll need to do a `vagrant init` to initialise the box. This does nothing more than create a default configuration file (called Vagrantfile) in *your current directory* (so watch out).

The defaults sound, and the only section I changed is the below:

    config.vm.box = "precise64"

and:

    config.vm.provider "virtualbox" do |vb|
      # Display the VirtualBox GUI when booting the machine
      vb.gui = false
      # Customize the amount of memory on the VM:
      vb.memory = "512"
    end

(We'll worry about sharing data between the host and the guest later)

Do a `vagrant up`, and you're up and running (no pun intented):

    U:\virt\vagrant>vagrant up
    Bringing machine 'default' up with 'virtualbox' provider...
    ==> default: Importing base box 'precise64'...
    ==> default: Matching MAC address for NAT networking...
    ==> default: Setting the name of the VM: vagrant_default_1430691171637_21594
    ==> default: Clearing any previously set network interfaces...
    ==> default: Preparing network interfaces based on configuration...
    default: Adapter 1: nat
    ==> default: Forwarding ports...
    default: 22 => 2222 (adapter 1)
    ==> default: Running 'pre-boot' VM customizations...
    i==> default: Booting VM...
    ==> default: Waiting for machine to boot. This may take a few minutes...

Time to log into the box!

    U:\virt\vagrant>vagrant ssh
    `ssh` executable not found in any directories in the %PATH% variable. Is an
    SSH client installed? Try installing Cygwin, MinGW or Git, all of which
    contain an SSH client. Or use your favorite SSH client with the following
    authentication information shown below:
    
    Host: 127.0.0.1
    Port: 2222
    Username: vagrant
    Private key: U:/virt/vagrant/.vagrant/machines/default/virtualbox/private_key

Oh wait... Okay - time to fire up PuTTY. But reforehand note that the 'Private key' defined above is not directly compatible with PuTTY (see [here](https://github.com/Varying-Vagrant-Vagrants/VVV/wiki/Connect-to-Your-Vagrant-Virtual-Machine-with-PuTTY) for more info - you'll have to use PuTTYgen to convert between formats).

Set up the key as such:

![vagrant_putty](../images/vagrant_putty.png)

And voila - you're in!

    login as: vagrant
    Authenticating with public key "imported-openssh-key"
    Welcome to Ubuntu 12.04 LTS (GNU/Linux 3.2.0-23-generic x86_64)
    
     * Documentation:  https://help.ubuntu.com/
     New release '14.04.2 LTS' available.
     Run 'do-release-upgrade' to upgrade to it.
    
     Welcome to your Vagrant-built virtual machine.
     Last login: Fri Sep 14 06:23:18 2012 from 10.0.2.2
     vagrant@precise64:~$

### Building something useful

We can now everything we need to do to turn this fresh VM into a useable machine - like installing packages, setting up dot files etc... and package it up with `vagrant package --base my-cool-new-machine`. This will essentially turn what we did into a template. We are now free to use the box as we see fit. Let's give this a try by installing `git` on the box (via `sudo apt-get install git`).

To package a box, we only need to run `vagrant package --base <box_name>`. The trouble I had was that `<box_name>` wasn't what I thought it was. It's actually the name virtualbox gives the VM. So how do we get hold of that? `VBoxManage` to the rescue:

    c:\Program Files\Oracle\VirtualBox>VBoxManage list vms
    "vagrant_default_1430691171637_21594" {1a7089f0-fd7e-49c3-9744-443ef261edc0}

(`VBoxManage.exe` is probably not in your path - just go to the virtualbox install directory and it should be there)

Shut down your VM (or vagrant will do it for you) and run:

    U:\virt\vagrant>vagrant package --base vagrant_default_1430691171637_21594
    ==> vagrant_default_1430691171637_21594: Attempting graceful shutdown of VM...
    vagrant_default_1430691171637_21594: Guest communication could not be established! This is usually because
    vagrant_default_1430691171637_21594: SSH is not running, the authentication information was changed,
    vagrant_default_1430691171637_21594: or some other networking issue. Vagrant will force halt, if
    vagrant_default_1430691171637_21594: capable.
    ==> vagrant_default_1430691171637_21594: Forcing shutdown of VM...
    ==> vagrant_default_1430691171637_21594: Clearing any previously set forwarded ports...
    ==> vagrant_default_1430691171637_21594: Exporting VM...
    ==> vagrant_default_1430691171637_21594: Compressing package to: U:/virt/vagrant/package.box

And you'll see a `package.box` file in the local directory.

So now what? We first need to register it with vargant:

    U:\virt\vagrant>vagrant box add box_with_git package.box
    ==> box: Adding box 'box_with_git' (v0) for provider:
        box: Downloading: file://U:/virt/vagrant/package.box
        box: Progress: 0% (Rate: 0/s, Estimated time remaining
        box: Progress: 25% (Rate: 227M/s, Estimated time remaining
        box: Progress: 41% (Rate: 58.1M/s, Estimated time remaining
        box: Progress: 98% (Rate: 130M/s, Estimated time remaining
        box: Progress: 100% (Rate: 118M/s, Estimated time remaining
        box: :--:--)
    ==> box: Successfully added box 'box_with_git' (v0) for 'virtualbox'!

### Automata Extraordinaire


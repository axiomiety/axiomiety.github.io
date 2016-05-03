---
layout: default
title: llog - cisco ios
category: pages
---

#### Prompts

`>` is user exec mode (usermode). Usually used to view stats. `#` is privileged exec mode. Accessed using `enable`.

    Switch>enable
    Switch#

Come out with `disable`.

    Switch#disa
    Switch>

#### Login

Type `logout` to log out.

#### Configuration modes

To make global changes, you need to be in privileged mode and type `configure terminal`. This enters the global configuration mode.

    Switch>config terminal
    ^
    % Invalid input detected at '^' marker.
      
    Switch>en
    Switch#config t
    Enter configuration commands, one per line.  End with CNTL/Z.
    Switch(config)#

Changes done there *are only applicable to the running config (DRAM)*. To make the changes permanent, they need to be copied to NVRAM (non-volatile RAM) - otherwise they won't survive a reboot.

Note that you can change the clock in privileged mode (no need to be in global conf mode).

To configure a particular interface, use the `interface` cmd when in global conf mode:

    Switch(config)#interface ?
      Ethernet         IEEE 802.3
      FastEthernet     FastEthernet IEEE 802.3
      GigabitEthernet  GigabitEthernet IEEE 802.3z
      Port-channel     Ethernet Channel of interfaces
      Vlan             Catalyst Vlans
      range            interface range command

Need to specify the type and port:

    Switch(config)#int fa ?
      <0-9>  FastEthernet interface number
    Switch(config)#int fa 0?
    /  
    Switch(config)#int fa 0/?
      <0-24>  FastEthernet interface number
    Switch(config)#int fa 0/1
    Switch(config-if)#

You can also configure the `line` used (console, VTY):

    Switch(config)#line console ?
      <0-0>  First Line number
    Switch(config)#line console 0
    Switch(config-line)#

`line console 0` is a global (major) command.

#### Privelged mode commands

Set the clock with `clock set 14:01:04 1 december 2020`.

#### Global configuration mode commands

Set the hostname with `hostname batcave`:

    Switch(config)#hostname batcave
    batcave(config)#

Set the login banner:

    batcave(config)#banner ?
      motd  Set Message of the Day banner
    batcave(config)#banner motd ;
    Enter TEXT message.  End with the character ';'.
    waza
    ;

If you then do a logout, you'll see 'waza'. You can also do it on one line `banner motd ; waza ;`.

Setting passwords:

batcave(config)#enable ?
  password  Assign the privileged level password
  secret    Assign the privileged level secret

Don't use password (like enable password foobar) - it's unencrypted and will show via `show running-config`:

    batcave#show running-config
    Building configuration...
    
    Current configuration : 1035 bytes
    !
    version 12.1
    no service timestamps log datetime msec
    no service timestamps debug datetime msec
    no service password-encryption
    !
    hostname batcave
    !
    enable password foobar

Set the console password with `line console 0`:

batcave(config)#line console 0
batcave(config-line)#password console
batcave(config-line)#login

If you follow this by a logout, it'll ask you for the password to log in. *This is not the same password to enter privileged mode* - just a password to log into the switch. And yes, it'll still be in clear in the config.
#### Show commands

`show history` - last 20 commands by default.

`show terminal` - term config

`terminal history size <0-256>` - set terminal history size.

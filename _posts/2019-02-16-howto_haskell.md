---
layout: post
title: haskell-dev-env-win10
excerpt: "Getting a Haskell development environment on Windows 10"
categories: [coding]
tags: [haskell, howto]
comments: false
---

If you're new to Haskell (or want to spruce things up a bit), it's possible to get a decent development environment on Windows 10. Specifically, we're talking using [stack](https://docs.haskellstack.org/en/stable/README/), [Visual Studio Code](https://code.visualstudio.com) and the  [Haskero](https://marketplace.visualstudio.com/items?itemName=Vans.haskero) extension.

# A Haskell Development Environment on Windows 10

## WSL

Okay so the Win10 part was a bit misleading. I *did* try to get all this set up and entered a number of issues. `stack` worked more or less fine but building `Haskero` became tricky. And all this pollutes your Win10 filesystem for when the dependencies are readily available on Linux  (I'm looking at you, [MSYS](http://www.mingw.org/wiki/MSYS)).

I found it much cleaner to use the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10). This is easy to install, clobber, mess around with and re-install - by default it will install Ubuntu. Assuming you have this, the rest is relatively straightforward

## Stack & GHC

The first step is to get `stack` installed. Ubuntu comes with a package (`sudo apt-get install haskell-stack`). If you want the latest and greatest you can run the install script straight from haskellstack: `wget -qO- https://get.haskellstack.org/ | sh` (if you're worried about what that does, just navigate to https://get.haskellstack.org to view the contents of the script).

Once you have this navigate to your workspace area and do `stack new sampleproject` (note package names don't include underscores - `stack` will complain if you try to call it with e.g. `stack new sample_project`). If this is the first time you're running it `stack` will fetch `GHC`. A bit like Python's `venv`, `stack` will ensure dependencies are local to your project so as not to conflict with other requirements - but unlike Python it goes an grab the actual compiler (akin to what a `conda` env does I guess). 

If you were to call `stack build`, you'll see something like:

~~~ shell
Preparing to install GHC to an isolated location.
This will not interfere with any system-level installation.
ghc-8.6.3:  159.17 MiB / 171.03 MiB ( 93.06%) downloaded...
...
~~~

All of this is cached in `~/.stack` so subsequent projects will be a lot faster to create (peak inside `~/.stack/snapshots/x86_64-linux/lts-13.6/8.6.3/` if you're using `lts-13.6`). Regardless, you should then be able to run `stack ghci` and get something similar:

~~~ shell
axiomiety@freya:/mnt/c/shared/crashburn/hs/sampleproject$ ls
app  ChangeLog.md  LICENSE  package.yaml  README.md  sampleproject.cabal  Setup.hs  src  stack.yaml  test
axiomiety@freya:/mnt/c/shared/crashburn/hs/sampleproject$ stack ghci
Using main module: 1. Package `sampleproject' component exe:sampleproject-exe with main-is file: /mnt/c/shared/crashburn/hs/sampleproject/app/Main.hs
Building all executables for `sampleproject' once. After a successful build of all of them, only specified executables will be rebuilt.
sampleproject-0.1.0.0: configure (lib + exe)
Configuring sampleproject-0.1.0.0...
sampleproject-0.1.0.0: initial-build-steps (lib + exe)
The following GHC options are incompatible with GHCi and have not been passed to it: -threaded
Configuring GHCi with the following packages: sampleproject
GHCi, version 8.6.3: http://www.haskell.org/ghc/  :? for help
[1 of 2] Compiling Lib              ( /mnt/c/shared/crashburn/hs/sampleproject/src/Lib.hs, interpreted )
[2 of 2] Compiling Main             ( /mnt/c/shared/crashburn/hs/sampleproject/app/Main.hs, interpreted )
Ok, two modules loaded.
Loaded GHCi configuration from /tmp/haskell-stack-ghci/2abe07e4/ghci-script
*Main Lib>
~~~

If you're hitting  [https://s3.amazonaws.com/hackage.fpcomplete.com/](https://s3.amazonaws.com/hackage.fpcomplete.com/) and facing issues downloading packages, check out [this thread on GitHub](https://github.com/commercialhaskell/stack/issues/3088)  - you can tweak the `package-indices` section of your `stack` config.

That was probably the hardest bit!

## Installing VSCode on WSL

Assuming you're using Debian/Ubuntu, the best way to ensure your VSCode is kept up-to-date is to add the Microsoft repository to `apt` as described in the [offical documentation](https://code.visualstudio.com/docs/setup/linux) and to install the `code` package. Copy-pasting straight from there, this amounts to:

~~~ shell
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt-get install apt-transport-https
sudo apt-get update
sudo apt-get install code 
~~~

I didn't have to bother with `apt-transport-https` but your mileage might vary.

With this done, running `code` won't do anything - we need a display to forward the output to (not a console).

## Forwarding the display to Windows

The WSL is headless by default - that is, there are no screens 'directly' connected to it. It turns out not to be an issue - we just need to install a Windows XServer that will take care of displaying whatever the WSL tells it to.. [VxXsrv](https://sourceforge.net/projects/vcxsrv/) is a free one which works really well.

Once you have it installed you can launch the XServer. By default this should be `C:\Program Files\VcXsrv\vcxsrv.exe`. Once the main window appears select "One large window" followed by "Start no client". The next screen will be as below:

![xserver_config](../../img/haskell_devenv/xserver_config.png)

If you're facing issues with OpenGL you can try turning that option off but it should work out of the box - just take note of that extra variable we'll need to set: `export LIBGL_ALWAYS_INDIRECT=1`.

At this point you have a XWindow server waiting for instructions. Time to get VSCode!

We'll need to export two variables first to tell Linux where to forward this to:

~~~ shell
axiomiety@freya:/mnt/c/shared/crashburn/hs/sampleproject$ export DISPLAY=:0
axiomiety@freya:/mnt/c/shared/crashburn/hs/sampleproject$ export LIBGL_ALWAYS_INDIRECT=1
axiomiety@freya:/mnt/c/shared/crashburn/hs/sampleproject$ code
~~~

If all went well, you should now see a VSCode window popping up - all running on WSL. It is however possible you'll get something like `/usr/share/code/bin/../code: error while loading shared libraries: libasound.so.2: cannot open shared object file: No such file or directory`. That is easily resolved with an `apt-get install libasound2`.

## Haskero

We now have a fancy editor and a way to build Haskell programs. The [Haskero](https://marketplace.visualstudio.com/items?itemName=Vans.haskero) extension will allow us to having things like code-completion and other niceties we take for granted nowadays with modern IDEs like PyCharm or IntelliJ.

Before we install this however we'll need to build one of its dependencies, the `intero` package. Back in your `sampleproject`, issue a `stack build intero`. It will look a little like:

~~~ shell
axiomiety@freya:/mnt/c/shared/crashburn/hs/sampleproject$ stack build intero
random-1.1: configure
random-1.1: build
Cabal-2.4.1.0: download
haskeline-0.7.5.0: download
network-2.8.0.0: download
haskeline-0.7.5.0: configure
haskeline-0.7.5.0: build
network-2.8.0.0: configure
random-1.1: copy/register
syb-0.7: download
network-2.8.0.0: build
...
~~~

Once done, go back to VSCode. Open up the plugins tool (it's the little square inside a bigger square on the left-hand-side) and search for `Haskero`:

![haskero_install](../../img/haskell_devenv/haskero_install.png)

Don't forget to reload/re-launch VSCode for the changes to take effect. And voila!


![vscode_haskero](../../img/haskell_devenv/vscode_haskero.png)

## Taking this further

You probably don't want to export those environment variables every time you start a new shell/reboot your system. Add those to your `~/.bashrc` instead.

## References

This only scratches the surface of what you can do with the tools listed above. The `stack` documentation particularly is well worth the read.

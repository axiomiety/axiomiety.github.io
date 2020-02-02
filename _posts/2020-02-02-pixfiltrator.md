---
layout: post
title: pixfiltrator
excerpt: "A small tool to exfiltrate files from a remote session using pixels"
categories: [coding]
tags: [howto]
comments: false
---

In a number of corporate environments, the usual exfiltration channels (e.g. email, web uploads, ...) are both actively monitored and restricted. Whilst some companies only allow remote access via a company-issued laptop and VPN, some allow remote connections in (usually via the likes of Citrix). This gives rise to an interesting use-case whereby we control the host but not the guest.

# Problem statement

The aim is to find an out-of-band channel through which we can exfiltrate files with 100% accuracy, using only the tools available on the guest. This means installing things like Python is usually out of the question as they either get flagged or flatly blocked - and tools like Powershell would look very out of place on say, a financial controller's PC.

There is however a very powerful toolset pretty much guaranteed to be installed on a user's PC - a browser with a JS console. Will that be sufficient? Challenge accepted...

# Ze masterplan

A file is nothing more than a collection of bytes. By converting each byte to a colour (or in our case, each half-byte), it's a bit like colouring a chessboard where square A1 represents the first byte, A2 the 2nd etc... - and maybe `0x0f` is represented as red, `0xee` as blue etc...

The host is tasked with identifying where that chessboard is being displayed, parsing each square back into its respective byte, and re-assembling the file.

Here is what a file composed of `0x00` to `0xff` looks like, with each half-byte represented by a square (so `0x0`, `0x0`, `0x0` `0x1` for `0x00` `0x01` respectively):

![0 to 255](../../img/pixfiltrator/0_to_255.png)

## The guest

The key component behind this is the `canvas` element in HTML5. Drawing a coloured square is as simple as:

~~~ javascript
ctx.beginPath();
ctx.rect(startX, startY, sqWidth, sqWidth);
ctx.fillStyle = '#000000';
ctx.fill();
ctx.closePath();
~~~

## The host

## References

The project is available [here](https://github.com/axiomiety/pixfiltrator).

Forks and MR are actively encouraged!

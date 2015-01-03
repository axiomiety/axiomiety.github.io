---
layout: default
title: writeups
category: pages
---

I'm a big fan of wargames - they always strike me as a great way to build up know-how and more importantly, just a fun way to learn about new things. Barrier to entry is limited by how much time you can dedicate to the game and not much else. Apart from a shell and an inquisitive mind, there isn't much else required.

The below are mainly writeups. They provide a full working solutions, and aren't particularly helpful if you're only looking for hints to point you in the right direction. I am currently experimenting with adding hints using overlays and the ability to toggle writeups - check out [Natas](natas.html) to see what that looks like.

#### [CryptoPals](http://www.cryptopals.com/) ####

This was a challenge started by [Matasano](http://matasano.com/) which started back in April 2013. The terms of the challenge meant writeups weren't possible - but this has since been relaxed once solutions were published by Matasano. Where possible I have tried to localise helper functions. But after Set 1 it became apparent that wasn't going to be manageable. Those have been collated in [`crypto_utils` in my crashburn repo](https://github.com/axiomiety/crashburn/blob/master/crypto_utils.py).

   * [Set 1](cryptopals1.html)
   * [Set 2](cryptopals2.html)

#### [OverTheWire](http://www.overthewire.org/) ####

OverTheWire provides a variety of wargames for all abilities. They are listed here in alphabetical order, not in order of difficulty. Those marked with `*` have been completed fully.

   * [Bandit*](bandit.html): An introduction to wargames with a very flat learning curve.
   * [Krypton](krypton.html): Crypto-based wargame
   * [Leviathan*](leviathan.html): Reverse engineering - mainly using `gdb`
   * [Natas](natas.html): Web-based wargame
   * [Semtex](semtex.html): A mixed bag. Hard
   * [Vortex](vortex.html): Another mixed bag. Harder

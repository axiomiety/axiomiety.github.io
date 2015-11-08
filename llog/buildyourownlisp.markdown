---
layout: default
title: llog/buildyourownlisp
category: pages
---

Notes from [buildyourownlisp](http://buildyourownlisp.com).

add -ggdb to get debug symbols. this will allow gdb to, among other things, display the source code. seems you can also use -g, but that's more generic.

source: https://gcc.gnu.org/onlinedocs/gcc-3.4.5/gcc/Debugging-Options.html

puts vs printf: http://stackoverflow.com/questions/2454474/what-is-the-difference-between-printf-and-puts-in-c

nice answer from 'Hannu Balk' that looks at the assembly equivalent, and when the compiler tries to be clever

TODO: understand what puts actually does, and its return value!

main has argc (arg Count) and argv (arg Vector)

"in a definition, int main() is a function taking no parameters. In a declaration which is not a definition, it's a function taking unspecified parameters. This is 6.7.5.3/14 in n1256, or 6.5.5.3/10 in n794. The questioner is asking about a definition. – Steve Jessop Oct 9 '10 at 23:19 "

whaaaat?

As per the C standard, there should only be 2 valid declarations (http://c-faq.com/ansi/maindecl.html)

To convert a numberic arg passed to `main`, use `atoi` from `stdlib`.

If you don't pass one, it will segfault (core dumped)!. Need to see if that can be investigated.

The core dump won't necessarily reside in the same directory. To see where, check out `/proc/sys/kernel/core_pattern`. If it mentions `abrt` it's something that manages those dumps, the config for which resides in `/etc/abrt/abrt-action-save-package-data.conf`.

More info on abrt: https://github.com/abrt/abrt/wiki/ABRT-Project

To analyse the dump:

cd /var/spool/abrt/XXXXXXX
gdb $(cat executable) coredump

This directory contains a whole bunch of files (including one named executable!)

Note that `abrt` can sometimes lock down the dumps. Might need to be root.

C99, it seems, added a new `_Bool` type via `<stdbool.h>` - with `true` and `false`!

`atoi` returns 0 if it cannot find a number at the start of the string.

when defining structs, it can be useful to do `typedef struct StructName { ... } TypeDefName;`. This means that instead of defining StructName vars, you don't need to use `struct StructName x;` - but instead `TyepDefName x;`.

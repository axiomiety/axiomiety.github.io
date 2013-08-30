---
layout: default
title: articles/python-debug
category: pages
---

## Debugging Python programs ##

There are many IDEs out there that make it a breeze to debug python. But one day you might find yourself in a situtation where you do *not* have access to this fancy IDE of yours, and you're trying to debug a program from the interpreter.

In a file named `crash.py`, have the following toy function:

{% highlight python %}
    def print_list(l):
      for it in l:
        print l
{% endhighlight %}

Now let's run this with an argument which is not iterable (like an integer):

{% highlight python %}
    >>> import crash
    >>> crash.print_list(1)
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
      File "crash.py", line 2, in print_list
        for it in l:
    TypeError: 'int' object is not iterable
    >>>
{% endhighlight %}

Okay - so it crashes as expected. Let's debug!

{% highlight python %}
    >>> pdb.pm()
    > /tmp/crash.py(2)print_list()
    -> for it in l:
    (Pdb) a
    l = 1
    (Pdb)
{% endhighlight %}

`a` shows the local variables - here we clearly see `l` is set to 1. But what if we wanted to step through? Well we can't quite do that once the program has been terminated so let's re-run it with `pdb` from the start.

{% highlight python %}
    >>> pdb.run('crash.print_list(1)')
    > <string>(1)<module>()
{% endhighlight %}

We're now at the very top of the program. Before continuing, let's set a breakpoint on the `for` statement:

{% highlight python %}
    (Pdb) b crash:2
    Breakpoint 1 at /tmp/crash.py:2
    (Pdb) c
    > /tmp/crash.py(2)print_list()
    -> for it in l:
    (Pdb) print type(l)
    <type 'int'>
    (Pdb) l
      1     def print_list(l):
      2 B->   for it in l:
      3         print it
    [EOF]
{% endhighlight %}

We can set we hit the breakpoint (denoted by 'B'), and we use `l` to list the current source. Now that we're in a debug session, let's make `l` an actual list.

{% highlight python %}
    (Pdb) l=[1,2,3,4]V
    *** Error in argument: '=[1,2,3,4]'
{% endhighlight %}

Right that was cheeky - `pdb` interprets `l` as the list command. We need to explicitly tell `pdb` it's a python command, and we do that by prefixing it with `!`. And we continue execution

{% highlight python %}
    (Pdb) !l=[1,2,3,4]
    (Pdb) c
    1
    > /tmp/crash.py(2)print_list()
    -> for it in l:
    (Pdb)
{% endhighlight %}

Press `c` to continue stepping through this, or `cl` to clear all breakpoints and `r` to resume execution.

This only touches the surface and there's much more `pdb` can do. We've been spoilt by GUI-based debuggers and you'll probably never need the above. But one day it just might get you out of an undesireable situation ^_^

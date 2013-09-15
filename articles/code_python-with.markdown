---
layout: default
title: articles/python-with
category: pages
---

## Python's `with` statement ##

The first time I used 'with', I didn't think twice about it. It seemed like such a natural thing to do. But curiosity got the better of me and I had to look it up. Python does a great job at providing powerful idioms, but makes it just as easy to look under the covers.

If you're familiar with python, you probably came across the `with` statement when dealing with files:

{% highlight python %}
    with open('some_file', 'r') as f:
        print f.readline()
{% endhighlight %}

For information directly out of the horse's mouse, you can check PEP-343 (well worth the read - well, depending on your definition of 'worth'). This is the TL;DR version because we're cowboys like that.

{% highlight python %}
    import sys
    
    class Reverso(object):
      def write(self, s):
        ll = list(s)
        ll.reverse()
        self.fn.write(''.join(ll))
    
      def __enter__(self):
        self.fn = sys.stdout
        sys.stdout = self # because print isn't a fn in 2.7
    
      def __exit__(self, type, value, traceback):
        sys.stdout = self.fn # cleaning up
    
    class ThingyMajig(object):
      def __init__(self):
        self.majig = 'majig'
    
      def __repr__(self):
        return '-'.join(self.majig)
    
    def foo():
      tm = ThingyMajig()
      print tm
      with Reverso():
        print tm
      print tm
{% endhighlight %}

Which will print:

    m-a-j-i-g
    g-i-j-a-m
    m-a-j-i-g

Now how cool is that?

But just to show there's no magic happening, you can replicate the above like such:

{% highlight python %}
    >>> import reverso
    >>> tm = reverso.ThingyMajig()
    >>> print tm
    m-a-j-i-g
    >>> r = reverso.Reverso()
    >>> r.__enter__()
    >>> print tm
    g-i-j-a-m
    >>> import sys
    >>> r.__exit__(*sys.exc_info())
    >>> print tm
    m-a-j-i-g
{% endhighlight %}

Which really is nothing more than how `with` works.

As a quick aside, it's also worth quickly looking at the `contextlib` library, which allows you to essentially add a decorator to a function to make 'with-able'. It goes like this:

{% highlight python %}
    from contextlib import contextmanager
    @contextmanager
    def clear_path():
      orig = sys.path
      sys.path = []
      yield
      sys.path = orig
{% endhighlight %}

Which runs like such:

{% highlight python %}
    >>> print len(sys.path)
    11
    >>> with reverso.clear_path():
    ...     print len(sys.path)
    ... 
    0
    >>> print len(sys.path)
    11
{% endhighlight %}

This is particularly handy when you want to switch the context in which you might execute some code. Neat heh?

TODO: find the source for open - somewhere like http://hg.python.org/cpython/file/c6880edaf6f3/Modules/_io/fileio.c

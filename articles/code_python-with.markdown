---
layout: default
title: articles/python-with
category: pages
---

## Python's `with` statement ##

The first time I used 'with', I didn't think twice about it. It seemed like such a natural thing to do. But curiosity got the better of me and I had to look it up. Python does a great job at providing powerful idioms, but makes it just as easy to look under the covers.

If you're familiar with python, you probably came across the with statement when dealing with files:

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

Todo: find the source for open - somewhere like http://hg.python.org/cpython/file/c6880edaf6f3/Modules/_io/fileio.c

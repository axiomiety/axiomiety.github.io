---
layout: post
title: doom-engine
excerpt: "A quick look at fixed-point arithmetic in the Doom game engine."
categories: [tech]
tags: [games,underthehood]
comments: false
---

### doom-engine ###

id Software have released most of their game's core engine code under the GPL. This provides a great opportunity to take a look at how things were done 'back in the day' - even though I'm sure some concepts still apply today. I have cherry-picked a few areas of interest.

#### Fixed-point arithmetic ####

Back in day (he says) it seems floating point operations weren't terribly efficient and it was much faster to use integers (so I'm told). To get around those limitations, developers came up with the concept of fixed-point arithmetic. Instead of having, say, a 32bit int representing an integer, it was divided in x.y parts with x representing the integer portion and y the floating one. Doom used a 16.16 format. So that meant having an integer range of +/- 32767/8 respectively (2^15 + 1 bit for sign), and floating point accuracy of 1/65536 (~0.000015).

So let's take the signed 16.16 case and how it might work in practice:

{% highlight c %}

    #include <stdio.h>
    
    void partify(int);
    
    int main()
    {
      // watch out - numbers are represented using 2's complement!
      // so 0x1000 in an 8bit system is -32768 and 0x1001 is -32767
      partify(0xffff0000);
      partify(0x7fff0000);
      partify(0x80010000);
      partify(0x0000ffff);
      partify(0x0001000f);
      return 0;
    }
    
    void partify(int k)
    {
      printf("hexadecimal:%08x \t\n", k);
      printf("unsigned int:%u \t\n", k);
      printf("integer part:%d \t\n", k >> 16);
      printf("floating part:%u \t\n", k & 0x0000ffff);
    }
{% endhighlight %}    

    ...
    hexadecimal:80010000 
    unsigned int:2147549184 
    integer part:-32767 
    floating part:0 
    ...

Let's lump the above into some macros instead and *write some tests*!

{% highlight c %}
    #include <stdio.h>
    #include <assert.h>
    
    typedef int fixed_t;
    
    #define FRACBITS        16
    #define FRACUNIT        (1 << FRACBITS)
    #define FP_DECIMAL(k)   ((fixed_t)k & 0x0000ffff)/(float)FRACUNIT
    #define FP_INTEGER(k)   (k >> FRACBITS)
    #define INT_TO_FP(k)    (fixed_t)(k << FRACBITS)
    #define FLOAT_TO_FP(k)  (fixed_t)((float)k * FRACUNIT)
    
    int main()
    {
      fixed_t max_pos = 0x7fff0000;
      //fixed_t max_neg = 0x8fff0000;
      fixed_t max_neg = 0x80010000; // 2's complement
      fixed_t min = 0x00000001;
      fixed_t neg_one = 0xffff0000;
    
      // testing inverses is often an easy way to make sure things work as expected
      assert( 12345 == FP_INTEGER( INT_TO_FP(12345) ) );
      assert( 0.5 == FP_DECIMAL( FLOAT_TO_FP(1234.5) ));
      assert( 1234 == FP_INTEGER( FLOAT_TO_FP(1234.5) ));
    
      assert( 0 == FP_INTEGER( min ) );
      assert( -1 == FP_INTEGER( neg_one ) );
      assert( 32767 == FP_INTEGER( max_pos ) );
      assert( -32767 == FP_INTEGER( max_neg ) );
      // we're losing precision - so we test by isolating the interval
      assert( 0.000016 > FP_DECIMAL( min ) );
      assert( 0.000015 < FP_DECIMAL( min ) );
    
      return 0;
    }
{% endhighlight %}    

Quick note: if you're having issues with macros, try compiling using `gcc -save-temps` and look at the .i file generated - it will show you how macros have been replaced in your code.

Now that we're satisfied the macros work as expected, we can take a look at operations on fixed point numbers.

Providing we're dealing with the same fixed point format (eg, 16.16 vs 16.16), addition and subtraction work as expected:

{% highlight c %}
    fixed_t a1 = FLOAT_TO_FP(100.123) - FLOAT_TO_FP(0.123);
    fixed_t a2 = FLOAT_TO_FP(100.123) + FLOAT_TO_FP(-0.123);
  
    assert( 100 == FP_INTEGER(a1) );
    assert( 0.00016 > FP_DECIMAL(a1) );
    assert( 100 == FP_INTEGER(a2) );
    assert( 0.00016 > FP_DECIMAL(a2) );
{% endhighlight %}    

Again, note the loss of precision - this is because the fractional part is not a multiple of 2^n - if we used 100.128 instead, we'd see what we expect.

Multiplication and division are a bit more fun. Using fixed point arithmetic, we're essentially scaling numbers - meaning the scale factor will get multiplied/divided along (see `2` for a really nice explanation). The `m_fixed.c` file of the doom engine shows us how it's done. Notice how multiplication 'scales back' the result by FRACUNIT, or how division scales it up (in the section commented out, which doesn't handle division by 0).

That concludes the introduction to fixed point arithmetic. Hopefully that's enough to make some sense out of `m_fixed.c` and `m_fixed.h`!

Further writing: [Lookup tables for trigonometric functions - why and how they're used](https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/tables.c)

References:
[a1](http://doomwiki.org/wiki/Inaccurate_trigonometry_table)
[a2](http://www.yaldex.com/games-programming/0672323699_ch11lev1sec5.html)
[a3](http://users.otenet.gr/~velktron/tech.html)
[a4](http://x86asm.net/articles/fixed-point-arithmetic-and-tricks/)
[a5](http://stackoverflow.com/questions/141525/absolute-beginners-guide-to-bit-shifting)
[a6](http://en.wikipedia.org/wiki/Two's_complement)


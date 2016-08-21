---
layout: post
title: cryptopals-set3
excerpt: "Cryptoals challenge - Set 3."
categories: [writeup]
tags: [itsec, crypto]
---

[matasano / cryptopals](http://www.cryptopals.com)

## Set 3 ##

### 17. The CBC padding oracle ###

The first function we have to create selects one of the 10 given strings at random, pads & encrypts with a random key. Nothing fancy here, except that as usual we need to store the IV and the key.

The 2nd function is our oracle:

{% highlight python %}
    RANDOM_AES_KEY = b'\xaa\xef\xab\xb7~\xef\xee!\x10\xc0u\xa5\x03bS>'
    RANDOM_IV = b'\xa8\xe8\x9fO\xb0r\xb7F\xcd\xe8\x1f8\xba9\xa4\x0e'

    def padding_oracle(ciphertext, key=RANDOM_AES_KEY, iv=RANDOM_IV):
      from Crypto.Cipher import AES
      cr = AES.new(key, AES.MODE_CBC, IV=iv)
      dec = cr.decrypt(ciphertext)
      try:
        crypto_utils.unpad(dec) # we do an assert which throws if it fails
        return True
      except Exception as e:
        return False
{% endhighlight %}

Now comes the tricky bit (see References below). We'll start with the first 2 blocks only - `C1||C2`. Our aim is to modify `C1` - turning it into `C'1` such that when we pass `C'1||C2` to `padding_oracle` it returns True. That is, we end up with `P'2` such that the block 'unpads' nicely - which allows us to back out what `I2` should be, bypassing the decryption step entirely. We can then do `C1^I2` to get `P2`.


{% highlight python %}
    def mc_part17():
      (iv, enc) = p17_f1() # note this will be random every time we run this
      c1, c2 = enc[0:16],enc[16:32]
      # zero out c_1 and i_2
      c_1 = bytearray(b'\x00'*16)
      i2 = bytearray(b'\x00'*16)
      pad_byte = 1
      for j in range(15,-1,-1):
        for i in range(0,256):
          c_1[j] = i
          if padding_oracle( bytes(c_1 + c2) ):
            break
        # we know that i2[j]^c_1[j] = pad_byte so we can derive i2[j]
        i2[j] = c_1[j]^pad_byte
    
        # we need to set c_1 up for the next iteration
        # all bytes >= j must, when xor'ed with i2, show the right padding
        # we can do that because we now know i2 from j onwards
        pad_byte += 1
        for k in range(j,16):
          c_1[k] = i2[k]^pad_byte
    
      # we know i2 - we bypassed the decryption step entirely and can back out the plaintext
      p2 = crypto_utils.xor_bytearrays(c1, i2)
      print(p2)
{% endhighlight %}

For simplicity, the above only takes the first 2 blocks into account. Expanding this to cover all (adjacent) blocks should be trivial.

#### References ####

[skullsecurity](https://blog.skullsecurity.org/2013/a-padding-oracle-example) and Robert Heaton's [blog](http://robertheaton.com/2013/07/29/padding-oracle-attack/). This small article on [padbuster](http://blog.gdssecurity.com/labs/2010/9/14/automated-padding-oracle-attacks-with-padbuster.html) is neat too.

### 18. Implement CTR, the stream cipher mode ###

CTR mode isn't particularly complex, but we need to be careful about padding (or lack of). With CTR we essentially end up xor'ing a stream of data with our plaintext to generate ciphertext (or vice versa for decryption).

The following snippet illustrates how to do this as a standalone function. It's a little counter-intuitive but we don't use AES on the ciphertext itself - instead we use it on this incrementing counter function and only *then* do we xor it with the ciphertext.

{% highlight python %}
  def mc_part18():
    s = base64.b64decode(b'L77na/nrFsKvynd6HzOoG7GHTLXsTVu9qvY/2syLXzhPweyyMTJULu/6/kXX0KSvoOLSFQ==')
    counter = 0
    
    def fn():
      import struct
      nonlocal counter
      ret = struct.pack('<QQ', 0, counter) # 2x64b -> 128b, little-endian
      counter += 1
      return ret
  
    from Crypto.Cipher import AES
    cr = AES.new(b'YELLOW SUBMARINE', AES.MODE_ECB)
  
    r = bytearray()
    for i in range(len(s)//16+1):
      block = s[i*16:(i+1)*16] 
      r.extend( crypto_utils.xor_bytearrays(cr.encrypt(fn()), block) )
  
    print(bytes(r))
{% endhighlight %}

Which yields `b"Yo, VIP Let's kick it Ice, Ice, baby Ice, Ice, baby "`.

### 19. Break fixed-nonce CTR mode using substitions ###

For this one, the first thing to understand is that we are not recovering the AES key used to generate the key stream. Instead, we are recovering the key stream itself (which, in a way, is almost as good as the key given we already have the ciphertext - and K (+) C = P).

### 20. Break fixed-nonce CTR statistically ###

Challenge 20 is an extension of challenge 19 and 6 (Break repeating-key XOR). We first pick the length of our smallest ciphertext and truncate all the remaining to that length. We now have 40 samples of what should be sourced from an English text - so as before, the most common character is space (character, not letter).

### 21. Implement the MT19937 Mersenne Twister RNG ###

For this challenge, we look at the pseudocode made available in [Wikipedia]( https://en.wikipedia.org/wiki/Mersenne_Twister#Pseudocode). There is a Python implementation but where's the fun in that. Note that by default Python's `random` module uses that by default [according to this PEP](http://legacy.python.org/dev/peps/pep-0504/). At the very least it should be a way for us to test our implementation!

This is pretty much a straight-up implementation of the pseudocode listed on Wikipedia - I haven't tried to optimise it.

{% highlight python %}
    class MT(object):
      # consts for MT19937 - note those aren't the same as the ones for MT19937-64
      (w,n,m,r) = (32,624,397,31)
      a = 0x9908B0DF
      (u,d) = (11, 0xFFFFFFFF)
      (s,b) = (7,  0X9D2C5680)
      (t,c) = (15, 0xEFC60000)
      l = 18
      f = 0x6C078965
      lower_mask = (1<<r) - 1
      upper_mask = 0xFFFFFFFF ^ lower_mask # 0x80000000
    
      def __init__(self):
        self.mt = [0]*MT.n # used to store the state of the generator
    
      def seed_mt(self, seed):
        self.index = MT.n
        self.mt[0] = seed
        for i in range(1, MT.n):
          self.mt[i] = 0xFFFFFFFF & (MT.f * (self.mt[i-1]^self.mt[i-1] >> (MT.w-2)) + i)
    
      def extract_number(self):
        if self.index >= MT.n:
          if self.index > MT.n:
            self.seed_mt(5489)
          self.twist()
    
        y = self.mt[self.index]
        y ^= (y>>MT.u) & MT.d
        y ^= (y<<MT.s) & MT.b
        y ^= (y<<MT.t) & MT.c
        y ^= y>>MT.l
        self.index += 1
    
        return 0xFFFFFFFF & y
    
      def twist(self):
        for i in range(MT.n):
          x = (self.mt[i] & MT.upper_mask) + (self.mt[ (i+1)%MT.n ] & MT.lower_mask)
          xA = x>>1
          if x%2 != 0:
            xA = xA ^ MT.a
          self.mt[i] = self.mt[ (i+MT.n)%MT.n ] ^ xA
        self.index = 0
{% endhighlight %}

Now trying this against `random.getstate`, we don't get anything matching at all. What gives?

It turns out that Python's `seed` method uses a different initialisation routine - as we can see from the states not matching *at all*. To verify our implementation, we use `numpy` instead. And indeed after setting `numpy.random.seed`, `numpy.random.get_state` ends up matching our internal state.

For those interested, there is a bit more colour to be found in the Python source code for the [random module]( http://svn.python.org/projects/python/branches/py3k/Lib/random.py) - but to get underneath it all we'd probably need to look at the code for the *actual* `_random` module.

### 22. Crack an MT19937 seed ###

The instructions given are fairly straightforward:

  1. time sleep (randint, 2, 30)
  1. seed with `int(time.time)`
  1. do step one again
  1. return the first random value returned by the RNG

Here we need to figure out what the seed was. Simply, we need to figure out what the epoch was. It's a bit of a bruteforce approach - we just need to 'rewind' the seconds until such a time that the first random value returned matches the original one.


{% highlight python %}
    import time, random
    time.sleep(random.randint(2,30))
    seed = int(time.time())
    print('original seed: {0}'.format(seed))
    o = MT()
    o.seed_mt(seed)
    time.sleep(random.randint(2,30))
    num = o.extract_number()
    
    oo = MT()
    trial_seed = int(time.time())
    oo.seed_mt(trial_seed)
    while oo.extract_number() != num:
      trial_seed -= 1
      oo.seed_mt(trial_seed)
  
    print('matching trial_seed: {0}'.format(trial_seed))
{% endhighlight %}

If we didn't know the seed had been based on the current time, this would have been considerably more difficult!

### 23. Clone an MT19937 RNG from its output ###

The steps in `extract_number` are as follows, with the values hardcoded for simplicity:

    y ^= (y >> 11) & 0xFFFFFFFF
    y ^= (y << 7)  & 0x9D2C5680
    y ^= (y << 15) & 0xEFC60000
    y ^= y >> 18

For us to invert the transform, we will reverse each operation starting from the last one. But first, let's take a quick look at what this means.

For simplicity, let's pick k = 4077814955. This is because the left-most bit will be set to 1, which makes it easier to visualise the shift.

{% highlight python %}
    print('k       {0:0>32b}'.format(k))
    print('k>>18   {0:0>32b}'.format(k>>18))
    print('k^k>>18 {0:0>32b}'.format(k^k>>18))
{% endhighlight %}

Which yields:

    k       11110011000011101000010010101011
    k>>18   00000000000000000011110011000011
    k^k>>18 11110011000011101011100001101000

We see the right shift moves everything down to the right by 18 places - leaving 18 zeros. When xor'ed with `k`, those 18 left-most zeros are essentially a no-op and allow us to recover the original 18 bits.

Let's do this piece-wise. For simplicity let `kdash=k^k>>18`. We'll isolate them by and'ing them with a 32-bit number composed of 18 leading 1's (which you can easily find via `hex(0b<insert 1's and 0's here>`):

{% highlight python %}
    kdash = k^k>>18
    print('kdash   {0:0>32b}'.format(kdash))
    print('top18   {0:0>32b}'.format(kdash & 0xffffc000))
{% endhighlight %}

yielding:

    kdash   11110011000011101011100001101000
    top18   11110011000011101000000000000000

We know that `k` was bitshifted to the right by 18 zeros before being xor'ed with itself. We also know that `k>>18` xor'ed with `kdash` will yield the original `k`. We can get the bottom 14 by bitshifting `top18` by 18 to the right. Let's break it down:

    top18   11110011000011101000000000000000
    bot14   00000000000000000011110011000011
    kdash   11110011000011101011100001101000
    k       11110011000011101000010010101011

We're almost there! We see that by xoring the bottom 14 bits with `kdash` we recover `k`. The actual sequence can be summarised as:

{% highlight python %}
      k = 4077814955
      kdash = k^k>>18
      top18 = kdash & 0xffffc000
      # this is equivalent to k>>18
      bot14 = top18>>18
      # we isolate the last 14 bytes of kdash
      kdash_bot14 = kdash & 0x00003fff
      actual_bot14 = kdash_bot14^bot14
      orig_k = top18^actual_bot14
{% endhighlight %}

As a side note, I just want to emphasise all we've done is derive `k` back from `kdash` (i.e., what `k` was before the transform).

Now let's take a look at the next transform:

    y ^= (y << 15) & 0xEFC60000

Just as before, we'll break it down. Let's keep `k` as defined above and let `m` be the mask `0xEFC60000`.

    k                  11110011000011101000010010101011
    (k<<15)&0xffffffff 01000010010101011000000000000000
    0xefc60000         11101111110001100000000000000000
    (k<<15)&0xefc60000 01000010010001000000000000000000

For the 2nd step we need to mask with `0xFFFFFFFF` because we want to keep the numbers as 32-bit (you don't need to do this in code because the mask will take care of this for you - only for display purposes). The mask means we can easily recover the last 17 bits - because we just `&` them with 0's.

For the sake of briefty:

TODO: rework this section. It was painful getting the below, and a decent explanation would help - just so it doesn't look like those ops were plucked out of thin air.

{% highlight python %}
      const = 0xefc60000
      ret = (k<<15)&const ^ k
      last15 = ret & 0x00007fff # 15 1's
      kk = last15<<15
      val = kk&const ^ ret
      last17 = val & 0x0001ffff # 17 1's
      kk = last17<<15
      val = kk&const ^ ret
      top15 = val & 0xfffe0000
      assert(k == top15 | last17) # we add the top and the bottom together
{% endhighlight %}
    
{% highlight python %}
      const = 0x9d2c5680
      ret = (kk<<7)&const ^ k
      last7 = ret & 0x0000007f
      kk = last7<<7
      val = kk&const ^ ret
      last14 = val & 0x00003fff
      kk = last14<<7
      val = kk&const ^ ret
      last21 = val & 0x001fffff
      kk = last21<<7
      val = kk&const ^ ret
      last28 = val & 0x0fffffff
      kk = last28<<7
      val = kk&const ^ ret
      assert(k == val)
{% endhighlight %}

{% highlight python %}
      kdash = k^((k>>11)&0xffffffff)
      kk = kdash & 0xffe0000 # top 11
      ret = (kk>>11)&0xffffffff
      kk = ret^kdash # top 22
      ret = (kk>>11)&0xffffffff
      val= ret^kdash # top 32
      assert(k == val)
{% endhighlight %}

We can then string the above to reverse each transform successively (look for `reverse_mersene_transform` in `crypto_utils.py`).

With this done, all we need is to source 624 numbers from the generator to recover the initial state:

    >>> o=MT()
    >>> o_clone = MT()
    >>> o.seed_mt(123)
    >>> state = [reverse_mersene_transform(n) for n in [o.extract_number() for _ in range(624)]]
    >>> o_clone.index = 624 # since we generated 624 values
    >>> o.index
    624
    >>> o_clone.mt = state
    >>> o.extract_number()
    2439673420
    >>> o_clone.extract_number()
    2439673420

Job done!

### 24. Create the MT19937 stream cipher and break it ###

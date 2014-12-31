---
layout: default
title: writeups/cryptopals
category: pages
---

[matasano / cryptopals](http://www.cryptopals.com)

Language of choice for this is Python. Probably not everyone's first choice but since v3 the support for bytes as a native type makes it much easier to handle the below.

## Set 1 ##

### 1. Convert hex to base64 ###

{% highlight python %}

    def mc_part1():
      h = '49276d206b696c6c696e6720796f757220627261696e206c696b65206120706f69736f6e6f7573206d757368726f6f6d'
      hh = bytes.fromhex(h)
      b64_expected = b'SSdtIGtpbGxpbmcgeW91ciBicmFpbiBsaWtlIGEgcG9pc29ub3VzIG11c2hyb29t'
      assert (b64_expected == base64.b64encode(hh))

{% endhighlight %}

That one was easy - just remember that `base64.b64encode` returns something of type byte, not str.

As a bit of trivia `h` is the hex representation of "I'm killing your brain like a poisonous mushroom" - a sentence from "Ice Ice Baby" (which is a recurring theme in this challenge >_<).

### 2. Fixed XOR ###

{% highlight python %}

    def mc_part2():
      a = '1c0111001f010100061a024b53535009181c'
      b = '686974207468652062756c6c277320657965'
      aa = bytes.fromhex(a)
      bb = bytes.fromhex(b)
      a_xor_b = bytes.fromhex('746865206b696420646f6e277420706c6179')
      xored = bytes([x^y for (x,y) in zip(aa,bb)])
      assert( xored == a_xor_b )

{% endhighlight %}

Nothing much here either, apart that `a_xor_b` is "the kid don't play".

### 3. Single-byte XOR cipher ###

This one is a little more tricky. We're given a piece of ciphertext encrypted with a single character but not told what the character is. The instructions suggest using frequency analysis - but I think the ciphertext is too small. Instead I opted for a brute force approach : )

{% highlight python %}

    def mc_part3(idx=15):
      h = '1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736'
      hh = bytes.fromhex(h)
    
      for k in string.ascii_letters:
        print(k)
        print(bytes([a^b for (a,b) in zip(hh,bytes(k*len(hh),'ascii'))]))

{% endhighlight %}

And we quickly see that when `k` is `X` the ciphertext decrypts to "Cooking MC's like a pound of bacon".

### 4. Detect single-character XOR ###

This makes it a little harder to brute force - instead of having a single string, we are given 60. We need to optimise!

We know one of those strings will decode to something from "Ice Ice Baby" - which means it'll be ASCII. Specifically, all characters should be printable. Behold `string.printable`. Except if we did that it'd generate too much noise. We certainly don't expect digits or non-standard symbols like `(` or `%` to be present. We this we can create a filter that will discard anything that doesn't match the given criteria.

{% highlight python %}

    def mc_part4(f='p4.txt'):
      with open(f, 'rU') as d:
        lines = d.readlines() # it's a small file
    
      lines = [l.strip() for l in lines] # remove \n
      candidates = list()
      # we only care for letters and a few symbols
      valid_characters = set(string.printable)-set(string.digits)-set(['#','$','%','/','~','`'])
      for line in lines:
        hh = bytes.fromhex(line)
        for k in string.printable:
          xored = bytes([a^b for (a,b) in zip(hh, bytes(k*len(hh),'ascii'))])
          if all(map(lambda c: chr(c) in valid_characters, xored)):
            candidates.append((k, xored))
      print(candidates)

{% endhighlight %}

Running this quickly isolates the string in question, which decodes to "Now that the party is jumping".

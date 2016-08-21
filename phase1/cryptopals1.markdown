---
layout: default
title: writeups/cryptopals1
category: pages
---

[matasano / cryptopals](http://www.cryptopals.com)

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

### 5. Implement repeating-key XOR ###

To get our repeating key, it's probably easiest to use a generator.

{% highlight python %}
    def mc_part5():
      
      def cycle_key(key):
        idx = 0
        while True:
          yield ord(key[idx%len(key)])
          idx += 1
    
      g = cycle_key('ICE')
      s = "Burning 'em, if you ain't quick and nimble\nI go crazy when I hear a cymbal"
      hh = bytes(s,'ascii')
      xored = bytes([a^b for (a,b) in zip(hh, g)])
    
      c = '0b3637272a2b2e63622c2e69692a23693a2a3c6324202d623d63343c2a26226324272765272a282b2f20430a652e2c652a3124333a653e2b2027630c692b20283165286326302e27282f'
      expected = bytes.fromhex(c)
      assert( xored == expected )
{% endhighlight %}

### 6. Break repeating-key XOR ###

To get this under way we need to do a little prep work. The first is being able to compute the hamming distance between two *lists* of bytes:

{% highlight python %}
    >>> a=bytes('this is a test','ascii')
    >>> b=bytes('wokka wokka!!!','ascii')
    >>> xored=bytes([x^y for (x,y) in zip(a,b)])
    >>> sum( (xored[j] >> i) & 1 for i in range(8) for j in range(len(xored)) )
    37
{% endhighlight %}

Which is expected (as per the instructions). We hardcode 8 because that's how long a byte it. Wrapping the above in a method yields:

{% highlight python %}
    def hamming_dist(a,b):
      xored = bytes([x^y for (x,y) in zip(a,b)])
      return sum( (xored[j] >> i) & 1 for i in range(8) for j in range(len(xored)) )
{% endhighlight %}

We also need something that allows us to divide a list into chunks. Note we only want complete chunks... I think (?).

{% highlight python %}
    def get_avg_hamming_dist(raw, chunk_size):
      chunks = get_chunks(raw, chunk_size)
      return sum(hamming_dist(c1,c2)/chunk_size for c1,c2 in zip(chunks,chunks[1:]))/len(chunks[1:])
{% endhighlight %}

It's not magic - we could have done the same thing with `range` but this is a little neater.

Next up we need to compute the hamming distance between each block.

{% highlight python %}
    dists = list()
    for chunk_size in range(2,40):
      dists.append( (chunk_size, get_avg_hamming_dist(raw, chunk_size)) )
    dists = sorted(dists, key=lambda x: x[1])
    print('smallest distance {1} was found with chunk size {0}'.format(*dists[0]))
{% endhighlight %}

Which yields:

    smallest distance 2.7593244194229416 was found with chunk size 29

Indicating the key is of length 29.

We now need to transpose each block (so 29 blocks all of the same length, apart potentially from the last one), and find the single character XOR key that yields the best 'English-looking' histogram. In other words, we'll gather 29 samples of what an english text should look like - where the byte which occurs the most often in each sample should match that which would occur the most often in an english text.

Most people (myself included) automatically think that 'e' is the most common letter - and that's true. But it isn't the most frequent character. According to [this page](http://mdickens.me/typing/letter_frequency.html) it's actually space. So by property of XOR, xor'ing the most frequent byte in the chunk with space should give us the character the chunk was encrypted with.

{% highlight python %}
    n = 29
    transposed_chunks = [raw[i::n] for i in range(n)]
    most_common_char = ord(' ') # space is the most common character in English
    candidate = bytearray()
    for tchunk in transposed_chunks:
      c = Counter(tchunk) # from collections import Counter
      char, _ = c.most_common()[0]
      candidate.append(char^most_common_char)
    print(candidate)
{% endhighlight %}

Yielding:

    bytearray(b'Terminator X: Bring the noise')

### 7. AES in ECB mode ###

We're not re-implementing AES - just looking at the ECB mode (the key has already been given to us).

{% highlight python %}
    def mc_part7():
      with open('p7.txt', 'rU') as f:
        lines = f.readlines()
    
      data = bytes(''.join([l.strip() for l in lines]), 'ascii')
      raw = base64.b64decode(data)
      from Crypto.Cipher import AES
      mode = AES.MODE_ECB
      decryptor = AES.new('YELLOW SUBMARINE', mode)
      plaintext = decryptor.decrypt(raw)
      print(plaintext)
{% endhighlight %}

Which will give you the lyrics to "Play That Funky Music" by Vanilla Ice.

### 8. Detect AES in ECB mode ###

We know the block size is 16. We simply need to look for a line which repeats every 16 bytes.

{% highlight python %}
    def mc_part8():
      blocksize = 16
    
      with open('p8.txt', 'rU') as f:
        lines = f.readlines()
    
      for line in (l.strip() for l in lines):
        indexes = range(0,len(line), blocksize)
        d = []
        for (start,end) in zip(indexes, indexes[1:]):
          d.append( line[start:end] )
        cn = Counter(d)
        if cn.most_common()[0][1] > 1:
          print(cn)
{% endhighlight %}

And we find that one of the lines has two blocks occurring 4 times:

    'd5d2d69c744cd283': 4, '08649af70dc06f4f': 4

Warm-up completed ^_^

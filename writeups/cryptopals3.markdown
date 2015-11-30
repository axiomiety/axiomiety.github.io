---
layout: default
title: writeups/cryptopals3
category: pages
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

### 22. Crack an MT19937 seed ###

1. time sleep (randint, 2, 30)
2. seed with int in time . time
3. do step one again
4. return the first random value returned by the RNG

Here we need to figure out what the seed was. Simply, we need to figure out what the epoch was. It's a bit of a bruteforce approach - we just need to 'rewind' the seconds until such a time that the first random value returned matches the original one.

### 23. Clone an MT19937 RNG from its output ###

### 24. Create the MT19937 stream cipher and break it ###

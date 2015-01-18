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
### 19. Break fixed-nonce CTR mode using substitions ###
### 20. Break fixed-nonce CTR statistically ###
### 21. Implement the MT19937 Mersenne Twister RNG ###
### 22. Crack an MT19937 seed ###
### 23. Clone an MT19937 RNG from its output ###
### 24. Create the MT19937 stream cipher and break it ###

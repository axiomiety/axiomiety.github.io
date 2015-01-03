---
layout: default
title: writeups/cryptopals2
category: pages
---

[matasano / cryptopals](http://www.cryptopals.com)

## Set 2 ##

### 9. Implement PKCS#7 padding ###

You can find the RFC [here](http://www.rfc-editor.org/rfc/rfc2315.txt here). What got me at first was that if the length of the data was a factor of blocksize, I did not add any padding. This was wrong :-/

{% highlight python %}
    def pad(b, blocksize=16):
      pad_length = blocksize
      if len(b) % blocksize:
        pad_length = blocksize - (len(b) % blocksize)
        
      return b + bytes((pad_length,))*pad_length
{% endhighlight %}

And we can validate this with the example given:

{% highlight python %}
    def mc_part9():
      print (b'YELLOW SUBMARINE\x04\x04\x04\x04' == pad(b'YELLOW SUBMARINE', 20))
{% endhighlight %}

And its inverse `unpad` - which isn't required yet but will be in the next problem.

{% highlight python %}
    def unpad(b, blocksize=16):
      assert(len(b) % blocksize == 0)
      pad_length = b[-1]
      assert(b[-pad_length:] == bytes((pad_length,))*pad_length)
      return b[:-pad_length]
{% endhighlight %}

### 10. Implement CBC mode ###

{% highlight python %}
    def mc_part10():
      raw = crypto_utils.b64_file_to_bytes('p10.txt')
      iv = b'\x00'*16 # initialisation vector - zero'ed
      key = b'YELLOW SUBMARINE'
      print( crypto_utils.aes_manual_cbc(key, raw, iv, mode=crypto_utils.MODE_DECRYPT) )
{% endhighlight %}

Which gives us the lyrics to the wonderful "Play That Funky Music" - again.

For completness, this is what `aes_manual_cbc` looks like. I bundled the encrypt/decrypt versions together.

{% highlight python %}
    def aes_manual_cbc(k, txt, iv, mode=MODE_DECRYPT):
      assert( isinstance(k, bytes) )
      assert( isinstance(txt, bytes) )
      assert( isinstance(iv, bytes) )
      assert( len(iv) == 16 )
      
      from Crypto.Cipher import AES
      cr = AES.new(k, AES.MODE_ECB)
      prev_block = iv
      d = bytearray()
      for block in get_blocks(txt, size=16):
        if mode == MODE_ENCRYPT:
          prev_block = cr.encrypt(xor_bytearrays(prev_block, block))
          d.extend(prev_block)
        else:
          d.extend(xor_bytearrays(cr.decrypt(block), prev_block))
          prev_block = block
    
      return unpad(d)
{% endhighlight %}

### 11. An ECB/CBC detection oracle ###

### 12. Byte-at-a-time ECB decryption (Simple) ###

### 13. ECB cut-and-paste ###

### 14. Byte-at-a-time ECB decryption (Harder) ###

### 15. PKCS#7 padding validation ###

### 16. CBC bitflipping attacks ###


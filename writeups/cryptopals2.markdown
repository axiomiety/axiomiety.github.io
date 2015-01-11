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

The check for padding correctness isn't necessary, but helped me catch some bad code along the way.

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

The difference is as follows:
   1. Encryption xors the previous block with the current block *first* before encrypting it
   2. Decryption decrypts the block *first* before xoring it with the previous block

It's actually rather neat!

### 11. An ECB/CBC detection oracle ###

For this one we have to complete a number of steps.

   * Write a function to generate a random AES key

{% highlight python %}
    def rand_bytes(length=16):
      return bytes(random.randint(0,255) for _ in range(length))
{% endhighlight %}

   * Write a function that encrypts data under an unknown key under CBC 50% of the time, and ECB otherwise. There are a few more caveats but that's the general idea.

{% highlight python %}
    def encryption_oracle(someinput):
      k = crypto_utils.rand_bytes(length=16)
      pre = crypto_utils.rand_bytes(random.randint(5,10))
      post = crypto_utils.rand_bytes(random.randint(5,10))
      
      plaintext = pre + someinput + post
    
      from Crypto.Cipher import AES
      mode = [AES.MODE_CBC, AES.MODE_ECB][random.randint(0,1)]
      if mode == AES.MODE_CBC: # then we need an IV
        cr = AES.new(k, mode, IV=crypto_utils.rand_bytes(length=16))
      else:
        cr = AES.new(k, mode)
      enc = cr.encrypt(crypto_utils.pad(plaintext)) # with PKCS#7
      o = {AES.MODE_CBC: 'CBC', AES.MODE_ECB: 'ECB'}
      print('mode used: {0}, mode guessed: {1}'.format(o[mode],['CBC','ECB'][crypto_utils.is_using_ECB(enc)]))
{% endhighlight %}

In the above we return whether or not we guessed right - but you get the idea.

It's worth noting that the input needs to be sufficiently large. With a toy example, it's easy enough:

    >>> encryption_oracle(b'A'*2000)
    mode used: CBC, mode guessed: CBC
    >>> encryption_oracle(b'A'*2000)
    mode used: ECB, mode guessed: ECB

Though that's cheating a little : )

### 12. Byte-at-a-time ECB decryption (Simple) ###

This is where things start to become interesting, and fun (and a bit more complicated)!

We will be exploiting a weakness in ECB to decrypt a piece of cyphertext for which we do not have the key.

   * Create a function that returns `AES-128-ECB(your-string || unknown-string, random-key)`
{% highlight python %}
    RANDOM_AES_KEY = b'\xaf\x19\x9cB;\xd5aoo\xc7\x86\xb2\xf0\xef\xbb\xa1'
    
    def oracle(someinput, key=RANDOM_AES_KEY):
      txt = 'Um9sbGluJyBpbiBteSA1LjAKV2l0aCBteSByYWctdG9wIGRvd24gc28gbXkg'
      txt += 'aGFpciBjYW4gYmxvdwpUaGUgZ2lybGllcyBvbiBzdGFuZGJ5IHdhdmluZyBq'
      txt += 'dXN0IHRvIHNheSBoaQpEaWQgeW91IHN0b3A/IE5vLCBJIGp1c3QgZHJvdmUg'
      txt += 'YnkK'
      txt = base64.b64decode(bytes(txt, 'ascii'))
      plaintext = someinput + txt
    
      from Crypto.Cipher import AES
      cr = AES.new(key, AES.MODE_ECB)
      enc = cr.encrypt(crypto_utils.pad(plaintext))
    
      return enc 
{% endhighlight %}

   * Guess the block size (which we know, but we do this for good measure). Since we're using ECB, encrypting the same bytes in two different blocks will lead to identical blocks - we just need to find which number of bytes it takes before a repeat occurs.

{% highlight python %}
    blocksize = None
    for bs in range(12,17):
      plaintext = b'A'*bs*2 # we want to see repeats
      enc = oracle(plaintext)
      block = enc[bs:2*bs]
      if enc[:bs] == block:
        blocksize = bs
        break

    print('guessing blocksize is %s' % blocksize if blocksize else 'no blocksize found')
    if blocksize is None: return # no point continuing
{% endhighlight %}

   * Check whether this uses ECB (we know it does, but we're being asked to do this anyway)

{% highlight python %}
    plaintext = b'A'*blocksize*2
    usingECB = crypto_utils.is_using_ECB(oracle(plaintext), blocksize)
    print('using ECB? %s' % usingECB)
{% endhighlight %}

   * Craft an input that's 1 byte short of the block size, and create a table for all possible combinations. Say our plaintext was 'YELLOW SUBMARINE' and block size is 8 - by crafting a plaintext that will be 7 bytes, the 8th byte will be 'Y' (`b'AAAAAAAY'`). If we didn't know what what the 8th byte would be, we would cycle through all possible bytes until the encrypted block matched the one with our unknown byte. ECB allows us to do that because each block is encrypted independently of the previous one.

{% highlight python %}
    inputblock = bytearray(b'A'*(blocksize-1))

    # there are up to 255 possible bytes
    rbt = dict()
    #TODO: this might not be a 1-1 mapping - multiple keys might map to the same chr
    for i in range(256):
      t = bytes([i])
      e = oracle(bytes(inputblock+t))[:blocksize]
      rbt[e] = t

    print(rbt[oracle(bytes(inputblock))[:blocksize]]) # the last byte will be that of the unknown plaintext
{% endhighlight %}

   * Lather, rinse, repeat. We essentially repeat the above but instead of using `b'AAAAAAAY'`, we now use `b'AAAAAAY?'` - we keep shifting left until we have decrypted all the plaintext.

{% highlight python %}
  found = bytearray()
  bs = 128 # how much we want to decrypt - this needs to be more or less equal to the length of the plaintext
  for idx in range(bs-1, 0, -1): # we go backwards, shifting left
    rbt = dict()
    inputblock = b'A'*idx
    for i in range(256):
      t = bytes([i])
      rbt[oracle(inputblock + found + t)[:bs]] = t
    found += rbt[oracle(inputblock)[:bs]]
  print(bytes(found))
{% endhighlight %}

Putting the snippets above together, we find that the plaintext is `b"Rollin' in my 5.0\nWith my rag-top down so my hair...` - all without knowing the actual encryption key, but just being provided a function that encrypts arbitrary plaintext.

### 13. ECB cut-and-paste ###

   * Write a `k=v` parsing routine and a function called `profile_for` that takes an email address and returns something encoded like `email=foo@bar.com&uid=10&role=user`

{% highlight python %}
    def kvparsingroutine(s):
      d = dict()
      for pairs in s.split('&'):
        k, v = pairs.split('=')
        d[k] = v
      return d
    
    def profile_for(u): # where u is an email address
      # don't allow metacharacters
      u = u.replace('&', '')
      u = u.replace('=', '')
      d = {'email': u, 'uid':10, 'role':'user'}
      # 'encoding'
      return '&'.join(['%s=%s' % (k,d[k]) for k in ['email','uid','role']])
{% endhighlight %}

   * Write 2 functions - one to encrypt the profile and another to decrypt it

{% highlight python %}
    def enc_profile_for(u, key=RANDOM_AES_KEY):
      plaintext = bytes(profile_for(u), 'ascii')
      from Crypto.Cipher import AES
      cr = AES.new(key, AES.MODE_ECB)
      enc = cr.encrypt(crypto_utils.pad(plaintext))
      return enc
    
    def dec_profile_for(e, key=RANDOM_AES_KEY):
      from Crypto.Cipher import AES
      cr = AES.new(key, AES.MODE_ECB)
      dec = crypto_utils.unpad(cr.decrypt(e))
      return kvparsingroutine(dec.decode('cp437')) # to fix some display isues i was having
{% endhighlight %}

Now for the tricky part - we need to generate a piece of ciphertext that decodes with `role=admin`. The `enc_profile_for` function acts as our oracle. In a nutshell we'll swap one of the blocks for our own, which contains the data we need. There are a few caveats - blocksize is fixed, so we need to craft our input carefully. On top of that `enc_profile_for` will strip all metacharacters.

Let's recap - `profile_for` will generate something like `email=_&uid=10&role=user`. We can only act on 16 bytes blocks - so there are 2 things we need to do. We want to split the blocks such that `role=` ends up at the 16th byte boundary (meaning we can then append a new block containing `admin`), and generate that block from the input.

Trying my hand as ascii art:

    |email=_ -->16b|admin -->16b|<-3b->&uid=10&role=|user -->16b|

So that we can take the middle block and replace it with the last block. Does that make a bit more sense? The lenght of our input should be `16b-len(email=) + 16b + 3b` where the middle 16b contain `admin` and the padding required to make it a valid block.

    >>> crypto_utils.pad(b'admin')
    b'admin\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b'

We have 10 + 3 bytes for our email address (or more if we want to split this over multiple blocks): `qwerty@ab.com` - but we need to take the last 3 bytes and stick them at the end of the admin block. Putting it all together:

{% highlight python %}
    def mc_part13():
      c = enc_profile_for('qwerty@ab.admin\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0bcom')
      admin_block = c[16:32]
      fudged = c[0:16] + c[32:48] + admin_block # we discard the last block entirely
      print(dec_profile_for(fudged))
{% endhighlight %}

Leading to:

    {'role': 'admin', 'email': 'qwerty@ab.com', 'uid': '10'}

How cool is that?

### 14. Byte-at-a-time ECB decryption (Harder) ###

### 15. PKCS#7 padding validation ###

### 16. CBC bitflipping attacks ###

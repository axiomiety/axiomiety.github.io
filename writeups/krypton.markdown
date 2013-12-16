---
layout: default
title: writeups/krypton
category: pages
---

[overthewire / krypton](http://www.overthewire.org/wargames/krypton/)

## Level 0 ##

Straight-forward - the string 'S1JZUFRPTklTR1JFQVQ=' has been encoded in base 64. For the eager ones, just head to http://www.base64decode.org/ and decode it and connect to the krypton box as krypton1.

## Level 1 ##

A quick look at the readme reveals the password is 'encrypted' using some sort of rot13 implementation. I did think about knocking something up in python, but for something so trivial tr will do the trick: `cat krypton2 | tr '[A-Z]' '[N-ZA-M']` - and voila!

## Level 2 ##

Level 2 suggests that we can encrypt any text with the same key using the 'encrypt' binary located in /krypton/krypton2. However I could not get the binary to write out the cypher text regardless of where I was pointing it to. So I created a small python script to go through all 25 rotations (A->B, A->C, ...). I would have liked to use the binary to encrypt the alphabet, which would have given me the offset directly - but this worked just as well.

## Level 3 ##

This level presents us with 3 cyphertexts that have been encrypted using the same key - and a 4th containing the password for the next level. A simple solution would be to use frequency analysis to find out which letter represents what. However I decided to focus on the last cyphertext - the one containing the password. Previous levels contained the word 'password' in the encrypted text, so maybe this was the case. Now PASSWORD has a repeating S - so the two possibilities were S=V or S=U. But:
KSVVWGBS
PASSWORD
Doesn't work as S in the cyphertext would be mapped to both A and D. So:
YQUUKBNW
PASSWORD
Using tr ('cat krypton4 | tr 'YQUKBNW' 'pasword'), we infer C=I. As we try this substitution on the various cyphertexts, we soon make up words and find out that the first couple of words in krypton4 are actually 'well done the level four password is ...'. The rest is easy.

## Level 4 ##

Ah - a Vigenere cipher. No funky heuristics there, but not necessarily that much more complicated. We have a rather large sample of ciphertext, and we know the key length (6). Using the hints provided, this means we can 'generate' 6 monoalphabetic ciphertexts from each sample. Once we have those, we can apply some frequency analysis - the most recurring letter is most likely to be E.
 Key Position Sample 1   Sample 2 ##
 0   J   J
 1   V/K   V/R
 2   I   X/I
 3   O   O/D
 4   I   X/I
 5   C   C

Assuming the text is in English, what this tells us is that when E is encrypted with the first letter of the key, the resulting letter is J. When E is encrypted with the 2nd letter of the key, the resulting letter is probably V etc... From this, we essentially have:

 Plaintext   E   E   E  E E E
 Key   ?  ?    ?  ?   ?   ?
 Ciphertext  J   V   I   O   I   C
Obtaining such a key is straight-forward. Applying the key in reverse order on the krypton5 file (so Key is known, Plaintext isn't) yields the password for the next level.

## Level 5 ##

Just when I thought we were done with polyalphabetic ciphers, here comes another. This time the length of the key is unknown - and so is the cipher.

So I finally came back to this months later. I ended up looking for the index of coincidence. The suggested key length was 9 - and then it became a case of decrypting BELOSZ against likely keys. It was a *pain* and took much more manual work than anticipated but it's finally done.

This is clearly a stub. I'll need to get this written up properly and clean up my code.

## Level 6 ##

### TAKEAWAY NOTES ###

Build tooking from the ground up. It really helps...

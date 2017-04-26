---
layout: post
title: sslcert-store
excerpt: "Looking at local CAs (Certificate of Authority) for SSL."
categories: [itsec]
tags: [ssl]
comments: false
---

## SSL

When you make a request to a HTTPS site, you are a given a certificate that, presumably, validates the identity of the site in question. What that certificate essentially says is that Bob, your loyal and trusted friend/mayor/politician, vouches that Fred is who he says he is. That's cool if you trust Bob - but I've always been curious. Given this process is totally opaque to me, how many "Bob's" am I trusting?

### Certificate issuer

In this example we'll use `github.com` as our target URL. `curl` has a `-v` option that will output the information we require.

~~~ shell
$ curl -v https://github.com 2>&1 | grep 'SSL connection' -A 14
  * SSL connection using TLS1.2 / ECDHE_RSA_AES_128_GCM_SHA256
  *        server certificate verification OK
  *        server certificate status verification SKIPPED
  *        common name: github.com (matched)
  *        server certificate expiration date OK
  *        server certificate activation date OK
  *        certificate public key: RSA
  *        certificate version: #3
  *        subject:
  *        start date: Thu, 10 Mar 2016 00:00:00 GMT
  *        expire date: Thu, 17 May 2018 12:00:00 GMT
  *        issuer: C=US,O=DigiCert Inc,OU=www.digicert.com,CN=DigiCert SHA2 Extended Validation Server CA
  *        compression: NULL
  * ALPN, server accepted to use http/1.1
  > GET / HTTP/1.1
~~~

We can see who issued the certificate - namely 'DigiCert Inc'. But how do we know to trust DigiCert?

### Certificate store

I'm using Ubuntu as my base system, so this may differ a little for you. My "Bob's" are stored under `/etc/ssl/certs`. I had no idea I trusted so many!

~~~ shell
$ ls -l /etc/ssl/certs/ | wc -l
522
~~~

Back to our example above, we're looking for the certificate for DigiCert.

~~~ shell
$ ls -l /etc/ssl/certs/DigiCert*
lrwxrwxrwx 1 root root 66 Oct  2  2016 /etc/ssl/certs/DigiCert_Assured_ID_Root_CA.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Assured_ID_Root_CA.crt
lrwxrwxrwx 1 root root 66 Oct  2  2016 /etc/ssl/certs/DigiCert_Assured_ID_Root_G2.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Assured_ID_Root_G2.crt
lrwxrwxrwx 1 root root 66 Oct  2  2016 /etc/ssl/certs/DigiCert_Assured_ID_Root_G3.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Assured_ID_Root_G3.crt
lrwxrwxrwx 1 root root 62 Oct  2  2016 /etc/ssl/certs/DigiCert_Global_Root_CA.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Global_Root_CA.crt
lrwxrwxrwx 1 root root 62 Oct  2  2016 /etc/ssl/certs/DigiCert_Global_Root_G2.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Global_Root_G2.crt
lrwxrwxrwx 1 root root 62 Oct  2  2016 /etc/ssl/certs/DigiCert_Global_Root_G3.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Global_Root_G3.crt
lrwxrwxrwx 1 root root 73 Apr 26 15:28 /etc/ssl/certs/DigiCert_High_Assurance_EV_Root_CA.pem -> /usr/share/ca-certificates/mozilla/DigiCert_High_Assurance_EV_Root_CA.crt
lrwxrwxrwx 1 root root 63 Oct  2  2016 /etc/ssl/certs/DigiCert_Trusted_Root_G4.pem -> /usr/share/ca-certificates/mozilla/DigiCert_Trusted_Root_G4.crt
~~~

We're on the right track but which is it? None seem to match the full name (DigiCert SHA2 Extended Validation Server CA).

### Certificate chaining

As it turns out trust relationships are transitive with CAs. So if I trust Bob and Bob trusts Eve (never trust Eve), by association I should also trust Eve. What that means is that somewhere down the line, someone I trust trusts someone who trusts DigitCert. But whom?

~~~ shell
$ openssl s_client -showcerts -connect github.com:443 | grep CN
depth=2 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert High Assurance EV Root CA
verify return:1
depth=1 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert SHA2 Extended Validation Server CA
verify return:1
depth=0 businessCategory = Private Organization, jurisdictionC = US, jurisdictionST = Delaware, serialNumber = 5157550, street = "88 Colin P Kelly, Jr Street", postalCode = 94107, C = US, ST = California, L = San Francisco, O = "GitHub, Inc.", CN = github.com
verify return:1
 0 s:/businessCategory=Private Organization/jurisdictionC=US/jurisdictionST=Delaware/serialNumber=5157550/street=88 Colin P Kelly, Jr Street/postalCode=94107/C=US/ST=California/L=San Francisco/O=GitHub, Inc./CN=github.com
    i:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert SHA2 Extended Validation Server CA
    BAGCNzwCAQMTAlVTMRkwFwYLKwYBBAGCNzwCAQITCERlbGF3YXJlMRAwDgYDVQQF
     1 s:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert SHA2 Extended Validation Server CA
        i:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert High Assurance EV Root CA
        subject=/businessCategory=Private Organization/jurisdictionC=US/jurisdictionST=Delaware/serialNumber=5157550/street=88 Colin P Kelly, Jr Street/postalCode=94107/C=US/ST=California/L=San Francisco/O=GitHub, Inc./CN=github.com
        issuer=/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert SHA2 Extended Validation Server CA
~~~

The line that starts with `i` lists the issuing authority. So to recap we have:

 * GitHub's certificate
 * is issued by DigiCert SHA2 Extended Validatio Server CA
 * which is in turned issued by DigitCert High Assurance EV Root CA

The last issuer should look familiar - it's `DigiCert_High_Assurance_EV_Root_CA.pem` listed above. We can parse the raw certificate with `openssl` for more information:

~~~ shell
$ openssl x509 -in /etc/ssl/certs/DigiCert_High_Assurance_EV_Root_CA.pem -text | head
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            02:ac:5c:26:6a:0b:40:9b:8f:0b:79:f2:ae:46:25:77
    Signature Algorithm: sha1WithRSAEncryption
        Issuer: C=US, O=DigiCert Inc, OU=www.digicert.com, CN=DigiCert High Assurance EV Root CA
        Validity
            Not Before: Nov 10 00:00:00 2006 GMT
            Not After : Nov 10 00:00:00 2031 GMT
~~~

Who is to be trusted until 2031 - this frendship knows no boundaries!

### Breaking friendships

If Bob was to do something silly, like [issuing bogus certificates](https://arstechnica.com/security/2017/03/google-takes-symantec-to-the-woodshed-for-mis-issuing-30000-https-certs/), I might be tempted to distrust him (and by association, Eve - whom I told you was trouble). However I don't necessarily want this to be a permanent ban - maybe Bob can regain my trust after all.

To temporarily distrust a certificate, we can comment out the relevant line in `/etc/ca-certificates.conf`. In our case we'll comment out `DigiCert_High_Assurance`:

~~~ shell
$ sed 's/mozilla\/DigiCert_High/\!mozilla\/DigiCert_High/' /etc/ca-certificates.conf | grep '^!'
!mozilla/DigiCert_High_Assurance_EV_Root_CA.crt
$ sudo sed -i 's/mozilla\/DigiCert_High/\!mozilla\/DigiCert_High/' /etc/ca-certificates.conf
Wed Apr 26 16:46 >~
$ grep '^!' /etc/ca-certificates.conf
!mozilla/DigiCert_High_Assurance_EV_Root_CA.crt
~~~

Once done, you'll need to run `update-ca-certificates`:

~~~ shell
$ cp /usr/share/ca-certificates/mozilla/DigiCert_High_Assurance_EV_Root_CA.crt /tmp
Wed Apr 26 16:49 >~
$ sudo update-ca-certificates
Updating certificates in /etc/ssl/certs...
0 added, 1 removed; done.
Running hooks in /etc/ca-certificates/update.d...

Removing debian:DigiCert_High_Assurance_EV_Root_CA.pem
done.
done.
~~~

Now let's see what happens when we try connecting to GitHub again with `curl`:

~~~ shell
$ curl -v https://github.com 2>&1
* Rebuilt URL to: https://github.com/
*   Trying 192.30.255.112...
* Connected to github.com (192.30.255.112) port 443 (#0)
* found 172 certificates in /etc/ssl/certs/ca-certificates.crt
* found 688 certificates in /etc/ssl/certs
* ALPN, offering http/1.1
* SSL connection using TLS1.2 / ECDHE_RSA_AES_128_GCM_SHA256
* server certificate verification failed. CAfile: /etc/ssl/certs/ca-certificates.crt CRLfile: none
* Closing connection 0
curl: (60) server certificate verification failed. CAfile: /etc/ssl/certs/ca-certificates.crt CRLfile: none
More details here: http://curl.haxx.se/docs/sslcerts.html

curl performs SSL certificate verification by default, using a "bundle"
 of Certificate Authority (CA) public keys (CA certs). If the default
 bundle file isn't adequate, you can specify an alternate file
 using the --cacert option.
If this HTTPS server uses a certificate signed by a CA represented in
 the bundle, the certificate verification probably failed due to a
 problem with the certificate (it might be expired, or the name might
 not match the domain name in the URL).
If you'd like to turn off curl's verification of the certificate, use
 the -k (or --insecure) option.
~~~

Ha! `curl` couldn't verify the certificate so did not proceed with our request. Good. But what if we wanted to trust Bob again, just this time? If so we can just point `curl` to the certificate itself:

~~~ shell
$ curl --cacert /tmp/DigiCert_High_Assurance_EV_Root_CA.crt -v https://github.com 2>&1 | grep 'server certificate verification'
*        server certificate verification OK
~~~

To re-enable the cert, just remove the `!` and run `update-ca-certificates` again.

### Conclusion

There's a lot more behind the little padlock sign we see in browsers than a fancy icon. It also goes to show how important the root store is - and how closely guarded it must be.

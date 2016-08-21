---
layout: default
title: articles/aws-glacier
category: pages
---

## Using Glacier with Python ##

Most home users have a lot of static files - things like music, little Tommy's 1st, 2nd, ... birth day videos, holiday pictures etc... It's data that will never change and seldom needs to be accessed (often because there's a local copy) but would cause quite a heartache if lost.

[Amazon Glacier](http://aws.amazon.com/glacier/faqs/) provides cloud storage at a price much closer to local storage. The caveat is in the name - it's dead slow, but it's huge.

### Terminology ###

*   `archive`: a block of data (a single file, a zip/tar archive, anything)
*   `vault`: a logical container for `archives` (such that each `archive` belongs to a `vault`
*   `job`: an action, often asynchronous

It's worth noting you can have as many achives as you want per `vault`, but the number of `vaults` is limited to 1,000 (though this can be increased, but you've got to get in touch with Amazon).

### Setting things up ###

Assuming you already have an Amazon account (a standard one, for books and stuff):

*   Go to aws.amazon.com and select 'Sign Up'
*   Fill in the forms - that will include name & address, along with billing information. Note that you will need to provide that phone number with you as verification will be done on that number (a pin will show up on the screen and you will receive an automated call - enter the pin to validate the account)
*   Select the Basic support plan

You're now set up for Amazon Web Services. To access Glacier:


*   Open up the [management console](https://console.aws.amazon.com/console/home?#) and select Galcier (under Storage & Contents Delivery)
*   Make sure the correct region is selected! By default it will be Oregon - check the top right of the screen, it's a drop-down menu. Different regions have different costs associated with them, and latency will obviously be a factor.
*   Click on 'Create Vault' and give your first vault a name (unless you're familiar with SNS, skip the part about setting up notifications)

A vault has now been created in the region specified - but we now need to set up credentials. To do so, use the drop-down at the top of the screen with your name and select 'Security Credentials'. You will get a notification about how you are using a root account. That's something we'll want to look at later but right now we're simply trying to get things up and running.

*   Under 'Access Keys', press the 'Create access keys' button
*   Download your access keys

At this point it's probably worth putting those on paper. This is the only opportunity you have to view your keys.

This conclude setting things up - we now have all the tools we need to start using the `boto` module.

TODO:
*   look into MFA (multi factor auth)
*   look into SNS, as they can be delivered over a variety of protocols (including email)
*   look into root account/multiple users

### Using `boto` ###

{% highlight python %}
>>> import boto
>>> AWSAccessKeyId='your_key_id'
>>> AWSSecretKey='your_secret_key'
>>> glacier = boto.connect_glacier(aws_access_key_id=AWSAccessKeyId, aws_secret_access_key=AWSSecretKey, region_name='eu-west-1')
>>> vault = glacier.get_vault('my_vault')
>>> archive_id = vault.upload_archive('/path/to/archive', description='something useful')
{% endhighlight %}

The upload will block until complete, and will return the archive id. Amazon expects us to keep those safe, so do. I tend to keep it along some extra pieces of information (like md5sum) in a Dropbox folder.

TODO: that's raw. add content.

### Wrapper ###

I'm in the process of writing a wrapper to abstract some of the record-keeping (`boto` makes the communication with Glacier dead easy - it's already abstracted). You can find the [work in progress here](https://github.com/axiomiety/crashburn/blob/master/glacier_wrapper.py).

---
layout: post
title: ccent
excerpt: "Study plan for the CCENT exam."
categories: [tech]
tags: [networking]
comments: false
---

When I decided to take my CCENT, I had trouble deciding on how to go about it. There were mentions of practice exams, renting Cisco hardware, ... Not exactly what I had in mind (I wanted to take it on the cheap). Below are a few thoughts on how I tackled (and passed!) the exam.

## Prerequisits

I have (had?) zero networking experience and I don't work in networking. I do work with technology but looking back there was zero overlap - apart perhaps from some familiarity with binary and hexadecimal numbers (which will come in handy when subnetting/for IPv6 EUI).

It goes without saying, but I do not own any Cisco equipment either.

## Study material

### CCENT Study Guide by Todd Lammle

It's a relatively quick read that covers a lot of ground. I really liked the worked-through labs at the end of most chapters.

### CCENT/CCNA ICND1 100-105 Official Cert Guide by Wendell Odom

Probably *the* reference for ICND1. Very thorough and complete - though some chapters can feel like they'll never end.

### Ze Internet

Seriously. CCENT is a very popular exam - there are plenty of learners lurking around on forums, and just as equally there are some really knowledgeable guys happy to give a hand if you get stuck.

YouTube can be great too, wich people giving tutorials on subnetting and Packet Tracer.

## Tools

### Anki

[Anki](http://ankisrs.net/) is a flashcard app. I can't recommend this highly enough. By the time you get through all the chapters you'll most likely have forgotten material from the beginning. Anki allows you to create flashcards easily. They don't need to be complex and contain the full output of commands, but simple things like `Define an ACL to block TFPT for host 192.168.1.23 on F0/1`.

### Packet Tracer

[Packet Tracer](https://www.netacad.com/about-networking-academy/packet-tracer/) is a network emulator by Cisco themselves. The latest version (7 I believe) includes many enhancements. It's even available on mobile if you want to study on the go.

Do note however that some commands will *not* be available on PT (being an emulator and all). As long as you understand its limitations it's a very effective tool - and all labs mentioned by Todd Lammle should be doable in PT.

## Study plan

I originally started with Wendell's guide - and whilst it's very detailed, it can be a bit dry. I quickly switched over to Todd's and made a lot more progress - I then skimmed over Wendell's books depending on how well (or poorly) I did on the 'Do I Already Know This' quizzes at the beginning of each chapter (which provide a great review tool too).

Looking back Wendell's guide is by far more complete than Todd's. The exam might quiz you on bits of knowledge you wouldn't necessarily encounter in some exam cram session, which I feel is what Todd's is more tailored for.

Saying that I'd still start with Todd - it will give you confidence to read around certain topics and quickly provide you with the necessary knowledge to better appreciate some of the intricacies discussed in Wendell's. Just make sure you give Wendell a chance : )

To sum up, my study plan went roughly like this:

  * Go through Todd's guide
    * Create flashcards as I go through each chapters, into Anki
    * Do the labs
  * Go through Wendell's
    * Keep track of my DIAKT scores
    * Read up on any topic I get a low score on
  * Take a break (I took a week off any studying - though kept revising my flashcards)
  * Do Todd's labs again
  * Go through the DIAKT quizzes in Wendell's again
    * Review any topic you don't get a perfect score for

How long might this take? From start to finish I would say it took me around 150 hours, though I'm sure you can do it in less. If you do an hour a day that's roughly 6 months' worth of studying.

## Things to keep in mind

   * If your company has a learning and development team, it's worth asking if you have access to Safari books (which has more resources than I'd care to mention).
   * Check out the errata for any books you read. There will be times when the answer to some question doesn't make sense. You'll scratch your head for way too long before finding out the author made a mistake.
   * The [ccent](http://www.reddit.com/r/ccent) subreddit - I found out the eve of my exam. Way too late.
   * On the day of the exam, bring ear plugs. The exam centre I went to doubles as a training centre - and there was a lot of noise from the classrooms.
   * Troubleshooting - particularly with PT, there will be times when you try to set up a lab and it fails. Take this as an opportunity to understand what is going wrong.
   * Be curious! Don't hesitate to explore certain topics, even if they're not directly relevant to the exam.
   * If you get stuck on a topic, find different material that explains it in another way.
   * Be wary of syllabus changes. I was gearing up for 100-102 when it changed half-way through my study plan to 100-105 (Cisco retired the previous version). Those changes happen relatively quickly (we're talking 3-4 months - not a year in advance).

## Final remarks

The CCENT is a challenging exam but not an impossible one. It provides some very sold fundamentals to the world of networking and even though some of the concepts are Cisco-specific, a lot of the ideas are generic enough to be applied elsewhere.

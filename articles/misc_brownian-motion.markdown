---
layout: default
title: articles/brownian-motion
category: pages
---

## Random Walk

Let's start with a (fair) coin toss and attach a pay-off on the outcome:

$$X = \begin{cases}1 & \text{H} \\ -1 & \text{T}\end{cases}$$

With each outcome as equally likely ($$p = \frac{1}{2}$$).

So if it's head you get one of something (candy, nut, ...) and if it's tail you lose it. Now imagine that we don't stop at the first toss but that instead we keep going - for a very, very long time (it's a rainy day). We could be tempted to ask - after the `k`'th toss, what does the tally look like.

(sample run - if you hit refresh, it will generate a new one)

The way to express that would be: $X_k = \sum\limits_{i=1}^k X_i$ and we want to figure out the expected value: $E[X_k]$ (we're bored but not so bored that we don't want to try and predict the outcome).

The good thing about those tosses, is that each toss is independent from the previous one. So calculating the expectation can be simplified as:

$$E[X_k] = E[\sum\limits_{i=1}^k X_i] = \sum\limits_{i=1}^k E[X_i]$$

What's $$E[X_i]$$? Nothing more than $$(1)*p + (-1)*p = \frac{1}{2} - \frac{1}{2} = 0$$. That sort of makes sense - on average, there's no winner. So $$E[X_k]$$ is also equal to zero.

What about the variance?

$$Var(X_k) = E[X_k^2] - (E[X_k])^2 = 1 - 0 = 1$$.

By the [Central Limit Theorem](https://en.wikipedia.org/wiki/Central_limit_theorem), given a sufficiently large number of tosses, $$X_k \sim N(0,1)$$.

Below is an example of over 100 trials, each of 250 tosses.

(MULTI RANDOM WALK GOES HERE)

If we plot the distribution of the 250th toss, we get something vaguely resembling a bell curve:

(HIST PLOT GOES HERE)

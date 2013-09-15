---
layout: default
title: articles/fx-forward
category: pages
---

## Anatomy of an FX Forward ##

When I started looking at financial products, the FX Forward was one of those building blocks present everywhere different currencies were involved. However the forumla to describe the forward rate was always given with little or no explanation. Now I'm a sucker for trying to understand things from first principles so here it goes.

### Forward Rate ###

For simplicity, let's assume we're trying to lock in the exchange rate between USD and JPY one year for now. Now each currency has a risk-free one year rate which we denote $$r_{usd}$$ and $$r_{jpy}$$ respectively. 
 
So if we put away a certain amount of dollars for one year, at the end we will get $$\text{USD}(1+r_{usd})=\text{USD'}$$. If we now put an equivalent amount of yen away today, in one year we will get $$\text{JPY}(1+r_{jpy})=\text{JPY'}$$. Under no arbitrage (ie, no free money), as the amounts were equivalent at the start, they must also be equivalent at the end. Let us define $$S_t=\frac{\text{USD}}{\text{JPY}}$$ as today's exchange rate between dollars and yen, and the forward exchange rate (one year from now) *decided today* as $$F_t=\frac{\text{USD'}}{\text{JPY'}}$$.

Substituting for USD' and JPY', we have:

$$F_t=\frac{\text{USD}(1+r_{usd})}{\text{JPY}(1+r_{jpy})}$$

Now we know that $$S_t=\frac{\text{USD}}{\text{JPY}}$$ so $$\text{USD}=S_t\text{JPY}$$. Plugging this in for USD,

$$F_t=\frac{S_t\text{JPY}}{\text{JPY}}\frac{(1+r_{usd})}{(1+r_{jpy})}$$

$$F_t=S_t\frac{(1+r_{usd})}{(1+r_{jpy})}$$

We can take it one step further and generalise for the continuous case and any time period:

$$S_t\frac{e^{r_{usd}T}}{e^{r_{jpy}T}}=F_t$$

$$S_te^{(r_{usd}-r_{jpy})T}=F_t$$

This is the equation you'll find in many sources but hopefully it will no longer appear to have been plucked out of thin air.

I am indebted to Lucy Park for providing the [snippet](http://www.lucypark.kr/blog/2013/02/25/mathjax-kramdown-and-octopress/) that makes Latex play nice with github pages & markdown.

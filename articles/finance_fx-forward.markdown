---
layout: default
title: articles/fx-forward
category: pages
---

## Anatomy of an FX Forward ##

When I started looking at financial products, the FX Forward was one of those building blocks present everywhere different currencies were involved. However the forumla to describe the forward rate was always given with little or no explanation. Now I'm a sucker for trying to understand things from first principles so here it goes.

### Forward Rate ###

The formula for an forward exchange rate is pretty simple
\\[ F = S\frac{1+r_d}{1+r_f} \\]

Where F is the forward exchange rate, S the spot one

Imagine you have a certain amount of cash in USD and that the risk-free interest rate for USD is \\(r_d\\). In other words if you were to put the cash in a savings account, at the end of one year you'd have \\(USD(1+r_d)=USD'\\). Now assume with have an equivalent amount in JPY, and that the interest rate for that currency is \\(r_f\\). At the end of one year we'd have \\(JPY(1+r_f)=JPY'\\).

We generally assume there is no arbitrage opportunity - that is you can't make 'free' money. If you could buy an item for $100 and immediately sell it for $110, you would have found a way to make $10 risk-free. But whoever was selling you the item for $100 would quickly become suspicious and start increasing his sale price until it reaches equilibrium $110. It's similar with interest rate. If the risk-free rate for USD was higher than that for JPY and the exchange rate didn't reflect that, you'd have arbitrage.

Going back to our example, at the end of year one we have USD' on one hand and JPY' on the other. In this no-arbitrage world, it means those two amounts must be equal. So we have that \\(USD'=S_TJPY'\\) - that is, the USD' is equal to the JPY' amount times the exchange rate for 1 year from now (also known as the forward rate). So substituting in the above:

\\[ USD(1+r_{usd})=S_fJPY(1+r_{jpy}) \\]

\\[ \frac{USD(1+r_{usd})}{JPY(1+r_{jpy})} \\]

But \\(\frac{USD}{JPY}\\) is nothing more than today's exchange rate, which we denote by \\(S_0\\). Re-arranging, we get:

\\[ S_0\frac{1+r_{usd}}{1+r_{jpy}}=S_T \\]

Here is an example MathJax inline rendering \\( 1/x^{2} \\), and here is a block rendering: 
\\[ \frac{1_a}{n^{2}} \\]

but:
\\[ \frac{r_{usd}}{n^{2}r^{jpy}} \\]

---
layout: default
title: llog - (Coursera) Financial Engineering and Risk Management Part I
category: pages
---

<style>
table, th, td {
   border: 1px solid black;
  }
</style>

INTRODUCTION TO BASIC FIXED INCOME SECURITIES

## Basics of Fixed Income Securities

### Introduction to No-arbitrage

Eliminate the possibility of having something for nothing.

Let $p$ be the price of a contract at time $t=0$, and $c_k$ represent the cash flows for $k=1,...,T$.

Weak no arbitrage: If $c_k \ge 0$ for all $k$ then $p \ge 0$.

Strong no arbitrage: If $c_k \ge 0$ for all $k$ and $c_l \gt 0$ for some $l$ then $p \gt 0$.

_Under a number of assumptions, like liquidity etc..._

#### Pricing a simple bond

Price $p$ of contract that pays $A$ in one year, and we can lend/borrow at rate $r$.

Cashflows | $t=0$ | $t=T$
:---------|-------|------
Buy contract | $-p$ | $A$
Borrow | $\frac\{A\}\{1+r\}$ | $-A$


So at $t=0$ the cashflow is $\frac{A}{1+r}-p$ and at $t=T$ it is $A-A=0$. Under weak no arbitrage, $c_1 \ge 0$ which implies $\frac{A}{1+r}-p \ge 0$. By constructing the portfolio the other way around, we get $p-\frac{A}{1+r} \ge 0$. So $p = \frac{A}{1+r}$.

_Under the assmuption you can borrow and lend at the same rate etc..._

### Interest Rates and Fixed Income Instruments

#### Compound interest

Rate $r$ per period over $n$ periods with principal $A$.

After $n$ periods we have $(((A(1+r))(1+r))(1+r)...) = A(1+r)^n$.

Alternatively we usually quote $r$ annually - so something that pays $n$ times a year over $y$ year:

$$A(1+\frac{r}{n})^{yn}$$

In the continuous case where $\lim_{n\to\infty} A(1+\frac{r}{n})^{yn} = Ae^{ra}$.

#### Present value

Price $p$ of a contract that pays $$\textit{c} = (c_0, c_1,...,c_n)$$.

blah

## Basic Fixed Income Instruments

### A

### B

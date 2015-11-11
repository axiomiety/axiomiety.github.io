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

Risks? Never truly risk-free

  * Inflation
  * Default
  * Market

#### Perpetuity

$c_k = A$ for all $k \ge 1$. Then $P = \sum_{k=1}^{\infty} \frac{A}{(1+r)^k} = \frac{A}{r}$

#### Annuity

$c_k = A$ for all $k = 1,...,n$. Then $P$ is the price of a perpetuity minus the price of a perpetuity starting at year $n+1$.

$$P = \frac{A}{r} - \frac{A}{r}\frac{1}{(1+r)^n} = \frac{A}{r}(1-\frac{1}{(1+r)^n})$$

#### Yield To Maturity

Rate at which the present value of the cashflows equals the price of the bond. Generic metric used to compare bonds, doesn't take everything into account. Primarily used to gauge quality - lower quality -> lower price -> higher YTM.

### Interest Rates and Fixed Income Instruments

#### Compound interest

Rate $r$ annually over $n$ periods with principal $A$, for a duration of $y$ years.

$$A(1+\frac{r}{n})^{yn}$$

Continuous case: $\lim_{n\to\infty} A(1+\frac{r}{n})^{yn} = Ae^{ra}$.

#### Present value

Price $p$ of a contract that pays $$\textit{c} = (c_0, c_1,...,c_n)$$ and $r$ *per period*:

$$PV(\textit{c},r) = \sum_{k=0}^{k=n} \frac{c_k}{(1+r)^k}$$

Price under no abitrage:

Cashflows | $t=0$ | $t=k$
:---------|-------|------
Buy contract|$-p+c_0$|$-c_k$
Borrow $\frac{c_k}{(1+r)^k}$ up to time $k$|$\frac{c_k}{(1+r)^k}$|$c_k$

Essentially cashflows cancel out for all $k \ge 1$ and we're left with $\sum_{k=0}^{k=T}\frac{c_k}{(1+r)^k} - p \ge 0$ which gives a lower bound for $p$. Reverse the portfolio for an upper bound.

If we have different lending/borrowing rates $r_L$ and $r_B$ respectively, we have: $$PV(\textit{c},r_B) \le p \le PV(\textit{c},r_L)$$

## Basic Fixed Income Instruments

### Floating Rate and Term Structure

Linear pricing - price of cash flow $c_a$ is $p_a$, $c_b$ is $p_b$ then price of $c=c_a+c_b$ must be $p=p_a+p_b$. Proved via what if $p \le p_a + p_b$ to obtain a lower bound and reversing the argument for an upper bound.

For floating rate bonds, let $r_k$ denote the interest rate for interval $[k,k+1)$. Only known at time $k$, random quantity. Coupon payment at time $k$ are $r_(k-1)F$, face value at time $n$ is $F$.

To compute the arbitrage-free price $P_f$, let $p_k$ be the price of a contract paying $r_(k-1)F$ at time $k$ - and $P$ be the present value of the principal at time $n = \frac{F}{(1+r)^n}$  Then we have:

$$P_f = P + \sum_{k=1}^n p_k$$

We end up constructing a portfolio whereby each random term cancels out - leaving us with $P_f = F$.

TODO: review proof - it's actually really nice.

#### Term Structure

Let $s_t$ be today's interest rate for a loan maturing in $t$ years. Discount rate: $d(0,t) = \frac{1}{(1+s_t)^t}$.

Forward rate $f_{uv}$ is the rate quoted today for lending between period $u$ to $v$.

Relationship between spot and forward rates:

$$f_{u,v} = \bigg(\frac{(1+s_v)^v}{(1+s_u)^u}\bigg)^\frac{1}{v-u} - 1$$

And:

$$(1+s_t)^t = \prod_{t=0}{k-1}(1+f_{k,k-1})$$

#### Forward Contracts

Set the forward price $F$ at $t=0$ for maturity $T$, where $S_t$ is the price of the asset at time $t$.

Let $f_t$ be the current price of a long position in $F$ at time $t$. Then $f_t = S_t - F$. We set $F$ at $t=0$ such that $f_0$ is also equal to zero.

No arbitrage price leads to $F = \frac{S_0}{d(0,T)}$. This takes into account the cost of carry.

TODO: deriving $f_t$ for $t>0$.

---

INTRODUCTION TO DERIVATIVE SECURITIES

## Swaps & Futures

### Swaps

Swap cashflows - usually fixed for floating or vice versa. The exchanging-floating-for-fixed leg is defined to be long.

$r_t$ is the unknown interest rate at time $t$. Cash flows at time $t=1,...,T$.

   * Company A (long): receives $Nr_{t-1}$ and pays $NX$
   * Company B (short): receives $NX$ and pays $Nr_{t-1}$

Value of swap to company A:

$$V_a = N(1-d(0,T)) - NX \sum_{t=1}^{T}d(0,t)$$

### Futures

Settled daily. Has an initial margin > minimum margin (if it his minimum, top to initial). Can be used as hedge.

## Options and Options Pricing

### Options

### Options Pricing

## The 1-Period Binomial Model

### The 1-Period Binomial Model

### Option Pricing in the 1-Period Binomial Model

---

OPTION PRICING IN THE MULTI-PERIOD BINOMIAL MODEL

## The Multi-Period Binomial Model

### The Multi-Period Binomial Model

### What's Going On?

## Pricing American Options and Replicating Strategies

### Pricing American Options

Payoff at expiry is identical to that of a European.

Never optimal to early exercise an American call option on a non-dividend paying stock.

### Replicating Strategies

## Dividends, Pricing in the Binomial Model, and the Black-Scholes Model

### Including Dividends

### Pricing Forwards and Futures in the Binomial Model

### The Black-Scholes Model

## An Example: Pricing a European Put on a Futures Contract

### An Example: Pricing a European Put on a Futures Contract

---


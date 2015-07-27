---
layout: default
title: CBOE
category: pages
---

Chicago Board Options Exchange

## Language

<dl>
  <dt>Class</dt>
  <dd>All options on the same stock - e.g. GOOG</dd>
  <dt>Series</dt>
  <dd>Given strike and expiration date</dd>
  <dt>Type</dt>
  <dd>Put or Call</dd>
  <dt>Chain</dt>
  <dd>All the series that make up a class</dd>
</dl>

### Long/Short

You can short an option you do not own, without having to borrow it (unlike stocks).

### Expiration cycle

Every stock is assigned to one of 3 expiration cycles:

   * January: Jan, Apr, Jul, Oct
   * February: Feb, May, Aug, Nov
   * March: Mar, Jun, Sep, Dec

<dl>
  <dt>Front month</dt>
  <dd>First expiration month</dd>
  <dt>Back month</dt>
  <dd>Longer dated expiration months</dd>
</dl>

### Price intervals

Usually, but there are exceptions:

   * `<` $25: $2.5
   * $25 `<=` . `<=` $200: $5
   * `>` $200: $10

### Paying

Generally, option has to be paid in full on the next business day. If shorting, usually require to put up margin - unless it's covered (and there requirements will differ).

Assignment notice is received the day after an option is exercised.

### American/European

All equity options are American. The majority of index-based options are European.

## Mechanics

<dl>
  <dt>BTO</dt>
  <dd>Buy To Open: creates a long position</dd>
  <dt>STC</dt>
  <dd>Sell To Close: sell what you own to close a long position</dd>
  <dt>STO</dt>
  <dd>Sell To Open: sell to create a short position</dd>
  <dt>BTC</dt>
  <dd>Buy To Close: buy to close out a short position</dd>
</dl>

### Bid/Offer & Orders

<dl>
  <dt>Bid</dt>
  <dd>how much someone is willing to pay to buy this option - so if you're looking to sell, that's what you can get.</dd>
  <dt>Ask(Offer)</dt>
  <dd>how much someone is willing to part with his option for - if you're looking to buy, that's the price you'll have to pay.</dd>
</dl>

<dl>
  <dt>Market</dt>
  <dd>execute immediately, regardless of the price.</dd>
  <dt>Limit</dt>
  <dd>specify the maximum you're willing to pay.</dd>
</dl>


### Option Symbols

`AAPL 101218C175000`

   * `AAPL`: stock ticker
   * `101218`: expiry - yymmdd
   * `C`: option type - `C` for calls, `P` for puts
   * `175000`: strike price, to 3dp (so $175.000)

### Stock Splits

Price is always quoted per share - so $3 for a contract on 100 shares has a total value of $300.

Type|Number of contracts|Strike
:---|:------------------|:-----
`n`-for-1| multiply by `n` | divide by `n`
`m`-for-`n`| identical - adjust #shares/contract instead: multiply by `m`/`n` | divide by `m` multiply by `n`

## Options Basics

Options are a contract between a buyer and writer (seller). Options on equity have no voting rights, no dividends.

In the US, expiration date is usually the Saturday after the 3rd Friday of the expiration month. However people must exercise on the last trading day - so the Friday itself.

Exercise means invoking the rights granted by the contract. Assignment is done impartially (it's a zero-sum game - for every buyer there is a seller).

Central clearing house for all options in the US is the Options Clearing Corporation (OCC).

Open Interest - not something present with stocks - represents the numbre of outstanding contracts.

### Communicating An Order

Each order must contain:

   * Buy or sell
   * Opening/closing transaction
   * Quantity of the option
   * Underlier
   * Expiry
   * Strike
   * Call/put
   * Price/order type (eg, market)

Examples:

   * Buy, to open, 5 GM June 60 Calls at the market
   * Sell, to open, 10 HWP September 45 Calls at 4.10

### In, At, Out

Does not take premium into account - just strike and price of underlier.

Type|Call|Put
:---|:---|:--
`K > S`|Out|In
`K = S`|At|At
`K < S`|In|Out


### Intrinsic & Time Value

<dl>
  <dt>Intrinsic value</dt>
  <dd>Amount by which an option is in-the-money. Does not take premium into account - just strike.</dd>
  <dt>Time value</dt>
  <dd>Any amount in excess of intrinsic value (if premium - intrinsic > 0, that's the time value)</dd>
  <dt>At parity</dt>
  <dd>When the option permium is equal to the instrinsic value (no time value)</dd>
</dl>

## Price Behaviour

Option prices composed of 6 factors:

   * Price of the underlying
   * Strike
   * Time to expiry
   * Interest rates
   * Dividends
   * Volatility

Compared to insurance, volatility can be seen as the risk factor. When volatility increases, so do prices.

### Volatility

Movement without regard to direction - potential range (up/down).

### How Price Change

Calls vs Puts - there's an interest rate component in the call which is not present in the put.

Increase in:

   * underlier - price of the calls go up, price of the puts go down
   * strike price - similar to changing the deductible of an insurance policy. Raising the deductible decreases the price (for calls).
   * days to expiry - reducing the number of days by X% reduces the price of the calls and puts by < X% (time decay is non-linear).
   * interest rates - seldom looked at due to the short-term view most take, but impact can be significant for long-dated options. This is because compared with owning the stock outright, it's still cheaper than owning the option. This is because the call buyer can invest the difference.
   * dividend yield - when it increases, calls go down and puts go up. This is because dividends impact the underlier (inverse of underlier)
   * volatility - both calls and puts go up (risk goes up)

### Delta and Time Decay

Delta is dynamic - it changes as the price of the underlier changes and time changes. It can also be viewed (practically) as the "share equivalency" of an option.

Call & Put deltas

Type|OTM|ATM|ITM
:---|:--|:--|:--
Call|`0:+0.5`|`+0.5`|`+0.5:+1`
Put|`-0.5:0`|`-0.5`|`-1:-0.5`

Call vs put values: same strike/expiry, calls will be more expensive than puts because of the interest component. To illustrate this, note that a long call can be replicated with a long stock + long put position. Money spent for the long stock posn (whether outright or borrowed) could be earning interest instead - hence calls should be more expensive than the equivalent put.

Time Decay is non-linear. Most of the decay happens ~1/3 of the remaining life of an option.

Implied volatility - out of all the inputs, volatility is the only which cannot be obtained objectively. We 'back it out' from our option pricing formula. It is both the market consensus of future volatility as well as the volatility that produces the market price of the option.

## Spreading I

4 basic (vertical) spreads.

<dl>
  <dt>Debit Spread</dt>
  <dl>Total cash amount paid out for long option > total cash amount received for the short option</dl>
  <dt>Debit Spread</dt>
  <dl>Total cash amount received for the short option > total cash amount paid out for the long option</dl>
</dl>


### Bull Call Spread

  * Purchase a call option at strike A, and sell another at strike B where B > A
  * Number of options is identical
  * Same expiry
  * Debit spread
  * Characteristics
    * Maximum Profit: difference in strike - debit paid
    * Maximum Loss: debit paid
    * Break-Even Point: lower strike + debit paid
  * Notes
    * better suited for underliers with higher volatility
    * give up 'unlimited' potential for lower BEP
    * value changes slowly, maximum ontol at or close to expiry
    * picking the strike - 'selling' the target price (since you don't think it'll go any higher than that)

When legging out - entering a spread order to close, it is more prudent to buy back the short before liquidating the long - to avoid having an uncovered short call with unlimited downside.

### Bear Put Spread

  * Purchase a put at strike A, and sell another at strike B where A > B
  * Number of options is identical
  * Same expiry
  * Debit spread
  * Considered covered for margin purposes
  * Characteristics
    * Maximum Profit: difference in strike - debit paid
    * Maximum Loss: debit paid
    * Break-Even Point: higher strike - debit paid
  * Notes
    * Can be used to offset time value

### Bear Call Spread

Margin requirements for uncovered calls (for CBOE) is proceeds from sale + 10% of underlier.

  * Buy a call at strike A, sell a call at strike B where A > B
  * Number of options is identical
  * Same expiry
  * Credit spread (+ive on initialisation)
  * Margin requirement will be difference between strikes - proceeds from short call sales
  * Characteristics
    * Maximum Profit: credit received (underlier < B)
    * Maximum Loss: difference in strike price - credit received
    * Break-Even Point: higher strike - debit paid

### Bull Put Spread

Writing uncovered puts, just like writing uncovered calls, has high margin requirements. This spread has a static margin required at initialisation but no ongoing margin requirement (vs an uncovered put).

  * Buy a put a strike A, sell a put at strike B where A < B
  * Number of options is identical
  * Same expiry
  * Credit spread (+ive on initialisation)
  * Characteristics
      * Maximum Profit: credit received (underlier > B)
      * Maximum Loss: difference in strike price - credit received
      * Break-Even Point: higher strike - credit received

### Debit or Credit Spreads

Scenario: bullish on short term - bull call or bull put spread?

Any trader would rather receive money than pay it out. Also, the cost of exiting a put spread is nil - but the call spread isn't (and will require transaction costs).

The difference is based on the possibility of early assignment (not applicable with European-style options). Worst scenario is when assignment happens at a price between A and B.

## Basic of Spread: Straddles and Strangles

### Short Straddles

Holder expects decreased volatility.

  * Constructed by writing a call and a put
  * Same strike
  * Same expiry
  * 1:1 ratio
  * Credit spread

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

Call vs Puts - there's an interest rate component in the call which is not present in the put.

Change in:

   * *strike price* - similar to changing the deductible of an insurance policy. Raising the deductible decreases the price (for calls).
   * *days to expiry* - reducing the number of days by `X%` reduces the price of the calls and puts by < `X%` (time decay is non-linear).
   * *interest rates*- seldom looked at due to the short-term view most take, but impact can be significant for long-dated options. This is because compared with owning the stock outright, it's still cheaper than owning the option. This is because the call buyer can invest the difference.
   * *dividend yield* - when it increases, calls go down and puts go up. This is because dividends impact the underlier.
   * *volatility* - both calls and puts go up (risk goes up)

### Delta and Time Decay

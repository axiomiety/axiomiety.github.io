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

#### Long/Short

You can short an option you do not own, without having to borrow it (unlike stocks).

#### Expiration cycle

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

#### Price intervals

Usually, but there are exceptions:

   * `<` $25: $2.5
   * $25 `<=` . `<=` $200: $5
   * `>` $200: $10

#### Paying

Generally, option has to be paid in full on the next business day. If shorting, usually require to put up margin - unless it's covered (and there requirements will differ).

Assignment notice is received the day after an option is exercised.

#### American/European

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

#### Bid/Offer & Orders

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


#### Option Symbols

`AAPL 101218C175000`

   * `AAPL`: stock ticker
   * `101218`: expiry - yymmdd
   * `C`: option type - `C` for calls, `P` for puts
   * `175000`: strike price, to 3dp (so $175.000)

#### Stock Splits

Price is always quoted per share - so $3 for a contract on 100 shares has a total value of $300.

Type|Number of contracts|Strike
:---|:------------------|:-----
`n`-for-1| multiply by `n` | divide by `n`
`m`-for-`n`| identical - adjust #shares/contract instead: multiply by `m`/`n` | divide by `m` multiply by `n`

## Options Basics




---
layout: post
title: WAR-Elixir
excerpt: "Implementation of the WAR card game in Elixir."
categories: [tech]
tags: [elixir, howto]
comments: false
---

I've been picking up a bit of [Elixir]() on the side. Having done some Erlang previously the language is quite familiar - and feels more user friendly (though that may be my Python background talking). I am running through [Etudes for Elixir]() and Chapter 9 - implementing the WAR card game, felt worthy of a post.

I don't profess to writing 'proper' Elixir - this was more an exercise in how to handle asynchronous messaging with something requiring ordering. There is no focus on error handling and unit testing.

## The WAR game

Given a (shuffled) deck of 52 cards, the game is deterministic. You can find more on [Wikipedia]() but in a nutshell players divide the deck into 2 equal piles and 'battle' the top card repeatedly. Whoever has the highest rank wins his opponent's cards (suit is completely ignored) and places them at the bottom of their pile. Ties are dealt with by putting 3 cards face down and one more up (though rules differ). The game is one when one of the player no longer has any cards to play.

## Modelling the deck

Our deck will be represented as a `{<suit>, <rank>}` tuple. As WAR is suit-agnostic, we don't really need to. But this will help us track the cards in the deck. We use list comprehensions to easily generate tuples:

~~~ erlang
defmodule Cards do
  @moduledoc "Represents a deck of 52 cards shuffle(cards), do: cards

  @doc "A, K, Q, J are 13, 12, 11, 10 respectively"
  def make_deck do
    for suit <- ["C","D","H","S"], rank <- 2..13, do: {suit, rank}
  end

  def shuffle(cards), do: cards

end
~~~

For now the `shuffle` method won't do anything - we'll take another stab at this later.

## Entities

Our design will have 2 entities - player and dealer (so 2 players and one dealer). The player, once spawned, will respond to instructions from the dealer.

~~~ erlang
defmodule Player do

  def loop(name, cards) do
    IO.puts("#{name} has #{Enum.count(cards)} cards")
    receive do
      {:receive, new_cards} ->
        IO.puts("#{name} received #{Enum.count(new_cards)} from dealer")
        loop(name, cards ++ new_cards)
      {:give, from, num_cards} ->
        IO.puts("#{name} was asked to give #{num_cards} cards to #{inspect from}")
        {cards_to_give, remaining_cards} = Enum.split(cards, num_cards)
        send(from, {name, cards_to_give})
        loop(name, remaining_cards)
      {:show} ->
        IO.puts(Enum.join(["#{name}'s deck:" | Enum.map(cards, &("#{elem(&1,1)}#{elem(&1,0)}"))], " "))
        loop(name, cards)
    end
  end

end
~~~

We don't need `:show` for the game but it makes debugging easier. Let's take what we have so far for a spin:

~~~ erlang
iex(27)> deck = Cards.make_deck
[{"C", 2}, {"C", 3}, {"C", 4}, {"C", 5}, {"C", 6}, {"C", 7}, {"C", 8}, {"C", 9},
 {"C", 10}, {"C", 11}, {"C", 12}, {"C", 13}, {"D", 2}, {"D", 3}, {"D", 4},
 {"D", 5}, {"D", 6}, {"D", 7}, {"D", 8}, {"D", 9}, {"D", 10}, {"D", 11},
 {"D", 12}, {"D", 13}, {"H", 2}, {"H", 3}, {"H", 4}, {"H", 5}, {"H", 6},
 {"H", 7}, {"H", 8}, {"H", 9}, {"H", 10}, {"H", 11}, {"H", 12}, {"H", 13},
 {"S", 2}, {"S", 3}, {"S", 4}, {"S", 5}, {"S", 6}, {"S", 7}, {"S", 8}, {"S", 9},
 {"S", 10}, {"S", 11}, {"S", 12}, {"S", 13}]
iex(28)> {cards, _} = Enum.split(deck, 5)
{[{"C", 2}, {"C", 3}, {"C", 4}, {"C", 5}, {"C", 6}],
 [{"C", 7}, {"C", 8}, {"C", 9}, {"C", 10}, {"C", 11}, {"C", 12}, {"C", 13},
  {"D", 2}, {"D", 3}, {"D", 4}, {"D", 5}, {"D", 6}, {"D", 7}, {"D", 8},
  {"D", 9}, {"D", 10}, {"D", 11}, {"D", 12}, {"D", 13}, {"H", 2}, {"H", 3},
  {"H", 4}, {"H", 5}, {"H", 6}, {"H", 7}, {"H", 8}, {"H", 9}, {"H", 10},
  {"H", 11}, {"H", 12}, {"H", 13}, {"S", 2}, {"S", 3}, {"S", 4}, {"S", 5},
  {"S", 6}, {"S", 7}, {"S", 8}, {"S", 9}, {"S", 10}, {"S", 11}, {"S", 12},
  {"S", 13}]}
iex(29)> player1 = spawn(Player, :loop, ["Bob", cards])
Bob has 5 cards
#PID<0.178.0>
iex(30)> send(player1, {:show})
Bob's deck: 2C 3C 4C 5C 6C
{:show}
Bob has 5 cards
iex(31)> send(player1, {:receive, [{"S", 13}]})
Bob received 1 from dealer
{:receive, [{"S", 13}]}
Bob has 6 cards
iex(33)> send(player1, {:give, self(), 3})
Bob was asked to give 3 cards to #PID<0.101.0>
{:give, #PID<0.101.0>, 3}
Bob has 3 cards
~~~

Note that if Bob doesn't have enough cards, we'll just get an empty list:

~~~ erlang
iex(34)> send(player1, {:give, self(), 3})
Bob received :take 3 from #PID<0.101.0>
{:give, #PID<0.101.0>, 3}
Bob has 0 cards
iex(35)> send(player1, {:give, self(), 3})
Bob received :take 3 from #PID<0.101.0>
{:give, #PID<0.101.0>, 3}
Bob has 0 cards
iex(36)> flush
{"Bob", [{"C", 2}, {"C", 3}, {"C", 4}]}
{"Bob", [{"C", 5}, {"C", 6}, {"S", 13}]}
{"Bob", []}
:ok
~~~

Let's move to the dealer.

## The dealer


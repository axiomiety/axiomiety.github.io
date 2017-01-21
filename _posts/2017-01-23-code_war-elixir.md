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
      :show ->
        #TODO this should probably send something back
        IO.puts(Enum.join(["#{name}'s deck:" | Enum.map(cards, &("#{elem(&1,1)}#{elem(&1,0)}"))], " "))
        loop(name, cards)
      :stop ->
        IO.puts("#{name} is shutting down")
        :ok
    end
  end

end
~~~

We don't need `:show` for the game but it makes debugging easier - and `:stop` is there so we don't leave processed running unnecessarily. Let's take what we have so far for a spin:

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
iex(30)> send(player1, :show)
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
iex(37)> send(player1, :stop)
Bob is shutting down
:stop
~~~


The dealer is arguably the most interesting entity - this is because it has to deal with the asynchronicity of the messages. When it asks players for cards, the replies won't necessarily come back in the same order.

Setting the game up however is easy. For simplicity we're leveraging `Process.register` so we can access the players without having to pass PIDs around. The tricky bit here is to make sure we wait until all players have performed the required actions before proceeding. For this we will introduce the concept of `count`, which keeps track of the number of replies received. The first two lists represent the cards laid out for each player:

~~~ erlang
defmodule Dealer do

  def init() do
    deck = Cards.shuffle(Cards.make_deck())
    {dp1, dp2} = Enum.split(deck, 26)
    player1 = spawn(Player, :loop, ["Bob", dp1])
    Process.register(player1, :player1)
    player2 = spawn(Player, :loop, ["Alice", dp2])
    Process.register(player2, :player2)
    loop([], [], 0)
  end

  def loop([], [], 0) do
    send(:player1, {:give, self(), 1})
    send(:player2, {:give, self(), 1})
    receive do
      {:player1, cards} ->
        loop(cards, [], 1)
      {:player2, cards} ->
        loop([], cards, 1)
    end
  end

  def loop(p1, p2, count) when count < 2 do
    IO.puts("p1: #{inspect p1}, p2: #{inspect p2}")
    receive do
      {:player1, cards} ->
        loop(cards, p2, count + 1)
      {:player2, cards} ->
        loop(p1, cards, count + 1)
    end
  end

  def stop() do
    send(:player1, :stop)
    send(:player2, :stop)
  end
~~~

It's a little muddy but after requesting players to hand over a card we then need to be ready to accept incoming messages. Because messages are async, we could have 2 `receive` clauses in `loop([], [], 0)` - but a new definition with a guard feels a little neater (though as we'll see below we can do better using states and maps).

We can then list out the end conditions:

~~~ erlang
  def loop([], p2, count) when count == 2 do
    IO.puts("p1: [], p2: #{inspect p2} - P2 wins!")
    stop()
  end

  def loop(p1, [], count) when count == 2 do
    IO.puts("p1: #{inspect p1}, p2: [] - P1 wins!")
    stop()
  end

  def loop([], [], count) when count == 2 do
    IO.puts("It's a tie!")
    stop()
  end

~~~

This takes care of when a player (or both!) runs out of cards. Now for the main game logic:

~~~ erlang
  def loop([h1|t1], [h2|t2], count) when count == 2 do
    IO.puts("p1: #{inspect h1}, p2: #{inspect h2}")

    {_, v1} = h1
    {_, v2} = h2
    cond do
      (v1 > v2) ->
        IO.puts("p1 wins this round as #{v1} > #{v2}")
        send(:player1, {:take, [h1|t1] ++ [h2|t2]})
        loop([], [], 0)
      (v2 > v1) ->
        IO.puts("p2 wins this round as #{v2} > #{v1}")
        send(:player1, {:take, [h2|t2] ++ [h1|t1]})
        loop([], [], 0)
      (v1 == v2) ->
        IO.puts("tie! as #{v1} == #{v2}")
        send(:player1, {:give, self(), 3})
        send(:player2, {:give, self(), 3})
        loop([h1|t1], [h2|t2], 0)
    end
  end
~~~

## Further enhancements

It's a game that could arguably be played with a number of decks and more than 2 players. The code above is tied to 2 players - making the change would probably mean using some sort of state machine.

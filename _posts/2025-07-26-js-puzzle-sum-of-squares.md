---
layout: post
title: js-puzzle sum-of-squares
excerpt: "Jane Street's puzzles: Sum of Squares"
categories: [writeup]
tags: [puzzle]
---

* TOC
{:toc}

# The Puzzle

My first thought looking at [this](https://www.janestreet.com/puzzles/sum-of-squares-index/) was "man, that's a lot of possibilities to try" - specifically, $10^25$. The divisibility requirements really restrict the last column/row (e.g. the bottom right cell needs to be both divisible by 10 and 5, which really makes it 0), but all other cells are pretty much up for grabs.

# Prelims

Let's start by writing a few helper functions to make this easier to digest. This really means being able to split a number into individual digits, forming what is essentially a matrix (where each entry is a digit), and validating that a grid satisfied the divisability constraints.

Note that we're passing `n` as a paramater (`n=5` in the actual problem) to help us validate our logic on a much smaller search space (assuming a solution exists for smaller `n`s - but it definitely does for a 2x2, namely `99,96`).

First some convenience functions:

{% highlight python %}
def to_digits(val: int, n: int) -> list[int]:
    """
    expands val into individual digits

    returns a list of length n, 0-padded
    """
    ret = []
    x = val
    while x > 0:
        x, digit = divmod(x, 10)
        ret.append(digit)

    while len(ret) < n:
        ret.append(0)

    return list(reversed(ret))

def from_digits(arr: list[int]) -> int:
    return sum(digit*10**(idx) for idx, digit in enumerate(reversed(arr)))

def to_grid(digits: list[int], n: int) -> list[list[int]]:
    return [to_digits(val,n) for val in digits]

def pretty_print_grid(grid: list[list[int]]) -> None:
    for row in grid:
        print(",".join(str(col) for col in row))

def test_to_digits() -> None:
    assert to_digits(123,3) == [1,2,3]
    assert to_digits(123,4) == [0,1,2,3]

def test_from_digits() -> None:
    assert from_digits([1,2,3]) == 123
    assert from_digits([0,1,2,3]) == 123

def test_to_grid() -> None:
    assert to_grid([12,3],n=2) == [[1,2],[0,3]]

{% endhighlight %}

Pretty-printing the sample solution given:
```
1,6,2,3,5
5,2,4,6,0
0,4,8,9,3
2,4,8,6,8
4,7,0,3,0
```

And something to validate a solution:

{% highlight python %}
{% endhighlight %}

{% highlight python %}
{% endhighlight %}




# Conclusion

Using `ortools` feels like cheating? I'm a little conflicted in that the problem changed from finding a solution to formulating the problem into something `ortools` can understand, which I guess is a skill in itself.

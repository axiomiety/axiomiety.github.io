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

My first thought looking at [this](https://www.janestreet.com/puzzles/sum-of-squares-index/) was "man, that's a lot of possibilities to try" - specifically, 10^25. The divisibility requirements really restrict the last column/row (e.g. the bottom right cell needs to be both divisible by 10 and 5, which really makes it 0), but all other cells are pretty much up for grabs.

# Prelims

Let's start by writing a few helper functions to make this easier to digest - namely being able to split a number into individual digits, forming what is essentially a matrix (where each entry is a digit), and validating that a grid satisfied the divisability constraints.

Note that we're passing `n` as a paramater (`n=5` in the actual problem) to help us validate our logic on a much smaller search space (assuming a solution exists for smaller `n`s - but it definitely does for a 2x2, namely `98,98`).

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
def is_valid(digits: list[int], n: int) -> bool:
    for idx, number in enumerate(digits):
        if number % (idx+1) != 0:
            return False

    g = to_grid(digits, n)
    # transpose the grid
    g_t = [list(row) for row in zip(*g)]
    for idx, number in enumerate(from_digits(row) for row in g_t):
        if number % (idx+1+n) != 0:
            return False

    return True

def test_is_valid() -> None:
    assert is_valid([16235,52460,4893,24868,47030], 5)
    assert is_valid([98,98], 2)
{% endhighlight %}

# Restricting the search space

We've already seen that cells can be restricted to certain values (e.g. divisible by 2 implies an even number). That's usually fine for the last digit but what about the others? Are there other restrictions? For instance for `n=2`, the first column must a multiple of 3 less than 100. This limits the number of possiblities in the first column to 34. For the 2nd column that's 25 - for a total of 34x25=850 instead of 10^4=10,000.

The reason we approach this by column first (technically the rightmost) is that this is where the largest restrictions are (the smallest numbers divisible by 2*n). Does this help for `n=5`? Let's see:

{% highlight python %}
def calc_num_possibilities(n:int) -> int:
    max_value = 10**n-1
    total = 1
    # just the columns
    for i in range(n+1,2*n+1):
        # +1 'cause 0
        total *= max_value//i+1
    return total

print(f"{calc_num_possibilities(5):>50,}")
print(f"{9**(5*5):>50,}")
{% endhighlight %}

Yielding (right-aligned):
```
       330,727,514,418,000,000,000
10,000,000,000,000,000,000,000,000
```

Mmm. We ended up reducing the search space by a factor of 10,000 but despite that, the number of possibilities for a fully exhaustive search is still beyond our reach. Even if we were to play around with further optimisations such as `numba` a quick back-of-the-envelope calculation shows that assuming 1 billion tries a seconds, I'd be long dead by the time this completes.

## Sticking to `n=5`, adding heuristics

How likely is it that the leftmost column is actually `[0,0,0,0,6]`? The search space above contains many such rows. We are given a sample solution with a sum of 100 - which would give each row/column an average of 20. We could add an arbitrary constraint (to possibly be relaxed later) that any combination less than say N is to be ignored. What should that number be? Perhaps it depends on the column. For numbers divisible by 6 we could assume have a higher N than those divisible by 10. At any rate how small or large should N be? Here are some sample values:

|N| Search space |
|-|--------------|
|0|330,628,310,482,720,900,000|
|9|271,035,027,801,972,000,000|
|18|29,042,203,408,256,760,480|
|27|10,558,024,225,182,720|
|36|1,774,864|

By now it's become painfully clear that an exhaustive search for anything other than `N=36` is becoming less and less likely. But there is hope still! If we can find a solution for `N=36` we could run a wider search but with a higher threshold on the sum of a column's values - up from 100. For example a threshold of 200 would mean an average of 40 per column - which greatly prunes the lower ranges.

Let's get going using this and the previous approach of restricting ourselves to the multiples satisfying each column's constraints. This means search space is essentially multiples of 6 whose sum of the digits > 36, times multiples of 7 whose sum of digits > 36, etc...

{% highlight python %}
def get_ordered_multiples(k:int, n:int, min_sum: int) -> list[ValueHolder]:
    val = 0
    max_value = 10**n
    mults = []
    while val < max_value:
        digits = to_digits(val,n=n)
        if sum(digits) > min_sum:
            mults.append(ValueHolder(val, digits, sum(digits)))
        val += k
    # now sort it out
    return sorted(mults, key=lambda v: (v.sum_of_digits, v.value), reverse=True)

min_sum = 36
om6=get_ordered_multiples(6,n,min_sum)
om7=get_ordered_multiples(7,n,min_sum)
om8=get_ordered_multiples(8,n,min_sum)
om9=get_ordered_multiples(9,n,min_sum)
om10=get_ordered_multiples(10,n,min_sum-1) # there are no multiples whose sum is greater than 36! 36 itself is as high as it gets
{% endhighlight %}

But that doesn't yet guarantee we have a valid grid. For this we need 3 more conditions:

 - row 2 is even
 - row 3 is divisible by 3
 - row 4 is divisible by 4

We can prune the multiples of column 10 by ensuring digits 2 and 4 are even:

{% highlight python %}
# search space for multiples of 10 had to be relaxed, otherwise no valid combinations with even digits in rows 2 and 4 were found!
om10=get_ordered_multiples(10,n,min_sum=27)
om10=[x for x in om10 if x.digits[1] % 2 == 0 and x.digits[3] % 2 == 0]
{% endhighlight %}

For a number to be divisble by 4, the last 2 digits must be divisble by 4:

{% highlight python %}
from itertools import product
om9_om10 = [(col4,col5) for col4, col5 in product(om9,om10) if (10*col4.digits[3]+col5.digits[3]) % 4 == 0]
{% endhighlight %}

Which reduces the numer of combinations for the last 2 columns from 8480 to just 23!

And lastly for 3, we need the sum of all digits divisible by 3. Now that one is a little harder to get up front but we're now in a place whereby this is the last remaining condition to check whether a grid is valid.

# An exhaustive search

Using `N=36` as a baseline (relaxed for multiples of 10) we can now iterate through all the combinations relatively quickly:

{% highlight python %}
def print_grid(grid_transposed: list[list[int]]) -> None:
    grid = list(list(row) for row in zip(*grid_transposed))
    for row in grid:
        print(row)

max_sum = 0
for a in om6:
    for b in om7:
        for c in om8:
            for (d,e) in om9_om10:
                if (a.digits[2]+b.digits[2]+c.digits[2]+d.digits[2]+e.digits[2]) % 3 == 0:
                    if (sum_of_digits := sum((sum(x.digits) for x in (a,b,c,d,e)))) > max_sum:
                        max_sum = sum_of_digits
                        print(max_sum)
                        print_grid([a.digits,b.digits,c.digits,d.digits,e.digits])
{% endhighlight %}

This snippet finishes in a few seconds on an M2 chip with:

```
203
[9, 8, 9, 9, 9]
[9, 9, 9, 9, 8]
[9, 9, 8, 9, 7]
[9, 9, 8, 9, 6]
[6, 9, 8, 9, 0]
204
[9, 8, 9, 9, 9]
[9, 9, 9, 9, 8]
[9, 9, 9, 9, 9]
[9, 9, 6, 9, 6]
[6, 9, 8, 9, 0]
205
[9, 8, 9, 9, 9]
[9, 9, 9, 9, 8]
[7, 9, 8, 9, 9]
[9, 9, 8, 9, 6]
[8, 9, 8, 9, 0]
```

Suggesting that the maximum sum of digits satisfying the grid is 205.

# Cheat mode ON: `ortools`

Even though intuitively the solution was likely to be the best (because we ordered our iteration by the maximum sum of the digits of the multiples), I wasn't entirely satisfied. What if we hadn't found a solution then? What approach would Ineed to take? After letting that sink in for a bit, I remembered reading an article about using integer programming to solve magic squares and wondered whether this was applicable here.

I struggled a bit to define the constraints in ways that were understood by the solver - particularly with modulo operations since those were not applicable to individual variables (cells) but dependent on a collection of. It turns out the workaround was to define such variables separately - complete with their own range - and define new equalities. All in all it was surprinsgly concicse:

{% highlight python %}
from ortools.sat.python import cp_model

def to_number(row):
    return sum(x*(10**i) for i, x in enumerate(reversed(row)))

def solve_square(n=3):
    model = cp_model.CpModel()
    grid = [[model.new_int_var(0,9,f"cell_{i}_{j}") for j in range(n)] for i in range(n)]
    grid_t = [list(row) for row in zip(*grid)]

    for row_idx in range(n):
        new_var = model.new_int_var(1,10**n-1, f"row_{row_idx}")
        model.add(new_var == to_number(grid[row_idx]))
        model.add_modulo_equality(0, new_var, row_idx+1)

    for col_idx in range(n):
        new_var = model.new_int_var(1,10**n-1, f"col_{col_idx}")
        # use the transposed grid, it's simpler to reason about
        model.add(new_var == to_number(grid_t[col_idx]))
        model.add_modulo_equality(0, new_var, col_idx+n+1)

    # that's the constraint for the maximum sum
    model.maximize(sum(grid[row][col] for row in range(n) for col in range(n)))

    solver = cp_model.CpSolver()
    print(f"solving for n={n}")
    status = solver.Solve(model)
    if status in (cp_model.FEASIBLE, cp_model.OPTIMAL):
        for i in range(n):
            print([solver.Value(grid[i][j]) for j in range(n)])
        total = sum(solver.Value(grid[i][j]) for i in range(n) for j in range(n))
        print(f"sum: {total}, status: {'optimal' if status == cp_model.OPTIMAL else status}")
    else:
        print("no solution found")

{% endhighlight %}

after calling `solve_square(5)` and waiting a few seconds, voila:

```
solving for n=5
[9, 8, 9, 9, 9]
[9, 9, 9, 9, 8]
[7, 9, 8, 9, 9]
[9, 9, 8, 9, 6]
[8, 9, 8, 9, 0]
sum: 205, status: optimal
```

No hacky heuristics, no reducing the search space, ... The solver took barely any time to come up with the optimal solution. I have no clue how this works under the covers but I'll be sure to take a peek (setting `solver.parameters.log_search_progress = True` sheds some light on the whole process but unless you know what `fs_random_no_lp` means, it still feelds pretty cryptic).


# Conclusion

I got curious and wondered how far I could take the `ortools` solution - and it turns out that up to `n=8` it's near instantaneous. Anything after that gives a solution very quickly if you ctrl+c it (great feature by the way - giving you the best thus far), but it takes longer and longer to *prove* it is the best.

Using `ortools` feels like cheating. I'm a little conflicted in that the problem changed from finding a solution to formulating the problem into something `ortools` can understand, which I guess is a skill in itself? I guess if I was to do take this to the extreme I'd stick to pen and paper.

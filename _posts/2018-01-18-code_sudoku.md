---
layout: post
title: sudoku-solver
excerpt: "A simple sudoku solver in Python"
categories: [coding]
tags: [python, howto]
comments: false
---

# Solving Sudoku using Python

[Sudoku](https://en.wikipedia.org/wiki/Sudoku) is a game whereby a grid needs to be filled with numbers such that certain properties are maintained at all times. A solution is deemed to have been found once the grid is complete.

I was working through the [eight queens puzzle](https://en.wikipedia.org/wiki/Eight_queens_puzzle) as part of [SICP]() and thought the concept of adding all positions to the fringe would be particularly applicable.

## Setting things up

We represent the board as a nested array. That is:

~~~ shell
[
  [1, 2, 3, 4],
  [4, 3, 2, 1],
  [3, 4, 1, 2],
  [2, 1, 4, 3]
]
~~~

Empty cells are represented with `None`. Given a board, we'll want the ability to access:
  * rows
  * columns
  * sub-squares (which we'll call chunk)

Let's kick this off by creating some methods to help us access those 3 items, with some tests first:

~~~ python
  def test_boardAccessors(self):
    b = [[1,2],[3,4]]
    self.assertEqual(row(b,0), [1,2])
    self.assertEqual(row(b,1), [3,4])
    self.assertEqual(col(b,0), [1,3])
    self.assertEqual(col(b,1), [2,4])

    # this is not a valid board, we just want to make sure we get unique chunks
    b = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [-1, -2, -3, -4],
            [-5, -6, -7, -8]
        ]
    chunks = boardChunks(b)
    self.assertEqual(chunks[0], [1,2,5,6])
    self.assertEqual(chunks[1], [3,4,7,8])
    self.assertEqual(chunks[2], [-1,-2,-5,-6])
    self.assertEqual(chunks[3], [-3,-4,-7,-8])
~~~

And the corresponding methods:

~~~ python
def col(board, idx):
    return [row[idx] for row in board]

def row(board, idx):
    return board[idx]

def boardChunks(board):
    chunks = []
    n = len(board)
    chunkSize = int(math.sqrt(n))
    for r in range(chunkSize):
        rows = board[r*chunkSize:(r+1)*chunkSize]
        for c in range(chunkSize):
            chunk = []
            for rr in rows:
                chunk.extend(rr[c*chunkSize:(c+1)*chunkSize])
            chunks.append(chunk)
    
    return chunks
~~~

Note that chunks is implementation-specific in the above, but the test need not be (e.g. by using sets).

## Correctness

As our potential solutions evolve, we'll need the ability to check whether a row, column or chunk is valid.

~~~ python
    def test_validity(self):
        b = [
                [1, 2, 3, 4],
                [4, 3, 2, 1],
                [3, 4, 1, 2],
                [2, 1, 4, 3]
            ]
        self.assertTrue(isBoardComplete(b))
        self.assertTrue(isBoardValid(b))
        b[0][0] = None
        self.assertFalse(isBoardComplete(b))
        self.assertTrue(isBoardValid(b))
        # rows and columns are valid but chunks aren't
        b = [
                [1, 2, 3, 4],
                [2, 3, 4, 1],
                [3, 4, 1, 2],
                [4, 1, 2, 3]

            ]
        self.assertFalse(isBoardValid(b))
~~~

And the implementation. Note we fully accept `None` may be part of the input.

~~~ python
def isValid(cons):
    ''' a list of digits is valid iff there are no duplicates
        and 1 <= k <= n for all k, where n is the width of the board '''
    n = len(cons)
    # we filter out potential None
    digits = [c for c in cons if c is not None]
    return len(digits) == len(set(digits)) and all(1 <= k <= n for k in digits)

def isBoardValid(board):
    n = len(board)
    return all(isValid(col(board, idx)) and isValid(row(board,idx)) for idx in range(n)) \
            and \
            all(isValid(chunk) for chunk in boardChunks(board))

def isBoardComplete(board):
    return not any(map(lambda rr: None in rr, board))
~~~

## Algorithm

We won't be particularly clever and instead

## Taking it further

This code focuses on the ease of implementation, not performance. For instance there may be cases where starting with the fullest column would be more optimal.

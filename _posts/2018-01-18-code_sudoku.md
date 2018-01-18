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

We won't be particularly clever - the gist of the algorithm is to fill all the empty slots with digits such that the constraints (row, col and chunks) are all satisfied. The steps taken will be are as follows:
  # while a solution has *not* been found:
    # pop a board off our list of valid boards
    # if the board is full (no `None`s) and valid, that's our solution
    # pick the fullest row (i.e. the one with the least empty cells)
    # generate all possible rows such that the board remains valid
    # for each row, create a new board with the new row merged in
    # add each new board to the list of valid boards

With the helper functions defined above, what's left to define are 2 functions (one to get the fullest row, one to generate valid rows) and the algo itself.

As before, let's start with some tests:

~~~ python
    def test_getFullestRowIdx(self):
        # the fullest row is the first one, but it has no empty cells
        # so we're not interested
        b = [
                [1,2,3],
                [None, None, None],
                [None, 1, None],
                [None, 1, 2]
            ]
        self.assertEqual(getFullestRowIdx(b), 3)

    def test_genValidRows(self):
        b = [
                [1, None, None, None],
                [None, None, None, 1],
                [None, None, None, None],
                [2, 1, 4, 3]
            ]
        valid_rows = [[4, 3, 1, 2], [3, 4, 1, 2]]
        self.assertEqual(genValidRows(b, 2), valid_rows)
        valid_rows = [[1, 4, 3, 2], [1, 3, 2, 4], [1, 2, 3, 4]]
        self.assertEqual(genValidRows(b, 0), valid_rows)
~~~

Followed by implementation:

~~~ python
def getFullestRowIdx(board):
    minNones = len(board) # worst case scenario, row is totally empty
    fullestRow = 0
    for rowIdx in range(len(board)):
        r = row(board, rowIdx)
        c = r.count(None)
        if 0 < c < minNones:
            fullestRow = rowIdx
            minNones = c
    
    return fullestRow

def genValidRows(board, rowIdx):
    r = row(board, rowIdx)
    rows = [r]
    valid_rows = []
    while rows:
        r = rows.pop()
        emptyIdx = r.index(None)
        for val in range(1, len(r)+1):
            new_row = r[:]
            new_row[emptyIdx] = val
            if isValid(new_row) and isBoardValid(merge(board, new_row, rowIdx)):
                if None in new_row:
                    rows.append(new_row)
                else:
                    valid_rows.append(new_row)

    return valid_rows
~~~

We need to define `merge`, which is nothing more than:

~~~ python
def merge(board, row, rowIdx):
    new_board = copy.deepcopy(board)
    new_board[rowIdx] = row
    return new_board
~~~

Note this returns a brand new board - no reference to the underlying one is kept

All that's left is to define the algorithm's main loop:

~~~ python
def solve(board):
    boards = [board]

    while boards:
        b = boards.pop()

        if isBoardComplete(b) and isBoardValid(b): # technically the board should already by valid
            return b # a potential solution

        candidate_row_idx = getFullestRowIdx(b)

        for possible_row in genValidRows(b, candidate_row_idx):
            boards.append(merge(b, possible_row, candidate_row_idx))
        
    return [] # no solution
~~~

## Use-case

Taking the incomplete board below, as shared in Wikipedia:

~~~ python
sampleBoard = [
    [5,3,None,None,7,None,None,None,None],
    [6,None,None,1,9,5,None,None,None,],
    [None,9,8,None,None,None,None,6,None],
    [8,None,None,None,6,None,None,None,3],
    [4,None,None,8,None,3,None,None,1],
    [7,None,None,None,2,None,None,None,6],
    [None,6,None,None,None,None,2,8,None],
    [None,None,None,4,1,9,None,None,5],
    [None,None,None,None,8,None,None,7,9]
]
~~~

Our code outputs the following:

~~~ python
[[5, 3, 4, 6, 7, 8, 9, 1, 2],
 [6, 7, 2, 1, 9, 5, 3, 4, 8],
 [1, 9, 8, 3, 4, 2, 5, 6, 7],
 [8, 5, 9, 7, 6, 1, 4, 2, 3],
 [4, 2, 6, 8, 5, 3, 7, 9, 1],
 [7, 1, 3, 9, 2, 4, 8, 5, 6],
 [9, 6, 1, 5, 3, 7, 2, 8, 4],
 [2, 8, 7, 4, 1, 9, 6, 3, 5],
 [3, 4, 5, 2, 8, 6, 1, 7, 9]]
~~~

Job done!

## Taking it further

This code focuses on ease of implementation and not performance. For instance there may be cases where starting with the fullest column would be more optimal, as opposed to the fullest row. Validating the chunks is also sub-optimal - we don't need to validate all the chunks, only the one we're operating in.

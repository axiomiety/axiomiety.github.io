---
layout: post
title: genetic-algo-python
excerpt: "A simple genetic algorithm using Python."
categories: [tech]
tags: [howto python algo]
---

This is an implementation of the procedure described on [ai-junkie](http://www.ai-junkie.com/ga/intro/gat2.html).

The full code is available [here](https://github.com/axiomiety/crashburn/blob/master/ga.py).

You'll note the code is fairly functional and peppered with `assert` after each function. This was to provide quick feedback and convince myself functions were more or less working as expected.

## Encoding the genes

This is relatively straight forward - the key thing to note is that we don't need a full encoding. This means that if a gene mutates to `0xf` it will be invalid. As we'll see later it will also mean the chromosome carryingn that gene won't survive to the next round.

{%highlight python%}
    GENES_TO_ENCODING = {
      '0':  0x0,
      '1':  0x1,
      '2':  0x2,
      '3':  0x3,
      '4':  0x4,
      '5':  0x5,
      '6':  0x6,
      '7':  0x7,
      '8':  0x8,
      '9':  0x9,
      '+':  0xa,
      '-':  0xb,
      '*':  0xc,
      '/':  0xd,
}
{%endhighlight%}

For our particular case a chromosome will be represented as a sequence of 5 genes - so `1+1/4` would be `0x1a1d4`.

## Extracting and decoding genes

Extracting genes is akin to applying a 4-bit mask (the size of a single gene).

{%highlight python%}
    def extract(chromosome):
      genes = []
      m = 2**GENE_LENGTH - 1 # what we'll use to mask our genes
      for i in range(CHROMOSOME_LENGTH):
        # we want to extract each group of GENE_LENGTH bits from the chromosone
        mask = m << i*GENE_LENGTH
        gene = (chromosome & mask) >> i*GENE_LENGTH
        genes.append(gene)
      genes.reverse() # as we went from right to left
      return genes
    
    assert extract(0x43ae2) == [4,3,10,14,2] 

{%endhighlight%}

Note the right-shift as our mask might be something like `0b00001111000000000000` - so once we have the relevant gene we need to get rid of all the extra zeroes to the right.

Decoding is just mapping the encoding to the actual genes:

{%highlight python%}
    def decode(chromosome):
      # there's a chance the gene encoding does not match anything we know, like 0xf
      genes = extract(chromosome)
      return [ENCODING_TO_GENES.get(gene, None) for gene in genes]
{%endhighlight%}

A chromosome is only valid if all the genes themselves are valid and *in the right place*. This means we need the genes are positions 2 and 4 to be operators, not numbers. We can probably relax this a little, but it makes it easier to comprehend.


{%highlight python%}
    def validate(genes):
      # we assume num, op, num, op, num
      m = False
      for gene in genes:
        if m:
          if gene not in ['+','-','*','/']:
            return False
          m = False
        else:
          if gene not in ['0','1','2','3','4','5','6','7','8','9','0']:
            return False
          m = True
      return True # we have a valid sequence
    
    assert validate(['+']) == False
    assert validate(['0','/','3','+','1']) == True
{%endhighlight%}

## Crossover

The crossover step takes two chromosomes and an index, and swaps parts between them. Namely `new_a = a[:idx] + b[idx:]` and `new_b = b[:idx] + a[idx:]`. Given we're using bits, we're using masks again.

Python's `~` operator is not the 'not' some people are used to - it's actually 2's complement. To get the actual *not* (e.g. `~0xf0 -> 0x0f`) we need to mask it with `0xfffff`.

It's also a bit of a shame that we're reading genes from left to right when their binary representation really works from right to left. It'd probably make the code a little neater if we could read them the other way around.

{%highlight python%}
    def crossover(a, b, gene_number):
      # we're counting genes from left to right
      mask_swapped = 2**(GENE_LENGTH*(CHROMOSOME_LENGTH-gene_number))-1
      mask_notswapped = ~mask_swapped & 2**(CHROMOSOME_LENGTH*GENE_LENGTH)-1
    
      new_a = (a & mask_notswapped) ^ (b & mask_swapped)
      new_b = (b & mask_notswapped) ^ (a & mask_swapped)
      return (new_a, new_b)
    
    assert crossover(0x10001,0x01010,3) == (0x10010,0x01001)
    assert crossover(0x54321,0x12345,4) == (0x54325,0x12341)
    assert crossover(0x54321,0x12345,3) == (0x54345,0x12321)
{%endhighlight%}

## Mutation

This step is straight forward - we toggle bits on and off based on probabilities.

{%highlight python%}
    def mutate(chromosome, probabilities, mutation_rate):
      # probabilities is an array of uniform(0,1) probabilities
      for idx, p in enumerate(probabilities):
        if p < mutation_rate:
          mask = 1 << (CHROMOSOME_LENGTH*GENE_LENGTH-idx-1) # ugly - maybe we should always index from the right
          chromosome ^= mask
      #print(bin(chromosome))
      return chromosome
    
    assert mutate(0x30100,[1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],0.5) == 0x20101
{%endhighlight%}

## The first population

Creating the initial population in a meaningful way was a little harder than I thought. I first thought I'd just need to randomly generate integers in the `(0,2**5*4)` range. However that would mean that by definition, about half would start with 0. Instead I opted to generate each gene individually, which gave me better results.

{%highlight python%}
    def create_initial_population(population_size):
      chromosomes = []
      for i in range(population_size):
        # we generate each gene separately
        chromosome = 0
        for g in range(CHROMOSOME_LENGTH):
          gene = random.randint(0,2**GENE_LENGTH-1) # so GENE_LENGTH bits
          chromosome ^= gene << g*GENE_LENGTH
        chromosomes.append( chromosome )
      return chromosomes
    
    assert len(create_initial_population(20)) == 20
{%endhighlight%}

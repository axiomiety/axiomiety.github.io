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

## Extracting genes

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

### Worked example

Let `chromosome = 0x43ae2`. We generate the first mask by bitshifting `0xf`, or `0b1111` by 0. This means `chromosome & mask = 0x43ae2 & 0x0000f = 0x2`. For the second mask we bitshift `0xf` by 4 - so `0xf0`. We then have `chromosome & mask = 0x43ae2 & 0x000f0 = 0xe0`. We need to bitshift this to the right by 4, leading to `0xe` - and continue until we isolate each group of 4 bits.

## Decoding genes

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

### Worked example

Let's work through the last `assert` - namely `a = 0x54321`, `b = 0x12345` and `gene_number=3`.

`mask_swapped = 0x000ff` with the leading zeroes added for clarity, and `mask_notswapped = 0xfff00` (c.f. comment about 2's complement). Then `a & mask_notswapped = 0x54300` and `b & mask_swapped = 0x00045`. XOR'ing just means adding the two together - leading to `0x54245`.

## Mutation

This step is straight forward - we toggle bits on and off (using XOR) based on probabilities drawn from a uniform distribution and being less than `mutation_rate`.

{%highlight python%}
    def mutate(chromosome, probabilities, mutation_rate):
      # probabilities is an array of uniform(0,1) probabilities
      for idx, p in enumerate(probabilities):
        if p < mutation_rate:
          mask = 1 << (CHROMOSOME_LENGTH*GENE_LENGTH-idx-1) # ugly - maybe we should always index from the right
          chromosome ^= mask
      return chromosome
    
    assert mutate(0x30100,[1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],0.5) == 0x20101
{%endhighlight%}

I could have had the method just take the mutation rate but I wanted it to give the same output given the same inputs (which is harder to do if I generate the probabilities internally).

## The first population

Creating the initial population in a meaningful way was a little harder than I thought. I first thought I'd just need to randomly generate integers in the `(0,2**5*4)` range. Instead I opted to generate each gene individually as it makes it easier to reason about what the initial population will look like. We also ensure the chromosomes generated are valid - otherwise they'd be discarded in the first iteration.

{%highlight python%}
    def create_initial_population(population_size):
      chromosomes = []
      for i in range(population_size):
        # we generate each gene separately
        chromosome = 0
        while not validate(decode(chromosome)):
          chromsome = 0
          for g in range(CHROMOSOME_LENGTH):
            gene = random.randint(0,2**GENE_LENGTH-1) # so GENE_LENGTH bits
            chromosome ^= gene << g*GENE_LENGTH
        chromosomes.append( chromosome )
      return chromosomes
    
    assert len(create_initial_population(20)) == 20
{%endhighlight%}

## Chromosome selection

In each iteration we'll need to select a pair of chromosomes. However not all chromosomes are equal - some are 'fitter' than others and should therefore have a higher probability of being selected.

I take *no* credit for the below - this was taken from [SO](http://stackoverflow.com/questions/10324015/fitness-proportionate-selection-roulette-wheel-selection-in-python) : )

{%highlight python%}
    def weighted_random_choice(chromosomes):
      total_fitness = sum(c.fitness for c in chromosomes)
      pick = random.uniform(0, total_fitness)
      curr = 0
      for c in chromosomes:
        curr += c.fitness
        if curr >= pick:
          return c
      raise Exception('that should never happen! {0} {1}'.format(total_fitness, pick))
{%endhighlight%}

To understand *why* this works, picture a series of rectangles next to each other. A 'fit' chromosome might have a rectangle of width 10 whereas an unfit one might have a width of just 2. Putting those two next to each other we have a rectangle of width 12. When generating a number between 0 and 12, there's a 10:2 chance that the number generated will fall within the boundary of the first rectangle.

Note this only works if fitness is positive (woops).

## Putting it all together

The steps are then as below:

- generate the initial population and evaluate the fitness of each chromosome
- create a new (empty) population
- pick 2 chromosomes from the existing population, proportionally to their fitness
- decide whether to cross them over
- mutate each based on the mutation rate
- add them into the new population, replacing your initial population
- lather, rinse repeat

If an exact solution hasn't been found, you can then grab the chromosomes with the highest fitness to find the best approxmation.

Check out the `run` method in [this module](https://github.com/axiomiety/crashburn/blob/master/ga.py) for an actual implementation.

## Conclusion

This was actually very informative. Conceptually it's rather simple - though getting a decent fitness function, along with tuning the parameters (like mutation rate, number of rounds etc...) can be hard to get right.

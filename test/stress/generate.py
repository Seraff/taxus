#!/usr/bin/env python3

from dendropy.simulate import treesim
from tqdm import tqdm

if __name__ == '__main__':
  for num in tqdm(range(1000, 15000, 1000)):
    tree = treesim.birth_death_tree(1, 0, num_total_tips=num)
    tree.write(path=f'trees/{num}.tre', schema="newick")

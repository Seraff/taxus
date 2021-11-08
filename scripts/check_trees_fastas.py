#!/usr/bin/env python3

##################################################
## The script checks if all not marked taxa in the tree exists in corresponding fasta file
##################################################
## Author: Serafim Nenarokov
## Copyright: Serafim Nenarokov 2020, Fangorn
## License: GPLv3
## Email: nenarokov@paru.cas.cz
##################################################

import os
import argparse
import glob
import re
from pathlib import Path

from Bio import Phylo
from Bio import SeqIO

FASTA_FILE_REGEX = re.compile(r"^RAxML_bipartitions\.(.+)\.tre$", re.IGNORECASE)

class BColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def get_options():
  description = 'The script checks if all not marked taxa in the tree exists in corresponding fasta file'
  parser = argparse.ArgumentParser(description=description)
  parser.add_argument("-t", "--trees", required=False, default="./", help="Folder with tree files (current folder by default)")
  parser.add_argument("-f", "--fastas", required=False , help="Folder with fasta files (tree folder by default)")
  return parser.parse_args()


def get_fasta_path(tree_path, fasta_folder_path):
  tree_name = os.path.basename(tree_path)
  fasta_name = re.findall(FASTA_FILE_REGEX, tree_name)



  if (fasta_name):
    fasta_name = fasta_name[0]

    fasta_name_splitted = fasta_name.split('.')
    fasta_name_splitted.insert(-1, 'fangorn')

    fasta_name = '.'.join(fasta_name_splitted)
  else:
    return None

  fasta_path = glob.glob(os.path.join(fasta_folder_path, fasta_name))

  if (fasta_path):
    return fasta_path[0]

  return None


def get_tree_taxas(tree_path):
  taxas = []

  with open(tree_path) as t:
    tree_content = t.read()

  fmt = 'nexus' if tree_content[0] == '#' else 'newick'

  tree = Phylo.read(tree_path, fmt)

  for leaf in tree.get_terminals():
    if (leaf.comment and ('fangorn_marked=true' in leaf.comment)):
      next
    else:
      taxas.append(leaf.name)

  return taxas


def get_fasta_headers(fasta_path):
  fasta = SeqIO.parse(fasta_path, 'fasta')
  return [c.id for c in fasta]


def compare_files(tree_path, fasta_path):
  taxas = get_tree_taxas(tree_path)
  taxas.sort()

  fasta_headers = get_fasta_headers(fasta_path)
  fasta_headers.sort()

  return taxas == fasta_headers


def main():
  options = get_options()

  tree_folder_path = options.trees.rstrip('/') if (options.trees != '/') else '/'

  fasta_folder_path = options.fastas if (options.fastas) else options.trees
  fasta_folder_path = fasta_folder_path.rstrip('/') if (fasta_folder_path != '/') else '/'

  tree_paths = glob.glob(os.path.join(tree_folder_path, '*.tre'))

  for tree_path in tree_paths:
    fasta_path = get_fasta_path(tree_path, fasta_folder_path)

    if (fasta_path):
      result = compare_files(tree_path, fasta_path)
      if (result):
        print(f"{BColors.OKGREEN}OK: {tree_path}{BColors.ENDC}")
      else:
        print(f"{BColors.FAIL}FAIL: {tree_path}{BColors.ENDC}")
    else:
      print(f"{BColors.WARNING}Warning: cannot find fasta for file {tree_path}{BColors.ENDC}")
      pass


if __name__ == '__main__':
    main()




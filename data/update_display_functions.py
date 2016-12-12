import os
import json

from cauldron.docgen import parsing
from cauldron.session import display

DATA_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
OUT_DIRECTORY = os.path.join(DATA_DIRECTORY, 'display_functions')


def run():
    """
    """

    results = parsing.module(display)

    for function in results['functions']:
        path = os.path.join(OUT_DIRECTORY, '{}.json'.format(function['name']))
        with open(path, 'w+', encoding='utf8') as fp:
            json.dump(function, fp, indent=2)
        print('[SAVED]:', function['name'])
  
  
if __name__ == '__main__':
    run()

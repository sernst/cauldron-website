import os
import json
import shutil

from cauldron.docgen import parsing
from cauldron.session import display
from cauldron.session.exposed import ExposedStep

DATA_DIRECTORY = os.path.dirname(os.path.realpath(__file__))


def parse(target, output_folder):
    """
    Parses the target and places the results in the specified output
    folder within the data directory
    """
    
    results = parsing.container(target)
    
    results_directory = os.path.join(DATA_DIRECTORY, output_folder)
    if os.path.exists(results_directory):
        shutil.rmtree(results_directory)
    os.makedirs(results_directory)
      
    for function in results['functions']:
        path = os.path.join(
          results_directory, 
          '{}.json'.format(function['name'])
        )
        
        with open(path, 'w+', encoding='utf8') as fp:
            json.dump(function, fp, indent=2)
            
        print('[SAVED]:', function['name'])

        
def run():
    """
    """
    
    parse(display, 'display_functions')
    parse(ExposedStep, 'step_functions')

  
  
if __name__ == '__main__':
    run()

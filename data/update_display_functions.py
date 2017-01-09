import os
import json
import glob
import shutil

from cauldron.docgen import parsing
from cauldron.session import display
from cauldron.session.exposed import ExposedStep
from cauldron.steptest import StepTestCase
from cauldron.steptest import StepTestRunResult
from cauldron.session.caching import SharedCache
import cauldron

DATA_DIRECTORY = os.path.dirname(os.path.realpath(__file__))


def clean(results_directory):
    """
    Removes any existing content from the specified output folder if
    it exists. Creates the output folder if it does not already exist.
    """

    if not os.path.exists(results_directory):
        os.makedirs(results_directory)
        return
    
    for file_path in glob.iglob(results_directory, recursive=True):
        if os.path.isfile(file_path):
            os.remove(file_path)

        
def write_entry(results_directory, data) -> str:            
    name = data['name']
    path = os.path.join(results_directory, '{}.json'.format(name))

    with open(path, 'w+', encoding='utf8') as fp:
        json.dump(data, fp, indent=2)

    print('[SAVED]:', name)            
    return path


def parse(target, output_folder):
    """
    Parses the target and places the results in the specified output
    folder within the data directory
    """
    
    results = parsing.container(target)
    results_directory = os.path.join(DATA_DIRECTORY, output_folder)    
    clean(results_directory)

    for entry in results.get('functions', []):
        write_entry(results_directory, entry)

    for entry in results.get('variables', []):
        write_entry(results_directory, entry)

    for entry in results.get('classes', []):
        write_entry(results_directory, entry)
        
    write_entry(results_directory, dict(
        name=results.get('name', 'Unknown'),
        description=results.get('description', '')
    ))


def run():
    """
    """
    
    parse(display, 'display_functions')
    parse(ExposedStep, 'step_functions')
    parse(StepTestCase, 'StepTestCase')
    parse(StepTestRunResult, 'StepTestRunResult')
    parse(cauldron, 'cauldron_functions')
    parse(SharedCache, 'SharedCache')
  
  
if __name__ == '__main__':
    run()

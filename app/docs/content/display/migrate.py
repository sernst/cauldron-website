import os
import glob
import textwrap

directory = os.path.realpath(os.path.dirname(__file__))

glob_path = os.path.join(directory, '*.fragment.pug')

for path in glob.iglob(glob_path):
    filename = os.path.basename(path)
    folder = filename.split('.', 1)[0]
    root = os.path.dirname(path)
    
    target_directory = os.path.join(root, folder)
    target_path = os.path.join(
        target_directory, 
        filename.replace('.fragment', '.page')
    )

    if not os.path.exists(target_directory):
        os.makedirs(target_directory)
        print('CREATED:', target_directory)
        
    with open(path) as f:
        contents = f.read()

    output = [
        'extends /app/docs/DocsLayout',
        '',
        'block content',
        textwrap.indent(contents, '  ')
    ]
    
    with open(target_path, 'w') as f:
        f.write('\n'.join(output))

    print('WROTE:', target_path)

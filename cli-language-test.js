/* eslint-disable import/no-extraneous-dependencies */

const highlight = require('highlight.js');
const cliLanguage = require('./cli-language');

// And register my language
highlight.registerLanguage('cli', cliLanguage.cli);

// const raw = [
//   '$ docker run --rm -it \\',
//   '  -v /path/to/root:/notebooks \\',
//   '  swernst/cauldron:ui-standard-current \\',
//   '  --connect=127.0.0.1:"5010" \\',
//   '  --profile deprod --dry-run -v -b 2'
// ].join('\n');
const raw = '$ cauldron ui --connect=127.0.0.1:5010';

console.log(highlight.highlight('cli', raw).value);


exports.cli = function cli(hljs) {
  return {
    case_insensitive: true,
    aliases: ['cli'],
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'keyword',
        begin: /\$\s/,
        contains: [
          { className: 'title', begin: /[^\s]+/ },
        ]
      },
      {
        className: 'keyword',
        begin: /\\\s*/,
      },
      { className: 'string', begin: '"', end: '"' },
      { className: 'string', begin: '\'', end: '\'' },
      {
        className: 'symbol',
        begin: /--[a-z\-=]+\s?/,
        contains: [
          { className: 'params', begin: /(?<==)[^\s]+/ },
          { className: 'params', begin: /(?<=\s)[^\s-]+/ },
          { className: 'string', begin: '"', end: '"' },
          { className: 'string', begin: '\'', end: '\'' },
        ]
      },
      {
        className: 'symbol',
        begin: /-[a-z]\s/,
        contains: [
          { className: 'params', begin: /(?<=\s)[^\s-]+/ },
          { className: 'string', begin: '"', end: '"' },
          { className: 'string', begin: '\'', end: '\'' },
        ]
      },
      {
        className: 'symbol',
        begin: /-[a-z]+\s/,
      },
    ]
  };
};

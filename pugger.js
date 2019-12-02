/* eslint-disable import/no-extraneous-dependencies */

const fs = require('fs');
const fsp = require('fs-promise');
const path = require('path');
const Rx = require('rx');
const highlight = require('highlight.js');
const _ = require('lodash');
const markdown = require('markdown-it')();
const cliLanguage = require('./cli-language');

const DATA_DIRECTORY = path.normalize(path.join(__dirname, 'data'));
const DOCS_DIRECTORY = path.join(DATA_DIRECTORY, 'documentation');

// Register the custom language for cli commands.
highlight.registerLanguage('cli', cliLanguage.cli);

/**
 * Returns a stream that has an observable for each file in the specified
 * directory. Each observable is an object containing the filename and
 * fully-qualified path to the the file in the directory.
 *
 * @param directoryPath
 *  The directory in which to list files
 */
function listFiles(directoryPath) {
  function fileStats(name) {
    const filePath = path.join(directoryPath, name);
    return fsp.stat(filePath)
      .then((stats) => ({
        sourceName: name,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        sourcePath: filePath
      }));
  }

  function getFileInfo() {
    return fsp.readdir(directoryPath)
      .then((entries) => Promise.all(entries.map(fileStats)));
  }

  return Rx.Observable.fromPromise(getFileInfo())
    .catch(() => Rx.Observable.just([]));
}

/**
 * Converts an array of objects to an object where the keys are taken from the
 * key argument in each object and the values are the objects themselves.
 *
 * @param key
 *  The name of the key in each entry to use as the key for the entry in the
 *  returned object
 * @param entries
 *  The array of objects to be turned into an object of objects
 * @returns {{}}
 */
function toObject(key, entries) {
  const out = {};
  entries.forEach((entry) => {
    out[entry[key]] = entry;
  });

  return out;
}


/**
 *
 * @param entry
 * @returns {*}
 */
function renderEntry(entry) {
  if (_.isString(entry)) {
    return markdown.render(entry);
  }

  if (Array.isArray(entry)) {
    return entry.map((v) => renderEntry(v));
  }

  if (_.isNull(entry) || _.isUndefined(entry)) {
    return entry;
  }

  if (!_.isPlainObject(entry)) {
    return entry;
  }

  const out = {};
  Object.keys(entry).forEach((key) => {
    const value = entry[key];
    const skipRender = _.isString(value) && (key === 'name');
    out[key] = skipRender ? value : renderEntry(value);
  });

  return out;
}


/**
 * Parses the source string as JSON. If it fails an empty object is quietly
 * returned instead to prevent error bubbling.
 *
 * @param source
 * @returns {{}}
 */
function parseJson(source) {
  try {
    return JSON.parse(source);
  } catch (ignore) {
    return {};
  }
}


/**
 * Reads the specified file and returns a stream with a single observable
 * containing the JSON-parsed object for that file, including a path property
 * that contains the filePath used to load the file.
 *
 * @param fileData
 */
function readFile(fileData) {
  return Rx.Observable
    .fromNodeCallback(fs.readFile)(fileData.sourcePath, 'utf8')
    .map((contents) => Object.assign(parseJson(contents), fileData));
}


/**
 * Reads the specified file and returns a stream with a single observable
 * containing the JSON-parsed object for that file, including a path property
 * that contains the filePath used to load the file. The file is rendered as
 * markdown such that all strings a converted from a raw format to a markdown
 * value.
 *
 * @param fileData
 */
function renderFile(fileData) {
  return Rx.Observable
    .fromNodeCallback(fs.readFile)(fileData.sourcePath, 'utf8')
    .map((contents) => Object.assign(renderEntry(parseJson(contents)), fileData));
}


/**
 * Converts a date string in the format MM/DD/YYYY or MM-DD-YYYY into a
 * JavaScript date object
 *
 * @param dateString
 * @returns {Date}
 */
function fromDateString(dateString) {
  const parts = dateString
    .replace(/\\/g, '-')
    .split('-')
    .map((x) => parseInt(x, 10));

  return new Date(parts[2], parts[0] - 1, parts[1]);
}


/**
 * Sorts data files by the value of their date properties such that the most
 * recent date will be last
 *
 * @param firstEntry
 *  A data file for comparison, which has a date property
 * @param secondEntry
 *  A data file for comparison, which has a date property
 * @returns {number}
 *  Standard sorting (-1, 0, 1) indicating the relative ordering of the two
 *  entries
 */
function sortByDate(firstEntry, secondEntry) {
  const firstDate = fromDateString(firstEntry.date || '1-1-2000').getTime();
  const secondDate = fromDateString(secondEntry.date || '1-1-2000').getTime();

  if (firstDate === secondDate) {
    return 0;
  }

  return firstDate < secondDate ? -1 : 1;
}


/**
 * Reads all files in the specified directory and returns a stream where each
 * observable is the JSON-parsed contents of that file
 *
 * @param parentDirectory
 *  Path to the directory that contains the folder in which to read the
 *  contents of files
 * @param folderName
 *  Name of the directory
 * @param doRender
 * @returns {Disposable|IDisposable}
 *  Stream with observables for each file read
 */
function readAllFiles(parentDirectory, folderName, doRender) {
  const directoryPath = path.join(parentDirectory, folderName);

  return listFiles(directoryPath)
    .flatMap((entry) => entry)
    .filter((entry) => entry.isFile)
    .map((p) => (doRender ? renderFile(p) : readFile(p)))
    .concatAll()
    .toArray()
    .map((array) => {
      const files = array.sort(sortByDate).reverse();
      const fileEntries = toObject('name', files);

      return {
        files,
        fileEntries,
        key: folderName,
        path: directoryPath
      };
    });
}


function versionFormatter(block, version) {
  const parts = (version || '0.0.0').trim().split('.');
  const blockName = block || 'VersionItem';
  const levels = ['major', 'minor', 'revision', 'build'];

  function toClass(index) {
    return `${blockName}__${levels[index]}`;
  }

  function toEntry(index, value) {
    return `<span class="${toClass(index)}">${value}</span>`;
  }

  function addDot(index) {
    if (index < 1) {
      return '';
    }

    return `<span class="${blockName}__separator--${levels[index]}">.</span>`;
  }

  return parts
    .map((value, index) => `${addDot(index)}${toEntry(index, value)}`)
    .join('');
}


/**
 *
 */
function fetchLocals() {
  function combineLocals(target, entry) {
    const out = {};
    out[entry.key] = entry.fileEntries;
    return Object.assign(out, target);
  }

  const configs$ = readAllFiles(DATA_DIRECTORY, 'configs', false);

  const documentation$ = listFiles(DOCS_DIRECTORY)
    .flatMap((entry) => entry)
    .filter((entry) => entry.isDirectory)
    .map((entry) => readAllFiles(DOCS_DIRECTORY, entry.sourceName, true))
    .concatAll();

  const functions = { versionFormatter };

  return Rx.Observable.merge(configs$, documentation$)
    .toArray()
    .map((entries) => entries.reduce(combineLocals, {}))
    .toPromise()
    .then((locals) => ({ functions, ...locals }));
}
exports.fetchLocals = fetchLocals;


/**
 *
 * @param text
 * @param options
 * @returns {*}
 */
function highlightFilter(text, options) {
  const code = text.trim();
  const language = options.language || 'python';
  const raw = highlight.highlight(language, code).value;
  const styleSuffix = options.dark ? '--dark' : '--light';
  const lineNumbers = raw
    .split(/\n/g)
    .map((line, index) => {
      const number = index < 9 ? `0${index + 1}` : `${index + 1}`;
      return `<div class="CodeBlock__lineNumber CodeBlock__lineNumber${styleSuffix}">${number}</div>`;
    })
    .join('\n');

  const showLineNumbers = 'lineNumbers' in options ? options.lineNumbers : true;
  const lineNumbersDom = showLineNumbers
    ? `<div class="CodeBlock__lineNumbers CodeBlock__lineNumbers${styleSuffix}">${lineNumbers}</div>`
    : '';

  return `<div class="CodeBlock CodeBlock${styleSuffix}" data-higlight-language="${language}">${lineNumbersDom}`
    + `<div class="CodeBlock__code CodeBlock__code${styleSuffix}">${raw}</div></div>`;
}
exports.highlightFilter = highlightFilter;


exports.filters = {
  highlight: highlightFilter
};

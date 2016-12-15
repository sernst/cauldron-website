/* eslint-disable import/no-extraneous-dependencies */

const fs = require('fs');
const path = require('path');
const Rx = require('rx');
const highlight = require('highlightjs');

const DATA_DIRECTORY = path.normalize(path.join(__dirname, 'data'));


/**
 * Returns a stream that has an observable for each file in the specified
 * directory. Each observable is an object containing the filename and
 * fully-qualified path to the the file in the directory.
 *
 * @param directoryPath
 *  The directory in which to list files
 */
function listFiles(directoryPath) {
  return Rx.Observable.fromNodeCallback(fs.readdir)(directoryPath)
    .catch(() => Rx.Observable.just([]))
    .flatMap(files => files)
    .map(filename => ({ filename, path: path.join(directoryPath, filename) }));
}


/**
 * Reads the specified file and returns a stream with a single observable
 * containing the JSON-parsed object for that file, including a path property
 * that contains the filePath used to load the file
 *
 * @param fileData
 */
function readFile(fileData) {
  function parseJson(source) {
    try {
      return JSON.parse(source);
    } catch (ignore) {
      return {};
    }
  }

  return Rx.Observable.fromNodeCallback(fs.readFile)(fileData.path, 'utf8')
    .map(contents => Object.assign(parseJson(contents), fileData));
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
    .map(x => parseInt(x, 10));

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
 * @param targetDirectory
 *  Directory in which to read the contents of files
 *
 * @returns {Disposable|IDisposable}
 *  Stream with observables for each file read
 */
function readAllFiles(targetDirectory) {
  return listFiles(targetDirectory)
    .map(p => readFile(p))
    .concatAll()
    .toArray()
    .map(array => array.sort(sortByDate).reverse());
}


/**
 *
 */
function fetchLocals() {
  function toObject(source) {
    const out = {};
    source.forEach((data) => {
      out[data.name] = data;
    });

    return out;
  }

  return Rx.Observable
    .combineLatest(
      readAllFiles(path.join(DATA_DIRECTORY, 'display_functions')),
      readAllFiles(path.join(DATA_DIRECTORY, 'step_functions')),
      (display, step) => ({ display, step })
    )
    .toPromise()
    .then(locals => (
      Object.assign({}, locals, {
        displayFunctions: toObject(locals.display),
        stepFunctions: toObject(locals.step)
      })
    ));
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
  const raw = highlight.highlight(options.language || 'Python', code).value;
  const lineNumbers = raw
    .split(/\n/g)
    .map((line, index) => {
      const number = index < 9 ? `0${index + 1}` : `${index + 1}`;
      return `<div class="CodeBlock__lineNumber">${number}</div>`;
    })
    .join('\n');

  return `<div class="CodeBlock"><div class="CodeBlock__lineNumbers">${lineNumbers}</div><div class="CodeBlock__code">${raw}</div></div>`;
}
exports.highlightFilter = highlightFilter;

exports.filters = {
  highlight: highlightFilter
};

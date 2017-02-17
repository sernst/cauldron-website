const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');

const NEXUS_BUCKET_NAME = 'cauldron-notebook-nexus';
const APP_MODES = ['editor', 'reader'];
const PLATFORMS = ['win', 'osx', 'linux-deb', 'linux-rpm'];

AWS.config.credentials = new AWS.SharedIniFileCredentials(
  { profile: 'cauldron' }
);

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];


/**
 *
 * @param platform
 * @param appMode
 * @param isNightly
 * @returns {*}
 */
function getEntry(platform, appMode, isNightly) {
  const keySegments = [
    isNightly ? 'nightly' : '',
    appMode,
    platform,
    'update.json'
  ];

  const s3 = new AWS.S3();
  const args = {
    Bucket: NEXUS_BUCKET_NAME,
    Key: keySegments.filter(segment => (segment.length > 0)).join('/'),
  };

  function getObject(resolve, reject) {
    function onResponse(error, response) {
      if (error) {
        console.log('ERROR:', args);
        return reject(error);
      }

      return resolve(response);
    }
    s3.getObject(args, onResponse);
  }

  return new Promise(getObject)
    .then(response => JSON.parse(response.Body))
    .catch(() => ({}))
    .then(data => ({ platform, appMode, data, isNightly }));
}


function updatesListToObject(updates) {
  const data = {};

  updates.forEach((entry) => {
    const mode = entry.appMode;
    const platform = entry.platform;
    const key = entry.isNightly ? 'nightly' : 'stable';
    data[mode] = data[mode] || {};
    data[mode][platform] = data[mode][platform] || {};
    data[mode][platform][key] = entry;
  });

  return data;
}


function getReleaseTime(update) {
  const value = update.data.TIMESTAMP;
  if (!value) {
    return -1;
  }

  const zeroTime = Date.UTC(2016, 0, 1);
  const delta = 60000 * parseInt(value, 36);
  return zeroTime + delta;
}


/**
 *
 * @param updates
 * @returns {Date}
 */
function getOldestReleaseDate(updates) {
  const times = updates
    .map(getReleaseTime)
    .filter(t => t > 0);
  return new Date(Math.min(...times));
}


/**
 *
 * @param updates
 * @returns {*}
 */
function getReleaseData(updates) {
  const releaseDate = getOldestReleaseDate(updates);
  return {
    releaseTime: releaseDate.getTime(),
    releaseDate: {
      year: releaseDate.getUTCFullYear(),
      month: releaseDate.getUTCMonth() + 1,
      date: releaseDate.getUTCDate(),
      dayName: DAY_NAMES[releaseDate.getUTCDay()],
      monthName: MONTH_NAMES[releaseDate.getUTCMonth()]
    }
  };
}

/**
 *
 * @param updates
 * @returns {Promise<T>|Promise}
 */
function saveData(updates) {
  const data = Object.assign(
    updatesListToObject(updates),
    {
      name: 'release_settings',
      nightly: getReleaseData(updates.filter(u => u.isNightly)),
      stable: getReleaseData(updates.filter(u => !u.isNightly))
    }
  );
  const targetPath = path.normalize(path.join(
    __dirname,
    'configs',
    'release_settings.json'
  ));

  function directoryExists(resolve) {
    fs.stat(
      path.dirname(targetPath),
      (error, stats) => resolve(error ? false : stats.isDirectory())
    );
  }

  function makeDirectory(resolve, reject) {
    fs.mkdir(
      path.dirname(targetPath),
      error => (error ? reject(error) : resolve())
    );
  }

  function saveFile(resolve, reject) {
    fs.writeFile(
      targetPath,
      JSON.stringify(data),
      error => (error ? reject(error) : resolve())
    );
  }

  return new Promise(directoryExists)
    .then(exists => (exists ? null : new Promise(makeDirectory)))
    .then(() => new Promise(saveFile));
}


/**
 * Returns an array of promises for each build target combination
 * (platform + appMode) for the given mode (nightly or stable) where each
 * promise downloads the update configs for that target and returns that
 * data in the promise resolution.
 *
 * @param isNightly
 * @returns {*}
 */
function getDownloadPromises(isNightly) {
  return PLATFORMS
    .map(p => APP_MODES.map(mode => getEntry(p, mode, isNightly)))
    .reduce((flat, entries) => flat.concat(entries), []);
}


const stableDownloadPromises = getDownloadPromises(false);
const nightlyDownloadPromises = getDownloadPromises(true);

Promise
  .all(stableDownloadPromises.concat(nightlyDownloadPromises))
  .then(updates => saveData(updates))
  .then(() => console.log('Download operation complete'))
  .catch(error => console.log(error));

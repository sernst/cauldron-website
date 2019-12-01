/* eslint-disable import/no-extraneous-dependencies */

const AWS = require('aws-sdk');
const named = require('vinyl-named');
const concat = require('gulp-concat');
const del = require('del');
const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const settings = require('./settings.json');
const path = require('path');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync');
const uglify = require('gulp-uglify');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const gulpIf = require('gulp-if');
const rename = require('gulp-rename');
const awsPublish = require('gulp-awspublish');
const mergeStream = require('merge-stream');
const argv = require('yargs').argv;
const pugger = require('./pugger');

const babelPreset = 'es2015';
const watchDefinitions = [];

/**
 * Creates a path relative to the output bin path for specifying destination
 *
 * @param segments
 *  Zero or more path segments that specify a relative path component within
 *  the output bin directory
 *
 * @returns {string}
 */
function makeOutputPath(...segments) {
  return path.join('bin', ...segments);
}


/**
 * TASK: html
 *    Compiles all of the Pug templates into HTML files that are saved in
 *    the bin directory while preserving relative locations within. Pug
 *    files that begin with underscores are considered partials and not
 *    compiled into HTML files of their own.
 */
function html() {
  function renderHtml(locals, resolve, reject) {
    return gulp.src('app/**/*.page.pug')
      .pipe(plumber())
      .pipe(pug({
        locals,
        filters: pugger.filters,
        basedir: __dirname
      }))
      .pipe(rename((file) => {
        Object.assign(file, { basename: 'index' });
      }))
      .pipe(gulp.dest(makeOutputPath()))
      .on('end', resolve)
      .on('error', reject);
  }

  return pugger.fetchLocals()
    .then(locals => new Promise(renderHtml.bind(null, locals)));
}
watchDefinitions.push({
  task: html,
  files: ['app/**/*.pug', 'app/components/**/*.pug', 'data/**/*.json']
});
exports.html = html;


/**
 * TASK: htmlFragments
 *    Compiles pug fragments into HTML files to be loaded by the app at
 *    run time
 */
function htmlFragments() {
  function renderHtml(locals, resolve, reject) {
    return gulp.src('app/**/*.fragment.pug')
      .pipe(plumber())
      .pipe(pug({ locals, filters: pugger.filters }))
      .pipe(rename((file) => {
        Object.assign(file, { basename: file.basename.split('.')[0] });
      }))
      .pipe(gulp.dest(makeOutputPath()))
      .on('end', resolve)
      .on('error', reject);
  }

  return pugger.fetchLocals()
    .then(locals => new Promise(renderHtml.bind(null, locals)));
}
watchDefinitions.push({
  task: htmlFragments,
  files: ['app/**/*.fragment.pug', 'app/components/**/*.pug', 'data/**/*.json']
});
exports.htmlFragments = htmlFragments;


/**
 * TASK: js
 */
function js() {
  return gulp.src('app/**/*.page.js')
    .pipe(plumber())
    .pipe(named(file => file.basename.split('.')[0]))
    .pipe(webpackStream({
      mode: argv.production ? 'production' : 'development',
      output: { filename: '[name]/[name].js' },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader',
            query: { presets: babelPreset }
          }
        ]
      },
      plugins: [
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ]
    }))
    .pipe(gulpIf(argv.production, uglify()))
    .pipe(gulp.dest(makeOutputPath()));
}
watchDefinitions.push({ task: js, files: 'app/**/*.js' });
exports.js = js;


/**
 * TASK: css
 */
function css() {
  return gulp.src('app/**/*.page.scss')
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(rename((file) => {
      Object.assign(file, { basename: file.basename.split('.')[0] });
    }))
    .pipe(gulp.dest(makeOutputPath()));
}
watchDefinitions.push({ task: css, files: 'app/**/*.scss' });
exports.css = css;


/**
 * TASK: assets
 */
function assets() {
  return gulp.src('app/assets/**/*')
    .pipe(plumber())
    .pipe(gulp.dest(makeOutputPath('assets')));
}
watchDefinitions.push({ task: assets, files: 'app/assets/**/*.*' });
exports.assets = assets;


/**
 * TASK: notebooks
 */
function notebooks() {
  return gulp.src('notebooks/**/*')
    .pipe(plumber())
    .pipe(gulp.dest(makeOutputPath('notebooks')));
}
watchDefinitions.push({ task: notebooks, files: 'notebooks/**/*.*' });
exports.notebooks = notebooks;


/**
 * TASK: npmScripts
 *
 */
function npmScripts() {
  const files = settings.npm.js.map(
    jsPath => (jsPath.endsWith(':') ? `${jsPath.slice(0, -1)}.js` : jsPath)
  )
    .map(jsPath => `node_modules/${jsPath}`);

  return gulp.src(files)
    .pipe(plumber())
    .pipe(concat('external.js'))
    .pipe(gulp.dest(makeOutputPath()));
}
exports.npmScripts = npmScripts;


/**
 * TASK: npmStyles
 *
 */
function npmStyles() {
  const files = settings.npm.css.map(cssPath => `node_modules/${cssPath}`);

  return gulp.src(files)
    .pipe(concat('external.css'))
    .pipe(plumber())
    .pipe(gulp.dest(makeOutputPath()));
}
exports.npmStyles = npmStyles;

/**
 * TASK: serve
 */
function serve() {
  browserSync({
    server: { baseDir: 'bin' },
    logLevel: 'debug',
    logConnections: true
  });

  return gulp.watch('bin/**/*').on('change', browserSync.reload);
}
exports.serve = serve;


/**
 * TASK: clean
 *    Empties the bin directory for a fresh population
 */
function clean() {
  return del('bin/**');
}
exports.clean = clean;


/**
 * TASK: publish
 *  Deploys the locally built site to the S3 bucket that is the origin for
 *  the public site
 */
function publish() {
  const publisher = awsPublish.create({
    region: 'us-west-2',
    params: { Bucket: 'www.unnotebook.com' },
    credentials: new AWS.SharedIniFileCredentials({ profile: 'cauldron' })
  });

  // define custom headers
  const headers = {
    'Cache-Control': 'max-age=3600, no-transform, public'
  };

  const binary$ = gulp.src(['bin/**/*', '!bin/**/*.{js,css,html,svg}']);
  const text$ = gulp.src('bin/**/*.{js,css,html,svg}')
    .pipe(awsPublish.gzip({ ext: '' }));

  return mergeStream(text$, binary$)
    .pipe(publisher.publish(headers))
    .pipe(publisher.cache())
    .pipe(awsPublish.reporter());
}
exports.publish = publish;


/**
 * TASK: build
 *    Builds
 */
const build = gulp.series(
  clean,
  gulp.parallel(
    html,
    htmlFragments,
    css,
    js,
    assets,
    notebooks,
    npmStyles
  ));
exports.build = build;


/**
 * TASK: watch
 *    Watches the development files for changes and triggers build tasks
 *    when updates are observed. The build task is executed prior to starting
 *    the watch to force initially updating all built files.
 */
function watch() {
  watchDefinitions.forEach(({ files, task }) => gulp.watch(files, task));
}
exports.watch = gulp.series(build, watch);

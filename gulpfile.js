/* eslint-disable import/no-extraneous-dependencies */

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
const webpack = require('webpack-stream');
const gulpIf = require('gulp-if');
const rename = require('gulp-rename');

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
  return gulp.src('app/**/*.page.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(rename((file) => {
      Object.assign(file, { basename: 'index' });
    }))
    .pipe(gulp.dest(makeOutputPath()));
}
watchDefinitions.push({ task: html, files: 'app/**/*.pug' });
exports.html = html;


/**
 * TASK: js
 */
function js() {
  return gulp.src('app/**/*.page.js')
    .pipe(plumber())
    .pipe(named(file => file.basename.split('.')[0]))
    .pipe(webpack({
      output: { filename: '[name]/[name].js' },
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader',
            query: { presets: babelPreset }
          }
        ]
      }
    }))
    .pipe(gulpIf(false, uglify()))
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
 * TASK: build
 *    Builds
 */
const build = gulp.series(
  clean,
  gulp.parallel(
    html,
    css,
    js,
    assets,
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

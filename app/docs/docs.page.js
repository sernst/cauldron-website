import xs from 'xstream';
import { run } from '@cycle/xstream-run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import makeLocationHashDriver from './LocationHashDriver';
import PageBanner from '../components/PageBanner/PageBanner';
import Navigator from './navigator/Navigator';
import Display from './display/Display';

const missingRequest = {
  url: '/docs/content/missing.html',
  category: 'Display',
};

const defaultRequest = {
  url: '/docs/content/basics/intro.html',
  category: 'Display',
};

const definitions = [
  {
    label: 'Basics',
    links: [
      { label: 'Introduction', id: 'basics/intro' },
      { label: 'Notebook Display', id: 'basics/display' },
      { label: 'Shared Variables', id: 'basics/shared-variables' }
    ]
  },
  {
    label: 'cauldron',
    links: [
      { label: 'get_environment_info', id: 'top-level/get_environment_info' },
      { label: 'refresh', id: 'top-level/refresh' },
      { label: 'run_project', id: 'top-level/run_project' },
      { label: 'run_server', id: 'top-level/run_server' },
      { label: 'run_shell', id: 'top-level/run_shell' },
      { label: 'shared', id: 'top-level/shared' }
    ]
  },
  {
    label: 'cauldron.display',
    links: [
      { label: 'bokeh', id: 'display/bokeh' },
      { label: 'code_block', id: 'display/code_block' },
      { label: 'head', id: 'display/head' },
      { label: 'header', id: 'display/header' },
      { label: 'html', id: 'display/html' },
      { label: 'inspect', id: 'display/inspect' },
      { label: 'jinja', id: 'display/jinja' },
      { label: 'json', id: 'display/json' },
      { label: 'latex', id: 'display/latex' },
      { label: 'listing', id: 'display/listing' },
      { label: 'list_grid', id: 'display/list_grid' },
      { label: 'markdown', id: 'display/markdown' },
      { label: 'plotly', id: 'display/plotly' },
      { label: 'pyplot', id: 'display/pyplot' },
      { label: 'status', id: 'display/status' },
      { label: 'svg', id: 'display/svg' },
      { label: 'table', id: 'display/table' },
      { label: 'tail', id: 'display/tail' },
      { label: 'text', id: 'display/text' },
      { label: 'whitespace', id: 'display/whitespace' }
    ]
  },
  {
    label: 'cauldron.step',
    links: [
      { label: 'breathe', id: 'step/breathe' },
      { label: 'stop', id: 'step/stop' }
    ]
  },
  {
    label: 'Step "Unit" Testing',
    links: [
      { label: 'Introduction', id: 'testing/intro' },
      { label: 'StepTestCase', id: 'testing/StepTestCase' },
      { label: 'StepTestRunResult', id: 'testing/StepTestRunResult' }
    ]
  },
  {
    label: 'In Production',
    links: [
      { label: 'Introduction', id: 'production/intro' },
      { label: 'Parallelism (SIMD)', id: 'production/simd' }
    ]
  }
];


/**
 *
 */
function main(sources) {
  const display = Display(sources.HTTP);
  const banner = PageBanner(
    sources.banner,
    xs.of({ downloadUrl: '/install' })
  );
  const navigator = Navigator(
    sources.navigator,
    sources.hash,
    xs.of(definitions)
  );

  const request$ = xs
    .merge(
      sources.hash
        .filter(event => (event.newHash && event.newHash.length > 2))
        .map(event => ({
          url: `/docs/content/${event.newHash.slice(1)}.html`,
          category: 'Display',
        })),
      display.response$
        .map(res => (res.error ? missingRequest : null))
        .filter(res => (res !== null))
    )
    .startWith(defaultRequest);

  return {
    banner: banner.DOM,
    navigator: navigator.DOM,
    display: display.DOM,
    hash: navigator.hash$,
    HTTP: request$
  };
}


run(main, {
  banner: makeDOMDriver('#bannerSection'),
  navigator: makeDOMDriver('.Navigator'),
  display: makeDOMDriver('.Display'),
  hash: makeLocationHashDriver(),
  HTTP: makeHTTPDriver()
});

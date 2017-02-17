import xs from 'xstream';
import { run } from '@cycle/xstream-run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import mainBanner from '../components/PageBanner/PageBanner';

const missingRequest = {
  url: '/docs/content/missing.html',
  category: 'Display',
};


/**
 *
 */
function main({ banner }) {
  return {
    banner: mainBanner(banner, xs.of({ downloadUrl: '/install' })).DOM
  };
}

run(main, {
  banner: makeDOMDriver('#bannerSection'),
  HTTP: makeHTTPDriver()
});

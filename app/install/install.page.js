import xs from 'xstream';
import { run } from '@cycle/xstream-run';
import { makeDOMDriver } from '@cycle/dom';

import mainBanner from '../components/PageBanner/PageBanner';


/**
 *
 */
function main({ banner }) {
  return {
    banner: mainBanner(banner, xs.of({ downloadUrl: '/install' })).DOM
  };
}

run(main, {
  banner: makeDOMDriver('#bannerSection')
});

import xs from 'xstream';
import { run } from '@cycle/xstream-run';
import { makeDOMDriver } from '@cycle/dom';

import mainBanner from '../components/banner/banner.component';


/**
 *
 */
function main({ banner }) {
  return {
    banner: mainBanner(banner, xs.of({ downloadUrl: '#download' })).DOM
  };
}

run(main, {
  banner: makeDOMDriver('#bannerSection')
});

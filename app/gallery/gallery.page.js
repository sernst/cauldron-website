import xs from 'xstream';
import { run } from '@cycle/xstream-run';
import { makeDOMDriver } from '@cycle/dom';

import mainBanner from '../components/banner/banner.component';


/**
 *
 */
function main({ banner }) {
  return mainBanner(banner, xs.of({ downloadUrl: '/#download' }));
}

run(main, {
  banner: makeDOMDriver('#bannerSection')
});

import xs from 'xstream';
import { run } from '@cycle/xstream-run';
import { makeDOMDriver } from '@cycle/dom';

import Banner from '../components/PageBanner/PageBanner';


/**
 *
 */
function main(sources) {
  const banner = Banner(sources.banner, xs.of({ downloadUrl: '/install' }));

  return {
    banner: banner.DOM
  };
}

run(main, {
  banner: makeDOMDriver('#bannerSection')
});

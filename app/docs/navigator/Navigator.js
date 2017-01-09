import xs from 'xstream';

import render from './Navigator.render';

const LINK_INTENT = 'link';
const TOGGLE_INTENT = 'toggle';
const DEFAULT_LINK_ID = 'basics/intro';

/**
 *
 * @param DOM
 * @returns {*}
 */
function intent(DOM) {
  const link$ = xs
    .merge(
      DOM.select('.NavigatorSection__link')
        .events('click'),
      DOM.select('.NavigatorMobileSection__link')
        .events('click')
    )
    .map(event => ({ event, type: LINK_INTENT }));

  const mobileToggle$ = DOM.select('.NavigatorToggle')
    .events('click')
    .map(event => ({ event, type: TOGGLE_INTENT }));

  return xs.merge(link$, mobileToggle$);
}


function processEvent(type, event) {
  switch (type) {
    case TOGGLE_INTENT:
      return { doToggle: true };
    case LINK_INTENT:
      return {
        hash: event.currentTarget.dataset.id,
        doToggle: false,
        open: false
      };
    default:
      return {};
  }
}


/**
 *
 * @param click$
 * @param hash$
 * @param definitions$
 */
function model(click$, hash$, definitions$) {
  const action$ = click$
    .map(entry => processEvent(entry.type, entry.event))
    .fold(
      (previous, now) => {
        const open = now.doToggle ? !previous.open : previous.open;
        return Object.assign({}, previous, { open }, now, { doToggle: false });
      },
      { hash: DEFAULT_LINK_ID, open: false, doToggle: false }
    );

  const hashStatus$ = xs
    .combine(
      action$,
      hash$
        .map((event) => {
          const id = event.newHash.slice(1);
          return id.length > 0 ? { id } : {};
        })
    )
    .map(([action, hash]) => Object.assign({}, action, hash));

  return xs
    .combine(hashStatus$, definitions$)
    .map(([status, definitions]) => ({ status, definitions }));
}


/**
 *
 * @param DOM
 * @param hash$
 * @param definitions$
 * @returns {{DOM: *, state$: *}}
 * @constructor
 */
function Navigator(DOM, hash$, definitions$) {
  const state$ = model(intent(DOM), hash$, definitions$);
  return {
    state$,
    hash$: state$.map(state => `/${state.status.hash}`),
    DOM: state$.map(state => render(state))
  };
}

export { Navigator as default };

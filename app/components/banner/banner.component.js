import xs from 'xstream';
import render from './banner.render';


/**
 *
 * @param domSource
 * @returns {*}
 */
function intent(domSource) {
  return domSource
    .select('.Banner__toggleMenuBtn')
    .events('click');
}


/**
 *
 * @param click$
 * @param props$
 * @returns {MemoryStream<{dropdownVisible: boolean}>|MemoryStream}
 */
function model(click$, props$) {
  const initialModel = { dropdownVisible: false };

  function toggleDropdown(previousState) {
    return Object.assign(
      {},
      previousState,
      { dropdownVisible: !previousState.dropdownVisible }
    );
  }

  const dropDownToggle$ = click$.fold(toggleDropdown, initialModel);

  return xs.combine(dropDownToggle$, props$)
    .map(([state, props]) => Object.assign({}, state, props));
}


/**
 *
 * @param dom$
 * @param props$
 * @returns {{banner: (MemoryStream<U>|Stream|Stream<U>)}}
 */
function mainBanner(dom$, props$) {
  const click$ = intent(dom$);
  const state$ = model(click$, props$);
  return { banner: state$.map(render) };
}

export { mainBanner as default };

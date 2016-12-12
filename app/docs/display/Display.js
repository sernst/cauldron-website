import xs from 'xstream';
import { div } from '@cycle/dom';

const defaultResponse = {
  error: true,
  text: '<div class="Display__loading">Loading Content</div>'
};


/**
 *
 * @param HTTP
 * @returns {*}
 */
function intent(HTTP) {
  return HTTP.select('Display');
}


/**
 *
 * @param response$$
 * @returns {*}
 */
function model(response$$) {
  return response$$
    .map(res$ => res$.replaceError(() => xs.of(defaultResponse)))
    .flatten();
}


/**
 *
 * @param response$
 */
function render(response$) {
  return response$
    .startWith(defaultResponse)
    .map((res) => {
      const innerHTML = res.text;
      return div('.Display__wrapper', {
        props: { innerHTML }
      });
    });
}


/**
 *
 * @param HTTP
 * @returns {*}
 */
function Display(HTTP) {
  const response$$ = intent(HTTP);
  const response$ = model(response$$);
  const vdom$ = render(response$);
  return { response$, DOM: vdom$ };
}

export { Display as default };

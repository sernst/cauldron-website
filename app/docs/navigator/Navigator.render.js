import { div, span, img } from '@cycle/dom';
import { bem, classed } from '../../modules/renderUtils';

const ARROW_DROP_DOWN_URL = '/assets/images/arrow_drop_down.svg';
const ARROW_DROP_UP_URL = '/assets/images/arrow_drop_up.svg';


/**
 *
 * @param status
 * @param definition
 * @returns {*}
 */
function renderMobileSection(status, definition) {
  const namer = bem('NavigatorMobileSection');

  function renderLink(link) {
    const selected = (status.id === link.id);

    return div(
      namer('link'),
      {
        attrs: { 'data-id': link.id },
        class: classed(namer('link', 'selected'), selected)
      },
      [span(namer('link-text'), link.label)]
    );
  }

  return div(
    namer(),
    definition.links
      .map(entry => renderLink(entry))
      .reduce(
        (children, link) => children.concat([link]),
        [div(namer('header'), definition.label)]
      )
  );
}


/**
 *
 * @param status
 * @param definitions
 */
function renderMobileToggle(status, definitions) {
  const namer = bem('NavigatorToggle');
  const iconUrl = status.open ? ARROW_DROP_UP_URL : ARROW_DROP_DOWN_URL;

  const toggleBtn = div(
    namer(),
    [
      img(namer('icon'), { attrs: { src: iconUrl } }),
      div(namer('text'), 'Browse Topics')
    ]
  );

  if (!status.open) {
    return [toggleBtn];
  }

  return [toggleBtn].concat(
    definitions.map(def => renderMobileSection(status, def))
  );
}


/**
 *
 * @param status
 * @param definition
 s * @returns {*}
 */
function renderSection(status, definition) {
  const namer = bem('NavigatorSection');

  function renderLink(link) {
    const selected = (status.id === link.id);

    return div(
      namer('link'),
      {
        attrs: { 'data-id': link.id },
        class: classed(namer('link', 'selected'), selected)
      },
      [
        span(
          namer('link-bullet'),
          {
            class: classed(namer('link-bullet', 'selected'), selected),
            props: { innerHTML: '&#8226;&nbsp;&nbsp;' }
          },
        ),
        span(namer('link-text'), link.label)
      ]
    );
  }

  return div(
    namer(),
    definition.links
      .map(entry => renderLink(entry))
      .reduce(
        (children, link) => children.concat([link]),
        [div(namer('header'), definition.label)]
      )
  );
}


/**
 *
 * @param state
 */
function render(state) {
  const renderSectionStatus = renderSection.bind(null, state.status);

  return div(
    '.Navigator__wrapper',
    renderMobileToggle(state.status, state.definitions)
      .concat(state.definitions.map(renderSectionStatus)));
}

export { render as default };

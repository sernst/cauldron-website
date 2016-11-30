import { div, a, img } from '@cycle/dom';

const GITHUB_LOGO = '/assets/images/octocat-logo.svg';
const GITHUB_PAGE = 'https://www.github.com/sernst/cauldron';

/**
 * Curried function to return the CSS class for the given component name
 * and then the given element name following the standard syntax for BEM
 * css naming conventions.
 *
 * @param componentName
 * @returns {function}
 */
function bem(componentName) {
  return elementName => (
    elementName ? `.${componentName}__${elementName}` : `.${componentName}`
  );
}


/**
 *
 * @returns {*}
 */
function renderLogo() {
  const name = bem('BannerLogo');

  return a(name(), { attrs: { href: '/' } }, [
    img(name('image'), { attrs: { src: '/assets/images/logo-white.svg' } }),
    div(name('title'), 'Cauldron')
  ]);
}


/**
 *
 * @returns {*}
 */
function renderMenuButtons(state) {
  const name = bem('BannerMenu');
  return div(name('box'), [
    a(
      name('btn'),
      { attrs: { href: state.downloadUrl } },
      'Install'
    ),
    a(name('btn'), { attrs: { href: '/gallery' } }, 'Gallery'),
    a(name('btn'), { attrs: { href: '/docs' } }, 'Documentation'),
    a({ attrs: { href: GITHUB_PAGE } }, [
      img(name('iconBtn'), { attrs: { src: GITHUB_LOGO } })
    ])
  ]);
}


/**
 *
 * @param state
 * @returns {*}
 */
function renderDropdownMenu(state) {
  if (!state.dropdownVisible) {
    return div();
  }

  const name = bem('BannerMenuDropdown');

  return div(name(), [
    div(name('aligner'), [
      a(
        name('btn'),
        { attrs: { href: state.downloadUrl } },
        'Install'
      ),
      a(name('btn'), { attrs: { href: '/gallery' } }, 'Gallery'),
      a(name('btn'), { attrs: { href: '/docs' } }, 'Documentation'),
      a(name('btn'), { attrs: { href: GITHUB_PAGE } }, [
        img(name('btnIcon'), { attrs: { src: GITHUB_LOGO } }),
        div('Github')
      ])
    ])
  ]);
}


/**
 *
 * @param state
 * @returns {*}
 */
function render(state) {
  const name = bem('Banner');

  return div(name(), [
    div(name('container'), [
      renderLogo(),
      div(name('spacer')),
      a(name('toggleMenuBtn'), 'Menu'),
      renderMenuButtons(state),
    ]),
    renderDropdownMenu(state)
  ]);
}

export { render as default };

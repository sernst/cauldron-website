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
  const namer = bem('PageBannerLogo');

  return a(namer(), { attrs: { href: '/' } }, [
    img(namer('image'), { attrs: { src: '/assets/images/logo-white.svg' } }),
    div(namer('title'), 'Cauldron')
  ]);
}


/**
 *
 * @returns {*}
 */
function renderMenuButtons(state) {
  const name = bem('PageBannerMenu');
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

  const name = bem('PageBannerMenuDropdown');

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
  const namer = bem('PageBanner');

  return div(namer(), [
    div(namer('container'), [
      renderLogo(),
      div(namer('spacer')),
      a(
        namer('toggleMenuBtn'),
        [
          img(
            namer('toggleMenuIcon'),
            { attrs: { src: '/assets/images/menu-white.svg' } }
          )
        ]
      ),
      renderMenuButtons(state),
    ]),
    renderDropdownMenu(state)
  ]);
}

export { render as default };

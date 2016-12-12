/**
 * Curried function to return the CSS class for the given component name
 * and then the given element name following the standard syntax for BEM
 * css naming conventions.
 *
 * @param blockName
 * @returns {function}
 */
function bem(blockName) {
  function em(elementName, modifier) {
    const e = elementName ? `__${elementName}` : '';
    const m = modifier ? `--${modifier}` : '';
    return ['.', blockName, e, m].join('');
  }

  return em;
}


/**
 *
 * @param className
 * @param on
 * @returns {{}}
 */
function classed(className, on) {
  const name = className.startsWith('.') ? className.slice(1) : className;
  const out = {};
  out[name] = on;
  return out;
}


function classedMany(...classedPairs) {
  const entries = classedPairs.map(pair => classed(...pair));
  return Object.assign({}, ...entries);
}


export { bem, classed, classedMany };

import xs from 'xstream';
import { createHashHistory } from 'history';


function hashFromUrl(url) {
  const parts = url.split('#');
  return (parts.length < 2) ? null : parts[1];
}


function createHashChangeStream() {
  const producer = {};

  function start(listener) {
    function onHashChange(event) {
      return listener.next({
        oldHash: hashFromUrl(event.oldURL),
        newHash: hashFromUrl(event.newURL)
      });
    }

    producer.onHashChange = onHashChange;
    window.addEventListener('hashchange', onHashChange, false);
  }
  producer.start = start;

  function stop() {
    window.removeEventListener('hashchange', producer.onHashChange);
  }
  producer.stop = stop;

  return producer;
}


/**
 *
 * @param history
 * @param hashChange$
 */
function processHashStream(history, hashChange$) {
  function changeHash(newHash) {
    const prefixedHash = newHash.startsWith('/') ? newHash : `/${newHash}`;
    history.push(prefixedHash);
  }

  hashChange$
    .filter((newHash) => {
      const oldHash = window.location.hash.slice(1);
      return (newHash !== oldHash);
    })
    .subscribe({ next: changeHash });
}


/**
 *
 * @param historyOptions
 * @returns {function(*=)}
 */
function makeLocationHashDriver(historyOptions) {
  const history = createHashHistory(historyOptions);

  function LocationHashDriver(hashSink$) {
    processHashStream(history, hashSink$);

    return xs.createWithMemory(createHashChangeStream())
      .startWith({ oldHash: null, newHash: window.location.hash.slice(1) });
  }

  return LocationHashDriver;
}

export { makeLocationHashDriver as default };

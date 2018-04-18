/**
 * callbag-to-obs
 * ---------------
 *
 * Convert a listenable callbag source to an observable (or subscribable).
 * The Observable is an object following the ECMAScript Observable proposal
 * https://github.com/tc39/proposal-observable and at a minimum has the method
 * "subscribe(observer)" attached to it.
 *
 * `npm install callbag-to-obs`
 *
 * Example:
 *
 *     const {pipe, interval, take, filter, map} = require('callbag-basics');
 *     const toObservable = require('callbag-to-obs');
 *
 *     const observable = pipe(
 *       interval(1000), // 0,1,2,3,4,5,6,7,...
 *       take(5), // 0,1,2,3,4
 *       filter(x => x !== 0), // 1,2,3,4
 *       map(x => x * 10), // 10,20,30,40
 *       toObservable
 *     );
 *
 *     observable.subscribe({
 *       next: x => console.log(x)
 *     });
 */

const $$observable = require('symbol-observable').default;

function normalize(observer) {
  if (!observer.start) observer.start = () => { };
  if (!observer.next) observer.next = () => { };
  if (!observer.error) observer.error = () => { };
  if (!observer.complete) observer.complete = () => { };
}

function toObservable(source) {
  return {
    subscribe: function subscribe(observer) {
      normalize(observer);
      let talkback;
      const sub = {
        unsubscribe: function unsubscribe() {
          if (talkback) talkback(2);
        },
      };
      observer.start(sub);
      try {
        source(0, (t, d) => {
          if (t === 0) talkback = d;
          if (t === 1) observer.next(d);
          if (t === 2 && d) observer.error(d);
          else if (t === 2) talkback = void 0, observer.complete(d);
        });
      } catch (err) {
        observer.error(err);
      }
      return sub;
    },

    [$$observable]: function () { return this; },
  };
}

module.exports = toObservable;

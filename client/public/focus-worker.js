/* focus-worker.js — drift-free ticker for the FocusTimer page.
 *
 * The main thread owns the authoritative end-time and computes remaining
 * seconds from the wall clock, so ticks can never accumulate drift. This
 * worker exists for one reason: setInterval in the main thread is throttled
 * to ~1 tick/minute when the tab is backgrounded, which would delay the
 * timer's completion by up to a minute. A Worker keeps ticking.
 */
let timer = null;

self.onmessage = (e) => {
  const data = e.data || {};
  if (data.cmd === 'start') {
    if (timer) clearInterval(timer);
    timer = setInterval(() => self.postMessage({ tick: Date.now() }), data.ms || 250);
  } else if (data.cmd === 'stop') {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
};

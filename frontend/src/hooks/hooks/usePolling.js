/**
 * Polling hook: run callback on mount and every intervalMs.
 * Optionally pauses when tab is hidden (Page Visibility API).
 */
import { useEffect, useRef } from 'react';

/**
 * @param {() => void | Promise<void>} callback - Called immediately and on each tick
 * @param {number} intervalMs - Interval in milliseconds (e.g. 5000)
 * @param {{ pauseWhenHidden?: boolean }} options - If true, pause when document.hidden
 */
export function usePolling(callback, intervalMs, options = {}) {
  const { pauseWhenHidden = true } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let intervalId = null;

    function tick() {
      if (pauseWhenHidden && document.hidden) return;
      const result = callbackRef.current();
      if (result && typeof result.then === 'function') {
        result.catch(() => {});
      }
    }

    tick();
    intervalId = setInterval(tick, intervalMs);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalMs, pauseWhenHidden]);
}

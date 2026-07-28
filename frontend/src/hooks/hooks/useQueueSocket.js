import { useEffect, useRef } from 'react';

let socketSingleton = null;
function getSocket() {
  if (socketSingleton) return socketSingleton;
  // Lazy import so socket.io-client's websocket code isn't in the initial
  // bundle for pages that never use live queue data (e.g. landing page).
  return null;
}

/**
 * Subscribes to live push updates for a doctor's queue, on top of whatever
 * polling the page already does. When the backend isn't running as a
 * persistent server (see backend/src/realtime/socket.js — this is the
 * case on the current Vercel serverless deployment), the socket simply
 * never connects and this hook is a no-op; the existing usePolling call
 * elsewhere on the page keeps the UI correct either way.
 *
 * @param {string|number} doctorId
 * @param {string} date - YYYY-MM-DD
 * @param {() => void} onUpdate - called when a real update arrives (typically the same refetch function passed to usePolling)
 */
export function useQueueSocket(doctorId, date, onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!doctorId) return undefined;

    let socket;
    let cancelled = false;

    import('socket.io-client').then(({ io }) => {
      if (cancelled) return;
      const socketUrl = import.meta.env.VITE_API_URL || undefined; // undefined -> same origin
      socket = io(socketUrl, {
        withCredentials: true,
        reconnectionAttempts: 3,
        timeout: 4000,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('queue:subscribe', { doctorId, date });
      });

      socket.on('queue:update', () => {
        onUpdateRef.current?.();
      });

      // Deliberately silent: connect_error just means we stay on polling.
      socket.on('connect_error', () => {});
    });

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('queue:unsubscribe', { doctorId, date });
        socket.disconnect();
      }
    };
  }, [doctorId, date]);
}

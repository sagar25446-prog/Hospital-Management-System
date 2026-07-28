/**
 * Real-time queue push via Socket.io.
 *
 * IMPORTANT DEPLOYMENT NOTE: this only provides real push updates when the
 * backend runs as a persistent process (e.g. `node server.js` on Render,
 * Docker, or a VPS) — WebSockets need a long-lived connection to a single
 * server instance. On Vercel serverless functions there is no persistent
 * process to hold that connection open, so `initSocket` is simply never
 * called in that path (see server.js) and the app continues to work via
 * the existing HTTP polling in usePolling.js / useQueueSocket.js. This is
 * a real constraint of serverless, not a bug — see CHANGES.md.
 */

let io = null;

function initSocket(httpServer) {
  const { Server } = require('socket.io');

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.some((o) => origin === o || origin.endsWith('.vercel.app'))) {
          return callback(null, true);
        }
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Clients join a room per doctor+date so updates only reach people
    // actually watching that queue, not every connected client.
    socket.on('queue:subscribe', ({ doctorId, date }) => {
      if (!doctorId) return;
      socket.join(roomName(doctorId, date));
    });
    socket.on('queue:unsubscribe', ({ doctorId, date }) => {
      if (!doctorId) return;
      socket.leave(roomName(doctorId, date));
    });
  });

  console.log('Socket.io initialized — live queue push enabled.');
  return io;
}

function roomName(doctorId, date) {
  return `queue:${doctorId}:${date || 'today'}`;
}

/**
 * Broadcast a queue update to anyone subscribed to that doctor's queue.
 * Safe to call even when sockets were never initialized (serverless) —
 * it's just a no-op, the REST response the caller already got is
 * unaffected.
 */
function emitQueueUpdate(doctorId, date, payload) {
  if (!io) return;
  io.to(roomName(doctorId, date)).emit('queue:update', payload);
}

module.exports = { initSocket, emitQueueUpdate };

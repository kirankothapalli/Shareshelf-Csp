const { Server } = require('socket.io');
const { verifyAccessToken } = require('./jwt');

let io = null;

// Map of userId -> Set of socket ids, so we can push events to a specific user
const userSockets = new Map();

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    console.log(`[socket] User ${uid} connected (socket ${socket.id})`);
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    socket.on('room:join', (transactionId) => {
      console.log(`[socket] User ${uid} joining room txn:${transactionId}`);
      socket.join(`txn:${transactionId}`);
    });

    socket.on('disconnect', () => {
      const set = userSockets.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(uid);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit an event to every connected socket for a specific user (their own "room")
function emitToUser(userId, event, payload) {
  if (!io) return;
  const set = userSockets.get(String(userId));
  if (!set) return;
  for (const sid of set) io.to(sid).emit(event, payload);
}

// Emit to everyone in a transaction's chat room
function emitToTransaction(transactionId, event, payload) {
  if (!io) return;
  io.to(`txn:${transactionId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToUser, emitToTransaction };

/**
 * Socket.IO Server Setup
 * Handles authentication, namespaces, and user rooms for real-time WhatsApp events.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

/** @type {import('socket.io').Server} */
let io = null;

/**
 * Room name for user-specific events (each user gets their own room)
 * @param {string|number} userId
 * @returns {string}
 */
export const getUserRoom = (userId) => `user:${userId}`;

/**
 * Initialize Socket.IO with authentication and connection handling
 * @param {import('socket.io').Server} socketServer
 */
export const initializeSocket = (socketServer) => {
  io = socketServer;

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const room = getUserRoom(userId);

    socket.join(room);
    console.log(`Socket connected: user ${userId} joined room ${room}`);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: user ${userId}, reason: ${reason}`);
    });
  });
};

/**
 * Emit event to a specific user's room
 * @param {string|number} userId
 * @param {string} event
 * @param {unknown} data
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  const room = getUserRoom(userId);
  io.to(room).emit(event, data);
};

/**
 * Get the Socket.IO server instance (for advanced use)
 * @returns {import('socket.io').Server | null}
 */
export const getIO = () => io;

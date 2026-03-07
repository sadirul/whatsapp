/**
 * Socket.IO Client Service
 * Modular, singleton-based connection with JWT authentication.
 * Connects only on the client (Next.js SSR-safe).
 */

import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

let socket = null;

/**
 * Connect to Socket.IO server with JWT authentication
 * @param {string} token - JWT token for auth
 * @returns {import('socket.io-client').Socket | null}
 */
export const connectSocket = (token) => {
  if (typeof window === 'undefined') return null;
  if (!token) return null;

  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the current socket instance (may be null if not connected)
 * @returns {import('socket.io-client').Socket | null}
 */
export const getSocket = () => socket;

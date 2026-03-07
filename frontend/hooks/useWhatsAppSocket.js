/**
 * useWhatsAppSocket - Hook to handle WhatsApp real-time events via Socket.IO
 * Events: whatsapp:qr, whatsapp:ready, whatsapp:authenticated, whatsapp:message, whatsapp:disconnected
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * @typedef {Object} WhatsAppSocketHandlers
 * @property {(data: { qr: string }) => void} [onQR] - QR code data URL
 * @property {(data: { status: string }) => void} [onReady] - Client ready
 * @property {(data: object) => void} [onAuthenticated] - Authenticated
 * @property {(data: { chatId: string, message: object }) => void} [onMessage] - New message
 * @property {(data: { status: string }) => void} [onDisconnected] - Disconnected
 */

/**
 * Subscribe to WhatsApp Socket.IO events
 * @param {WhatsAppSocketHandlers} handlers - Event handlers
 */
export const useWhatsAppSocket = (handlers = {}) => {
  const { socket, connected } = useSocket();

  const {
    onQR,
    onReady,
    onAuthenticated,
    onMessage,
    onDisconnected,
  } = handlers;

  useEffect(() => {
    if (!socket) return;

    if (onQR) {
      socket.on('whatsapp:qr', onQR);
    }
    if (onReady) {
      socket.on('whatsapp:ready', onReady);
    }
    if (onAuthenticated) {
      socket.on('whatsapp:authenticated', onAuthenticated);
    }
    if (onMessage) {
      socket.on('whatsapp:message', onMessage);
    }
    if (onDisconnected) {
      socket.on('whatsapp:disconnected', onDisconnected);
    }

    return () => {
      if (onQR) socket.off('whatsapp:qr', onQR);
      if (onReady) socket.off('whatsapp:ready', onReady);
      if (onAuthenticated) socket.off('whatsapp:authenticated', onAuthenticated);
      if (onMessage) socket.off('whatsapp:message', onMessage);
      if (onDisconnected) socket.off('whatsapp:disconnected', onDisconnected);
    };
  }, [socket, onQR, onReady, onAuthenticated, onMessage, onDisconnected]);

  return { socket, connected };
};

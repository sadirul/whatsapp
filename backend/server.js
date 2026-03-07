import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app, { initializeApp } from './app.js';
import { getAllClients, reconnectAllClients } from './services/whatsapp.service.js';
import { initializeSocket } from './socket/index.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

let server;

const startServer = async () => {
  try {
    // Initialize database
    await initializeApp();

    // Reconnect WhatsApp clients for users with connected status
    console.log('Reconnecting WhatsApp clients...');
    await reconnectAllClients();

    // Create HTTP server and attach Socket.IO
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });
    initializeSocket(io);

    server = httpServer;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO enabled for real-time events`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');

  // Close all WhatsApp clients
  const clients = getAllClients();
  for (const [userId, { client }] of clients) {
    try {
      await client.logout();
      await client.destroy();
      console.log(`WhatsApp client closed for user ${userId}`);
    } catch (err) {
      console.error(`Error closing client for user ${userId}:`, err);
    }
  }

  // Close server
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

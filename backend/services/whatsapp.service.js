import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import puppeteer from 'puppeteer';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { emitToUser } from '../socket/index.js';
import { processAutoReply } from './aiAutoReply.service.js';

/** Resolve Chrome executable path - use Puppeteer's bundled Chromium or fallback to system Chrome */
function getChromeExecutablePath() {
  const puppeteerPath = puppeteer.executablePath();
  if (puppeteerPath && fs.existsSync(puppeteerPath)) {
    return puppeteerPath;
  }
  // Fallback: common Windows Chrome paths
  const systemPaths = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  for (const p of systemPaths) {
    if (fs.existsSync(p)) return p;
  }
  // Let Puppeteer use default (will download Chromium if needed)
  return undefined;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clients = new Map();
const qrCodes = new Map();
const initializing = new Set(); // Prevent concurrent init for same user
// In-memory store for recent incoming messages (userId -> chatId -> messages[])
const incomingMessages = new Map();

const addIncomingMessage = (userId, chatId, msg) => {
  if (!incomingMessages.has(userId)) incomingMessages.set(userId, new Map());
  const userChats = incomingMessages.get(userId);
  if (!userChats.has(chatId)) userChats.set(chatId, []);
  const list = userChats.get(chatId);
  list.push(msg);
  if (list.length > 100) list.shift();
};

export const getIncomingMessages = (userId, chatId) => {
  const userChats = incomingMessages.get(userId);
  if (!userChats) return [];
  const list = userChats.get(chatId) || [];
  userChats.delete(chatId);
  return list;
};

export const getWhatsAppClient = async (userId) => {
  try {
    // Return existing client if available
    if (clients.has(userId)) {
      const { client } = clients.get(userId);
      return { client, qr: qrCodes.get(userId) };
    }

    // Prevent concurrent initialization for same user
    if (initializing.has(userId)) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (clients.has(userId)) {
          const { client } = clients.get(userId);
          return { client, qr: qrCodes.get(userId) };
        }
      }
      throw new Error('Initialization timeout');
    }
    initializing.add(userId);

    // Create session path
    const sessionPath = path.join(__dirname, '../sessions', `user-${userId}`);

    // Create new client
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `user-${userId}`,
        dataPath: sessionPath,
      }),
      puppeteer: (() => {
        const execPath = getChromeExecutablePath();
        return {
          headless: true,
          ...(execPath && { executablePath: execPath }),
          args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-software-rasterizer',
        ],
        };
      })(),
    });

    // QR Code handler
    client.on('qr', async (qr) => {
      try {
        const qrImage = await qrcode.toDataURL(qr);
        qrCodes.set(userId, qrImage);
        emitToUser(userId, 'whatsapp:qr', { qr: qrImage });
        console.log(`QR Code generated for user ${userId}`);
      } catch (err) {
        console.error('QR Code generation error:', err);
      }
    });

    // Ready handler
    client.on('ready', async () => {
      try {
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({ whatsapp_status: 'connected' });
        }
        qrCodes.delete(userId);
        emitToUser(userId, 'whatsapp:ready', { status: 'connected' });
        console.log(`WhatsApp client ready for user ${userId}`);
      } catch (err) {
        console.error('Ready handler error:', err);
      }
    });

    // Authenticated handler
    client.on('authenticated', () => {
      emitToUser(userId, 'whatsapp:authenticated', {});
      console.log(`WhatsApp authenticated for user ${userId}`);
    });

    // Disconnected handler
    client.on('disconnected', async () => {
      try {
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({ whatsapp_status: 'disconnected' });
        }
        clients.delete(userId);
        qrCodes.delete(userId);
        emitToUser(userId, 'whatsapp:disconnected', { status: 'disconnected' });
        console.log(`WhatsApp disconnected for user ${userId}`);
      } catch (err) {
        console.error('Disconnected handler error:', err);
      }
    });

    // Auth failure - e.g. session deleted from WhatsApp Web
    client.on('auth_failure', async (msg) => {
      console.log(`WhatsApp auth failure for user ${userId}:`, msg);
      try {
        const user = await User.findByPk(userId);
        if (user) await user.update({ whatsapp_status: 'disconnected' });
        clients.delete(userId);
        qrCodes.delete(userId);
        emitToUser(userId, 'whatsapp:disconnected', { status: 'disconnected' });
      } catch (err) {
        console.error('Auth failure handler error:', err);
      }
    });

    // Error handler
    client.on('error', (error) => {
      console.error(`WhatsApp client error for user ${userId}:`, error);
    });

    // Message handler - store for Messages UI and forward to webhook
    client.on('message', async (message) => {
      console.log(`Message received for user ${userId}:`, message.from, message.body);
      try {
        const chatId = message.from;
        const msgData = {
          id: typeof message.id === 'object' ? message.id?._serialized : String(message.id),
          body: message.body || '',
          fromMe: message.fromMe || false,
          timestamp: message.timestamp,
          type: message.type || 'chat',
          hasMedia: message.hasMedia || false,
        };
        addIncomingMessage(userId, chatId, msgData);
        emitToUser(userId, 'whatsapp:message', {
          chatId,
          message: msgData,
        });
        const user = await User.findByPk(userId, { attributes: ['webhook_url'] });
        if (user?.webhook_url) {
          const payload = {
            event: 'message',
            userId,
            message: {
              id: typeof message.id === 'object' ? message.id?._serialized : String(message.id),
              from: message.from,
              to: message.to,
              body: message.body || '',
              type: message.type,
              timestamp: message.timestamp,
              fromMe: message.fromMe || false,
              hasMedia: message.hasMedia || false,
              author: message.author || null,
            },
          };
          await fetch(user.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        processAutoReply(userId, message).catch((err) =>
          console.error('AI auto-reply:', err.message)
        );
      } catch (err) {
        console.error(`Webhook error for user ${userId}:`, err.message);
      }
    });

    // Initialize client
    await client.initialize();

    // Store client immediately
    clients.set(userId, { client, qrCodes: () => qrCodes.get(userId) });

    // Wait for client to be ready when restoring session (max 15 sec)
    if (!client.info) {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), 15000);
        client.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    return {
      client,
      qr: qrCodes.get(userId),
    };
  } catch (error) {
    console.error('WhatsApp Client Error:', error);
    throw error;
  } finally {
    initializing.delete(userId);
  }
};

export const getQRCode = (userId) => {
  return qrCodes.get(userId);
};

export const isClientConnected = (userId) => {
  if (!clients.has(userId)) return false;
  const { client } = clients.get(userId);
  return client?.info !== undefined;
};

export const removeClient = async (userId) => {
  if (clients.has(userId)) {
    const { client } = clients.get(userId);
    try {
      await client.logout();
      await client.destroy();
    } catch (err) {
      console.error('Error destroying client:', err);
    }
    clients.delete(userId);
  }
  qrCodes.delete(userId);
};

export const getAllClients = () => clients;

export const restoreUserSession = async (userId) => {
  try {
    const user = await User.findByPk(userId, { attributes: ['id', 'whatsapp_status'] });
    if (!user || user.whatsapp_status !== 'connected') return;

    if (isClientConnected(userId)) return;

    const { client } = await getWhatsAppClient(userId);
    if (!client.info) {
      await User.update({ whatsapp_status: 'disconnected' }, { where: { id: userId } });
    }
  } catch (err) {
    console.error(`Restore session for user ${userId}:`, err.message);
  }
};

export const reconnectAllClients = async () => {
  try {
    const users = await User.findAll({
      where: { whatsapp_status: 'connected' },
      attributes: ['id'],
    });

    if (users.length === 0) {
      console.log('No WhatsApp sessions to restore');
      return;
    }

    console.log(`Restoring ${users.length} WhatsApp session(s)...`);

    for (const user of users) {
      try {
        const { client } = await getWhatsAppClient(user.id);
        if (client.info) {
          console.log(`  ✓ User ${user.id} session restored`);
        } else {
          await User.update(
            { whatsapp_status: 'disconnected' },
            { where: { id: user.id } }
          );
          console.log(`  ✗ User ${user.id} session expired, marked disconnected`);
        }
      } catch (err) {
        console.error(`  ✗ User ${user.id} restore failed:`, err.message);
        await User.update(
          { whatsapp_status: 'disconnected' },
          { where: { id: user.id } }
        );
      }
    }

    console.log('WhatsApp session restore complete');
  } catch (err) {
    console.error('Reconnect all clients error:', err);
  }
};

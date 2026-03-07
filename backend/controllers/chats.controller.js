import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import User from '../models/User.js';
import customValidate from '../utils/customValidate.js';
import { getWhatsAppClient, removeClient, getIncomingMessages } from '../services/whatsapp.service.js';

const formatChat = (chat) => {
  const chatId = (chat.id && (chat.id._serialized || chat.id.id)) || String(chat.id);
  return {
    id: chatId,
    name: chat.name || chat.formattedTitle || 'Unknown',
    isGroup: chat.isGroup,
    timestamp: chat.timestamp,
    unreadCount: chat.unreadCount || 0,
    profilePicUrl: null,
    lastMessage: chat.lastMessage ? {
      body: chat.lastMessage.body?.substring(0, 100) || '',
      fromMe: chat.lastMessage.fromMe,
      timestamp: chat.lastMessage.timestamp,
    } : null,
  };
};

const formatMessage = (msg) => ({
  id: typeof msg.id === 'object' ? msg.id?._serialized : String(msg.id),
  body: msg.body || '',
  fromMe: msg.fromMe || false,
  timestamp: msg.timestamp,
  type: msg.type || 'chat',
  hasMedia: msg.hasMedia,
});

export const getChats = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);
    if (!user || user.whatsapp_status !== 'connected') {
      return res.status(400).json({ success: false, message: 'WhatsApp is not connected' });
    }

    const { client } = await getWhatsAppClient(userId);
    if (!client.info) {
      await removeClient(userId);
      await user.update({ whatsapp_status: 'disconnected' });
      return res.status(400).json({ success: false, message: 'WhatsApp session expired' });
    }

    const chats = await client.getChats();
    const formatted = chats.map((chat) => formatChat(chat));

    res.json({ success: true, chats: formatted });
  } catch (error) {
    console.error('Get Chats Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get chats' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const user = await User.findByPk(userId);
    if (!user || user.whatsapp_status !== 'connected') {
      return res.status(400).json({ success: false, message: 'WhatsApp is not connected' });
    }

    const { client } = await getWhatsAppClient(userId);
    if (!client.info) {
      await removeClient(userId);
      await user.update({ whatsapp_status: 'disconnected' });
      return res.status(400).json({ success: false, message: 'WhatsApp session expired' });
    }

    const chat = await client.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    await chat.sendSeen();

    const messages = await chat.fetchMessages({ limit });
    const formatted = messages.map(formatMessage);

    const recent = getIncomingMessages(userId, chatId);
    const merged = [...formatted];
    for (const r of recent) {
      if (!merged.some((m) => m.id === r.id)) {
        merged.push(r);
      }
    }
    merged.sort((a, b) => a.timestamp - b.timestamp);

    res.json({ success: true, messages: merged });
  } catch (error) {
    console.error('Get Chat Messages Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get messages' });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId, message } = req.body;

    const validation = customValidate({ chatId, message }, {
      chatId: 'required|string',
      message: 'required|string',
    });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const user = await User.findByPk(userId);
    if (!user || user.whatsapp_status !== 'connected') {
      return res.status(400).json({ success: false, message: 'WhatsApp is not connected' });
    }

    const { client } = await getWhatsAppClient(userId);
    if (!client.info) {
      await removeClient(userId);
      await user.update({ whatsapp_status: 'disconnected' });
      return res.status(400).json({ success: false, message: 'WhatsApp session expired' });
    }

    const chat = await client.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const sent = await chat.sendMessage(message);
    const formatted = formatMessage(sent);

    res.json({ success: true, message: formatted });
  } catch (error) {
    console.error('Send Chat Message Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send message' });
  }
};

export const sendChatDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.body;
    const file = req.file;

    const validation = customValidate({ chatId }, { chatId: 'required|string' });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const user = await User.findByPk(userId);
    if (!user || user.whatsapp_status !== 'connected') {
      return res.status(400).json({ success: false, message: 'WhatsApp is not connected' });
    }

    const { client } = await getWhatsAppClient(userId);
    if (!client.info) {
      await removeClient(userId);
      await user.update({ whatsapp_status: 'disconnected' });
      return res.status(400).json({ success: false, message: 'WhatsApp session expired' });
    }

    const chat = await client.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const media = new MessageMedia(
      file.mimetype,
      file.buffer.toString('base64'),
      file.originalname
    );
    const sent = await chat.sendMessage(media, { sendMediaAsDocument: true });
    const formatted = formatMessage(sent);

    res.json({ success: true, message: formatted });
  } catch (error) {
    console.error('Send Chat Document Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send document' });
  }
};

export const downloadMessageMedia = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId, messageId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || user.whatsapp_status !== 'connected') {
      return res.status(400).json({ success: false, message: 'WhatsApp is not connected' });
    }

    const { client } = await getWhatsAppClient(userId);
    if (!client.info) {
      await removeClient(userId);
      await user.update({ whatsapp_status: 'disconnected' });
      return res.status(400).json({ success: false, message: 'WhatsApp session expired' });
    }

    const msg = await client.getMessageById(messageId);
    if (!msg || !msg.hasMedia) {
      return res.status(404).json({ success: false, message: 'Message or media not found' });
    }

    const media = await msg.downloadMedia();
    if (!media) {
      return res.status(404).json({ success: false, message: 'Could not download media' });
    }

    const ext = media.mimetype?.split('/')[1] || 'bin';
    const filename = `download.${ext}`;
    const buffer = Buffer.from(media.data, 'base64');

    res.setHeader('Content-Type', media.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download Media Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to download' });
  }
};

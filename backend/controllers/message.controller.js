import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import User from '../models/User.js';
import customValidate from '../utils/customValidate.js';
import { getWhatsAppClient, removeClient } from '../services/whatsapp.service.js';

export const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { number, message } = req.body;

    const validation = customValidate({ number, message }, {
      number: 'required|string',
      message: 'required|string',
    });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check WhatsApp status
    if (user.whatsapp_status !== 'connected') {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp is not connected',
      });
    }

    // Get WhatsApp client
    const { client } = await getWhatsAppClient(userId);

    if (!client.info) {
      await removeClient(userId);
      await user.update({ whatsapp_status: 'disconnected' });
      return res.status(400).json({
        success: false,
        message: 'WhatsApp session expired. Please reconnect from the WhatsApp page.',
      });
    }

    // Format phone number
    const chatId = number.includes('@') ? number : `${number}@c.us`;

    // Send message
    await client.sendMessage(chatId, message);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

export const testMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    const validation = customValidate({ message }, { message: 'required|string' });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Test message validated successfully',
    });
  } catch (error) {
    console.error('Test Message Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const validateAndGetClient = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.whatsapp_status !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }
  const { client } = await getWhatsAppClient(userId);
  if (!client.info) {
    await removeClient(userId);
    await user.update({ whatsapp_status: 'disconnected' });
    throw new Error('WhatsApp session expired. Please reconnect from the WhatsApp page.');
  }
  return client;
};

const formatChatId = (number) => {
  return number.includes('@') ? number : `${number}@c.us`;
};

export const sendMedia = async (req, res) => {
  try {
    const userId = req.userId;
    const { to, caption } = req.body;
    const file = req.file;

    const validation = customValidate({ to }, { to: 'required|string' });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const client = await validateAndGetClient(userId);
    const chatId = formatChatId(to);

    const media = new MessageMedia(
      file.mimetype,
      file.buffer.toString('base64'),
      file.originalname
    );

    await client.sendMessage(chatId, media, { caption: caption || '' });

    return res.status(200).json({
      success: true,
      message: 'Media sent successfully',
    });
  } catch (error) {
    console.error('Send Media Error:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to send media',
    });
  }
};

export const sendMediaUrl = async (req, res) => {
  try {
    const userId = req.userId;
    const { to, url, caption, filename } = req.body;

    const validation = customValidate({ to, url }, {
      to: 'required|string',
      url: 'required|url',
    });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const client = await validateAndGetClient(userId);
    const chatId = formatChatId(to);

    const media = await MessageMedia.fromUrl(url, {
      unsafeMime: true,
      ...(filename && { filename }),
    });
    await client.sendMessage(chatId, media, { caption: caption || '' });

    return res.status(200).json({
      success: true,
      message: 'Media sent successfully',
    });
  } catch (error) {
    console.error('Send Media URL Error:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to send media',
    });
  }
};

import User from '../models/User.js';
import { getWhatsAppClient, getQRCode as getStoredQRCode, removeClient, isClientConnected, restoreUserSession } from '../services/whatsapp.service.js';
import { emitToUser } from '../socket/index.js';

export const getQRCode = async (req, res) => {
  try {
    const userId = req.userId;

    // Poll for QR - it's generated asynchronously after client.initialize()
    // (Frontend calls initialize first, so client/QR should appear within ~15 sec)
    let qr = getStoredQRCode(userId);
    for (let i = 0; i < 15 && !qr; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      qr = getStoredQRCode(userId);
    }

    if (!qr) {
      return res.status(400).json({
        success: false,
        message: 'Unable to generate QR code. Please try Initialize again.',
      });
    }

    return res.status(200).json({
      success: true,
      qr,
    });
  } catch (error) {
    console.error('Get QR Code Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const initializeWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;

    const client = await getWhatsAppClient(userId);

    return res.status(200).json({
      success: true,
      message: 'WhatsApp client initialized',
      data: {
        status: 'initializing',
      },
    });
  } catch (error) {
    console.error('Initialize WhatsApp Error:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error.message || String(error))
      : 'Server error';
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

export const getWhatsAppStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If DB says connected but client not in memory (e.g. after restart), trigger restore and show "connecting"
    let status = user.whatsapp_status;
    if (user.whatsapp_status === 'connected' && !isClientConnected(userId)) {
      restoreUserSession(userId).catch((err) =>
        console.error('Status restore:', err.message)
      );
      status = 'connecting';
    }

    return res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Get WhatsApp Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const disconnectWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Destroy WhatsApp client and update user status
    await removeClient(userId);
    await user.update({ whatsapp_status: 'disconnected' });
    emitToUser(userId, 'whatsapp:disconnected', { status: 'disconnected' });

    return res.status(200).json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect WhatsApp Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

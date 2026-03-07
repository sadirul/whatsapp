import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET, JWT_EXPIRY } from '../config/jwt.js';
import { generateApiKey } from '../utils/generateApiKey.js';
import customValidate from '../utils/customValidate.js';
import { restoreUserSession, isClientConnected, getWhatsAppClient } from '../services/whatsapp.service.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const validation = customValidate(
      { name, email, password, confirmPassword },
      {
        name: 'required|string|max:255',
        email: 'required|email',
        password: 'required|string|min:6',
        confirmPassword: 'required|same:password',
      }
    );
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate API key
    const apiKey = generateApiKey();

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      api_key: apiKey,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        api_key: user.api_key,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = customValidate({ email, password }, {
      email: 'required|email',
      password: 'required',
    });
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Restore WhatsApp session in background if user was connected
    if (user.whatsapp_status === 'connected') {
      restoreUserSession(user.id).catch((err) =>
        console.error('Login session restore:', err.message)
      );
    } else {
      // Pre-initialize WhatsApp client in background when disconnected
      // So QR is ready instantly when user clicks Initialize
      getWhatsAppClient(user.id).catch((err) =>
        console.error('Login WhatsApp pre-init:', err.message)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        api_key: user.api_key,
        whatsapp_status: user.whatsapp_status,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If DB says connected but client not in memory (e.g. after restart), trigger restore and show "connecting"
    let whatsapp_status = user.whatsapp_status;
    if (user.whatsapp_status === 'connected' && !isClientConnected(req.userId)) {
      restoreUserSession(req.userId).catch((err) =>
        console.error('Profile restore:', err.message)
      );
      whatsapp_status = 'connecting';
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        api_key: user.api_key,
        whatsapp_status,
      },
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

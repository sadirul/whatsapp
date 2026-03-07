/**
 * AI Auto-Reply Service
 * Eligibility checks, chat history, and reply orchestration.
 */

import User from '../models/User.js';
import { generateReply } from './gemini.service.js';

const DEBUG = process.env.AI_AUTO_REPLY_DEBUG === 'true';
const log = (...args) => DEBUG && console.log('[AI Auto-Reply]', ...args);

const STOP_PHRASES = ['stop', 'don\'t reply', 'no auto reply', 'stop replying', 'disable auto reply'];
const repliedMessageIds = new Set();
const disabledChats = new Map();

const isStopPhrase = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().trim();
  return STOP_PHRASES.some((phrase) => lower.includes(phrase));
};

const getDisabledKey = (userId, chatId) => `${userId}:${chatId}`;

export const isChatDisabled = (userId, chatId) => {
  return disabledChats.has(getDisabledKey(userId, chatId));
};

export const disableChat = (userId, chatId) => {
  disabledChats.set(getDisabledKey(userId, chatId), true);
};

const formatChatHistory = (messages) => {
  return messages
    .map((m) => {
      const text = (m.body || '').trim() || (m.hasMedia ? '[Media]' : '');
      if (!text) return null;
      const role = m.fromMe ? 'Me' : 'User';
      return `${role}: ${text}`;
    })
    .filter(Boolean)
    .join('\n');
};

const randomDelay = (minMs, maxMs) => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((r) => setTimeout(r, ms));
};

const getMessageId = (message, userId) => {
  const id = typeof message.id === 'object' ? message.id?._serialized : message.id;
  if (id && String(id).length > 0) return String(id);
  return `${userId}-${message.from || 'unknown'}-${message.timestamp || Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Check if message is eligible for AI auto-reply
 */
export const isEligibleForAutoReply = (message, user) => {
  if (!user?.gemini_api_key?.trim()) return false;
  if (!!user.ai_auto_reply_enabled === false) return false;
  if (message.fromMe) return false;
  if (message.isStatus) return false;
  const from = (message.from || '').toString();
  if (from.includes('status') || from.includes('broadcast')) return false;
  if (!message.body && !message.hasMedia) return false;
  return true;
};

/**
 * Check if chat should be excluded (group, etc.)
 */
const isExcludedChat = (chat) => {
  try {
    if (chat.isGroup) return true;
    return false;
  } catch {
    return true;
  }
};

/**
 * Process incoming message and send AI reply if eligible
 */
export const processAutoReply = async (userId, message) => {
  const msgId = getMessageId(message, userId);
  if (repliedMessageIds.has(msgId)) {
    log('Skip duplicate msgId:', msgId);
    return;
  }
  repliedMessageIds.add(msgId);
  console.log(`[AI Auto-Reply] Incoming message from ${message.from}: "${(message.body || '').slice(0, 40)}${(message.body || '').length > 40 ? '...' : ''}"`);
  if (repliedMessageIds.size > 1000) {
    const arr = [...repliedMessageIds];
    repliedMessageIds.clear();
    arr.slice(-500).forEach((id) => repliedMessageIds.add(id));
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: ['gemini_api_key', 'ai_auto_reply_enabled'],
    });
    if (!user) {
      log('User not found:', userId);
      return;
    }
    if (!isEligibleForAutoReply(message, user)) {
      log('Not eligible - key:', !!user?.gemini_api_key?.trim(), 'enabled:', user.ai_auto_reply_enabled, 'fromMe:', message.fromMe);
      return;
    }

    const chat = await message.getChat();
    const chatId = (chat.id && chat.id._serialized) || chat.id || message.from;

    if (isExcludedChat(chat)) {
      log('Excluded chat (group)');
      return;
    }
    if (isChatDisabled(userId, chatId)) {
      log('Chat disabled by user');
      return;
    }

    const body = (message.body || '').trim();
    if (isStopPhrase(body)) {
      disableChat(userId, chatId);
      log('Stop phrase detected, disabled chat');
      return;
    }

    log('Fetching chat history...');
    let messages = [];
    try {
      messages = await chat.fetchMessages({ limit: 20 });
    } catch (fetchErr) {
      console.error('AI auto-reply: fetchMessages failed:', fetchErr.message);
      return;
    }

    const sorted = [...(messages || [])].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const chatHistory = formatChatHistory(sorted);
    const newMessage = body || (message.hasMedia ? '[User sent media]' : '');

    if (!newMessage) {
      log('No message content to reply to');
      return;
    }

    log('Generating reply...');
    const reply = await generateReply(user.gemini_api_key, chatHistory, newMessage);
    if (!reply || !reply.trim()) {
      log('No reply from Gemini');
      return;
    }

    await randomDelay(2000, 5000);
    log('Sending reply');
    await chat.sendMessage(reply);
    console.log(`[AI Auto-Reply] Sent to ${chatId}: "${reply.slice(0, 50)}${reply.length > 50 ? '...' : ''}"`);
  } catch (err) {
    console.error('AI auto-reply error:', err.message);
    if (DEBUG) console.error(err);
  }
};

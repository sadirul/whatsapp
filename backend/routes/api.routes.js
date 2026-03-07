import express from 'express';
import multer from 'multer';
import * as messageController from '../controllers/message.controller.js';
import apiKeyMiddleware from '../middlewares/apiKey.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
});

// API Key authenticated endpoints (external API)
router.post('/send', apiKeyMiddleware, messageController.sendMessage);
router.post('/send-media', apiKeyMiddleware, upload.single('file'), messageController.sendMedia);
router.post('/send-media-url', apiKeyMiddleware, messageController.sendMediaUrl);

// JWT authenticated endpoints (dashboard)
router.post('/send-message', authMiddleware, messageController.sendMessage);
router.post('/send-media-message', authMiddleware, upload.single('file'), messageController.sendMedia);
router.post('/send-media-url-message', authMiddleware, messageController.sendMediaUrl);

// JWT authenticated endpoints for testing
router.post('/test', authMiddleware, messageController.testMessage);

export default router;

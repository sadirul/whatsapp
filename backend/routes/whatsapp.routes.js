import express from 'express';
import multer from 'multer';
import * as whatsappController from '../controllers/whatsapp.controller.js';
import * as chatsController from '../controllers/chats.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });
const router = express.Router();

router.get('/qr', authMiddleware, whatsappController.getQRCode);
router.post('/initialize', authMiddleware, whatsappController.initializeWhatsApp);
router.get('/status', authMiddleware, whatsappController.getWhatsAppStatus);
router.post('/disconnect', authMiddleware, whatsappController.disconnectWhatsApp);

router.get('/chats', authMiddleware, chatsController.getChats);
router.post('/chats/send', authMiddleware, chatsController.sendChatMessage);
router.post('/chats/send-document', authMiddleware, upload.single('file'), chatsController.sendChatDocument);
router.get('/chats/:chatId/messages/:messageId/media', authMiddleware, chatsController.downloadMessageMedia);
router.get('/chats/:chatId/messages', authMiddleware, chatsController.getChatMessages);

export default router;

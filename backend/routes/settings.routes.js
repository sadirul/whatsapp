import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, settingsController.getSettings);
router.put('/change-password', authMiddleware, settingsController.changePassword);
router.put('/', authMiddleware, settingsController.updateSettings);

export default router;

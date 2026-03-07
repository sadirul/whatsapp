import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import * as templateController from '../controllers/template.controller.js';

const router = express.Router();

// List & CRUD (auth required)
router.get('/', authMiddleware, templateController.getTemplates);
router.get('/:id/file', authMiddleware, templateController.getTemplateFile);
router.get('/:id', authMiddleware, templateController.getTemplate);
router.post('/', authMiddleware, templateController.upload, templateController.createTemplate);
router.put('/:id', authMiddleware, templateController.upload, templateController.updateTemplate);
router.delete('/:id', authMiddleware, templateController.deleteTemplate);

export default router;

import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import * as contactController from '../controllers/contact.controller.js';

const router = express.Router();
router.use(authMiddleware);

// Groups
router.get('/groups', contactController.getGroups);
router.post('/groups', contactController.createGroup);
router.put('/groups/:id', contactController.updateGroup);
router.delete('/groups/:id', contactController.deleteGroup);

// Contacts
router.get('/contacts', contactController.getContacts);
router.post('/contacts', contactController.createContact);
router.put('/contacts/:id', contactController.updateContact);
router.delete('/contacts/:id', contactController.deleteContact);

// Import / Export
router.post('/import', contactController.importContacts);
router.get('/export', contactController.exportContacts);
router.get('/sample', contactController.downloadSample);

export default router;

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { Template } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/templates');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, String(req.userId));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, unique + path.extname(file.originalname) || '');
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
}).single('file');

/** Apply multer only for multipart requests */
export const upload = (req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return multerUpload(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
      next();
    });
  }
  next();
};

export const getTemplates = async (req, res) => {
  const templates = await Template.findAll({
    where: { user_id: req.userId },
    order: [['created_at', 'DESC']],
  });
  res.json({ success: true, templates });
};

export const getTemplate = async (req, res) => {
  const { id } = req.params;
  const template = await Template.findOne({ where: { id, user_id: req.userId } });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, template });
};

export const getTemplateFile = async (req, res) => {
  const { id } = req.params;
  const template = await Template.findOne({ where: { id, user_id: req.userId } });
  if (!template || template.type !== 'media' || !template.file_path) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  const filePath = path.join(__dirname, '..', template.file_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
  res.sendFile(path.resolve(filePath), { headers: { 'Content-Disposition': `inline; filename="${template.file_name || 'file'}"` } });
};

export const createTemplate = async (req, res) => {
  try {
      const { name, type, message, media_url, caption } = req.body || {};
      if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
      if (!['text', 'media', 'media_url'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type' });
      }

      const data = { user_id: req.userId, name: name.trim(), type };

      if (type === 'text') {
        if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
        data.message = message.trim();
      } else if (type === 'media') {
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, message: 'File is required for media type' });
        data.file_path = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
        data.file_name = file.originalname;
        if (caption?.trim()) data.caption = caption.trim();
      } else if (type === 'media_url') {
        if (!media_url?.trim()) return res.status(400).json({ success: false, message: 'Media URL is required' });
        data.media_url = media_url.trim();
        if (caption?.trim()) data.caption = caption.trim();
      }

    const template = await Template.create(data);
    res.status(201).json({ success: true, template });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
      const { id } = req.params;
      const template = await Template.findOne({ where: { id, user_id: req.userId } });
      if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

      const { name, type, message, media_url, caption } = req.body || {};
      const updates = {};

      if (name?.trim()) updates.name = name.trim();
      if (type && ['text', 'media', 'media_url'].includes(type)) updates.type = type;

      if (template.type === 'text' || type === 'text') {
        if (message !== undefined) updates.message = message?.trim() || null;
      }
      if (template.type === 'media_url' || type === 'media_url') {
        if (media_url !== undefined) updates.media_url = media_url?.trim() || null;
      }
      if (template.type === 'media' || template.type === 'media_url' || type === 'media' || type === 'media_url') {
        if (caption !== undefined) updates.caption = caption?.trim() || null;
      }

      if (req.file && (template.type === 'media' || type === 'media')) {
        if (template.file_path) {
          const oldPath = path.join(__dirname, '..', template.file_path);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        updates.file_path = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');
        updates.file_name = req.file.originalname;
      }

    await template.update(updates);
    res.json({ success: true, template });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteTemplate = async (req, res) => {
  const { id } = req.params;
  const template = await Template.findOne({ where: { id, user_id: req.userId } });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  if (template.file_path) {
    const filePath = path.join(__dirname, '..', template.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await template.destroy();
  res.json({ success: true, message: 'Template deleted' });
};

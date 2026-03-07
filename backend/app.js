import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import models from './models/index.js';
import authRoutes from './routes/auth.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import apiRoutes from './routes/api.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import contactRoutes from './routes/contact.routes.js';
import templateRoutes from './routes/template.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import workerRoutes from './routes/worker.routes.js';

const app = express();

// Middleware - allow localhost origins in development
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/api', apiRoutes);
app.use('/settings', settingsRoutes);
app.use('/contacts', contactRoutes);
app.use('/templates', templateRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/worker', workerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Initialize database
export const initializeApp = async () => {
  try {
    await models.sequelize.authenticate();
    console.log('Database connected successfully');

    await models.sequelize.sync();
    console.log('Database synchronized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default app;

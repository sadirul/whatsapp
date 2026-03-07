import express from 'express';
import workerMiddleware from '../middlewares/worker.middleware.js';
import { executeSchedule } from '../services/schedule.service.js';

const router = express.Router();
router.use(workerMiddleware);

router.post('/execute-schedule/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await executeSchedule(Number(id));
    res.json({ success: true, schedule: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

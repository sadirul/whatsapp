import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import * as scheduleController from '../controllers/schedule.controller.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', scheduleController.getSchedules);
router.get('/:id/history', scheduleController.getScheduleHistory);
router.get('/:id', scheduleController.getSchedule);
router.post('/', scheduleController.createSchedule);
router.put('/:id/cancel', scheduleController.cancelSchedule);
router.put('/:id/reschedule', scheduleController.rescheduleSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;

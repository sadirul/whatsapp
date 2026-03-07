import { Schedule, ScheduleHistory, Group, Template } from '../models/index.js';
import { enqueueSchedule, cancelQueueJob } from '../services/queue.service.js';

export const getSchedules = async (req, res) => {
  const schedules = await Schedule.findAll({
    where: { user_id: req.userId },
    include: [
      { model: Group, as: 'Group', attributes: ['id', 'name'] },
      { model: Template, as: 'Template', attributes: ['id', 'name', 'type'] },
    ],
    order: [['scheduled_at', 'DESC']],
  });
  res.json({ success: true, schedules });
};

export const getSchedule = async (req, res) => {
  const { id } = req.params;
  const schedule = await Schedule.findOne({
    where: { id, user_id: req.userId },
    include: [
      { model: Group, as: 'Group', attributes: ['id', 'name'] },
      { model: Template, as: 'Template', attributes: ['id', 'name', 'type', 'message', 'caption', 'media_url'] },
    ],
  });
  if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
  res.json({ success: true, schedule });
};

export const getScheduleHistory = async (req, res) => {
  const { id } = req.params;
  const schedule = await Schedule.findOne({ where: { id, user_id: req.userId } });
  if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
  const history = await ScheduleHistory.findAll({
    where: { schedule_id: id },
    order: [['sent_at', 'DESC']],
  });
  res.json({ success: true, history });
};

export const createSchedule = async (req, res) => {
  const { group_id, template_id, scheduled_at } = req.body;
  if (!group_id || !template_id || !scheduled_at) {
    return res.status(400).json({ success: false, message: 'Group, template and scheduled_at are required' });
  }
  const group = await Group.findOne({ where: { id: group_id, user_id: req.userId } });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  const template = await Template.findOne({ where: { id: template_id, user_id: req.userId } });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  const scheduledDate = new Date(scheduled_at);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return res.status(400).json({ success: false, message: 'Scheduled time must be in the future' });
  }
  const schedule = await Schedule.create({
    user_id: req.userId,
    group_id,
    template_id,
    scheduled_at: scheduledDate,
    status: 'pending',
  });
  await enqueueSchedule(schedule.id);
  res.status(201).json({ success: true, schedule });
};

export const cancelSchedule = async (req, res) => {
  const { id } = req.params;
  const schedule = await Schedule.findOne({ where: { id, user_id: req.userId } });
  if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
  if (schedule.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending schedules can be cancelled' });
  }
  await cancelQueueJob(schedule.id);
  await schedule.update({ status: 'cancelled' });
  res.json({ success: true, schedule });
};

export const rescheduleSchedule = async (req, res) => {
  const { id } = req.params;
  const { scheduled_at } = req.body;
  const schedule = await Schedule.findOne({ where: { id, user_id: req.userId } });
  if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
  if (!['failed', 'cancelled'].includes(schedule.status)) {
    return res.status(400).json({ success: false, message: 'Only failed or cancelled schedules can be rescheduled' });
  }
  const newDate = scheduled_at ? new Date(scheduled_at) : (() => { const d = new Date(); d.setMinutes(d.getMinutes() + 5); return d; })();
  if (isNaN(newDate.getTime()) || newDate <= new Date()) {
    return res.status(400).json({ success: false, message: 'Scheduled time must be in the future' });
  }
  await schedule.update({
    status: 'pending',
    scheduled_at: newDate,
    sent_count: 0,
    failed_count: 0,
    total_contacts: 0,
    error_message: null,
    executed_at: null,
  });
  await enqueueSchedule(schedule.id);
  res.json({ success: true, schedule });
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  const schedule = await Schedule.findOne({ where: { id, user_id: req.userId } });
  if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
  if (schedule.status === 'running') {
    return res.status(400).json({ success: false, message: 'Cannot delete running schedule' });
  }
  await schedule.destroy();
  res.json({ success: true, message: 'Schedule deleted' });
};

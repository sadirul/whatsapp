import { Op } from 'sequelize';
import { QueueJob, Schedule, sequelize } from '../models/index.js';

/** Enqueue a schedule - create queue job when schedule is created */
export async function enqueueSchedule(scheduleId) {
  const schedule = await Schedule.findByPk(scheduleId);
  if (!schedule || schedule.status !== 'pending') return null;
  const [job] = await QueueJob.findOrCreate({
    where: { schedule_id: scheduleId, status: ['pending', 'processing'] },
    defaults: {
      schedule_id: scheduleId,
      job_type: 'schedule',
      status: 'pending',
      execute_at: schedule.scheduled_at,
    },
  });
  return job;
}

/** Cancel queue job when schedule is cancelled */
export async function cancelQueueJob(scheduleId) {
  await QueueJob.update(
    { status: 'cancelled' },
    { where: { schedule_id: scheduleId, status: 'pending' } }
  );
}

/** Get next pending job from queue (atomic claim for worker) */
export async function claimNextJob() {
  const t = await sequelize.transaction();
  try {
    const job = await QueueJob.findOne({
      where: {
        status: 'pending',
        execute_at: { [Op.lte]: new Date() },
        [Op.and]: sequelize.where(sequelize.col('attempts'), Op.lt, sequelize.col('max_attempts')),
      },
      order: [['execute_at', 'ASC']],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!job) {
      await t.commit();
      return null;
    }
    await job.update(
      { status: 'processing', attempts: job.attempts + 1, started_at: new Date() },
      { transaction: t }
    );
    await t.commit();
    return job;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

/** Mark job as completed */
export async function completeJob(jobId) {
  await QueueJob.update(
    { status: 'completed', completed_at: new Date() },
    { where: { id: jobId } }
  );
}

/** Mark job as failed */
export async function failJob(jobId, errorMessage) {
  await QueueJob.update(
    { status: 'failed', completed_at: new Date(), error_message: errorMessage },
    { where: { id: jobId } }
  );
}

/** Requeue failed job for retry (if under max_attempts) */
export async function requeueJob(jobId) {
  const job = await QueueJob.findByPk(jobId);
  if (!job || job.attempts >= job.max_attempts) return false;
  await job.update({ status: 'pending' });
  return true;
}

/** Backfill: create queue jobs for pending schedules that don't have one (e.g. created before queue existed) */
export async function backfillQueueJobs() {
  const pendingSchedules = await Schedule.findAll({ where: { status: 'pending' } });
  const existingJobScheduleIds = new Set(
    (await QueueJob.findAll({ where: { status: ['pending', 'processing'] }, attributes: ['schedule_id'] }))
      .map((j) => j.schedule_id)
  );
  let created = 0;
  for (const s of pendingSchedules) {
    if (!existingJobScheduleIds.has(s.id)) {
      await QueueJob.create({
        schedule_id: s.id,
        job_type: 'schedule',
        status: 'pending',
        execute_at: s.scheduled_at,
      });
      created++;
    }
  }
  return created;
}

import dotenv from 'dotenv';
import models from './models/index.js';
import { claimNextJob, completeJob, failJob, backfillQueueJobs } from './services/queue.service.js';

dotenv.config();

const POLL_INTERVAL_MIN_MS = 5000;
const POLL_INTERVAL_MAX_MS = 15000;

const randomDelay = () =>
  Math.floor(Math.random() * (POLL_INTERVAL_MAX_MS - POLL_INTERVAL_MIN_MS + 1)) + POLL_INTERVAL_MIN_MS;
const SERVER_BASE = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
const WORKER_SECRET = process.env.WORKER_SECRET || '';

async function callExecuteSchedule(scheduleId) {
  const res = await fetch(`${SERVER_BASE}/worker/execute-schedule/${scheduleId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-worker-secret': WORKER_SECRET,
    },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
  return json.schedule;
}

async function runWorker() {
  try {
    await models.sequelize.authenticate();
    console.log('[Scheduler Worker] Database connected');
  } catch (err) {
    console.error('[Scheduler Worker] Database connection failed:', err.message);
    process.exit(1);
  }

  const backfilled = await backfillQueueJobs();
  if (backfilled > 0) console.log(`[Scheduler Worker] Backfilled ${backfilled} queue job(s)`);

  const processQueue = async () => {
    try {
      const job = await claimNextJob();
      if (!job) return;

      console.log(`[Scheduler Worker] Processing job ${job.id} (schedule ${job.schedule_id})`);
      try {
        await callExecuteSchedule(job.schedule_id);
        await completeJob(job.id);
        console.log(`[Scheduler Worker] Job ${job.id} completed`);
      } catch (err) {
        console.error(`[Scheduler Worker] Job ${job.id} failed:`, err.message);
        await failJob(job.id, err.message);
      }
    } catch (err) {
      console.error('[Scheduler Worker] Queue poll error:', err.message);
    }
  };

  const runLoop = async () => {
    await processQueue();
    const delay = randomDelay();
    console.log(`[Scheduler Worker] Next poll in ${(delay / 1000).toFixed(1)}s`);
    setTimeout(runLoop, delay);
  };

  console.log(`[Scheduler Worker] Running. Polling queue every 5–15s randomly → ${SERVER_BASE}`);
  await runLoop();
}

runWorker().catch((err) => {
  console.error('[Scheduler Worker] Fatal:', err);
  process.exit(1);
});

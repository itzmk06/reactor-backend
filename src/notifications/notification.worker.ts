import { Worker } from 'bullmq';
import { QUEUE_NAMES, redisConnection } from './notification.queue';
import { notificationProcessor } from './notification.processor';

export function createNotificationWorker():Worker {
  const worker = new Worker(QUEUE_NAMES.NOTIFICATIONS, notificationProcessor, {
    connection: redisConnection,
    concurrency: 3,
  });
  worker.on('completed', (job) => {
    console.log(`[NOTIFICATION WORKER]: Job ${job.id} (${job.name}) completed`);
  });
  worker.on('failed', (job, err) => {
    console.error(
      `[NOTIFICATION WORKER]: Job ${job?.id} (${job?.name}) failed with error: ${err?.message}`,
    );
  });
  worker.on('error', (error) => {
    console.error(`[NOTIFICATION WORKER]: Worker error: ${error?.message}`);
  });
  console.log('[NOTIFICATION WORKER]: Worker started');
  return worker;
}

export async function closeNotificationWorker(worker: Worker) {
  await worker.close();
}

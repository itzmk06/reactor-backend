import 'dotenv/config';
import { verifyMailer } from './notifications/email.service';
import { createNotificationWorker } from './notifications/notification.worker';

async function main() {
  try {
    await verifyMailer();
  } catch (error) {
    console.error(`[WORKER] Error verifying mailer: ${error}`);
    process.exit(1);
  }
}

const worker = createNotificationWorker();

function shutdown(signal: string) {
  console.log(`[WORKER] Received ${signal}, shutting down...`);
  worker.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

main().catch((err) => {
  console.error(`[WORKER] Error starting worker: ${err}`);
  process.exit(1);
});

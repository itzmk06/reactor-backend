import 'dotenv/config';
import {
  queueIncidentAssignedNotification,
  queueIncidentCreatedNotification,
  queueIncidentResolvedNotification,
} from '../notifications/notification.queue';
async function testAll() {
  const incidentId = 'test-all-123';
  const title = 'BullMQ Full Test';
  const severity = 'P1' as const;
const description =
  'Massive end-to-end BullMQ validation designed to stress test queue throughput, worker concurrency, delayed jobs, retries, failure recovery, event propagation, and notification delivery under production-like conditions.';

  // 1. INCIDENT CREATED
  console.log('🔥 Queuing INCIDENT_CREATED...');
  await queueIncidentCreatedNotification({
    incidentId,
    title,
    severity,
    description,
    creatorName: 'Keerthana',
    creatorUsername: 'keerthana',
    recipientEmails: [
      'coolest.conqueror@gmail.com',
      // add a second email if you want to test deduplication/fan-out
    ],
  });

  // 2. INCIDENT ASSIGNED
  console.log('🔥 Queuing INCIDENT_ASSIGNED...');
  await queueIncidentAssignedNotification({
    incidentId,
    title,
    description,
    severity,
    assigneeName: 'Alice',
    assigneeEmail: 'coolest.conqueror@gmail.com',
    assigneeUsername: 'Manoj',
    assignedByName: 'Keerthana',
    assignedByUsername: 'keerthana',
  });

  // 3. INCIDENT RESOLVED
  console.log('🔥 Queuing INCIDENT_RESOLVED...');
  await queueIncidentResolvedNotification({
    incidentId,
    title,
    description,
    severity,
    resolvedByName: 'Keerthana',
    recipientEmails: ['coolest.conqueror@gmail.com'],
    resolvedByUsername: 'keerthana',
  });

  console.log('✅ All 3 jobs queued! Check your inbox and worker logs.');
  process.exit(0);
}

testAll();

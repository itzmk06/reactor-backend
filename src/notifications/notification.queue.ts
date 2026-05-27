import { Queue, QueueOptions } from 'bullmq';
import { env } from '../lib/env';
import { Severity } from '../generated/prisma/enums';
import { AppError } from '../lib/error';

const redisUrl = new URL(env.REDIS_URL);

const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: parseInt(redisUrl.pathname.slice(1) || '0'),
  tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
};

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
} as const;

export const JOB_TYPES = {
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_ASSIGNED: 'incident.assigned',
  INCIDENT_RESOLVED: 'incident.resolved',
} as const;

export interface IncidentCreatedJobData {
  incidentId: string;
  severity: Severity;
  title: string;
  creatorName: string;
  creatorUsername: string;
  recipientEmail: string;
}

export interface IncidentAssignedJobData {
  incidentId: string;
  title: string;
  severity: Severity;
  assigneeName: string;
  assigneeUsername: string;
  assigneeEmail: string;
  assignedByName: string;
  assignedByUsername: string;
}

export interface IncidentResolvedJobData {
  incidentId: string;
  title: string;
  severity: Severity;
  resolvedByName: string;
  resolvedByUsername: string;
  recipientEmail: string;
}

export function getSeverityPriority(severity: Severity): number {
  switch (severity) {
    case 'P1':
      return 1;
    case 'P2':
      return 2;
    case 'P3':
      return 3;
    case 'P4':
      return 4;
    default:
      return 5;
  }
}

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 100,
      age: 60 * 60 * 24,
    },
    removeOnFail: {
      count: 50,
      age: 60 * 60 * 24 * 7,
    },
  },
};

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, queueOptions);

export async function closeNotificationQueue() {
  await notificationQueue.close();
}

export async function queueIncidentCreatedNotification(data: {
  incidentId: string;
  severity: Severity;
  title: string;
  creatorName: string;
  creatorUsername: string;
  recipientEmails: string[];
}) {
  const emails = [...new Set(data.recipientEmails)];
  if (emails.length === 0) return;
  try {
    await Promise.all(
      emails.map((email) => {
        return notificationQueue.add(
          JOB_TYPES.INCIDENT_CREATED,
          {
            incidentId: data.incidentId,
            title: data.title,
            severity: data.severity,
            creatorName: data.creatorName,
            creatorUsername: data.creatorUsername,
            recipientEmail: email,
          } satisfies IncidentCreatedJobData,
          {
            priority: getSeverityPriority(data.severity),
            jobId: `incident-created-${data.incidentId}-${email}`,
          },
        );
      }),
    );
  } catch (error) {
    console.error(
      `[NOTIFICATION QUEUE] : Failed to queue incident created notification for ${data.incidentId}`,
      error,
    );
    throw new AppError(`Failed to queue incident created notification for ${data.incidentId}`, 500);
  }
}

export async function queueIncidentAssignedNotification(data: IncidentAssignedJobData) {
  try {
    await notificationQueue.add(JOB_TYPES.INCIDENT_ASSIGNED, data, {
      priority: getSeverityPriority(data.severity),
    });
  } catch (error) {
    console.error(
      `[NOTIFICATION QUEUE] : Failed to queue incident assigned notification for ${data.incidentId}`,
      error,
    );
    throw new AppError(
      `Failed to queue incident assigned notification for ${data.incidentId}`,
      500,
    );
  }
}

export async function queueIncidentResolvedNotification(data: {
  incidentId: string;
  title: string;
  severity: Severity;
  resolvedByName: string;
  resolvedByUsername: string;
  recipientEmails: string[];
}) {
  const emails = [...new Set(data.recipientEmails)];
  if (emails.length === 0) return;
  try { 
    await Promise.all(
      emails.map((email) => {
        return notificationQueue.add(
          JOB_TYPES.INCIDENT_RESOLVED,
          {
            incidentId: data.incidentId,
            title: data.title,
            severity: data.severity,
            resolvedByName: data.resolvedByName,
            resolvedByUsername: data.resolvedByUsername,
            recipientEmail: email,
          } satisfies IncidentResolvedJobData,
          {
            priority: 5,
            jobId: `incident-resolved-${data.incidentId}-${email}`,
          },
        );
      }),
    );
  } catch (error) {
    console.error(
      `[NOTIFICATION QUEUE] : Failed to queue incident resolved notification for ${data.incidentId}`,
      error,
    );
    throw new AppError(
      `Failed to queue incident resolved notification for ${data.incidentId}`,
      500,
    );
  }
}

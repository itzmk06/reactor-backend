import { Job } from 'bullmq';
import { sendMail } from './email.service';
import {
  JOB_TYPES,
  IncidentAssignedJobData,
  IncidentCreatedJobData,
  IncidentResolvedJobData,
} from './notification.queue';
import {
  incidentAssignedTemplate,
  incidentCreatedTemplate,
  incidentResolvedTemplate,
} from './email.templates';

type NotificationJobData =
  | IncidentCreatedJobData
  | IncidentAssignedJobData
  | IncidentResolvedJobData;
export async function notificationProcessor(job: Job<NotificationJobData>) {
  console.log(`[NOTIFICATION PROCESSOR] : Processing ${job.name} notification for ${job.id}`);
  switch (job.name) {
    case JOB_TYPES.INCIDENT_CREATED: {
      const data = job.data as IncidentCreatedJobData;
      const { subject, html } = incidentCreatedTemplate({
        incidentId: data.incidentId,
        title: data.title,
        severity: data.severity,
        description: data.description,
        creatorUsername: data.creatorUsername,
      });
      await sendMail({
        to: data.recipientEmail,
        subject: subject,
        html: html,
      });
      console.log(
        `[NOTIFICATION PROCESSOR] : Sent ${job.name} notification for ${data.recipientEmail}`,
      );
      return;
    }
    case JOB_TYPES.INCIDENT_ASSIGNED: {
      const data = job.data as IncidentAssignedJobData;
      const { subject, html } = incidentAssignedTemplate({
        incidentId: data.incidentId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        assignedByUsername: data.assignedByUsername,
        assigneeUsername: data.assigneeUsername,
      });
      await sendMail({
        to: data.assigneeEmail,
        subject: subject,
        html: html,
      });
      console.log(
        `[NOTIFICATION PROCESSOR]: Sent ${job.name} notification for ${data.assigneeEmail}`,
      );
      return;
    }
    case JOB_TYPES.INCIDENT_RESOLVED: {
      const data = job.data as IncidentResolvedJobData;
      const { subject, html } = incidentResolvedTemplate({
        incidentId: data.incidentId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        resolvedByUsername: data.resolvedByUsername,
      });
      await sendMail({
        to: data.recipientEmail,
        subject: subject,
        html: html,
      });
      console.log(
        `[NOTIFICATION PROCESSOR]: Sent ${job.name} notification for ${data.recipientEmail}`,
      );
      return;
    }
    default: {
      throw new Error(`Unknown notification type ${job.name}`);
    }
  }
}

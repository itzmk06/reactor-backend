// This is the most powerful file of this project xD

import { prisma } from '../lib/prisma';
import { redisPub } from '../lib/redis';
import { AppError } from '../lib/error';
import { IncidentStatus, Severity } from '../generated/prisma/enums';
import {
  queueIncidentCreatedNotification,
  queueIncidentAssignedNotification,
  queueIncidentResolvedNotification,
} from '../notifications/notification.queue';

async function publish(room: string, event: string, data: unknown) {
  await redisPub.publish('incident:updates', JSON.stringify({ room, event, data }));
}

export async function listIncidents(filters: {
  status?: string;
  severity?: Severity;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(Math.max(1, filters.limit ?? 10), 100);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  const [incidents, total] = await prisma.$transaction([
    prisma.incident.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: { select: { events: true } },
      },
    }),
    prisma.incident.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { incidents, total, page, totalPages };
}

export async function getIncident(id: string) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      assignees: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
      events: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
  });
  if (!incident) throw new AppError('incident not found', 404);
  return incident;
}

export async function createIncident(
  data: { title: string; description: string; severity: Severity },
  userId: string,
) {
  const incident = await prisma.$transaction(async (tx) => {
    const inc = await tx.incident.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity as Severity,
        creatorId: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
    await tx.incidentEvent.create({
      data: {
        incidentId: inc.id,
        userId,
        type: 'STATUS_CHANGE',
        content: 'Incident created',
        metadata: {
          severity: inc.severity,
          status: 'OPEN',
        },
      },
    });
    return inc;
  });
  try {
    const recipients = await prisma.user.findMany({
      where: {
        role: {
          in: ['LEAD', 'ADMIN'],
        },
      },
      select: {
        email: true,
      },
    });
    await queueIncidentCreatedNotification({
      incidentId: incident.id,
      severity: incident.severity,
      title: incident.title,
      description: incident.description,
      creatorName: incident.creator.name,
      recipientEmails: recipients.map((recipient) => recipient.email),
      creatorUsername: incident.creator.username,
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to queue incident created notification:', err);
  }
  try {
    await publish(`incident:${incident.id}`, 'incident:created', incident);
  } catch (err) {
    console.error('[PUBLISH] Failed to publish incident created event:', err);
  }
  return incident;
}

export async function updateStatus(id: string, status: IncidentStatus, userId: string) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.incident.findUnique({
      where: { id },
    });
    if (!existing) throw new AppError('incident not found', 404);
    const inc = await tx.incident.update({
      where: { id },
      data: {
        status: status as IncidentStatus,
        resolvedAt: status === IncidentStatus.RESOLVED ? new Date() : null,
      },
    });
    await tx.incidentEvent.create({
      data: {
        incidentId: inc.id,
        userId,
        type: 'STATUS_CHANGE',
        content: `Status changed from ${existing.status} to ${status}`,
        metadata: { from: existing.status, to: status },
      },
    });
    return inc;
  });
  if (updated.status === IncidentStatus.RESOLVED) {
    try {
      const [incident, resolvedBy] = await Promise.all([
        prisma.incident.findUnique({
          where: {
            id: updated.id,
          },
          include: {
            assignees: {
              select: {
                email: true,
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            name: true,
            username: true,
          },
        }),
      ]);
      if (incident) {
        const recipients = incident.assignees.map((assignee) => assignee.email);
        await queueIncidentResolvedNotification({
          incidentId: updated.id,
          title: updated.title,
          severity: updated.severity,
          description: updated.description,
          resolvedByName: resolvedBy?.name || 'Team',
          resolvedByUsername: resolvedBy?.username || 'Team',
          recipientEmails: recipients,
        });
      }
    } catch (err) {
      console.error('[NOTIFICATION] Failed to queue incident resolved notification:', err);
    }
  }
  try {
    await publish(`incident:${updated.id}`, 'incident:status', {
      incidentId: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error('[PUBLISH] Failed to publish incident status event:', err);
  }
  return updated;
}

export async function updateSeverity(id: string, severity: Severity, userId: string) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.incident.findUnique({
      where: { id },
    });
    if (!existing) throw new AppError('incident not found', 404);
    const inc = await tx.incident.update({
      where: { id },
      data: { severity: severity as Severity },
    });
    await tx.incidentEvent.create({
      data: {
        incidentId: inc.id,
        userId,
        type: 'SEVERITY_CHANGE',
        content: `Severity changed from ${existing.severity} to ${severity}`,
        metadata: { from: existing.severity, to: severity },
      },
    });
    return inc;
  });
  try {
    await publish(`incident:${updated.id}`, 'incident:severity', {
      incidentId: updated.id,
      severity: updated.severity,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error('[PUBLISH] Failed to publish incident severity event:', err);
  }
  return updated;
}

export async function addComment(incidentId: string, content: string, userId: string) {
  const comment = await prisma.$transaction(async (tx) => {
    const inc = await tx.incident.findUnique({
      where: { id: incidentId },
    });
    if (!inc) throw new AppError('incident not found', 404);
    const event = await tx.incidentEvent.create({
      data: {
        incidentId,
        userId,
        type: 'COMMENT',
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
    return event;
  });
  try {
    await publish(`incident:${incidentId}`, 'incident:comment', comment);
  } catch (err) {
    console.error('[PUBLISH] Failed to publish incident comment event:', err);
  }
  return comment;
}

export async function assignUser(incidentId: string, assigneeUserId: string, userId: string) {
  const [incident, targetUser] = await Promise.all([
    prisma.incident.findUnique({ where: { id: incidentId } }),
    prisma.user.findUnique({
      where: { id: assigneeUserId },
      select: { id: true, name: true, username: true, role: true, email: true },
    }),
  ]);
  if (!incident) throw new AppError('incident not found', 404);
  if (!targetUser) throw new AppError('assign user not found', 404);
  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.incident.update({
      where: { id: incidentId },
      data: { assignees: { connect: { id: assigneeUserId } } },
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
    await tx.incidentEvent.create({
      data: {
        incidentId,
        userId,
        type: 'ASSIGNMENT',
        content: `Incident assigned to ${targetUser.username}`,
        metadata: { assigneeId: assigneeUserId, action: 'assigned' },
      },
    });
    return updated;
  });
  try {
    const assignedBy = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        username: true,
      },
    });
    await queueIncidentAssignedNotification({
      incidentId,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      assigneeName: targetUser.name,
      assigneeUsername: targetUser.username,
      assigneeEmail: targetUser.email,
      assignedByName: assignedBy?.name || 'Incident Command Center',
      assignedByUsername: assignedBy?.username || 'incident.command.center',
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to queue incident assigned notification:', err);
  }
  try {
    await publish(`incident:${incidentId}`, 'incident:assignment', event);
  } catch (err) {
    console.error('[PUBLISH] Failed to publish incident assignment event:', err);
  }
  return event;
}

export async function unassignUser(incidentId: string, assigneeUserId: string, userId: string) {
  const [incident, targetUser] = await Promise.all([
    prisma.incident.findUnique({ where: { id: incidentId } }),
    prisma.user.findUnique({ where: { id: assigneeUserId } }),
  ]);
  if (!incident) throw new AppError('incident not found', 404);
  if (!targetUser) throw new AppError('assign user not found', 404);
  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.incident.update({
      where: {
        id: incidentId,
      },
      data: {
        assignees: {
          disconnect: { id: assigneeUserId },
        },
      },
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
    await tx.incidentEvent.create({
      data: {
        incidentId,
        userId,
        type: 'ASSIGNMENT',
        content: `Incident unassigned from ${targetUser.username}`,
        metadata: { assigneeId: assigneeUserId, action: 'unassigned' },
      },
    });
    return updated;
  });
  try {
    await publish(`incident:${incidentId}`, 'incident:unassignment', event);
  } catch (err) {
    console.error('[PUBLISH] Failed to publish incident unassignment event:', err);
  }
  return event;
}

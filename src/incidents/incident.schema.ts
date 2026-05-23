import { z } from 'zod';
import { IncidentStatus, Severity } from '../generated/prisma/enums';

export const createIncidentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters long')
      .max(200, 'Title must be at most 200 characters long'),
    description: z
      .string()
      .trim()
      .min(3, 'Description must be at least 3 characters long')
      .max(6000, 'Description must be at most 6000 characters long'),
    severity: z.enum(Severity),
  })
  .strict();

export const updateStatusSchema = z
  .object({
    status: z.enum(IncidentStatus),
  })
  .strict();

export const updateSeveritySchema = z
  .object({
    severity: z.enum(Severity),
  })
  .strict();

export const addCommentSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(3, 'Comment must be at least 3 characters long')
      .max(6000, 'Comment must be at most 6000 characters long'),
  })
  .strict();

export const assignUserSchema = z
  .object({
    assigneeUserId: z.cuid2('Invalid user ID'),
  })
  .strict();

export const listIncidentQuerySchema = z.object({
  status: z.enum(IncidentStatus).optional(),
  severity: z.enum(Severity).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const incidentIdParamSchema = z.object({
  id: z.cuid2('Invalid incident ID'),
});

export const unAssignSchema = z.object({
  id: z.cuid2('Invalid incident ID'),
  userId: z.cuid2('Invalid user ID'),
});

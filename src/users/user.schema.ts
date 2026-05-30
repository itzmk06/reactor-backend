import { UserUncheckedUpdateManyInput } from './../generated/prisma/models/User';
import z from 'zod';
import { Role } from '../generated/prisma/enums';

export const updateRoleSchema = z
  .object({
    role: z.enum(Role),
  })
  .strict();

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const userIdParamSchema = z.object({
  id: z.cuid2('Invalid user ID'),
});

export const usernameParamSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._]+$/, 'Username can contain only . _  a-z 0-9')
    .toLowerCase(),
});

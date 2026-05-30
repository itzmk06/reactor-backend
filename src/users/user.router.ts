import { Router, Response } from 'express';
import { validate } from '../lib/validate';
import { listUsersQuerySchema, updateRoleSchema, userIdParamSchema, usernameParamSchema } from './user.schema';
import { AuthRequest } from '../auth/auth.types';
import { asyncHandler } from '../lib/asyncHandler';
import { getUserById, getUserByUsername, listUsers, updateUserRole } from './user.service';
import { Role } from '../generated/prisma/enums';
import { verifyAccessToken, verifyRole } from '../auth/auth.middleware';

export const userRouter = Router();
userRouter.use(verifyAccessToken);

userRouter.get(
  '/',
  validate(listUsersQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = listUsersQuerySchema.parse(req.query);
    const users = await listUsers(page, limit, search);
    return res.status(200).json({
      success: true,
      data: users,
    });
  }),
);

userRouter.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await getUserById(req.params.id as string);
    return res.status(200).json({
      success: true,
      data: user,
    });
  }),
);

userRouter.get(
  '/u/:username',
  validate(usernameParamSchema, 'params'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await getUserByUsername(req.params.username as string);
    return res.status(200).json({
      success: true,
      data: user,
    })
  }),
);

userRouter.patch(
  '/:id/role',
  verifyRole('ADMIN'),
  validate(userIdParamSchema, 'params'),
  validate(updateRoleSchema, 'body'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await updateUserRole(req.params.id as string, req.body.role as Role);
    return res.status(200).json({
      success: true,
      data: user,
    });
  }),
);

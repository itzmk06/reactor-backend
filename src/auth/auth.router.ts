import { Request, Response, Router, CookieOptions } from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, logoutUser, rotateRefreshToken } from './auth.service';
import { registerSchema, loginSchema, RegisterType, LoginType } from './auth.schema';
import { verifyRole, verifyAccessToken } from './auth.middleware';
import { env } from '../lib/env';
import { validate } from '../lib/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { AppError } from '../lib/error';
import { prisma } from '../lib/prisma';
import { Role } from '../generated/prisma/enums';
import { AuthRequest } from './auth.types';

export const appRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

appRouter.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  asyncHandler(async (req: Request<{}, {}, RegisterType>, res: Response) => {
    const { email, password, name, username } = req.body;
    const { user, accessToken, refreshToken } = await registerUser(email, password, name, username);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  }),
);

appRouter.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  asyncHandler(async (req: Request<{}, {}, LoginType>, res: Response) => {
    const { identifier, password } = req.body;
    const { user, accessToken, refreshToken } = await loginUser(identifier.toLowerCase(), password);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  }),
);

appRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new AppError('please login again!', 401);
    }
    const tokens = await rotateRefreshToken(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  }),
);

appRouter.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) await logoutUser(refreshToken);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(204).send();
  }),
);

appRouter.get(
  '/me',
  verifyAccessToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError('user not found', 404);
    res.status(200).json({ success: true, data: user });
  }),
);

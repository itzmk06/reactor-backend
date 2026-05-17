import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../lib/error';
import { Role } from '../generated/prisma/enums';
import { env } from '../lib/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export function verifyAccessToken(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('auth header not found', 401);
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('access token not found', 401);
    }
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      role: Role;
      type: string;
    };
    if (payload.type !== 'access') {
      throw new AppError('invalid token', 401);
    }
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new AppError('token expired', 401));
    }
    if (error instanceof JsonWebTokenError) {
      return next(new AppError('invalid token', 401));
    }
    return next(error);
  }
}

export function verifyRole(...roles: Role[]) {
  return function (req: AuthRequest, _res: Response, next: NextFunction) {
    if (!req?.user) {
      return next(new AppError('unauthenticated', 401));
    }
    if (!roles.includes(req?.user?.role)) {
      return next(new AppError('unauthorized', 403));
    }
    next();
  };
}

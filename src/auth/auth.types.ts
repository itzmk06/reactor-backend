import { Role } from '../generated/prisma/enums';
import { Request } from 'express';
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export interface RefreshTokenPayload {
  sub: string;
  family: string;
  type: 'refresh';
}

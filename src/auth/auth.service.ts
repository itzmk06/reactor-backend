import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/error';
import { env } from '../lib/env';
import { redisPub } from '../lib/redis';
import { hashToken } from '../lib/hash';
import { Role } from '../generated/prisma/enums';
import { RefreshTokenPayload } from './auth.types';

const BCRYPT_ROUNDS = 12;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function registerUser(
  email: string,
  password: string,
  name: string,
  username: string,
) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    },
  });
  if (existing) {
    throw new AppError('user already exists', 409);
  }
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      name: name,
      username: username.toLowerCase(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
    },
  });
  const tokens = await generateTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function loginUser(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    },
  });
  const isPasswordValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(
        password,
        '$2a$12$cGe1rtfllwNqUOwItdhRHet9MvS9FzsGrkio.Ow5PTUqbWYXMt.HO',
      );
  if (!user || !isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }
  const tokens = await generateTokenPair(user.id, user.role);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
    },
    ...tokens,
  };
}

export async function generateTokenPair(userId: string, role: Role, familyId?: string) {
  const family = familyId ?? nanoid();
  const accessToken = jwt.sign(
    {
      sub: userId,
      role: role,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY },
  );
  const refreshToken = jwt.sign(
    {
      sub: userId,
      family: family,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY },
  );
  const hashedRefreshToken = hashToken(refreshToken);
  //   key : family , field : refresh token
  await redisPub.hset(`family:${family}`, hashedRefreshToken, userId);
  await redisPub.expire(`family:${family}`, REFRESH_TTL_SECONDS);

  return { accessToken, refreshToken, family };
}

export async function rotateRefreshToken(oldRefreshToken: string) {
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
  if (payload.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401);
  }
  const { sub: userId, family } = payload;
  const hashedOldRefreshToken = hashToken(oldRefreshToken);
  const storedUserId = await redisPub.hget(`family:${family}`, hashedOldRefreshToken);
  if (!storedUserId) {
    await redisPub.del(`family:${family}`);
    console.warn('Possible refresh token reuse detected - Sessions have been invalidated');
    throw new AppError('Invalid refresh token', 401);
  }
  if (storedUserId !== userId) {
    throw new AppError('Invalid refresh token', 401);
  }
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });
  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }
  await redisPub.hdel(`family:${family}`, hashedOldRefreshToken);
  const tokens = await generateTokenPair(userId, user.role, family);
  return tokens;
}

export async function logoutUser(refreshToken: string) {
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
  if (payload.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401);
  }
  const { family } = payload;
  await redisPub.del(`family:${family}`);
}

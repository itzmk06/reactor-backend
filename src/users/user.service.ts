import { Role } from '../generated/prisma/enums';
import { AppError } from '../lib/error';
import { prisma } from '../lib/prisma';

export async function listUsers(page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            username: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }
    : {};
  const [users, count] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    users,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdIncidents: true,
          assignedIncidents: true,
        },
      },
    },
  });
  if (!user) {
    throw new AppError('user not found', 404);
  }
  return user;
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdIncidents: true,
          assignedIncidents: true,
        },
      },
    },
  });
  if (!user) {
    throw new AppError('user not found', 404);
  }
  return user;
}

export async function updateUserRole(targetUserId: string, newRole: Role) {
  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!user) throw new AppError('user not found', 404);
    if (user.role === newRole) return user;
    if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
      if (adminCount === 1)
        throw new AppError('cannot remove last admin, promote another admin first', 400);
    }
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdIncidents: true,
            assignedIncidents: true,
          },
        },
      },
    });

    return updated;
  });
  return updatedUser;
}

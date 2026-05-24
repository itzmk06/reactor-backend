// src/tests/user.test.ts
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';
import { redisPub, redisSub } from '../lib/redis';
import { env } from '../lib/env';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

async function cleanDatabase() {
  await prisma.incidentEvent.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();
}

async function flushRedisFamilies() {
  const keys = await redisPub.keys('family:*');
  if (keys.length > 0) await redisPub.del(...keys);
}

function generateAccessToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

async function createUser(data: {
  email: string;
  name: string;
  username: string;
  password?: string;
  role?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password || 'Test@1234', 12);
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      username: data.username.toLowerCase(),
      passwordHash: hashedPassword,
      role: (data.role as any) || 'ENGINEER',
    },
    select: { id: true, email: true, name: true, username: true, role: true },
  });
}

// ═══════════════════════════════════════════════════════════════════
//  E2E TESTS
// ═══════════════════════════════════════════════════════════════════

describe('User E2E', () => {
  let adminToken: string;
  let leadToken: string;
  let memberToken: string;
  let adminId: string;
  let leadId: string;
  let memberId: string;

  beforeAll(async () => {
    await cleanDatabase();
    await flushRedisFamilies();

    const admin = await createUser({
      email: 'admin@vector.com',
      name: 'Admin User',
      username: 'admin',
      password: 'Admin@1234',
      role: 'ADMIN',
    });
    adminId = admin.id;
    adminToken = generateAccessToken(admin.id, 'ADMIN');

    const lead = await createUser({
      email: 'lead@vector.com',
      name: 'Lead User',
      username: 'lead',
      password: 'Lead@1234',
      role: 'LEAD',
    });
    leadId = lead.id;
    leadToken = generateAccessToken(lead.id, 'LEAD');

    const member = await createUser({
      email: 'member@vector.com',
      name: 'Member User',
      username: 'member',
      password: 'Member@1234',
      role: 'ENGINEER',
    });
    memberId = member.id;
    memberToken = generateAccessToken(member.id, 'ENGINEER');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  GET /api/v1/users
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('GET /api/v1/users', () => {
    it('lists users with pagination (200)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        totalPages: expect.any(Number),
      });
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users[0]).toHaveProperty('role');
      expect(res.body.data.users[0]).not.toHaveProperty('passwordHash');
    });

    it('supports page and limit query (200)', async () => {
      const res = await request(app)
        .get('/api/v1/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('supports search by name/username/email (200)', async () => {
      const res = await request(app)
        .get('/api/v1/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      expect(
        res.body.data.users.some(
          (u: any) =>
            u.name.includes('Admin') ||
            u.username.includes('admin') ||
            u.email.includes('admin')
        )
      ).toBe(true);
    });

    it('rejects invalid pagination params (422)', async () => {
      const res = await request(app)
        .get('/api/v1/users?page=0&limit=999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422); // Zod validation error
    });

    // NOTE: If GET /users is public (no auth middleware), skip this
    // If it requires auth, uncomment and expect 401
    // it('requires authentication (401)', async () => {
    //   const res = await request(app).get('/api/v1/users');
    //   expect(res.status).toBe(401);
    // });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  GET /api/v1/users/:id
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('GET /api/v1/users/:id', () => {
    it('returns user by ID with incident counts (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(memberId);
      expect(res.body.data).toHaveProperty('_count');
      expect(res.body.data._count).toHaveProperty('createdIncidents');
      expect(res.body.data._count).toHaveProperty('assignedIncidents');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/users/cly3qnx5v0000abcdefgh1234')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('user not found');
    });

    it('rejects invalid ID format (422)', async () => {
      const res = await request(app)
        .get('/api/v1/users/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422); // Zod CUID2 validation
    });

    // NOTE: If GET /users/:id is public, skip this
    // it('requires authentication (401)', async () => {
    //   const res = await request(app).get(`/api/v1/users/${memberId}`);
    //   expect(res.status).toBe(401);
    // });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PATCH /api/v1/users/:id/role
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('PATCH /api/v1/users/:id/role', () => {
    it('admin promotes user to ADMIN (200)', async () => {
      const target = await createUser({
        email: 'promote@vector.com',
        name: 'Promote User',
        username: 'promote',
        role: 'ENGINEER',
      });

      const res = await request(app)
        .patch(`/api/v1/users/${target.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('ADMIN');
      expect(res.body.data).toHaveProperty('_count');

      await prisma.user.delete({ where: { id: target.id } });
    });

    it('admin demotes user to ENGINEER (200)', async () => {
      const target = await createUser({
        email: 'demote@vector.com',
        name: 'Demote User',
        username: 'demote',
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/v1/users/${target.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ENGINEER' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ENGINEER');

      await prisma.user.delete({ where: { id: target.id } });
    });

    it('no-op when role is already same (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ENGINEER' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ENGINEER');
    });

    it('prevents removing last admin (400)', async () => {
      // Ensure only 1 admin exists (the beforeAll admin)
      const allAdmins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const a of allAdmins) {
        if (a.id !== adminId) {
          await prisma.user.delete({ where: { id: a.id } });
        }
      }

      const res = await request(app)
        .patch(`/api/v1/users/${adminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'LEAD' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot remove last admin');
    });

    it('forbids non-admin from changing role (403)', async () => {
      const target = await createUser({
        email: 'forbid@vector.com',
        name: 'Forbid User',
        username: 'forbid',
        role: 'ENGINEER',
      });

      // Use leadToken (LEAD role) - verifyRole('ADMIN') should reject with 403
      const res = await request(app)
        .patch(`/api/v1/users/${target.id}/role`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);

      await prisma.user.delete({ where: { id: target.id } });
    });

    it('rejects invalid role enum (422)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPERADMIN' });

      expect(res.status).toBe(422); // Zod enum validation fails first
    });

    it('rejects extra fields due to strict schema (422)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN', extraField: 'bad' });

      expect(res.status).toBe(422); // Zod strict fails first
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .patch('/api/v1/users/cly3qnx5v0000abcdefgh1234/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ENGINEER' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('user not found');
    });

    it('rejects missing body (422)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(422); // Zod requires role field
    });

    it('requires authentication (401)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${memberId}/role`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(401);
    });
  });
});
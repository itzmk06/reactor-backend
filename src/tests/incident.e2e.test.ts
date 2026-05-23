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

describe('Incident E2E', () => {
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
    memberToken = generateAccessToken(member.id, 'MEMBER');
  });

  afterEach(async () => {
    await prisma.incidentEvent.deleteMany();
    await prisma.incident.deleteMany();
  });

//   afterAll(async () => {
//     await cleanDatabase();
//     await flushRedisFamilies();
//     await prisma.$disconnect();
//     await redisPub.quit();
//     await redisSub.quit();
//   });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  AUTH FLOW (sanity check)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Auth Sanity', () => {
    it('registers a new user (201)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'new@vector.com',
        password: 'New@1234',
        name: 'New User',
        username: 'newuser',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('new@vector.com');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('logs in and returns tokens (200)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'admin',
        password: 'Admin@1234',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('gets current user (200)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(adminId);
    });

    it('rejects invalid token (401)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  INCIDENT CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('POST /api/v1/incidents', () => {
    it('creates incident with real DB (201)', async () => {
      const res = await request(app)
        .post('/api/v1/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Production Server Down',
          description: 'Main API server is not responding to health checks',
          severity: 'P1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Production Server Down');
      expect(res.body.data.severity).toBe('P1');
      expect(res.body.data.creatorId).toBe(adminId);

      // Verify in DB
      const inDb = await prisma.incident.findUnique({
        where: { id: res.body.data.id },
        include: { events: true },
      });
      expect(inDb).not.toBeNull();
      expect(inDb?.events.length).toBeGreaterThan(0);
      expect(inDb?.events[0].type).toBe('STATUS_CHANGE');
    });

    it('rejects invalid severity (400)', async () => {
      const res = await request(app)
        .post('/api/v1/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test',
          description: 'Test description',
          severity: 'INVALID',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('rejects short title (400)', async () => {
      const res = await request(app)
        .post('/api/v1/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'ab',
          description: 'Valid description here',
          severity: 'P1',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('requires authentication (401)', async () => {
      const res = await request(app).post('/api/v1/incidents').send({
        title: 'Test',
        description: 'Test',
        severity: 'P1',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/incidents', () => {
    beforeEach(async () => {
      await prisma.incident.createMany({
        data: [
          {
            title: 'Open Incident',
            description: 'Desc 1',
            severity: 'P1',
            status: 'OPEN',
            creatorId: adminId,
          },
          {
            title: 'Resolved Incident',
            description: 'Desc 2',
            severity: 'P2',
            status: 'RESOLVED',
            creatorId: adminId,
            resolvedAt: new Date(),
          },
          {
            title: 'Another Open',
            description: 'Desc 3',
            severity: 'P3',
            status: 'OPEN',
            creatorId: leadId,
          },
        ],
      });
    });

    it('lists all incidents with pagination (200)', async () => {
      const res = await request(app)
        .get('/api/v1/incidents')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incidents).toHaveLength(3);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.totalPages).toBe(1);
    });

    it('filters by status (200)', async () => {
      const res = await request(app)
        .get('/api/v1/incidents')
        .query({ status: 'OPEN' })
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incidents).toHaveLength(2);
      expect(res.body.data.incidents.every((i: any) => i.status === 'OPEN')).toBe(true);
    });

    it('filters by severity (200)', async () => {
      const res = await request(app)
        .get('/api/v1/incidents')
        .query({ severity: 'P1' })
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incidents).toHaveLength(1);
      expect(res.body.data.incidents[0].severity).toBe('P1');
    });

    it('paginates correctly (200)', async () => {
      const res = await request(app)
        .get('/api/v1/incidents')
        .query({ page: '1', limit: '2' })
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incidents).toHaveLength(2);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('requires authentication (401)', async () => {
      const res = await request(app).get('/api/v1/incidents');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/incidents/:id', () => {
    it('returns incident details with events (200)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test Incident',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
          events: {
            create: {
              userId: adminId,
              type: 'COMMENT',
              content: 'Initial comment',
            },
          },
        },
        include: { events: true },
      });

      const res = await request(app)
        .get(`/api/v1/incidents/${incident.id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(incident.id);
      expect(res.body.data.events).toHaveLength(1);
      expect(res.body.data.creator.id).toBe(adminId);
    });

    it('returns 404 for non-existent incident', async () => {
      const res = await request(app)
        .get('/api/v1/incidents/tz4a98xxat96iws9zmbrgj3a')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(404);
    });

    it('rejects invalid incident ID (400)', async () => {
      const res = await request(app)
        .get('/api/v1/incidents/invalid-id')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /api/v1/incidents/:id/status', () => {
    it('updates status and sets resolvedAt (200)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/incidents/${incident.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');

      const inDb = await prisma.incident.findUnique({
        where: { id: incident.id },
        include: { events: true },
      });
      expect(inDb?.status).toBe('RESOLVED');
      expect(inDb?.resolvedAt).not.toBeNull();
      expect(inDb?.events.some((e) => e.type === 'STATUS_CHANGE')).toBe(true);
    });

    it('clears resolvedAt when reopening (200)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'RESOLVED',
          creatorId: adminId,
          resolvedAt: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/api/v1/incidents/${incident.id}/status`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ status: 'OPEN' });

      expect(res.status).toBe(200);

      const inDb = await prisma.incident.findUnique({
        where: { id: incident.id },
      });
      expect(inDb?.resolvedAt).toBeNull();
    });

    it('forbids MEMBER from updating status (403)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/incidents/${incident.id}/status`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(403);
    });

    it('rejects invalid status (400)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/incidents/${incident.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /api/v1/incidents/:id/severity', () => {
    it('updates severity and creates event (200)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/incidents/${incident.id}/severity`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ severity: 'P3' });

      expect(res.status).toBe(200);
      expect(res.body.data.severity).toBe('P3');

      const inDb = await prisma.incident.findUnique({
        where: { id: incident.id },
        include: { events: true },
      });
      expect(inDb?.severity).toBe('P3');
      expect(inDb?.events.some((e) => e.type === 'SEVERITY_CHANGE')).toBe(true);
    });

    it('forbids MEMBER (403)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/incidents/${incident.id}/severity`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ severity: 'P2' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/incidents/:id/comments', () => {
    it('adds comment and creates event (201)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .post(`/api/v1/incidents/${incident.id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: 'Looking into this issue now' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Looking into this issue now');

      const inDb = await prisma.incidentEvent.findMany({
        where: { incidentId: incident.id, type: 'COMMENT' },
      });
      expect(inDb).toHaveLength(1);
    });

    it('rejects short comment (400)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .post(`/api/v1/incidents/${incident.id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: 'ab' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/incidents/:id/assign', () => {
    it('assigns user and creates event (201)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .post(`/api/v1/incidents/${incident.id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeUserId: memberId });

      expect(res.status).toBe(201);

      const inDb = await prisma.incident.findUnique({
        where: { id: incident.id },
        include: { assignees: true },
      });
      expect(inDb?.assignees).toHaveLength(1);
      expect(inDb?.assignees[0].id).toBe(memberId);
    });

    it('forbids MEMBER (403)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .post(`/api/v1/incidents/${incident.id}/assign`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ assigneeUserId: leadId });

      expect(res.status).toBe(403);
    });

    it('rejects invalid user ID (400)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .post(`/api/v1/incidents/${incident.id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeUserId: 'invalid-id' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/incidents/:id/assign/:userId', () => {
    it('unassigns user and creates event (200)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
          assignees: {
            connect: { id: memberId },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/v1/incidents/${incident.id}/assign/${memberId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);

      const inDb = await prisma.incident.findUnique({
        where: { id: incident.id },
        include: { assignees: true },
      });
      expect(inDb?.assignees).toHaveLength(0);
    });

    it('forbids MEMBER (403)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: 'Test',
          description: 'Test',
          severity: 'P1',
          status: 'OPEN',
          creatorId: adminId,
        },
      });

      const res = await request(app)
        .delete(`/api/v1/incidents/${incident.id}/assign/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  FULL WORKFLOW TEST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Full Incident Workflow', () => {
    it('complete lifecycle: create → comment → assign → resolve', async () => {
      // 1. Create incident
      const createRes = await request(app)
        .post('/api/v1/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Database Connection Pool Exhausted',
          description: 'All connections are in use, new requests failing',
          severity: 'P1',
        });
      expect(createRes.status).toBe(201);
      const incidentId = createRes.body.data.id;

      // 2. Add comment
      const commentRes = await request(app)
        .post(`/api/v1/incidents/${incidentId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: 'Investigating connection leak in auth service' });
      expect(commentRes.status).toBe(201);

      // 3. Assign member
      const assignRes = await request(app)
        .post(`/api/v1/incidents/${incidentId}/assign`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ assigneeUserId: memberId });
      expect(assignRes.status).toBe(201);

      // 4. Resolve
      const resolveRes = await request(app)
        .patch(`/api/v1/incidents/${incidentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });
      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('RESOLVED');

      // 5. Verify final state in DB
      const final = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: { events: true, assignees: true },
      });

      expect(final?.status).toBe('RESOLVED');
      expect(final?.resolvedAt).not.toBeNull();
      expect(final?.assignees).toHaveLength(1);
      expect(final?.events.length).toBeGreaterThanOrEqual(3); // create + comment + assign + status
    });
  });
});
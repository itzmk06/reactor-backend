import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { incidentRouter } from '../incidents/incident.router';
import * as incidentService from '../incidents/incident.service';
import { prisma } from '../lib/prisma';
import { redisPub } from '../lib/redis';
import { Severity, IncidentStatus } from '../generated/prisma/enums';

// ═══════════════════════════════════════════════════════════════════
//  MOCKS
// ═══════════════════════════════════════════════════════════════════
jest.mock('../lib/validate', () => ({
  validate: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../auth/auth.middleware', () => ({
  verifyAccessToken: jest.fn((req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
      id: 'usradm98xxat96iws9zmbrg1',
      name: 'Test User',
      username: 'testuser',
      role: 'ADMIN',
    };
    next();
  }),
  verifyRole: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

const mockTx = {
  incident: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  incidentEvent: { create: jest.fn() },
  user: { findUnique: jest.fn() },
};

jest.mock('../lib/prisma', () => ({
  prisma: {
    incident: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    incidentEvent: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../lib/redis', () => ({
  redisPub: { publish: jest.fn().mockResolvedValue(undefined) },
}));

// ═══════════════════════════════════════════════════════════════════
//  TEST APP + ERROR HANDLER (so we see real errors in tests)
// ═══════════════════════════════════════════════════════════════════

const app = express();
app.use(express.json());
app.use('/incidents', incidentRouter);

// Catch-all error handler — exposes error details during testing
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ═══════════════════════════════════════════════════════════════════
//  TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Incident Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    (prisma.$transaction as jest.Mock).mockImplementation((arg: any) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg(mockTx);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ROUTE TESTS (Supertest)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Routes', () => {
    const INC_ID = 'tz4a98xxat96iws9zmbrgj3a';
    const USER_ID = 'usrb98xxat96iws9zmbrgj3e';

    describe('GET /incidents', () => {
      it('should list incidents with query filters (200)', async () => {
        const mockResult = {
          incidents: [{ id: INC_ID, title: 'Server Down', status: 'OPEN' }],
          total: 1,
          page: 1,
          totalPages: 1,
        };
        jest.spyOn(incidentService, 'listIncidents').mockResolvedValue(mockResult as any);

        const res = await request(app)
          .get('/incidents')
          .query({ status: 'OPEN', severity: 'P1', page: '1', limit: '10' });

        // Debug: if not 200, print body so we know what failed
        if (res.status !== 200) {
          console.log('GET /incidents (with query) failed:', res.status, res.body);
        }

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockResult);
      });

      it('should use defaults when no query provided (200)', async () => {
        const mockResult = { incidents: [], total: 0, page: 1, totalPages: 0 };
        jest.spyOn(incidentService, 'listIncidents').mockResolvedValue(mockResult as any);

        const res = await request(app).get('/incidents');

        if (res.status !== 200) {
          console.log('GET /incidents (no query) failed:', res.status, res.body);
        }

        expect(res.status).toBe(200);
      });
    });

    describe('GET /incidents/:id', () => {
      it('should return incident details (200)', async () => {
        const mockIncident = {
          id: INC_ID,
          title: 'Test',
          creator: { id: USER_ID, name: 'Alice', username: 'alice' },
          events: [],
        };
        jest.spyOn(incidentService, 'getIncident').mockResolvedValue(mockIncident as any);

        const res = await request(app).get(`/incidents/${INC_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual(mockIncident);
      });
    });

    describe('POST /incidents', () => {
      it('should create incident (201)', async () => {
        const mockIncident = {
          id: 'kb4a98xxat96iws9zmbrgj3b',
          title: 'New Incident',
          severity: 'P1',
        };
        jest.spyOn(incidentService, 'createIncident').mockResolvedValue(mockIncident as any);

        const res = await request(app).post('/incidents').send({
          title: 'New Incident',
          description: 'Something is broken',
          severity: 'P1',
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Incident created');
      });
    });

    describe('PATCH /incidents/:id/status', () => {
      it('should update status (200)', async () => {
        const mockUpdated = { id: INC_ID, status: 'RESOLVED' };
        jest.spyOn(incidentService, 'updateStatus').mockResolvedValue(mockUpdated as any);

        const res = await request(app)
          .patch(`/incidents/${INC_ID}/status`)
          .send({ status: 'RESOLVED' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Incident status updated');
      });
    });

    describe('PATCH /incidents/:id/severity', () => {
      it('should update severity (200)', async () => {
        const mockUpdated = { id: INC_ID, severity: 'P2' };
        jest.spyOn(incidentService, 'updateSeverity').mockResolvedValue(mockUpdated as any);

        const res = await request(app)
          .patch(`/incidents/${INC_ID}/severity`)
          .send({ severity: 'P2' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Incident severity updated');
      });
    });

    describe('POST /incidents/:id/comments', () => {
      it('should add comment (201)', async () => {
        const mockComment = { id: 'evt98xxat96iws9zmbrgj3c', content: 'Looking into this' };
        jest.spyOn(incidentService, 'addComment').mockResolvedValue(mockComment as any);

        const res = await request(app)
          .post(`/incidents/${INC_ID}/comments`)
          .send({ content: 'Looking into this' });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Comment added');
      });
    });

    describe('POST /incidents/:id/assign', () => {
      it('should assign user (201)', async () => {
        const mockResult = { id: INC_ID, assignees: [{ id: USER_ID }] };
        jest.spyOn(incidentService, 'assignUser').mockResolvedValue(mockResult as any);

        const res = await request(app)
          .post(`/incidents/${INC_ID}/assign`)
          .send({ assigneeUserId: USER_ID });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User assigned');
      });
    });

    describe('DELETE /incidents/:id/assign/:userId', () => {
      it('should unassign user (200)', async () => {
        const mockResult = { id: INC_ID, assignees: [] };
        jest.spyOn(incidentService, 'unassignUser').mockResolvedValue(mockResult as any);

        const res = await request(app).delete(`/incidents/${INC_ID}/assign/${USER_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User unassigned');
      });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SERVICE TESTS (Unit)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Service', () => {
    describe('listIncidents', () => {
      it('returns paginated incidents with defaults', async () => {
        const incidents = [{ id: '1', title: 'Test' }];
        const total = 5;
        (prisma.$transaction as jest.Mock).mockResolvedValueOnce([incidents, total]);

        const result = await incidentService.listIncidents({});
        expect(result).toMatchObject({ incidents, total, page: 1, totalPages: 1 });
      });

      it('applies filters and custom pagination', async () => {
        const incidents = [{ id: '1', title: 'Filtered' }];
        (prisma.$transaction as jest.Mock).mockResolvedValueOnce([incidents, 1]);

        const result = await incidentService.listIncidents({
          status: 'OPEN',
          severity: 'P1' as Severity,
          page: 2,
          limit: 5,
        });
        expect(result.page).toBe(2);
        expect(result.totalPages).toBe(1);
      });
    });

    describe('getIncident', () => {
      it('returns incident when found', async () => {
        const mockIncident = { id: '1', title: 'Test', creator: {}, assignees: [], events: [] };
        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(mockIncident);

        const result = await incidentService.getIncident('1');
        expect(result).toEqual(mockIncident);
      });

      it('throws 404 when not found', async () => {
        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(null);
        await expect(incidentService.getIncident('1')).rejects.toThrow('incident not found');
      });
    });

    describe('createIncident', () => {
      it('creates incident, event, and publishes', async () => {
        const mockIncident = { id: 'new-1', title: 'Test', severity: 'P1', creatorId: 'user-1' };
        mockTx.incident.create.mockResolvedValueOnce(mockIncident);
        mockTx.incidentEvent.create.mockResolvedValueOnce({});

        const result = await incidentService.createIncident(
          { title: 'Test', description: 'Desc', severity: 'P1' as Severity },
          'user-1',
        );

        expect(mockTx.incident.create).toHaveBeenCalled();
        expect(mockTx.incidentEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'STATUS_CHANGE',
              content: 'Incident created',
              metadata: { severity: 'P1', status: 'OPEN' },
            }),
          }),
        );
        expect(redisPub.publish).toHaveBeenCalled();
        expect(result).toEqual(mockIncident);
      });
    });

    describe('updateStatus', () => {
      it('updates status, sets resolvedAt, creates event, publishes', async () => {
        const existing = { id: '1', status: 'OPEN', severity: 'P1' };
        const updated = {
          id: '1',
          status: 'RESOLVED',
          resolvedAt: new Date(),
          updatedAt: new Date(),
        };

        mockTx.incident.findUnique.mockResolvedValueOnce(existing);
        mockTx.incident.update.mockResolvedValueOnce(updated);

        const result = await incidentService.updateStatus(
          '1',
          'RESOLVED' as IncidentStatus,
          'user-1',
        );

        expect(mockTx.incident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: 'RESOLVED', resolvedAt: expect.any(Date) }),
          }),
        );
        expect(redisPub.publish).toHaveBeenCalled();
        expect(result).toEqual(updated);
      });

      it('clears resolvedAt when status is not RESOLVED', async () => {
        const existing = { id: '1', status: 'RESOLVED', severity: 'P1' };
        const updated = { id: '1', status: 'OPEN', resolvedAt: null };

        mockTx.incident.findUnique.mockResolvedValueOnce(existing);
        mockTx.incident.update.mockResolvedValueOnce(updated);

        await incidentService.updateStatus('1', 'OPEN' as IncidentStatus, 'user-1');
        expect(mockTx.incident.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { status: 'OPEN', resolvedAt: null } }),
        );
      });

      it('throws 404 if incident not found', async () => {
        mockTx.incident.findUnique.mockResolvedValueOnce(null);
        await expect(
          incidentService.updateStatus('1', 'RESOLVED' as IncidentStatus, 'user-1'),
        ).rejects.toThrow('incident not found');
      });
    });

    describe('updateSeverity', () => {
      it('updates severity, creates event, publishes', async () => {
        const existing = { id: '1', status: 'OPEN', severity: 'P1' };
        const updated = { id: '1', severity: 'P2', updatedAt: new Date() };

        mockTx.incident.findUnique.mockResolvedValueOnce(existing);
        mockTx.incident.update.mockResolvedValueOnce(updated);

        const result = await incidentService.updateSeverity('1', 'P2' as Severity, 'user-1');
        expect(mockTx.incidentEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'SEVERITY_CHANGE',
              content: 'Severity changed from P1 to P2',
            }),
          }),
        );
        expect(result).toEqual(updated);
      });

      it('throws 404 if incident not found', async () => {
        mockTx.incident.findUnique.mockResolvedValueOnce(null);
        await expect(
          incidentService.updateSeverity('1', 'P2' as Severity, 'user-1'),
        ).rejects.toThrow('incident not found');
      });
    });

    describe('addComment', () => {
      it('adds comment and publishes', async () => {
        const mockComment = { id: 'evt-1', content: 'Note', user: {} };
        mockTx.incident.findUnique.mockResolvedValueOnce({ id: '1' });
        mockTx.incidentEvent.create.mockResolvedValueOnce(mockComment);

        const result = await incidentService.addComment('1', 'Note', 'user-1');
        expect(result).toEqual(mockComment);
        expect(redisPub.publish).toHaveBeenCalled();
      });

      it('throws 404 if incident not found', async () => {
        mockTx.incident.findUnique.mockResolvedValueOnce(null);
        await expect(incidentService.addComment('1', 'Note', 'user-1')).rejects.toThrow(
          'incident not found',
        );
      });
    });

    describe('assignUser', () => {
      it('assigns user, creates event, publishes', async () => {
        const mockIncident = { id: '1' };
        const mockUser = { id: 'user-2', username: 'john' };
        const mockUpdated = { id: '1', assignees: [mockUser] };

        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(mockIncident);
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
        mockTx.incident.update.mockResolvedValueOnce(mockUpdated);

        const result = await incidentService.assignUser('1', 'user-2', 'user-1');
        expect(mockTx.incident.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { assignees: { connect: { id: 'user-2' } } } }),
        );
        expect(result).toEqual(mockUpdated);
      });

      it('throws if incident not found', async () => {
        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(null);
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({} as any);
        await expect(incidentService.assignUser('1', 'user-2', 'user-1')).rejects.toThrow(
          'incident not found',
        );
      });

      it('throws if target user not found', async () => {
        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce({ id: '1' } as any);
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
        await expect(incidentService.assignUser('1', 'user-2', 'user-1')).rejects.toThrow(
          'assign user not found',
        );
      });
    });

    describe('unassignUser', () => {
      it('unassigns user, creates event, publishes', async () => {
        const mockIncident = { id: '1' };
        const mockUser = { id: 'user-2', username: 'john' };
        const mockUpdated = { id: '1', assignees: [] };

        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(mockIncident);
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
        mockTx.incident.update.mockResolvedValueOnce(mockUpdated);

        const result = await incidentService.unassignUser('1', 'user-2', 'user-1');
        expect(mockTx.incident.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { assignees: { disconnect: { id: 'user-2' } } } }),
        );
        expect(result).toEqual(mockUpdated);
      });

      it('throws if incident not found', async () => {
        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(null);
        await expect(incidentService.unassignUser('1', 'user-2', 'user-1')).rejects.toThrow(
          'incident not found',
        );
      });

      it('throws if target user not found', async () => {
        (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce({ id: '1' } as any);
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
        await expect(incidentService.unassignUser('1', 'user-2', 'user-1')).rejects.toThrow(
          'assign user not found',
        );
      });
    });
  });
});

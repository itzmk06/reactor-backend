import { AuthRequest } from './../auth/auth.types';
import { Response, Router } from 'express';
import { verifyAccessToken, verifyRole } from '../auth/auth.middleware';
import { validate } from '../lib/validate';
import {
  addCommentSchema,
  assignUserSchema,
  createIncidentSchema,
  incidentIdParamSchema,
  listIncidentQuerySchema,
  unAssignSchema,
  updateSeveritySchema,
  updateStatusSchema,
} from './incident.schema';
import { asyncHandler } from '../lib/asyncHandler';
import { IncidentStatus, Severity } from '../generated/prisma/enums';
import {
  addComment,
  assignUser,
  createIncident,
  getIncident,
  listIncidents,
  unassignUser,
  updateSeverity,
  updateStatus,
} from './incident.service';

export const incidentRouter = Router();
incidentRouter.use(verifyAccessToken);

incidentRouter.get(
  '/',
  validate(listIncidentQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, severity, page, limit } = req.query as {
      status?: IncidentStatus;
      severity?: Severity;
      page?: number;
      limit?: number;
    };
    const result = await listIncidents({ status, severity, page, limit });
    return res.status(200).json({
      success: true,
      data: result,
    });
  }),
);

incidentRouter.get(
  '/:id',
  validate(incidentIdParamSchema, 'params'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const incident = await getIncident(req.params.id as string);
    return res.status(200).json({
      success: true,
      data: incident,
    });
  }),
);

incidentRouter.post(
  '/',
  validate(createIncidentSchema, 'body'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const incident = await createIncident(req.body, req.user!.id);
    return res.status(201).json({
      success: true,
      message: 'Incident created',
      data: incident,
    });
  }),
);

incidentRouter.patch(
  '/:id/status',
  verifyRole('ADMIN', 'LEAD'),
  validate(incidentIdParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const incident = await updateStatus(req.params.id as string, req.body.status, req.user!.id);
    return res.status(200).json({
      success: true,
      message: 'Incident status updated',
      data: incident,
    });
  }),
);

incidentRouter.patch(
  '/:id/severity',
  verifyRole('ADMIN', 'LEAD'),
  validate(incidentIdParamSchema, 'params'),
  validate(updateSeveritySchema, 'body'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const incident = await updateSeverity(req.params.id as string, req.body.severity, req.user!.id);
    return res.status(200).json({
      success: true,
      message: 'Incident severity updated',
      data: incident,
    });
  }),
);

incidentRouter.post(
  '/:id/comments',
  validate(incidentIdParamSchema, 'params'),
  validate(addCommentSchema, 'body'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const event = await addComment(req.params.id as string, req.body.content, req.user!.id);
    return res.status(201).json({
      success: true,
      message: 'Comment added',
      data: event,
    });
  }),
);

incidentRouter.post(
  '/:id/assign',
  verifyRole('ADMIN', 'LEAD'),
  validate(incidentIdParamSchema, 'params'),
  validate(assignUserSchema, 'body'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const event = await assignUser(req.params.id as string, req.body.assigneeUserId, req.user!.id);
    return res.status(201).json({
      success: true,
      message: 'User assigned',
      data: event,
    });
  }),
);

incidentRouter.delete(
  '/:id/assign/:userId',
  verifyRole('ADMIN', 'LEAD'),
  validate(unAssignSchema, 'params'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const event = await unassignUser(
      req.params.id as string,
      req.params.userId as string,
      req.user!.id,
    );
    return res.status(200).json({
      success: true,
      message: 'User unassigned',
      data: event,
    });
  }),
);

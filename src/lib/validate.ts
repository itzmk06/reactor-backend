import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { AppError } from './error';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodType, target: ValidationTarget) {
  return function (req: Request, _res: Response, next: NextFunction) {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(new AppError('Invalid request', 422));
    }

    if (target === 'query') {
      Object.assign(req.query, result.data);
    } else {
      req[target] = result.data;
    }

    next();
  };
}

import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { AppError } from './error';

export function validate(schema: ZodType) {
  return function (req: Request, _res: Response, next: NextFunction) {
    const result=schema.safeParse(req.body); 
    if (!result.success) {
        return next(new AppError("Invalid request", 422));
    }
    req.body=result.data; 
    next(); 
  };
}

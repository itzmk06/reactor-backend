import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { authRouter } from './auth/auth.router';
import { incidentRouter } from './incidents/incident.router';
import { globalErrorHandler } from './lib/error.middleware';
import { userRouter } from './users/user.router';
export const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// 3. Body parsing
app.use(express.json());
app.use(cookieParser());

// 4. Rate limiting
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// 5. Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/incidents',incidentRouter)
app.use('/api/v1/users',userRouter)
// 6. Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 7. Error handler — LAST, ALWAYS
app.use(globalErrorHandler);

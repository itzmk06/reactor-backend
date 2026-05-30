import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  CLIENT_URL: z.url(),
  SERVER_URL: z.url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(6060),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GMAIL_USER: z.email().min(1),
  GMAIL_APP_PASSWORD: z.string().min(1),
  EMAIL_FROM: z.email().min(1),
  APP_NAME: z.string().min(1),
});

export const env = envSchema.parse(process.env);

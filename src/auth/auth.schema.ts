// schema for register
import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Min 8 chars required')
      .max(72, 'Max 72 chars are allowed')
      .regex(/[a-z]/, 'Must contain a lowercase character')
      .regex(/[A-Z]/, 'Must contain a uppercase character')
      .regex(/[0-9]/, 'Must contain a digit')
      .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
    name: z
      .string()
      .trim()
      .min(3, 'Min 3 chars required')
      .max(100, 'Max 100 chars are allowed'),
    username: z
      .string()
      .trim()
      .min(3, 'Min 3 chars required')
      .max(30, 'Max 30 chars are allowed')
      .regex(/^[a-z0-9._]+$/,'Username can contain only . _  a-z 0-9')
      .toLowerCase(),
  })
  .strict();

// schema for login
export const loginSchema = z
  .object({
    identifier:z.string().trim().min(1,"email or username required"),
    password: z.string().min(1, 'password required'),
  })
  .strict();

// types for them
export type LoginType = z.infer<typeof loginSchema>;
export type RegisterType = z.infer<typeof registerSchema>;

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:4000'),
  RING_API_BASE_URL: z.string().default('https://api.amazonvision.com'),
  RING_PARTNER_CLIENT_ID: z.string().default('mock-client-id'),
  RING_PARTNER_CLIENT_SECRET: z.string().default('mock-client-secret'),
  RING_WEBHOOK_SECRET: z.string().default('clearsight_hmac_secret_test_key_99214'),
  GEMINI_API_KEY: z.string().optional().default(''),
});

export const config = envSchema.parse(process.env);

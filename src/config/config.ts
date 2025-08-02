import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Rate limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().default('15m'),

  // External APIs
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(env.error.format());
  process.exit(1);
}

export const config = {
  NODE_ENV: env.data!.NODE_ENV,
  PORT: env.data!.PORT,
  HOST: env.data!.HOST,
  LOG_LEVEL: env.data!.LOG_LEVEL,

  DATABASE_URL: env.data!.DATABASE_URL,

  JWT_SECRET: env.data!.JWT_SECRET,
  JWT_EXPIRES_IN: env.data!.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: env.data!.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: env.data!.JWT_REFRESH_EXPIRES_IN,

  RATE_LIMIT_MAX: env.data!.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW: env.data!.RATE_LIMIT_WINDOW,

  STRIPE_SECRET_KEY: env.data!.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: env.data!.STRIPE_WEBHOOK_SECRET,

  ENCRYPTION_KEY: env.data!.ENCRYPTION_KEY,
  CORS_ORIGIN: env.data!.CORS_ORIGIN,
};

// Type for configuration
export type Config = typeof config;
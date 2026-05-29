import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5050),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/loan_tracker"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  CORS_ORIGIN: z.string().default("*"),
  REDIS_ENABLED: z.coerce.boolean().default(true),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_CACHE_DB: z.coerce.number().int().min(0).default(0),
  REDIS_QUEUE_DB: z.coerce.number().int().min(0).default(1),
  QUEUE_WORKERS_ENABLED: z.coerce.boolean().default(false),
  LOG_LEVEL: z.string().default("info"),
  UPLOAD_DIR: z.string().default("uploads"),
  PUBLIC_BASE_URL: z.string().optional(),
  MAX_PROOF_FILE_SIZE_MB: z.coerce.number().positive().default(5),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("Loan Tracker <no-reply@loantracker.local>"),
  PUBLIC_WEBSITE_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

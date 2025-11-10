import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const configSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  S3_BUCKET: z.string().min(3)
});

export type AppConfig = z.infer<typeof configSchema>;

export const getConfig = (): AppConfig => {
  const parsed = configSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Configuration validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
};

import { z } from 'zod';

export const participantSchema = z.object({
  externalId: z.string().min(1),
  attributes: z.record(z.string()).default({})
});

export const joinSessionRequestSchema = z.object({
  projectId: z.string().uuid(),
  participant: participantSchema,
  locale: z.string().default('en-US')
});

export const sessionTokenSchema = z.object({
  sessionId: z.string().uuid(),
  token: z.string().min(1),
  expiresAt: z.string()
});

export type JoinSessionRequest = z.infer<typeof joinSessionRequestSchema>;

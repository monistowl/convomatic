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

export const sessionStateSchema = z.enum(['waiting', 'active', 'closed']);

export const sessionSummarySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  projectName: z.string().min(1),
  state: sessionStateSchema,
  participantCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable()
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  senderType: z.enum(['participant', 'system']),
  senderId: z.string().optional(),
  text: z.string().optional(),
  deliveredAt: z.string()
});

export const transcriptSchema = z.object({
  session: sessionSummarySchema,
  messages: z.array(messageSchema)
});

export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export type MessageEntry = z.infer<typeof messageSchema>;
export type Transcript = z.infer<typeof transcriptSchema>;

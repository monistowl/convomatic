import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { joinSessionRequestSchema } from '@convomatic/shared';
import { toMessageDTO, toSessionSummaryDTO } from '../utils/serializers.js';

const sessionParamsSchema = z.object({
  id: z.string().uuid()
});

export const registerSessionRoutes = (app: FastifyInstance) => {
  app.get('/api/sessions', async () => {
    const sessions = await app.prisma.chatSession.findMany({
      include: { project: true, participants: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return sessions.map(toSessionSummaryDTO);
  });

  app.get('/api/sessions/:id/messages', async (request) => {
    const { id } = sessionParamsSchema.parse(request.params);

    const session = await app.prisma.chatSession.findUnique({
      where: { id },
      include: { project: true, participants: true }
    });

    if (!session) {
      throw app.httpErrors.notFound('Session not found');
    }

    const messages = await app.prisma.message.findMany({
      where: { sessionId: id },
      orderBy: { deliveredAt: 'asc' }
    });

    return {
      session: toSessionSummaryDTO(session),
      messages: messages.map(toMessageDTO)
    };
  });

  app.post('/api/sessions/join', async (request, reply) => {
    const payload = joinSessionRequestSchema.parse(request.body);
    try {
      const result = await app.matchmaker.join(payload);

      if (result.status === 'queued') {
        reply.code(202);
        return {
          status: 'queued',
          projectId: result.projectId,
          participantId: result.participantId,
          position: result.position
        };
      }

      const token = await app.jwt.sign({
        sessionId: result.sessionId,
        participantId: result.participantId
      });

      return {
        status: 'matched',
        projectId: result.projectId,
        sessionId: result.sessionId,
        participantId: result.participantId,
        token,
        participantIds: result.participantIds
      };
    } catch (error) {
      request.log.error({ err: error }, 'failed to join session');
      throw app.httpErrors.badRequest((error as Error).message);
    }
  });
};

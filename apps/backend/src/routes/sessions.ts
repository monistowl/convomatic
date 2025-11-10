import { FastifyInstance } from 'fastify';
import { joinSessionRequestSchema } from '@convomatic/shared';

export const registerSessionRoutes = (app: FastifyInstance) => {
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

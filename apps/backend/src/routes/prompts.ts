import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { toPromptDTO } from '../utils/serializers.js';

const paramsSchema = z.object({
  projectId: z.string().uuid()
});

export const registerPromptRoutes = (app: FastifyInstance) => {
  app.get('/api/projects/:projectId/prompts', async (request) => {
    const { projectId } = paramsSchema.parse(request.params);
    const prompts = await app.prisma.prompt.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    });

    return prompts.map(toPromptDTO);
  });
};

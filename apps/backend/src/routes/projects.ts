import { FastifyInstance } from 'fastify';
import { createProjectSchema, updateProjectSchema } from '@convomatic/shared';
import { z } from 'zod';
import { toProjectDTO } from '../utils/serializers.js';

const paramsSchema = z.object({
  id: z.string().uuid()
});

const toPrismaPrompt = (prompt: { order: number; body: string; delaySeconds: number; assetUrl?: string; assetType?: string }) => ({
  order: prompt.order,
  body: prompt.body,
  delaySeconds: prompt.delaySeconds,
  assetUrl: prompt.assetUrl,
  assetType: (prompt.assetType ?? 'none').toUpperCase()
});

export const registerProjectRoutes = (app: FastifyInstance) => {
  app.get('/api/projects', async () => {
    const projects = await app.prisma.project.findMany({
      include: { prompts: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });

    return projects.map(toProjectDTO);
  });

  app.get('/api/projects/:id', async (request) => {
    const { id } = paramsSchema.parse(request.params);
    const project = await app.prisma.project.findUnique({
      where: { id },
      include: { prompts: { orderBy: { order: 'asc' } } }
    });

    if (!project) {
      throw app.httpErrors.notFound('Project not found');
    }

    return toProjectDTO(project);
  });

  app.post('/api/projects', async (request, reply) => {
    const payload = createProjectSchema.parse(request.body);

    const project = await app.prisma.project.create({
      data: {
        name: payload.name,
        quorum: payload.quorum,
        welcomeCopy: payload.welcomeCopy,
        farewellCopy: payload.farewellCopy,
        status: payload.status.toUpperCase(),
        prompts: {
          create: payload.prompts.map(toPrismaPrompt)
        }
      },
      include: { prompts: { orderBy: { order: 'asc' } } }
    });

    reply.code(201);
    return toProjectDTO(project);
  });

  app.put('/api/projects/:id', async (request) => {
    const { id } = paramsSchema.parse(request.params);
    const payload = updateProjectSchema.parse(request.body);

    const project = await app.prisma.project.update({
      where: { id },
      data: {
        name: payload.name,
        quorum: payload.quorum,
        welcomeCopy: payload.welcomeCopy,
        farewellCopy: payload.farewellCopy,
        status: payload.status.toUpperCase(),
        prompts: {
          deleteMany: {},
          create: payload.prompts.map(toPrismaPrompt)
        }
      },
      include: { prompts: { orderBy: { order: 'asc' } } }
    });

    return toProjectDTO(project);
  });
};

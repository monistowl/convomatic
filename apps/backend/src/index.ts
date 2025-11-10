import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getConfig } from './config.js';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerSessionRoutes } from './routes/sessions.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerRealtimeGateway } from './routes/realtime.js';
import { registerPromptRoutes } from './routes/prompts.js';
import { createMatchmaker } from './services/matchmaker.js';

const config = getConfig();

async function buildServer() {
  const app = Fastify({
    logger: {
      level: 'info'
    }
  }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet);
  await app.register(websocket);
  await app.register(jwt, { secret: config.JWT_SECRET });
  await app.register(prismaPlugin);
  await app.register(redisPlugin, { url: config.REDIS_URL });

  const matchmaker = createMatchmaker({
    redis: app.redis,
    logger: app.log,
    prisma: app.prisma
  });

  app.decorate('matchmaker', matchmaker);

  registerHealthRoutes(app);
  registerProjectRoutes(app);
  registerPromptRoutes(app);
  registerSessionRoutes(app);
  registerRealtimeGateway(app);

  return app;
}

const start = async () => {
  const app = await buildServer();
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
};

start().catch((error) => {
  console.error('Failed to start Convomatic backend', error);
  process.exit(1);
});

export type AppServer = Awaited<ReturnType<typeof buildServer>>;

import 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { RedisClient } from './plugins/redis.js';
import type { Matchmaker } from './services/matchmaker.js';
import type { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: RedisClient;
    matchmaker: Matchmaker;
    jwt: JWT;
  }
}

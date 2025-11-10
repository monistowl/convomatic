import fp from 'fastify-plugin';
import IORedis, { Redis } from 'ioredis';

export interface RedisPluginOptions {
  url: string;
}

export const redisPlugin = fp<RedisPluginOptions>(async (fastify, opts) => {
  const redis = new IORedis(opts.url);

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});

export type RedisClient = Redis;

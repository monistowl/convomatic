import type { FastifyBaseLogger } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { RedisClient } from '../plugins/redis.js';
import type { JoinSessionRequest } from '@convomatic/shared';

interface MatchmakerOptions {
  redis: RedisClient;
  prisma: PrismaClient;
  logger: FastifyBaseLogger;
  queueTtlSeconds?: number;
}

interface QueueEntry {
  participantId: string;
  locale: string;
  enqueuedAt: string;
}

export type MatchResult =
  | {
      status: 'queued';
      projectId: string;
      position: number;
      participantId: string;
    }
  | {
      status: 'matched';
      projectId: string;
      sessionId: string;
      participantIds: string[];
      participantId: string;
    };

export class Matchmaker {
  private readonly redis: RedisClient;
  private readonly prisma: PrismaClient;
  private readonly logger: FastifyBaseLogger;
  private readonly queueTtlSeconds: number;

  constructor(options: MatchmakerOptions) {
    this.redis = options.redis;
    this.prisma = options.prisma;
    this.logger = options.logger;
    this.queueTtlSeconds = options.queueTtlSeconds ?? 900;
  }

  async join(request: JoinSessionRequest): Promise<MatchResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: request.projectId },
      include: { prompts: { orderBy: { order: 'asc' } } }
    });

    if (!project) {
      throw new Error(`Project ${request.projectId} not found`);
    }

    if (project.status !== 'ACTIVE') {
      throw new Error('Project is not accepting participants');
    }

    const participant = await this.prisma.participant.create({
      data: {
        externalId: request.participant.externalId,
        attributes: request.participant.attributes ?? {}
      }
    });

    const queueKey = this.queueKeyForProject(project.id);
    const entry: QueueEntry = {
      participantId: participant.id,
      locale: request.locale,
      enqueuedAt: new Date().toISOString()
    };

    const execResult = await this.redis
      .multi()
      .rpush(queueKey, JSON.stringify(entry))
      .expire(queueKey, this.queueTtlSeconds)
      .llen(queueKey)
      .exec();

    if (!execResult) {
      throw new Error('Redis queue operation failed');
    }

    const queueLength = Number(execResult[2][1]);

    if (queueLength < project.quorum) {
      this.logger.info({ projectId: project.id, queueLength }, 'participant queued');
      return { status: 'queued', projectId: project.id, position: queueLength, participantId: participant.id };
    }

    const pops = this.redis.multi();
    for (let i = 0; i < project.quorum; i += 1) {
      pops.lpop(queueKey);
    }

    const popResults = await pops.exec();
    if (!popResults) {
      throw new Error('Failed to pop participants from queue');
    }

    const matchedEntries = popResults
      .map(([, raw]) => (typeof raw === 'string' ? this.safeParseEntry(raw) : null))
      .filter((value): value is QueueEntry => Boolean(value));

    const participantIds = matchedEntries.map((item) => item.participantId);

    if (participantIds.length < project.quorum) {
      this.logger.error(
        { projectId: project.id, participantIds },
        'insufficient participants popped from queue'
      );
      throw new Error('Unable to form chat session with available participants');
    }

    const session = await this.prisma.$transaction(async (tx) => {
      const chatSession = await tx.chatSession.create({
        data: {
          projectId: project.id,
          state: 'ACTIVE',
          startedAt: new Date()
        }
      });

      await Promise.all(
        participantIds.map((pid, index) =>
          tx.sessionParticipant.create({
            data: {
              sessionId: chatSession.id,
              participantId: pid,
              role: `participant-${index + 1}`
            }
          })
        )
      );

      await tx.promptEvent.createMany({
        data: project.prompts.map((prompt) => ({
          sessionId: chatSession.id,
          promptId: prompt.id,
          emittedAt: chatSession.startedAt ?? new Date()
        }))
      });

      return chatSession;
    });

    this.logger.info({ projectId: project.id, sessionId: session.id }, 'chat session created');

    return {
      status: 'matched',
      projectId: project.id,
      sessionId: session.id,
      participantIds,
      participantId: participant.id
    };
  }

  private queueKeyForProject(projectId: string) {
    return `projects:${projectId}:queue`;
  }

  private safeParseEntry(raw: string): QueueEntry | null {
    try {
      return JSON.parse(raw) as QueueEntry;
    } catch (error) {
      this.logger.error({ error }, 'Failed to parse queue entry');
      return null;
    }
  }
}

export const createMatchmaker = (options: MatchmakerOptions) => new Matchmaker(options);

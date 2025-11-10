import { describe, expect, it } from 'vitest';
import { Matchmaker } from '../src/services/matchmaker.js';
import type { JoinSessionRequest } from '@convomatic/shared';

const logger = {
  info: () => {},
  error: () => {},
  warn: () => {}
} as const;

describe('Matchmaker', () => {
  it('throws when project is missing', async () => {
    const request: JoinSessionRequest = {
      projectId: '00000000-0000-0000-0000-000000000000',
      locale: 'en-US',
      participant: {
        externalId: 'test-user',
        attributes: {}
      }
    };

    const matchmaker = new Matchmaker({
      prisma: {
        project: { findUnique: async () => null }
      } as any,
      redis: {} as any,
      logger
    });

    await expect(matchmaker.join(request)).rejects.toThrow('Project 00000000-0000-0000-0000-000000000000 not found');
  });
});

import type { ChatSession, Message, Project, Prompt, SessionParticipant } from '@prisma/client';

export interface PromptDTO {
  id: string;
  order: number;
  body: string;
  delaySeconds: number;
  assetUrl?: string;
  assetType: 'none' | 'image' | 'audio' | 'video';
}

export interface ProjectDTO {
  id: string;
  name: string;
  quorum: number;
  welcomeCopy: string;
  farewellCopy: string;
  status: 'draft' | 'active' | 'archived';
  prompts: PromptDTO[];
}

export interface SessionSummaryDTO {
  id: string;
  projectId: string;
  projectName: string;
  state: 'waiting' | 'active' | 'closed';
  participantCount: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface MessageDTO {
  id: string;
  sessionId: string;
  senderType: 'participant' | 'system';
  senderId?: string;
  text?: string;
  deliveredAt: string;
}

const assetTypeMap: Record<string, PromptDTO['assetType']> = {
  NONE: 'none',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video'
};

const statusMap: Record<string, ProjectDTO['status']> = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

const sessionStateMap: Record<string, SessionSummaryDTO['state']> = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  CLOSED: 'closed'
};

const senderTypeMap: Record<string, MessageDTO['senderType']> = {
  PARTICIPANT: 'participant',
  SYSTEM: 'system'
};

export const toPromptDTO = (prompt: Prompt): PromptDTO => ({
  id: prompt.id,
  order: prompt.order,
  body: prompt.body,
  delaySeconds: prompt.delaySeconds,
  assetUrl: prompt.assetUrl ?? undefined,
  assetType: assetTypeMap[prompt.assetType] ?? 'none'
});

export const toProjectDTO = (project: Project & { prompts: Prompt[] }): ProjectDTO => ({
  id: project.id,
  name: project.name,
  quorum: project.quorum,
  welcomeCopy: project.welcomeCopy,
  farewellCopy: project.farewellCopy,
  status: statusMap[project.status] ?? 'draft',
  prompts: project.prompts.map(toPromptDTO)
});

export const toSessionSummaryDTO = (
  session: ChatSession & { project: Project; participants: SessionParticipant[] }
): SessionSummaryDTO => ({
  id: session.id,
  projectId: session.projectId,
  projectName: session.project.name,
  state: sessionStateMap[session.state] ?? 'waiting',
  participantCount: session.participants.length,
  createdAt: session.createdAt.toISOString(),
  startedAt: session.startedAt ? session.startedAt.toISOString() : null,
  endedAt: session.endedAt ? session.endedAt.toISOString() : null
});

export const toMessageDTO = (message: Message): MessageDTO => ({
  id: message.id,
  sessionId: message.sessionId,
  senderType: senderTypeMap[message.senderType] ?? 'system',
  senderId: message.senderId ?? undefined,
  text: extractTextPayload(message.payload),
  deliveredAt: message.deliveredAt.toISOString()
});

const extractTextPayload = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  if ('text' in payload) {
    const value = (payload as Record<string, unknown>).text;
    return typeof value === 'string' ? value : undefined;
  }

  return undefined;
};

import type { Project, Prompt } from '@prisma/client';

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

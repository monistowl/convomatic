import { z } from 'zod';

export const promptSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().nonnegative(),
  body: z.string().min(1),
  delaySeconds: z.number().int().nonnegative(),
  assetUrl: z.string().url().optional(),
  assetType: z.enum(['image', 'audio', 'video', 'none']).default('none')
});

export const projectBaseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  quorum: z.number().int().positive(),
  welcomeCopy: z.string().min(1),
  farewellCopy: z.string().min(1),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  prompts: z.array(promptSchema)
});

export const createProjectSchema = projectBaseSchema.omit({ id: true }).extend({
  prompts: z.array(promptSchema.omit({ id: true }))
});

export const updateProjectSchema = projectBaseSchema;

export type PromptInput = z.infer<typeof promptSchema>;
export type ProjectInput = z.infer<typeof projectBaseSchema>;

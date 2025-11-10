import type { PageLoad } from './$types';
import type { ProjectInput } from '@convomatic/shared';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('http://localhost:3333/api/projects');
  if (!response.ok) {
    return { projects: [] as ProjectInput[] };
  }

  const projects = (await response.json()) as ProjectInput[];
  return { projects };
};

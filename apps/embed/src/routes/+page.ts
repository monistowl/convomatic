import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  const projectId = url.searchParams.get('projectId');
  const externalId = url.searchParams.get('externalId');

  return {
    projectId,
    externalId
  };
};

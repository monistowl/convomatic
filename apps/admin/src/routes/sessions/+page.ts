import type { PageLoad } from './$types';
import { sessionSummarySchema, type SessionSummary } from '@convomatic/shared';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('http://localhost:3333/api/sessions');
  if (!response.ok) {
    return { sessions: [] as SessionSummary[] };
  }

  const payload = await response.json();
  const sessions = sessionSummarySchema.array().parse(payload);

  return { sessions };
};

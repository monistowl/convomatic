import type { PageLoad } from './$types';
import { sessionSummarySchema, transcriptSchema, type SessionSummary, type Transcript } from '@convomatic/shared';

interface PageDataShape {
  sessions: SessionSummary[];
  transcript: Transcript | null;
}

export const load: PageLoad = async ({ fetch }): Promise<PageDataShape> => {
  const sessionsResponse = await fetch('http://localhost:3333/api/sessions');
  if (!sessionsResponse.ok) {
    return { sessions: [], transcript: null };
  }

  const sessionsPayload = await sessionsResponse.json();
  const sessions = sessionSummarySchema.array().parse(sessionsPayload);

  if (sessions.length === 0) {
    return { sessions, transcript: null };
  }

  const transcriptResponse = await fetch(`http://localhost:3333/api/sessions/${sessions[0].id}/messages`);
  if (!transcriptResponse.ok) {
    return { sessions, transcript: null };
  }

  const transcriptPayload = await transcriptResponse.json();
  const transcript = transcriptSchema.parse(transcriptPayload);

  return { sessions, transcript };
};

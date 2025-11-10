<script lang="ts">
  import { transcriptSchema, type Transcript } from '@convomatic/shared';
  import type { PageData } from './$types';

  export let data: PageData;

  let selectedSessionId: string = data.transcript?.session.id ?? data.sessions[0]?.id ?? '';
  let transcript: Transcript | null = data.transcript;
  let loading = false;
  let error = '';

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  };

  const formatMessageTimestamp = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(value));

  const loadTranscript = async (sessionId: string) => {
    loading = true;
    error = '';

    try {
      const response = await fetch(`http://localhost:3333/api/sessions/${sessionId}/messages`);
      if (!response.ok) {
        throw new Error('Unable to fetch transcript');
      }

      const payload = await response.json();
      transcript = transcriptSchema.parse(payload);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  };

  const handleSessionChange = async (event: Event) => {
    const target = event.target as HTMLSelectElement;
    selectedSessionId = target.value;
    if (selectedSessionId) {
      await loadTranscript(selectedSessionId);
    }
  };
</script>

<svelte:head>
  <title>Transcript Exports • Convomatic</title>
</svelte:head>

<section class="space-y-6">
  <header class="space-y-3">
    <div>
      <h2 class="text-2xl font-semibold text-white">Transcript Exports</h2>
      <p class="mt-2 text-sm text-slate-400">
        Download chat transcripts or trigger CSV exports for downstream qualitative analysis.
      </p>
    </div>

    {#if data.sessions.length > 0}
      <div class="flex flex-wrap items-center gap-3">
        <label class="text-sm font-medium text-slate-300" for="session-select">Session</label>
        <select
          id="session-select"
          class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-brand focus:outline-none"
          on:change={handleSessionChange}
          bind:value={selectedSessionId}
        >
          {#each data.sessions as session}
            <option value={session.id}>
              {session.projectName} · {session.state} · {formatDateTime(session.startedAt)}
            </option>
          {/each}
        </select>
        <button
          class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs uppercase tracking-wide text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-40"
          type="button"
          disabled={loading || !selectedSessionId}
          on:click={() => selectedSessionId && loadTranscript(selectedSessionId)}
        >
          Refresh transcript
        </button>
      </div>
    {/if}
  </header>

  {#if data.sessions.length === 0}
    <div class="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-sm text-slate-300">
      No sessions available yet. Once conversations conclude, their transcripts will be available for download here.
    </div>
  {:else}
    {#if error}
      <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    {/if}

    <article class="space-y-5">
      <section class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-white">
              {transcript?.session.projectName ?? 'Select a session'}
            </h3>
            {#if transcript}
              <p class="text-xs uppercase tracking-wide text-slate-400">
                {transcript.session.state} · Participants: {transcript.session.participantCount}
              </p>
            {/if}
          </div>
          <div class="text-xs text-slate-400">
            <div>Created {formatDateTime(transcript?.session.createdAt ?? null)}</div>
            <div>Started {formatDateTime(transcript?.session.startedAt ?? null)}</div>
            <div>Ended {formatDateTime(transcript?.session.endedAt ?? null)}</div>
          </div>
        </header>

        {#if loading}
          <p class="mt-6 text-sm text-slate-300">Loading transcript…</p>
        {:else if transcript && transcript.messages.length > 0}
          <ol class="mt-6 space-y-3">
            {#each transcript.messages as message}
              <li class="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span class="font-medium uppercase tracking-wide">{message.senderType}</span>
                  <span>{formatMessageTimestamp(message.deliveredAt)}</span>
                </div>
                {#if message.text}
                  <p class="mt-2 whitespace-pre-line text-sm text-slate-100">{message.text}</p>
                {:else}
                  <p class="mt-2 text-sm italic text-slate-400">Non-text payload</p>
                {/if}
              </li>
            {/each}
          </ol>
        {:else if transcript}
          <p class="mt-6 text-sm text-slate-300">No messages recorded yet for this session.</p>
        {:else}
          <p class="mt-6 text-sm text-slate-300">Select a session to preview its transcript.</p>
        {/if}
      </section>
    </article>
  {/if}
</section>

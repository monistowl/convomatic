<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  const stateLabels: Record<PageData['sessions'][number]['state'], string> = {
    waiting: 'Waiting',
    active: 'Active',
    closed: 'Closed'
  };

  const badgeStyles: Record<PageData['sessions'][number]['state'], string> = {
    waiting: 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/40',
    active: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/40',
    closed: 'bg-slate-500/10 text-slate-200 border border-slate-500/40'
  };

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
</script>

<svelte:head>
  <title>Live Sessions • Convomatic</title>
</svelte:head>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-white">Live Sessions</h2>
    <p class="mt-2 text-sm text-slate-400">
      Real-time visibility into participant pairing, wait times, and transcript capture.
    </p>
  </header>

  {#if data.sessions.length === 0}
    <div class="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-sm text-slate-300">
      No sessions have started yet. Once participants begin matching, new sessions will appear here with live status
      updates.
    </div>
  {:else}
    <div class="grid gap-5 lg:grid-cols-2">
      {#each data.sessions as session}
        <article class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/20">
          <header class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-white">{session.projectName}</h3>
              <p class="text-xs uppercase tracking-wide text-slate-400">Session {session.id.slice(0, 8)}</p>
            </div>
            <span class={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeStyles[session.state]}`}>
              {stateLabels[session.state]}
            </span>
          </header>

          <dl class="mt-6 space-y-3 text-sm text-slate-300">
            <div class="flex items-center justify-between">
              <dt class="text-slate-400">Participants</dt>
              <dd class="font-medium text-white">{session.participantCount}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-400">Created</dt>
              <dd>{formatDateTime(session.createdAt)}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-400">Started</dt>
              <dd>{formatDateTime(session.startedAt)}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-400">Ended</dt>
              <dd>{formatDateTime(session.endedAt)}</dd>
            </div>
          </dl>
        </article>
      {/each}
    </div>
  {/if}
</section>

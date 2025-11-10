<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import type { PageData } from './$types';
  import type { JoinSessionRequest } from '@convomatic/shared';

  export let data: PageData;

  const messages = writable<{ sender: string; text: string }[]>([]);
  let status: 'idle' | 'queue' | 'active' = 'idle';
  let queuePosition = 0;
  let input = '';
  let socket: WebSocket | null = null;

  onMount(() => {
    if (!data.projectId || !data.externalId) {
      status = 'idle';
      return;
    }

    joinSession();
    return () => {
      socket?.close();
    };
  });

  async function joinSession() {
    const payload: JoinSessionRequest = {
      projectId: data.projectId!,
      locale: 'en-US',
      participant: {
        externalId: data.externalId!,
        attributes: {}
      }
    };

    const response = await fetch('http://localhost:3333/api/sessions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    if (body.status === 'queued') {
      status = 'queue';
      queuePosition = body.position;
      return;
    }

    if (body.status === 'matched') {
      status = 'active';
      openSocket(body.token);
    }
  }

  function openSocket(token: string) {
    socket = new WebSocket(`ws://localhost:3333/ws?token=${token}`);
    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data) as { senderId: string; message: string };
      messages.update((items) => [...items, { sender: payload.senderId, text: payload.message }]);
    });
  }

  function sendMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN || input.trim().length === 0) {
      return;
    }
    socket.send(input.trim());
    messages.update((items) => [...items, { sender: 'me', text: input.trim() }]);
    input = '';
  }
</script>

<section class="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-8">
  <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
    <header class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-slate-900">Convomatic Chat</h1>
        <p class="text-xs text-slate-500">Project {data.projectId ?? 'not specified'}</p>
      </div>
      <span class="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase text-brand">
        {#if status === 'active'}
          Live
        {:else if status === 'queue'}
          Waiting #{queuePosition}
        {:else}
          Ready
        {/if}
      </span>
    </header>

    <div class="h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {#if status === 'idle'}
        <p class="text-sm text-slate-500">
          Provide `projectId` and `externalId` query parameters to join a chat session.
        </p>
      {:else}
        <div class="space-y-3">
          {#each $messages as message}
            <div class={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <span class={`rounded-2xl px-4 py-2 text-sm ${message.sender === 'me' ? 'bg-brand text-white' : 'bg-white text-slate-800 shadow'}`}>
                {message.text}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <form
      class="mt-4 flex items-center gap-3"
      on:submit|preventDefault={sendMessage}
    >
      <input
        class="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand focus:outline-none"
        type="text"
        placeholder="Type your response"
        bind:value={input}
      />
      <button
        class="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-400"
        type="submit"
        disabled={status !== 'active'}
      >
        Send
      </button>
    </form>
  </div>

  <footer class="text-center text-xs text-slate-400">
    Powered by the Convomatic real-time gateway. Connection state: {status}
  </footer>
</section>

<script lang="ts">
  import '../app.postcss';
</script>

<svelte:head>
  <title>Convomatic Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <header class="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <h1 class="text-lg font-semibold tracking-tight">Convomatic Admin</h1>
      <nav class="flex gap-4 text-sm text-slate-300">
        <a href="/" class="hover:text-white">Projects</a>
        <a href="/sessions" class="hover:text-white">Sessions</a>
        <a href="/transcripts" class="hover:text-white">Transcripts</a>
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-6xl px-6 py-10">
    <slot />
  </main>
</div>

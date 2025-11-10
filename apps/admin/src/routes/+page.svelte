<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<section class="space-y-6">
  <div>
    <h2 class="text-2xl font-semibold">Projects</h2>
    <p class="mt-2 text-sm text-slate-400">
      Manage quorum requirements, prompt sequences, and distribution snippets for each experiment.
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    {#if data.projects.length === 0}
      <p class="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        No projects yet. Create your first project to start pairing participants.
      </p>
    {:else}
      {#each data.projects as project}
        <article class="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-sm transition hover:border-slate-700 hover:shadow-md">
          <header class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white">{project.name}</h3>
              <p class="text-xs uppercase tracking-wide text-slate-400">Quorum: {project.quorum}</p>
            </div>
            <span class="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
              {project.status}
            </span>
          </header>
          <p class="mt-4 text-sm text-slate-300">{project.welcomeCopy}</p>
          <div class="mt-6">
            <h4 class="text-xs font-semibold uppercase text-slate-400">Prompts</h4>
            <ol class="mt-2 space-y-1 text-sm text-slate-200">
              {#each project.prompts as prompt}
                <li class="flex items-center justify-between rounded bg-slate-800/60 px-3 py-2">
                  <span class="font-medium">{prompt.order + 1}. {prompt.body}</span>
                  <span class="text-xs text-slate-400">{prompt.delaySeconds}s</span>
                </li>
              {/each}
            </ol>
          </div>
        </article>
      {/each}
    {/if}
  </div>
</section>

<script lang="ts">
  import type { Snippet } from 'svelte';
  let { hint = '', actions, children, label = 'Interactive bench' }: { hint?: string; actions?: Snippet; children: Snippet; label?: string } = $props();
</script>

<section class="sheet" aria-label={label}>
  {#if hint || actions}
    <div class="bar">
      {#if hint}<p>{hint}</p>{/if}
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </div>
  {/if}
  {@render children()}
</section>

<style>
  .sheet {
    margin-top: 20px;
    border: 1.5px solid var(--frame);
    border-radius: var(--r-md);
    background-color: var(--paper);
    background-image: linear-gradient(var(--paper-line) 1px, transparent 1px), linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);
    background-size: 16px 16px;
    box-shadow: var(--sheet-shadow);
    padding: clamp(14px, 2.5vw, 22px);
    font-family: var(--font-ui);
  }
  .bar { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .bar p { margin: 0; font-size: 14px; max-width: 52ch; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .sheet :global(.row) { display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: flex-start; }
  .sheet :global(.grow) { flex: 999 1 380px; min-width: 0; }
  .sheet :global(.side) { flex: 1 1 260px; min-width: 0; }
  .sheet :global(.panel) { background: var(--paper); border: 1.5px solid var(--frame); padding: 12px 14px; }
  .sheet :global(figure) { margin: 0; }
  .sheet :global(figcaption) { font-family: var(--font-text); font-size: 15px; color: var(--muted); margin-top: 2px; }
  .sheet :global(figcaption b) { font-family: var(--font-ui); font-weight: 400; color: var(--ink); margin-right: 4px; }
  .sheet :global(.controls) { display: grid; gap: 14px; }
</style>

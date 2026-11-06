<script lang="ts">
  import { fly } from 'svelte/transition';

  interface Option { text: string; correct?: boolean; why: string }
  let { id, question, options }: { id: string; question: string; options: Option[] } = $props();
  let picked = $state<number | null>(null);
</script>

<fieldset class="qc">
  <legend><span class="tag">Quick check</span>{question}</legend>
  <div class="opts">
    {#each options as o, i}
      <label class:picked={picked === i} class:right={picked === i && o.correct} class:wrong={picked === i && !o.correct}>
        <input type="radio" name={id} value={i} onchange={() => (picked = i)} />
        <span>{o.text}</span>
      </label>
    {/each}
  </div>
  <div aria-live="polite">
    {#if picked !== null}
      {#key picked}
        <p class="why" class:right={options[picked].correct} in:fly={{ y: 6, duration: 180 }}>
          <strong>{options[picked].correct ? 'Correct.' : 'Not quite.'}</strong> {options[picked].why}
        </p>
      {/key}
    {/if}
  </div>
</fieldset>

<style>
  .qc { margin: 28px 0 0; max-width: var(--measure); border: 1.5px solid var(--frame); border-radius: var(--r-md); padding: 14px 18px 16px; background: var(--paper); box-shadow: var(--sheet-shadow); }
  legend { padding: 0 6px; margin-left: -6px; font-family: var(--font-text); font-size: var(--text-size); }
  .tag { display: block; font-family: var(--font-ui); font-size: 13px; color: var(--muted); }
  .opts { display: grid; gap: 8px; margin-top: 10px; }
  label { display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; border: 1px solid var(--rule); border-radius: var(--r-sm); cursor: pointer; font-family: var(--font-text); font-size: 18px; transition: border-color 140ms var(--ease), background-color 140ms var(--ease); }
  label:hover { border-color: var(--frame); }
  input { accent-color: var(--grab); margin-top: 6px; }
  label.right { border-color: var(--good); background: var(--good-soft); }
  label.wrong { border-color: var(--bad); background: var(--bad-soft); }
  .why { margin: 12px 0 0; font-family: var(--font-text); font-size: 18px; }
  .why strong { color: var(--bad); }
  .why.right strong { color: var(--good); }
</style>

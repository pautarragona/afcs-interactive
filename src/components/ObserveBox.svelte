<script lang="ts">
  import { fly } from 'svelte/transition';
  import { evaluate, type Feedback, type Rubric } from '../lib/rubric';
  import { lab } from './lab/state.svelte';

  let { rubric }: { rubric: Rubric } = $props();

  let answer = $state('');
  let feedback = $state<Feedback | null>(null);
  let attempt = $state(0);
  const id = `obs-${rubric.id}`;

  function check(e: SubmitEvent) {
    e.preventDefault();
    attempt += 1;
    feedback = answer.trim()
      ? evaluate(rubric, answer, lab.moved)
      : { verdict: 'none', headline: 'Write what you saw first.', lines: ['One or two sentences is enough: what changed in the plot, and why do you think so?'] };
  }
</script>

<div class="observe">
  <p class="prompt">{rubric.prompt}</p>
  <form onsubmit={check}>
    <label for={id}>Your observation</label>
    <textarea {id} rows="3" bind:value={answer} placeholder="When I drag up, the peak…"></textarea>
    <button type="submit" class="btn">Check my observation</button>
  </form>
  <div role="status" aria-live="polite">
    {#if feedback}
      {#key attempt}
        <div class="feedback" class:complete={feedback.verdict === 'complete'} in:fly={{ y: 6, duration: 200 }}>
          <p class="tag">Feedback</p>
          <div>
            <p><strong>{feedback.headline}</strong></p>
            {#each feedback.lines as line}<p>{line}</p>{/each}
          </div>
        </div>
      {/key}
    {/if}
  </div>
  <p class="note">Feedback compares your words with key points a person wrote for this plot. It is a nudge, not a grade.</p>
</div>

<style>
  .observe { max-width: var(--measure); }
  .prompt { font-family: var(--font-text); font-size: var(--text-size); margin: 14px 0 14px; }
  label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 4px; }
  textarea { width: 100%; font-family: var(--font-text); font-size: 18px; color: var(--ink); background: var(--paper); border: 1.5px solid var(--frame); border-radius: var(--r-sm); padding: 10px 12px; resize: vertical; transition: box-shadow 140ms var(--ease); }
  textarea:focus { outline: none; box-shadow: 0 0 0 3px var(--grab-soft); border-color: var(--grab); }
  .btn { margin-top: 10px; }
  .feedback { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--rule); display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 4px 16px; font-family: var(--font-text); font-size: 18px; }
  .feedback p { margin: 0 0 6px; }
  .feedback .tag { font-family: var(--font-ui); font-size: 13px; color: var(--muted); }
  .feedback.complete strong { color: var(--good); }
  @media (max-width: 560px) { .feedback { grid-template-columns: 1fr; } }
  .note { margin: 12px 0 0; font-size: 13px; color: var(--muted); }
</style>

<script lang="ts">
  import { evaluate, type Feedback, type Rubric } from '../lib/rubric';
  import { lab } from './lab/state.svelte';

  let { rubric, heading = 'What did you notice?' }: { rubric: Rubric; heading?: string } = $props();

  let answer = $state('');
  let feedback = $state<Feedback | null>(null);
  const id = `obs-${rubric.id}`;

  function check(e: SubmitEvent) {
    e.preventDefault();
    if (!answer.trim()) {
      feedback = { verdict: 'none', headline: 'Write what you saw first.', lines: ['One or two sentences is enough: what changed in the plot, and why do you think so?'] };
      return;
    }
    feedback = evaluate(rubric, answer, lab.moved);
  }
</script>

<section class="observe" aria-labelledby={`${id}-h`}>
  <h2 id={`${id}-h`}>{heading}</h2>
  <p class="prompt">{rubric.prompt}</p>
  <form onsubmit={check}>
    <label for={id}>Your observation</label>
    <textarea {id} rows="3" bind:value={answer} placeholder="For example: when I drag up, the peak…"></textarea>
    <button type="submit" class="btn-primary">Check my observation</button>
  </form>
  <div class="feedback-slot" role="status" aria-live="polite">
    {#if feedback}
      <div class="feedback" class:complete={feedback.verdict === 'complete'}>
        <p class="headline">{feedback.headline}</p>
        {#each feedback.lines as line}<p>{line}</p>{/each}
      </div>
    {/if}
  </div>
  <p class="note">Feedback compares your words with key points a person wrote for this plot. It is a nudge, not a grade.</p>
</section>

<style>
  .observe { max-width: var(--measure); }
  h2 { margin: 0; font-size: var(--step-2); line-height: 1.25; }
  .prompt { margin: 8px 0 16px; color: var(--muted); }
  label { display: block; font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  textarea { width: 100%; box-sizing: border-box; font: inherit; font-size: 17px; color: var(--ink); background: var(--field-bg); border: 1.5px solid var(--rule); border-radius: var(--radius-sm); padding: 12px 14px; resize: vertical; }
  textarea:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; border-color: transparent; }
  .btn-primary { margin-top: 12px; font: inherit; font-size: 16px; font-weight: 700; min-height: 44px; padding: 0 18px; border: none; border-radius: var(--radius-sm); background: var(--btn-bg); color: var(--btn-ink); cursor: pointer; }
  .btn-primary:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .feedback { margin-top: 16px; background: var(--feedback-bg); border-radius: var(--radius-md); padding: 14px 18px; }
  .feedback p { margin: 6px 0 0; }
  .feedback .headline { margin: 0; font-weight: 700; }
  .feedback.complete .headline { color: var(--ok); }
  .note { margin: 12px 0 0; font-size: 14px; color: var(--muted); }
</style>

<script lang="ts">
  import { metrics } from '../sim/secondOrder';
  import { lab, meetsSpec, spec } from './lab/state.svelte';

  const m = $derived(metrics(lab.poles));
  const ok = $derived(meetsSpec());
  const done = $derived(ok.overshoot && ok.settling);
  let hint = $state(false);

  const overshootText = $derived(m.overshootPct === null ? 'unstable' : `${m.overshootPct.toFixed(1)} %`);
  const settlingText = $derived(m.settlingTime === null ? 'never settles' : `${m.settlingTime.toFixed(1)} s`);
</script>

<section class="challenge" class:done aria-labelledby="challenge-h">
  <h2 id="challenge-h">Challenge: meet the spec</h2>
  <p>Place the poles so the overshoot stays under {spec.maxOvershootPct} % and the response settles within {spec.maxSettlingTime} s. The target zone in the s-plane shows where both hold.</p>
  <ul aria-live="polite">
    <li class:met={ok.overshoot}><span>Overshoot under {spec.maxOvershootPct} %</span><strong>{overshootText}, {ok.overshoot ? 'met' : 'not yet'}</strong></li>
    <li class:met={ok.settling}><span>Settling time under {spec.maxSettlingTime} s</span><strong>{settlingText}, {ok.settling ? 'met' : 'not yet'}</strong></li>
  </ul>
  {#if done}
    <p class="win">Both met. Look at where your poles ended up: far enough left to settle fast, and close enough to the real axis to keep ζ above about 0.6.</p>
  {/if}
  <button type="button" class="btn-quiet" aria-expanded={hint} onclick={() => (hint = !hint)}>{hint ? 'Hide the hint' : 'Show a hint'}</button>
  {#if hint}
    <p class="hint">Move the poles left to settle faster, and towards the real axis to cut the overshoot. The zone's edge is jagged because the exact 2 % settling time jumps as the response enters the band at a different peak; 4 / (ζω<sub>n</sub>) is the smooth rule of thumb.</p>
  {/if}
</section>

<style>
  .challenge { max-width: var(--measure); border: 1.5px solid var(--challenge-border); border-radius: var(--radius-lg); padding: 24px 28px; }
  .challenge.done { border-color: var(--ok); }
  h2 { margin: 0; font-size: var(--step-1); line-height: 1.25; }
  p { margin: 8px 0 0; }
  ul { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 10px; }
  li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 16px; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--caution-soft); }
  li strong { color: var(--caution-ink); font-variant-numeric: tabular-nums; }
  li.met { background: var(--ok-soft); }
  li.met strong { color: var(--ok); }
  .win { font-weight: 700; color: var(--ok); }
  .btn-quiet { margin-top: 16px; font: inherit; font-size: 16px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-sm); border: 1px solid var(--rule); background: transparent; color: var(--ink); cursor: pointer; }
  .btn-quiet:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .hint { color: var(--muted); }
</style>

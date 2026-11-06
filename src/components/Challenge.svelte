<script lang="ts">
  import { slide } from 'svelte/transition';
  import { metrics } from '../sim/secondOrder';
  import { lab, meetsSpec, spec } from './lab/state.svelte';

  const m = $derived(metrics(lab.poles));
  const ok = $derived(meetsSpec());
  const done = $derived(ok.overshoot && ok.settling);
  let hint = $state(false);
</script>

<div class="challenge">
  <p class="lead">Move the poles until both requirements are met. The blue region in the s-plane is where that is possible.</p>
  <table class="num">
    <thead><tr><th scope="col">Requirement</th><th scope="col" class="r">Now</th><th scope="col">Status</th></tr></thead>
    <tbody aria-live="polite">
      <tr class:met={ok.overshoot}><td>Overshoot below {spec.maxOvershootPct} %</td><td class="r">{m.overshootPct === null ? 'unstable' : `${m.overshootPct.toFixed(1)} %`}</td><td class="s">{ok.overshoot ? 'Met' : 'Not met'}</td></tr>
      <tr class:met={ok.settling}><td>Settling time below {spec.maxSettlingTime} s</td><td class="r">{m.settlingTime === null ? 'never' : `${m.settlingTime.toFixed(2)} s`}</td><td class="s">{ok.settling ? 'Met' : 'Not met'}</td></tr>
    </tbody>
  </table>
  {#if done}
    <p class="win" transition:slide={{ duration: 200 }}>Both met. Your poles sit far enough left to settle quickly and close enough to the real axis to keep ζ above about 0.6.</p>
  {/if}
  <button type="button" class="btn-line" aria-expanded={hint} onclick={() => (hint = !hint)}>{hint ? 'Hide the hint' : 'Show a hint'}</button>
  {#if hint}
    <p class="hint" transition:slide={{ duration: 200 }}>Move left to settle faster and towards the real axis to cut overshoot. The region's edge is jagged because the exact 2 % settling time jumps whenever the response enters the band at a different peak; equation (1.6) is the smooth rule of thumb.</p>
  {/if}
</div>

<style>
  .challenge { max-width: var(--measure); font-family: var(--font-ui); }
  .lead, .win, .hint { font-family: var(--font-text); font-size: var(--text-size); }
  .lead { margin: 14px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; border: 1.5px solid var(--frame); background: var(--paper); }
  th { text-align: left; font-weight: 400; color: var(--muted); }
  th, td { padding: 9px 12px; border: 1px solid var(--rule); transition: background-color 220ms var(--ease), color 220ms var(--ease); }
  .r { text-align: right; }
  .s { color: var(--bad); }
  tr.met td { background: var(--good-soft); }
  tr.met .s { color: var(--good); font-weight: 700; }
  .win { color: var(--good); margin: 14px 0 0; }
  .btn-line { margin-top: 14px; }
  .hint { color: var(--muted); margin: 12px 0 0; }
</style>

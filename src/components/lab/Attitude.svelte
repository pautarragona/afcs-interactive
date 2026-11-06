<script lang="ts">
  import { stepResponse } from '../../sim/secondOrder';
  import { lab, T_END } from './state.svelte';

  /** Illustrative scale: an output of 1 on the plot is drawn as 8 degrees of nose-up attitude. */
  const DEG_PER_UNIT = 8;
  const t = $derived(lab.playT ?? T_END);
  const v = $derived(stepResponse(lab.poles, t));
  const deg = $derived(Number.isFinite(v) ? Math.max(-30, Math.min(30, v * DEG_PER_UNIT)) : 0);
</script>

<figure class="att" aria-label={`Nose attitude ${deg.toFixed(1)} degrees at t = ${t.toFixed(1)} seconds`}>
  <svg viewBox="-60 -40 120 80" width="132" height="88" aria-hidden="true">
    <line class="horizon" x1="-60" y1="0" x2="60" y2="0" />
    <line class="target" x1="-60" y1="0" x2="60" y2="0" transform={`rotate(${-DEG_PER_UNIT})`} />
    <g transform={`rotate(${-deg})`}>
      <path class="plane" d="M-34 0 C-28 -4 18 -5 28 -2 C34 -1 35 1 28 2 C18 4 -28 3 -34 1 Z M-34 0 L-40 -13 L-33 -13 L-25 -1 Z M-8 1 L8 1 L3 5 L-12 5 Z" />
    </g>
  </svg>
  <figcaption><span class="num">{deg.toFixed(1)}°</span> nose up<br /><span class="note">dashed: target attitude</span></figcaption>
</figure>

<style>
  .att { margin: 0; text-align: center; font-family: var(--font-ui); font-size: 13px; }
  svg { display: block; margin: 0 auto; overflow: visible; }
  .horizon { stroke: var(--muted); stroke-width: 1; }
  .target { stroke: var(--spec); stroke-width: 1; stroke-dasharray: 4 3; }
  .plane { fill: var(--ink); }
  .note { color: var(--muted); font-size: 12px; }
</style>

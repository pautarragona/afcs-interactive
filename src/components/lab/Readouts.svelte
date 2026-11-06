<script lang="ts">
  import { metrics } from '../../sim/secondOrder';
  import { lab, meetsSpec, spec } from './state.svelte';

  const m = $derived(metrics(lab.poles));
  const ok = $derived(meetsSpec());
  const stable = $derived(m.stability === 'stable');
</script>

<dl class="readouts" aria-live="polite">
  <div>
    <dt>Damping ratio <i class="sym">ζ</i></dt>
    <dd>{m.zeta.toFixed(2)}</dd>
  </div>
  <div>
    <dt>Natural frequency <i class="sym">ω</i><sub>n</sub></dt>
    <dd>{m.omegaN.toFixed(2)} <span class="unit">rad/s</span></dd>
  </div>
  <div class:caution={!stable || !ok.overshoot} class:good={stable && ok.overshoot}>
    <dt>Overshoot <span class="target">target under {spec.maxOvershootPct} %</span></dt>
    <dd>{stable ? (m.overshootPct ?? 0).toFixed(1) : '—'} <span class="unit">%</span></dd>
  </div>
  <div class:caution={!stable || !ok.settling} class:good={stable && ok.settling}>
    <dt>Settling time, 2 % <span class="target">target under {spec.maxSettlingTime} s</span></dt>
    <dd>{stable ? (m.settlingTime ?? 0).toFixed(1) : '—'} <span class="unit">s</span></dd>
  </div>
</dl>

<style>
  .readouts { margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--readout-gap, 12px); }
  @media (max-width: 720px) { .readouts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .readouts > div { background: var(--readout-bg); border-radius: var(--radius-sm); padding: 12px 16px; }
  dt { font-size: 14px; color: var(--readout-label); line-height: 1.35; }
  .target { display: block; font-size: 13px; opacity: 0.85; }
  dd { margin: 4px 0 0; font-size: 28px; font-weight: 700; line-height: 1.15; color: var(--readout-value); font-variant-numeric: tabular-nums; font-family: var(--font-numbers, inherit); }
  .unit { font-size: 16px; font-weight: 400; color: var(--readout-label); }
  .caution dd { color: var(--plot-caution); }
  .good dd { color: var(--ok); }
  .sym { font-family: var(--font-math); }
</style>

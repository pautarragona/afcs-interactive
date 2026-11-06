<script lang="ts">
  import { metrics } from '../../sim/secondOrder';
  import { lab, meetsSpec, spec } from './state.svelte';

  const m = $derived(metrics(lab.poles));
  const prev = $derived(lab.previous ? metrics(lab.previous) : null);
  const ok = $derived(meetsSpec());
  const stable = $derived(m.stability === 'stable');
  const f = (v: number | null, d: number) => (v === null || !Number.isFinite(v) ? '—' : v.toFixed(d));
</script>

<table class="tb num" aria-live="polite">
  <caption>Live values for the current poles</caption>
  <tbody>
    <tr>
      <td><span class="lbl">Damping ratio</span><span class="sym m">ζ</span><span class="val">{f(m.zeta, 3)}</span></td>
      <td><span class="lbl">Natural frequency</span><span class="sym m">ω<sub>n</sub></span><span class="val">{f(m.omegaN, 2)} <small>rad/s</small></span></td>
      <td class:bad={!ok.overshoot} class:good={ok.overshoot}><span class="lbl">Overshoot</span><span class="sym m">M<sub>p</sub></span><span class="val">{stable ? f(m.overshootPct, 1) : '—'} <small>%</small></span></td>
      <td class:bad={!ok.settling} class:good={ok.settling}><span class="lbl">Settling, 2 %</span><span class="sym m">t<sub>s</sub></span><span class="val">{stable ? f(m.settlingTime, 2) : '—'} <small>s</small></span></td>
    </tr>
    <tr class="sub">
      <td>{prev ? `was ${f(prev.zeta, 3)}` : m.stability === 'stable' ? 'stable' : m.stability}</td>
      <td>{prev ? `was ${f(prev.omegaN, 2)}` : `σ = ${f(lab.poles.sigma, 2)}, ωd = ${f(lab.poles.omegaD, 2)}`}</td>
      <td>spec &lt; {spec.maxOvershootPct} %, <span class="status">{ok.overshoot ? 'met' : 'not met'}</span></td>
      <td>spec &lt; {spec.maxSettlingTime} s, <span class="status">{ok.settling ? 'met' : 'not met'}</span></td>
    </tr>
  </tbody>
</table>

<style>
  .tb { width: 100%; border-collapse: collapse; background: var(--paper); border: 1.5px solid var(--frame); font-family: var(--font-ui); font-size: 13px; table-layout: fixed; }
  caption { position: absolute; left: -9999px; }
  td { border: 1px solid var(--rule); padding: 8px 12px; vertical-align: top; transition: background-color 220ms var(--ease); }
  .lbl { color: var(--muted); }
  .sym { float: right; font-size: 15px; }
  .val { display: block; font-size: 26px; font-weight: 700; line-height: 1.3; transition: color 220ms var(--ease); }
  .val small { font-size: 13px; font-weight: 400; color: var(--muted); }
  .sub td { padding: 6px 12px; color: var(--muted); }
  .bad .val, .bad .status { color: var(--bad); }
  .good .val, .good .status { color: var(--good); }
  tr:first-child td.good { background: var(--good-soft); }
  @media (max-width: 640px) {
    .tb, .tb tbody, .tb tr { display: grid; grid-template-columns: 1fr 1fr; }
    .tb td { display: block; }
  }
</style>

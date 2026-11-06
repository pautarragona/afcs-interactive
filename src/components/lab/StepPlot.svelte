<script lang="ts">
  import { metrics, sampleStep, type PolePair } from '../../sim/secondOrder';
  import { lab } from './state.svelte';

  const X0 = 40, Y0 = 20, W = 500, H = 300;
  const T_END = 6;
  const Y_MAX = 1.8;
  const x = (t: number) => X0 + (t / T_END) * W;
  const y = (v: number) => Y0 + H - (v / Y_MAX) * H;
  const fmt = (v: number, d = 1) => v.toFixed(d);

  function path(p: PolePair) {
    const { t, y: ys } = sampleStep(p, T_END, 241);
    let d = '';
    for (let i = 0; i < t.length; i++) {
      const v = Math.max(-0.2, Math.min(Y_MAX + 0.2, ys[i]));
      d += `${i ? 'L' : 'M'}${x(t[i]).toFixed(1)} ${y(v).toFixed(1)}`;
    }
    return d;
  }

  const m = $derived(metrics(lab.poles));
  const d = $derived(path(lab.poles));
  const ghostD = $derived(lab.previous ? path(lab.previous) : null);
  const peak = $derived(m.peakTime !== null && m.peakTime <= T_END && m.overshootPct !== null && m.overshootPct > 0.05
    ? { cx: x(m.peakTime), cy: y(1 + m.overshootPct / 100) } : null);
  const settle = $derived(m.settlingTime !== null && m.settlingTime <= T_END ? x(m.settlingTime) : null);

  const tTicks = [0, 1, 2, 3, 4, 5, 6];
  const yTicks = [0, 0.5, 1, 1.5];
  const summary = $derived(
    m.stability === 'unstable' ? 'Unstable: the response grows without bound.'
    : m.stability === 'marginal' ? 'Marginally stable: the response oscillates forever.'
    : `Overshoot ${fmt(m.overshootPct ?? 0)} percent, settles within 2 percent at ${fmt(m.settlingTime ?? 0, 2)} seconds.`
  );
</script>

<svg viewBox="0 0 560 352" class="step" role="img" aria-label={`Step response. ${summary}`}>
  <defs><clipPath id="plot-clip"><rect x={X0} y={Y0} width={W} height={H} /></clipPath></defs>
  <rect class="band" x={X0} y={y(1.02)} width={W} height={y(0.98) - y(1.02)} />
  <g class="grid">
    {#each tTicks.slice(1, -1) as t}<line x1={x(t)} y1={Y0} x2={x(t)} y2={Y0 + H} />{/each}
    {#each [0.5, 1.5] as v}<line x1={X0} y1={y(v)} x2={X0 + W} y2={y(v)} />{/each}
  </g>
  <line class="axis" x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} />
  <line class="axis" x1={X0} y1={Y0} x2={X0} y2={Y0 + H} />
  <line class="reference" x1={X0} y1={y(1)} x2={X0 + W} y2={y(1)} />

  <g clip-path="url(#plot-clip)">
    {#if ghostD}<path class="ghost" d={ghostD} />{/if}
    <path class="response" class:bad={m.stability !== 'stable'} d={d} />
  </g>

  {#if peak}
    <line class="marker" x1={peak.cx} y1={peak.cy} x2={peak.cx} y2={y(1)} />
    <circle class="peak" cx={peak.cx} cy={peak.cy} r="4.5" />
    <text class="note" x={Math.min(peak.cx + 10, 400)} y={Math.max(peak.cy - 6, 34)}>{fmt(m.overshootPct ?? 0)} % overshoot</text>
  {/if}
  {#if settle !== null}
    <line class="marker dashed" x1={settle} y1={y(0.98)} x2={settle} y2={Y0 + H} />
    <text class="note" x={Math.min(settle + 7, 420)} y={y(0.6)}>inside ±2 % from {fmt(m.settlingTime ?? 0)} s</text>
  {:else if m.stability === 'stable'}
    <text class="note" x={X0 + W - 6} y={y(0.6)} text-anchor="end">still settling at 6 s</text>
  {:else}
    <text class="note bad" x={X0 + W - 6} y={y(0.6)} text-anchor="end">{m.stability === 'unstable' ? 'unstable: grows without bound' : 'marginal: never settles'}</text>
  {/if}

  <g class="ticks">
    {#each tTicks as t}<text x={x(t)} y={Y0 + H + 18} text-anchor={t === 6 ? 'end' : 'middle'}>{t === 6 ? '6 s' : t}</text>{/each}
    {#each yTicks as v}<text x={X0 - 8} y={y(v) + 4} text-anchor="end">{v}</text>{/each}
  </g>
</svg>

<style>
  .step { width: 100%; height: auto; display: block; }
  .band { fill: var(--plot-target-soft); }
  .grid line { stroke: var(--plot-grid); stroke-width: 1; }
  .axis { stroke: var(--plot-axis); stroke-width: 1.2; }
  .reference { stroke: var(--plot-target); stroke-width: 1.2; stroke-dasharray: 6 4; }
  .ghost { fill: none; stroke: var(--plot-ghost); stroke-width: 1.8; stroke-dasharray: 6 4; }
  .response { fill: none; stroke: var(--plot-response); stroke-width: 2.6; stroke-linejoin: round; }
  .response.bad { stroke: var(--plot-caution); }
  .marker { stroke: var(--plot-text-strong); stroke-width: 1; }
  .marker.dashed { stroke-dasharray: 2 3; }
  .peak { fill: var(--plot-response); }
  .note { font-size: 13px; fill: var(--plot-text-strong); font-variant-numeric: tabular-nums; }
  .note.bad { fill: var(--plot-caution); }
  .ticks text { font-size: 12px; fill: var(--plot-text); }
</style>

<script lang="ts">
  import { metrics, sampleStep, stepResponse, type PolePair } from '../../sim/secondOrder';
  import { lab, T_END } from './state.svelte';

  const X0 = 40, Y0 = 20, W = 500, H = 300;
  const Y_MAX = 1.8;
  const x = (t: number) => X0 + (t / T_END) * W;
  const y = (v: number) => Y0 + H - (Math.max(-0.15, Math.min(Y_MAX + 0.15, v)) / Y_MAX) * H;

  function path(p: PolePair) {
    const { t, y: ys } = sampleStep(p, T_END, 301);
    return t.map((ti, i) => `${i ? 'L' : 'M'}${x(ti).toFixed(1)} ${y(ys[i]).toFixed(1)}`).join('');
  }

  const m = $derived(metrics(lab.poles));
  const d = $derived(path(lab.poles));
  const ghostD = $derived(lab.previous ? path(lab.previous) : null);
  const peak = $derived(m.peakTime !== null && m.peakTime <= T_END && (m.overshootPct ?? 0) > 0.5 ? { x: x(m.peakTime), y: y(1 + (m.overshootPct ?? 0) / 100) } : null);
  const settle = $derived(m.settlingTime !== null && m.settlingTime <= T_END ? x(m.settlingTime) : null);

  // Hover readout
  let svg: SVGSVGElement;
  let hoverT = $state<number | null>(null);
  function hover(e: PointerEvent) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const t = ((p.x - X0) / W) * T_END;
    hoverT = t >= 0 && t <= T_END ? t : null;
  }
  const cursorT = $derived(lab.playT ?? hoverT);
  const cursor = $derived(cursorT === null ? null : { t: cursorT, x: x(cursorT), v: stepResponse(lab.poles, cursorT) });

  const tTicks = [1, 2, 3, 4, 5];
  const summary = $derived(m.stability === 'unstable' ? 'Unstable: the response grows without bound.'
    : m.stability === 'marginal' ? 'Marginally stable: the response oscillates forever.'
    : `Overshoot ${(m.overshootPct ?? 0).toFixed(1)} percent; inside the 2 percent band from ${(m.settlingTime ?? 0).toFixed(2)} seconds.`);
</script>

<svg bind:this={svg} viewBox="0 0 560 362" class="step" role="img" aria-label={`Step response. ${summary}`}
  onpointermove={hover} onpointerleave={() => (hoverT = null)}>
  <defs>
    <clipPath id="plot-area"><rect x={X0} y={Y0} width={W} height={H} /></clipPath>
    <marker id="dim-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 1.5 L10 5 L0 8.5 Z" class="arrowhead" />
    </marker>
  </defs>
  <rect class="paper" x={X0} y={Y0} width={W} height={H} />
  <rect class="band" x={X0} y={y(1.02)} width={W} height={y(0.98) - y(1.02)} />
  <line class="reference" x1={X0} y1={y(1)} x2={X0 + W} y2={y(1)} />
  <rect class="frame" x={X0} y={Y0} width={W} height={H} />
  <path class="frame" d={tTicks.map((t) => `M${x(t)} ${Y0 + H}v-6M${x(t)} ${Y0}v4`).join('') + [0.5, 1, 1.5].map((v) => `M${X0} ${y(v)}h6M${X0 + W} ${y(v)}h-6`).join('')} />

  <g clip-path="url(#plot-area)">
    {#if ghostD}<path class="ghost" d={ghostD} />{/if}
    <path class="response" class:bad={m.stability !== 'stable'} d={d} />
  </g>

  {#if peak}
    <g class="dim">
      <line x1={peak.x + 5} y1={peak.y} x2={peak.x + 40} y2={peak.y} />
      <line x1={peak.x + 28} y1={y(1)} x2={peak.x + 40} y2={y(1)} />
      {#if y(1) - peak.y > 14}
        <line class="dim-line" x1={peak.x + 34} y1={peak.y + 1.5} x2={peak.x + 34} y2={y(1) - 1.5} marker-start="url(#dim-arrow)" marker-end="url(#dim-arrow)" />
      {/if}
    </g>
    <text class="dim-text num" x={Math.min(peak.x + 44, 440)} y={(peak.y + y(1)) / 2 + 4}><tspan class="m sym">M</tspan><tspan class="m sub" dy="3">p</tspan><tspan dy="-3"> = {(m.overshootPct ?? 0).toFixed(1)} %</tspan></text>
  {/if}
  {#if settle !== null}
    <g class="dim">
      <line x1={settle} y1={y(0.98) + 2} x2={settle} y2={Y0 + H - 8} class="dashed" />
      <line class="dim-line" x1={X0 + 1.5} y1={Y0 + H - 22} x2={settle - 1.5} y2={Y0 + H - 22} marker-start="url(#dim-arrow)" marker-end="url(#dim-arrow)" />
    </g>
    <rect class="paper" x={(X0 + settle) / 2 - 42} y={Y0 + H - 40} width="84" height="14" />
    <text class="dim-text num" x={(X0 + settle) / 2} y={Y0 + H - 29} text-anchor="middle"><tspan class="m sym">t</tspan><tspan class="m sub" dy="3">s</tspan><tspan dy="-3"> = {(m.settlingTime ?? 0).toFixed(2)} s</tspan></text>
  {:else}
    <text class="dim-text" class:bad-text={m.stability !== 'stable'} x={X0 + W - 8} y={Y0 + H - 29} text-anchor="end">{m.stability === 'unstable' ? 'unstable: grows without bound' : m.stability === 'marginal' ? 'marginal: never settles' : 'still outside ±2 % at 6 s'}</text>
  {/if}
  <text class="band-label" x={X0 + W - 6} y={y(1.02) - 5} text-anchor="end">±2 % band</text>

  {#if cursor}
    <g class="cursor" class:playing={lab.playT !== null}>
      <line x1={cursor.x} y1={Y0} x2={cursor.x} y2={Y0 + H} />
      <circle cx={cursor.x} cy={y(cursor.v)} r="4.5" />
      <text class="num" x={cursor.x > X0 + W - 140 ? cursor.x - 8 : cursor.x + 8} y={Y0 + 16} text-anchor={cursor.x > X0 + W - 140 ? 'end' : 'start'}>t = {cursor.t.toFixed(2)} s, y = {Number.isFinite(cursor.v) ? cursor.v.toFixed(3) : '—'}</text>
    </g>
  {/if}

  <g class="ticks num">
    {#each [0, ...tTicks, 6] as t}<text x={x(t)} y={Y0 + H + 16} text-anchor="middle">{t}</text>{/each}
    {#each [0, 0.5, 1, 1.5] as v}<text x={X0 - 6} y={y(v) + 4} text-anchor="end">{v}</text>{/each}
  </g>
  <text class="axis-title" x={X0 + W / 2} y={Y0 + H + 34} text-anchor="middle">t [s]</text>
  <text class="axis-title" x="12" y={Y0 + H / 2} text-anchor="middle" transform={`rotate(-90 12 ${Y0 + H / 2})`}>y(t) [–]</text>
</svg>

<style>
  .step { width: 100%; height: auto; display: block; font-family: var(--font-ui); cursor: crosshair; }
  .paper { fill: var(--paper); }
  .band { fill: var(--spec-soft); }
  .reference { stroke: var(--spec); stroke-width: 1; stroke-dasharray: 8 4; }
  .frame { fill: none; stroke: var(--frame); stroke-width: 1; }
  .ghost { fill: none; stroke: var(--ghost); stroke-width: 1.4; }
  .response { fill: none; stroke: var(--ink); stroke-width: 2.2; stroke-linejoin: round; }
  .response.bad { stroke: var(--bad); }
  .dim line { stroke: var(--ink); stroke-width: 0.8; }
  .dim .dashed { stroke-dasharray: 3 3; }
  .dim .dim-line { stroke-width: 1; }
  .arrowhead { fill: var(--ink); }
  .dim-text { font-size: 12px; fill: var(--ink); }
  .bad-text { fill: var(--bad); }
  .sym { font-size: 14px; }
  .sub { font-size: 10px; }
  .band-label { font-size: 11px; fill: var(--spec); }
  .cursor line { stroke: var(--muted); stroke-width: 1; }
  .cursor circle { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; }
  .cursor text { font-size: 11px; fill: var(--muted); }
  .cursor.playing line { stroke: var(--grab); }
  .cursor.playing circle { stroke: var(--grab); stroke-width: 2.2; }
  .ticks text { font-size: 11px; fill: var(--muted); }
  .axis-title { font-size: 11px; fill: var(--muted); }
</style>

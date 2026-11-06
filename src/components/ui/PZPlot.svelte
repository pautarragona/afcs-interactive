<script lang="ts" module>
  export interface PZ { re: number; im: number; id?: string; drag?: boolean }
</script>

<script lang="ts">
  import type { C } from '../../sim/lti';
  import { niceTicks } from './Plot.svelte';

  interface Props {
    re: [number, number];
    im: [number, number];
    poles?: PZ[];
    zeros?: PZ[];
    closed?: C[];
    loci?: C[][];
    zetaLines?: number[];
    ariaLabel: string;
    onmove?: (id: string, re: number, im: number) => void;
    size?: number;
  }
  let { re, im, poles = [], zeros = [], closed = [], loci = [], zetaLines = [], ariaLabel, onmove, size = 340 }: Props = $props();

  const L = 40, T = 12, B = 34, R = 12;
  const W = $derived(size - L - R);
  const H = $derived(Math.round((W * (im[1] - im[0])) / (re[1] - re[0])));
  const VH = $derived(H + T + B);
  const X = (v: number) => L + ((v - re[0]) / (re[1] - re[0])) * W;
  const Y = (v: number) => T + ((im[1] - v) / (im[1] - im[0])) * H;
  const hatchId = `h-${Math.random().toString(36).slice(2, 8)}`;
  const clipId = `c-${Math.random().toString(36).slice(2, 8)}`;
  const minus = (v: number) => String(Number(v.toPrecision(3))).replace('-', '−');

  let svg: SVGSVGElement;
  let dragging = $state<string | null>(null);
  function toS(e: PointerEvent) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    return { r: clamp(re[0] + ((p.x - L) / W) * (re[1] - re[0]), re[0], re[1]), i: clamp(im[1] - ((p.y - T) / H) * (im[1] - im[0]), im[0], im[1]) };
  }
  function down(e: PointerEvent, id: string) { dragging = id; (e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault(); }
  function move(e: PointerEvent) { if (dragging && onmove) { const s = toS(e); onmove(dragging, Math.round(s.r * 100) / 100, Math.round(s.i * 100) / 100); } }
  function key(e: KeyboardEvent, p: PZ) {
    if (!onmove || !p.id) return;
    const d = e.shiftKey ? 0.25 : 0.05;
    const m: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
    if (!m[e.key]) return;
    e.preventDefault();
    onmove(p.id, Math.round((p.re + m[e.key][0]) * 100) / 100, Math.round((p.im + m[e.key][1]) * 100) / 100);
  }
  const locusPath = (b: C[]) => b.map((c, i) => `${i ? 'L' : 'M'}${X(c.re).toFixed(1)} ${Y(c.im).toFixed(1)}`).join('');
  const zeta = (z: number) => { const a = Math.acos(z); const r = Math.max(-re[0], im[1]) * 2; return `M${X(0)} ${Y(0)}L${X(-r * Math.cos(a))} ${Y(r * Math.sin(a))}M${X(0)} ${Y(0)}L${X(-r * Math.cos(a))} ${Y(-r * Math.sin(a))}`; };
</script>

<svg bind:this={svg} viewBox={`0 0 ${size} ${VH}`} class="pz" class:dragging={!!dragging} role="group" aria-label={ariaLabel}
  onpointermove={move} onpointerup={() => (dragging = null)} onpointercancel={() => (dragging = null)}>
  <defs>
    <pattern id={hatchId} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="hatch" /></pattern>
    <clipPath id={clipId}><rect x={L} y={T} width={W} height={H} /></clipPath>
  </defs>
  <rect class="paper" x={L} y={T} width={W} height={H} />
  {#if re[1] > 0}<rect x={X(0)} y={T} width={X(re[1]) - X(0)} height={H} fill={`url(#${hatchId})`} />{/if}
  <g clip-path={`url(#${clipId})`}>
    {#each zetaLines as z}<path class="zeta" d={zeta(z)} />{/each}
    <line class="raxis" x1={L} x2={L + W} y1={Y(0)} y2={Y(0)} />
    {#if re[1] >= 0}<line class="iaxis" x1={X(0)} x2={X(0)} y1={T} y2={T + H} />{/if}
    {#each loci as b}<path class="locus" d={locusPath(b)} />{/each}
    {#each closed as c}<rect class="cl" x={X(c.re) - 4.5} y={Y(c.im) - 4.5} width="9" height="9" />{/each}
  </g>
  {#each zeros as z}
    <g class="item" class:grab={z.drag} role={z.drag ? 'slider' : undefined} tabindex={z.drag ? 0 : undefined} aria-label={z.drag ? `Zero at ${z.re} plus j ${z.im}` : undefined} aria-valuenow={z.drag ? z.re : undefined}
      onpointerdown={(e) => z.drag && z.id && down(e, z.id)} onkeydown={(e) => key(e, z)}>
      {#if z.drag}<circle class="halo" cx={X(z.re)} cy={Y(z.im)} r="14" />{/if}
      <circle class="zero" cx={X(z.re)} cy={Y(z.im)} r="6" />
    </g>
  {/each}
  {#each poles as p}
    <g class="item" class:grab={p.drag} role={p.drag ? 'slider' : undefined} tabindex={p.drag ? 0 : undefined} aria-label={p.drag ? `Pole at ${p.re} plus j ${p.im}` : undefined} aria-valuenow={p.drag ? p.re : undefined}
      onpointerdown={(e) => p.drag && p.id && down(e, p.id)} onkeydown={(e) => key(e, p)}>
      {#if p.drag}<circle class="halo" cx={X(p.re)} cy={Y(p.im)} r="14" />{/if}
      <path class="pole" d={`M${X(p.re) - 5} ${Y(p.im) - 5}l10 10m0 -10l-10 10`} />
    </g>
  {/each}
  <rect class="frame" x={L} y={T} width={W} height={H} />
  <g class="ticks num">
    {#each niceTicks(re[0], re[1], 5) as v}<text x={X(v)} y={T + H + 15} text-anchor="middle">{minus(v)}</text>{/each}
    {#each niceTicks(im[0], im[1], 5) as v}<text x={L - 6} y={Y(v) + 4} text-anchor="end">{minus(v)}</text>{/each}
  </g>
  <text class="axis" x={L + W / 2} y={VH - 4} text-anchor="middle">Re(s)</text>
  <text class="axis" x="10" y={T + H / 2} text-anchor="middle" transform={`rotate(-90 10 ${T + H / 2})`}>Im(s)</text>
</svg>

<style>
  .pz { width: 100%; height: auto; display: block; font-family: var(--font-ui); touch-action: none; user-select: none; }
  .paper { fill: var(--paper); }
  .hatch { stroke: var(--bad); stroke-width: 1.2; opacity: 0.35; }
  .frame { fill: none; stroke: var(--frame); stroke-width: 1; }
  .raxis { stroke: var(--muted); stroke-width: 0.8; stroke-dasharray: 2 3; }
  .iaxis { stroke: var(--ink); stroke-width: 1; }
  .zeta { stroke: var(--spec); stroke-width: 1; stroke-dasharray: 5 4; fill: none; }
  .locus { fill: none; stroke: var(--ink); stroke-width: 1.3; opacity: 0.75; }
  .cl { fill: var(--ink); stroke: var(--paper); stroke-width: 1.2; transition: x 60ms linear, y 60ms linear; }
  .pole { stroke: var(--ink); stroke-width: 2.3; stroke-linecap: square; fill: none; }
  .zero { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
  .halo { fill: var(--grab-soft); stroke: var(--grab); stroke-width: 1.6; transition: r 140ms var(--ease); }
  .item.grab { cursor: grab; outline: none; }
  .dragging .item.grab { cursor: grabbing; }
  .item.grab:hover .halo, .item.grab:focus-visible .halo { r: 17px; }
  .item.grab:focus-visible .halo { stroke-width: 3; }
  .ticks text { font-size: 11px; fill: var(--muted); }
  .axis { font-size: 11px; fill: var(--muted); }
</style>

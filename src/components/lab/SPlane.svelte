<script lang="ts">
  import zone from '../../data/target-zone.json';
  import { lab, beginMove, setPoles } from './state.svelte';

  let { showTarget = true }: { showTarget?: boolean } = $props();

  // Plot frame: real part -3.5 … 1, imaginary part -3 … 3, 50 px per unit.
  const X0 = 40, Y0 = 20, PX = 50;
  const RE_MIN = -3.5, RE_MAX = 1, IM_MAX = 3;
  const W = (RE_MAX - RE_MIN) * PX, H = 2 * IM_MAX * PX;
  const x = (re: number) => X0 + (re - RE_MIN) * PX;
  const y = (im: number) => Y0 + (IM_MAX - im) * PX;
  const toRe = (px: number) => (px - X0) / PX + RE_MIN;
  const toIm = (py: number) => IM_MAX - (py - Y0) / PX;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const round2 = (v: number) => Math.round(v * 100) / 100;

  const reTicks = [-3, -2, -1, 0, 1];
  const imTicks = [-2, -1, 1, 2];

  // Exact challenge zone (upper boundary from verify/target_zone.py), mirrored below the real axis.
  const targetPath = (() => {
    const pt = (re: number, im: number) => `${x(re).toFixed(1)},${y(im).toFixed(1)}`;
    const upperTopDown = [...zone.boundary].reverse().map((p) => pt(p.re, p.im)); // im 3 → 0
    const lowerTopDown = zone.boundary.map((p) => pt(p.re, -p.im)); // im 0 → -3
    return [pt(RE_MIN, IM_MAX), ...upperTopDown, ...lowerTopDown, pt(RE_MIN, -IM_MAX)].join(' ');
  })();

  let svg: SVGSVGElement;
  let dragSign = 1;

  const upper = $derived({ cx: x(-lab.poles.sigma), cy: y(lab.poles.omegaD) });
  const lower = $derived({ cx: x(-lab.poles.sigma), cy: y(-lab.poles.omegaD) });
  const ghost = $derived(lab.previous ? { cx: x(-lab.previous.sigma), up: y(lab.previous.omegaD), down: y(-lab.previous.omegaD) } : null);

  function svgPoint(e: PointerEvent) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  function moveTo(px: number, py: number) {
    const re = clamp(toRe(px), RE_MIN + 0.05, RE_MAX - 0.05);
    const im = clamp(dragSign * toIm(py), 0, IM_MAX - 0.05);
    setPoles({ sigma: round2(-re), omegaD: round2(im) });
  }

  function down(e: PointerEvent, sign: number) {
    dragSign = sign;
    beginMove();
    lab.dragging = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function move(e: PointerEvent) {
    if (!lab.dragging) return;
    const p = svgPoint(e);
    moveTo(p.x, p.y);
  }
  function up() { lab.dragging = false; }

  function key(e: KeyboardEvent, sign: number) {
    const step = e.shiftKey ? 0.25 : 0.05;
    const p = { ...lab.poles };
    if (e.key === 'ArrowLeft') p.sigma += step;
    else if (e.key === 'ArrowRight') p.sigma -= step;
    else if (e.key === 'ArrowUp') p.omegaD += sign * step;
    else if (e.key === 'ArrowDown') p.omegaD -= sign * step;
    else return;
    e.preventDefault();
    beginMove();
    setPoles({ sigma: round2(clamp(p.sigma, -(RE_MAX - 0.05), -(RE_MIN + 0.05))), omegaD: round2(clamp(p.omegaD, 0, IM_MAX - 0.05)) });
  }

  const label = $derived(`Pole at ${(-lab.poles.sigma).toFixed(2)} plus or minus ${lab.poles.omegaD.toFixed(2)} j. Arrow keys move it; hold Shift for bigger steps.`);
  const poleText = $derived(`${(-lab.poles.sigma).toFixed(2).replace('-', '−')} ± ${lab.poles.omegaD.toFixed(2)}j`);
</script>

<svg
  bind:this={svg}
  viewBox="0 0 300 352"
  class="splane"
  class:dragging={lab.dragging}
  role="group"
  aria-label="s-plane. Drag a pole, or focus it and use the arrow keys."
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  {#if showTarget}<polygon class="target" points={targetPath} />{/if}
  <rect class="unstable" x={x(0)} y={Y0} width={x(RE_MAX) - x(0)} height={H} />
  <g class="grid">
    {#each reTicks as r}{#if r !== 0}<line x1={x(r)} y1={Y0} x2={x(r)} y2={Y0 + H} />{/if}{/each}
    {#each imTicks as i}<line x1={X0} y1={y(i)} x2={X0 + W} y2={y(i)} />{/each}
  </g>
  <line class="axis" x1={X0} y1={y(0)} x2={X0 + W + 3} y2={y(0)} />
  <line class="axis" x1={x(0)} y1={Y0 - 4} x2={x(0)} y2={Y0 + H + 4} />
  <line class="ray" x1={x(0)} y1={y(0)} x2={upper.cx} y2={upper.cy} />

  {#if ghost}
    <g class="ghost-pole"><circle cx={ghost.cx} cy={ghost.up} r="6" /><circle cx={ghost.cx} cy={ghost.down} r="6" /></g>
  {/if}

  {#each [{ p: upper, sign: 1 }, { p: lower, sign: -1 }] as h}
    <g
      class="pole"
      role="slider"
      tabindex="0"
      aria-label={label}
      aria-valuetext={poleText}
      aria-valuenow={-lab.poles.sigma}
      onpointerdown={(e) => down(e, h.sign)}
      onkeydown={(e) => key(e, h.sign)}
    >
      <circle class="halo" cx={h.p.cx} cy={h.p.cy} r="18" />
      <path class="cross" d={`M${h.p.cx - 6} ${h.p.cy - 6} L${h.p.cx + 6} ${h.p.cy + 6} M${h.p.cx + 6} ${h.p.cy - 6} L${h.p.cx - 6} ${h.p.cy + 6}`} />
    </g>
  {/each}

  <text class="pole-label" x={Math.min(upper.cx + 18, 196)} y={Math.max(upper.cy - 12, 14)}>{poleText}</text>
  <text class="zone-label unstable-label" x={x(0) + 5} y={Y0 + 14}>unstable</text>
  {#if showTarget}<text class="zone-label target-label" x={X0 + 4} y={Y0 + H - 6}>target</text>{/if}
  <g class="ticks">
    {#each reTicks as r}<text x={x(r)} y={Y0 + H + 18} text-anchor="middle">{String(r).replace('-', '−')}</text>{/each}
    {#each imTicks as i}<text x={X0 - 6} y={y(i) + 4} text-anchor="end">{String(i).replace('-', '−')}</text>{/each}
    <text x={X0 + W + 4} y={y(0) - 6} text-anchor="end">Re</text>
    <text x={x(0) + 6} y={Y0 + 10}>Im</text>
  </g>
</svg>

<style>
  .splane { width: 100%; height: auto; display: block; touch-action: none; user-select: none; }
  .target { fill: var(--plot-target-soft); stroke: var(--plot-target); stroke-width: 1; stroke-dasharray: 3 3; }
  .unstable { fill: var(--plot-caution-soft); }
  .grid line { stroke: var(--plot-grid); stroke-width: 1; }
  .axis { stroke: var(--plot-axis); stroke-width: 1.2; }
  .ray { stroke: var(--plot-response); stroke-width: 1; stroke-dasharray: 4 3; opacity: 0.8; }
  .ghost-pole circle { fill: none; stroke: var(--plot-ghost); stroke-width: 1.5; }
  .pole { cursor: grab; outline: none; }
  .dragging .pole { cursor: grabbing; }
  .halo { fill: var(--plot-response-soft); stroke: var(--plot-response); stroke-width: 1; transition: r 120ms ease; }
  .pole:hover .halo, .pole:focus-visible .halo { r: 21px; }
  .pole:focus-visible .halo { stroke-width: 2.5; }
  .cross { stroke: var(--plot-response); stroke-width: 3; stroke-linecap: round; }
  .pole-label { font-size: 13px; fill: var(--plot-text-strong); font-variant-numeric: tabular-nums; pointer-events: none; }
  .zone-label { font-size: 12px; pointer-events: none; }
  .unstable-label { fill: var(--plot-caution); }
  .target-label { fill: var(--plot-target); }
  .ticks text { font-size: 12px; fill: var(--plot-text); }
  @media (prefers-reduced-motion: reduce) { .halo { transition: none; } }
</style>

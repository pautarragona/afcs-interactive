<script lang="ts">
  import zone from '../../data/target-zone.json';
  import { lab, beginMove, setPoles } from './state.svelte';

  let { showTarget = true }: { showTarget?: boolean } = $props();

  // Frame: real part -3.5 … 1, imaginary part -3 … 3, 50 px per unit.
  const X0 = 40, Y0 = 20, PX = 50;
  const RE_MIN = -3.5, RE_MAX = 1, IM_MAX = 3;
  const W = (RE_MAX - RE_MIN) * PX, H = 2 * IM_MAX * PX;
  const x = (re: number) => X0 + (re - RE_MIN) * PX;
  const y = (im: number) => Y0 + (IM_MAX - im) * PX;
  const toRe = (px: number) => (px - X0) / PX + RE_MIN;
  const toIm = (py: number) => IM_MAX - (py - Y0) / PX;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const minus = (s: string) => s.replace('-', '−');

  const reTicks = [-3, -2, -1, 0, 1];
  const imTicks = [-2, -1, 0, 1, 2];

  const targetPath = (() => {
    const pt = (re: number, im: number) => `${x(re).toFixed(1)},${y(im).toFixed(1)}`;
    const upper = [...zone.boundary].reverse().map((p) => pt(p.re, p.im));
    const lower = zone.boundary.map((p) => pt(p.re, -p.im));
    return [pt(RE_MIN, IM_MAX), ...upper, ...lower, pt(RE_MIN, -IM_MAX)].join(' ');
  })();

  let svg: SVGSVGElement;
  let dragSign = $state(1);

  const px = $derived(x(-lab.poles.sigma));
  const pyUp = $derived(y(lab.poles.omegaD));
  const pyDown = $derived(y(-lab.poles.omegaD));
  const ghost = $derived(lab.previous ? { x: x(-lab.previous.sigma), up: y(lab.previous.omegaD), down: y(-lab.previous.omegaD) } : null);

  // Angle arc for theta, drawn only for stable, underdamped poles.
  const arc = $derived.by(() => {
    const { sigma, omegaD } = lab.poles;
    if (sigma <= 0.05 || omegaD <= 0.05) return null;
    const r = 18;
    const a = Math.atan2(omegaD, sigma);
    return { d: `M${x(0) - r} ${y(0)} A${r} ${r} 0 0 1 ${(x(0) - r * Math.cos(a)).toFixed(1)} ${(y(0) - r * Math.sin(a)).toFixed(1)}`, lx: x(0) - 30 * Math.cos(a / 2), ly: y(0) - 30 * Math.sin(a / 2) + 4 };
  });

  function svgPoint(e: PointerEvent) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
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
    const re = clamp(toRe(p.x), RE_MIN + 0.05, RE_MAX - 0.05);
    const im = clamp(dragSign * toIm(p.y), 0, IM_MAX - 0.05);
    setPoles({ sigma: -re, omegaD: im });
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
    setPoles({ sigma: clamp(p.sigma, -(RE_MAX - 0.05), -(RE_MIN + 0.05)), omegaD: clamp(p.omegaD, 0, IM_MAX - 0.05) });
  }

  const poleText = $derived(`${minus((-lab.poles.sigma).toFixed(2))} ± j${lab.poles.omegaD.toFixed(2)}`);
  const ariaText = $derived(`Poles at ${(-lab.poles.sigma).toFixed(2)} plus or minus j ${lab.poles.omegaD.toFixed(2)}`);
</script>

<svg bind:this={svg} viewBox="0 0 300 360" class="splane" class:dragging={lab.dragging}
  role="group" aria-label="s-plane. Drag a pole, or focus it and use the arrow keys; Shift for bigger steps."
  onpointermove={move} onpointerup={up} onpointercancel={up}>
  <defs>
    <pattern id="hatch-unstable" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" class="hatch" />
    </pattern>
  </defs>
  <rect class="paper" x={X0} y={Y0} width={W} height={H} />
  {#if showTarget}<polygon class="target" points={targetPath} />{/if}
  <rect x={x(0)} y={Y0} width={x(RE_MAX) - x(0)} height={H} fill="url(#hatch-unstable)" />
  <rect class="frame" x={X0} y={Y0} width={W} height={H} />
  <path class="frame" d={reTicks.map((r) => `M${x(r)} ${Y0 + H}v-6M${x(r)} ${Y0}v6`).join('') + imTicks.map((i) => `M${X0} ${y(i)}h6M${X0 + W} ${y(i)}h-6`).join('')} />
  <line class="real-axis" x1={X0} y1={y(0)} x2={X0 + W} y2={y(0)} />
  <line class="imag-axis" x1={x(0)} y1={Y0} x2={x(0)} y2={Y0 + H} />
  <line class="ray" x1={x(0)} y1={y(0)} x2={px} y2={pyUp} />
  {#if arc}<path class="arc" d={arc.d} /><text class="theta m" x={arc.lx} y={arc.ly} text-anchor="middle">θ</text>{/if}

  {#if ghost}
    <path class="ghost" d={`M${ghost.x - 4} ${ghost.up - 4}l8 8m0 -8l-8 8M${ghost.x - 4} ${ghost.down - 4}l8 8m0 -8l-8 8`} />
  {/if}

  {#each [{ cy: pyUp, sign: 1 }, { cy: pyDown, sign: -1 }] as h}
    <g class="pole" class:active={lab.dragging && dragSign === h.sign} role="slider" tabindex="0"
      aria-label={`${h.sign > 0 ? 'Upper' : 'Lower'} pole`} aria-valuetext={ariaText} aria-valuenow={-lab.poles.sigma}
      onpointerdown={(e) => down(e, h.sign)} onkeydown={(e) => key(e, h.sign)}>
      <circle class="hit" cx={px} cy={h.cy} r="22" />
      <circle class="ring" cx={px} cy={h.cy} r="14" />
      <path class="cross" d={`M${px - 5} ${h.cy - 5}l10 10m0 -10l-10 10`} />
    </g>
  {/each}

  <text class="label num" x={Math.min(px + 20, 190)} y={Math.max(pyUp - 12, 34)}>{poleText}</text>
  <text class="zone bad" x={x(0) + 4} y={Y0 + H - 6}>unstable</text>
  {#if showTarget}<text class="zone spec" x={X0 + 5} y={Y0 + 14}>spec met</text>{/if}
  <g class="ticks num">
    {#each reTicks as r}<text x={x(r)} y={Y0 + H + 16} text-anchor="middle">{minus(String(r))}</text>{/each}
    {#each [-2, 0, 2] as i}<text x={X0 - 6} y={y(i) + 4} text-anchor="end">{minus(String(i))}</text>{/each}
  </g>
  <text class="axis-title" x={X0 + W / 2} y={Y0 + H + 34} text-anchor="middle">Re(s) [1/s]</text>
  <text class="axis-title" x="12" y={Y0 + H / 2} text-anchor="middle" transform={`rotate(-90 12 ${Y0 + H / 2})`}>Im(s) [rad/s]</text>
</svg>

<style>
  .splane { width: 100%; height: auto; display: block; touch-action: none; user-select: none; font-family: var(--font-ui); }
  .paper { fill: var(--paper); }
  .target { fill: var(--spec-soft); stroke: var(--spec); stroke-width: 1.1; }
  .hatch { stroke: var(--bad); stroke-width: 1.2; opacity: 0.4; }
  .frame { fill: none; stroke: var(--frame); stroke-width: 1; }
  .real-axis { stroke: var(--muted); stroke-width: 0.8; stroke-dasharray: 2 3; }
  .imag-axis { stroke: var(--ink); stroke-width: 1; }
  .ray, .arc { fill: none; stroke: var(--ink); stroke-width: 0.8; }
  .theta { font-size: 13px; fill: var(--ink); }
  .ghost { stroke: var(--ghost); stroke-width: 1.4; stroke-linecap: round; fill: none; }
  .pole { cursor: grab; outline: none; }
  .dragging .pole { cursor: grabbing; }
  .hit { fill: transparent; }
  .ring { fill: var(--grab-soft); stroke: var(--grab); stroke-width: 1.6; transition: r 140ms var(--ease), stroke-width 140ms var(--ease); }
  .cross { stroke: var(--ink); stroke-width: 2.4; stroke-linecap: square; }
  .pole:hover .ring { r: 16px; }
  .pole:focus-visible .ring { stroke-width: 3; r: 16px; }
  .pole.active { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35)); }
  .pole.active .ring { r: 18px; }
  .label { font-size: 12px; fill: var(--ink); pointer-events: none; }
  .zone { font-size: 11px; pointer-events: none; }
  .zone.bad { fill: var(--bad); }
  .zone.spec { fill: var(--spec); }
  .ticks text { font-size: 11px; fill: var(--muted); }
  .axis-title { font-size: 11px; fill: var(--muted); }
</style>

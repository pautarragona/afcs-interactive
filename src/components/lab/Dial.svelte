<script lang="ts">
  import { beginMove, lab } from './state.svelte';

  interface Props {
    label: string;
    min: number;
    max: number;
    major: number;
    minor: number;
    value: number;
    disabled?: boolean;
    unit?: string;
    onchange: (v: number) => void;
    children?: import('svelte').Snippet;
  }
  let { label, min, max, major, minor, value, disabled = false, unit = '', onchange, children }: Props = $props();

  const CX = 44, CY = 44, R = 30;
  const angleOf = (v: number) => ((-135 + (270 * (v - min)) / (max - min)) * Math.PI) / 180;
  const pt = (a: number, r: number) => [CX + r * Math.sin(a), CY - r * Math.cos(a)];

  const ticks = (() => {
    const n = Math.round((max - min) / minor);
    let d = '';
    for (let i = 0; i <= n; i++) {
      const v = min + i * minor;
      const big = Math.abs((v - min) / major - Math.round((v - min) / major)) < 1e-6;
      const [x1, y1] = pt(angleOf(v), R);
      const [x2, y2] = pt(angleOf(v), R - (big ? 7 : 4));
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
    return d;
  })();
  const labels = (() => {
    const out: { x: number; y: number; t: string }[] = [];
    for (let v = min; v <= max + 1e-9; v += major) {
      const [x, y] = pt(angleOf(v), R + 9);
      out.push({ x, y: y + 3.5, t: String(Math.round(v * 100) / 100) });
    }
    return out;
  })();

  const clamped = $derived(Math.min(max, Math.max(min, value)));
  const needle = $derived(pt(angleOf(clamped), R - 3));
  let svg: SVGSVGElement;
  let dragging = $state(false);

  function fromPointer(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    const dx = e.clientX - (r.left + (CX / 88) * r.width);
    const dy = e.clientY - (r.top + (CY / 86) * r.height);
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    deg = Math.max(-135, Math.min(135, deg));
    onchange(min + ((deg + 135) / 270) * (max - min));
  }
  function down(e: PointerEvent) {
    if (disabled) return;
    beginMove();
    dragging = true;
    lab.dragging = true;
    svg.setPointerCapture(e.pointerId);
    fromPointer(e);
  }
  function move(e: PointerEvent) { if (dragging) fromPointer(e); }
  function up() { dragging = false; lab.dragging = false; }
  function key(e: KeyboardEvent) {
    if (disabled) return;
    const step = (e.shiftKey ? 1 : 0.2) * minor;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { beginMove(); onchange(Math.min(max, clamped + step)); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { beginMove(); onchange(Math.max(min, clamped - step)); }
    else return;
    e.preventDefault();
  }
</script>

<div class="dial" class:disabled>
  <svg bind:this={svg} viewBox="0 0 88 86" width="96" height="94" role="slider" tabindex={disabled ? -1 : 0}
    aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={clamped} aria-valuetext={`${clamped.toFixed(2)} ${unit}`} aria-disabled={disabled}
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onkeydown={key} class:dragging>
    <circle class="face" cx={CX} cy={CY} r={R + 1} />
    <path class="ticks" d={ticks} />
    {#each labels as l}<text x={l.x} y={l.y} text-anchor="middle">{l.t}</text>{/each}
    <line class="needle" x1={CX} y1={CY} x2={needle[0]} y2={needle[1]} />
    <circle class="hub" cx={CX} cy={CY} r="4" />
  </svg>
  <p>{@render children?.()}</p>
</div>

<style>
  .dial { text-align: center; font-family: var(--font-ui); }
  .dial p { margin: 0; font-size: 13px; }
  svg { display: block; margin: 0 auto; cursor: grab; touch-action: none; outline: none; border-radius: 50%; }
  svg.dragging { cursor: grabbing; }
  svg:focus-visible { box-shadow: 0 0 0 2px var(--focus); }
  .face { fill: var(--paper); stroke: transparent; transition: filter 140ms var(--ease); }
  svg:hover .face, svg.dragging .face { filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.18)); }
  .ticks { stroke: var(--ink); stroke-width: 1.2; }
  text { font-size: 9px; fill: var(--muted); }
  .needle { stroke: var(--grab); stroke-width: 2.6; stroke-linecap: round; }
  .hub { fill: var(--ink); }
  .disabled svg { cursor: not-allowed; opacity: 0.45; }
</style>

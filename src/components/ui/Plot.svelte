<script lang="ts" module>
  export type Kind = 'ink' | 'ghost' | 'spec' | 'bad' | 'grab' | 'muted' | 'good';
  export interface Series { x: number[]; y: number[]; kind?: Kind; dash?: boolean; width?: number; label?: string }
  export interface Line { at: number; kind?: Kind; label?: string; dash?: boolean }
  export interface Band { from: number; to: number; kind?: Kind; label?: string }
  export interface Point { x: number; y: number; kind?: Kind; label?: string; r?: number }

  /** Round-number ticks covering [a, b]. */
  export function niceTicks(a: number, b: number, n = 5): number[] {
    const span = b - a;
    if (!(span > 0)) return [a];
    const raw = span / n;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? 10 * mag;
    const out: number[] = [];
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(Number(v.toPrecision(10)));
    return out;
  }
  const fmt = (v: number) => (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0) ? v.toExponential(0) : String(Number(v.toPrecision(3)))).replace('-', '−');
</script>

<script lang="ts">
  interface Props {
    series: Series[];
    xRange: [number, number];
    yRange?: [number, number];
    xLabel: string;
    yLabel: string;
    logX?: boolean;
    height?: number;
    hlines?: Line[];
    vlines?: Line[];
    hbands?: Band[];
    vbands?: Band[];
    points?: Point[];
    hover?: boolean;
    cursorX?: number | null;
    xTicks?: number[];
    yTicks?: number[];
    ariaLabel: string;
    unitX?: string;
  }
  let { series, xRange, yRange, xLabel, yLabel, logX = false, height = 300, hlines = [], vlines = [], hbands = [], vbands = [], points = [], hover = true, cursorX = null, xTicks, yTicks, ariaLabel, unitX = '' }: Props = $props();

  const L = 48, R = 14, T = 14, B = 40, Wv = 560;
  const W = Wv - L - R;
  const H = $derived(height - T - B);
  const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`;

  const yr = $derived.by((): [number, number] => {
    if (yRange) return yRange;
    let lo = Infinity, hi = -Infinity;
    for (const s of series) for (const v of s.y) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (!Number.isFinite(lo)) return [0, 1];
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const pad = 0.08 * (hi - lo);
    return [lo - pad, hi + pad];
  });
  const fx = (v: number) => (logX ? Math.log10(Math.max(v, 1e-12)) : v);
  const x0 = $derived(fx(xRange[0])), x1 = $derived(fx(xRange[1]));
  const X = (v: number) => L + ((fx(v) - x0) / (x1 - x0)) * W;
  const Y = (v: number) => T + H - ((v - yr[0]) / (yr[1] - yr[0])) * H;
  const clampY = (v: number) => Math.max(yr[0] - 0.2 * (yr[1] - yr[0]), Math.min(yr[1] + 0.2 * (yr[1] - yr[0]), v));

  const xt = $derived(xTicks ?? (logX ? Array.from({ length: Math.floor(x1) - Math.ceil(x0) + 1 }, (_, i) => 10 ** (Math.ceil(x0) + i)) : niceTicks(xRange[0], xRange[1], 6)));
  const yt = $derived(yTicks ?? niceTicks(yr[0], yr[1], 5));
  const path = (s: Series) => {
    let d = '', pen = false;
    for (let i = 0; i < s.x.length; i++) {
      const v = s.y[i];
      if (!Number.isFinite(v)) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${X(s.x[i]).toFixed(1)} ${Y(clampY(v)).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  let svg: SVGSVGElement;
  let hx = $state<number | null>(null);
  function onMove(e: PointerEvent) {
    if (!hover) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    if (p.x < L || p.x > L + W) { hx = null; return; }
    const f = x0 + ((p.x - L) / W) * (x1 - x0);
    hx = logX ? 10 ** f : f;
  }
  const cx = $derived(cursorX ?? hx);
  const readout = $derived.by(() => {
    if (cx === null || !series.length) return null;
    const s = series.find((q) => q.kind !== 'ghost') ?? series[0];
    let best = 0, bd = Infinity;
    s.x.forEach((v, i) => { const d = Math.abs(fx(v) - fx(cx)); if (d < bd) { bd = d; best = i; } });
    return { x: s.x[best], y: s.y[best] };
  });
</script>

<svg bind:this={svg} viewBox={`0 0 ${Wv} ${height}`} class="plot" role="img" aria-label={ariaLabel} onpointermove={onMove} onpointerleave={() => (hx = null)}>
  <defs><clipPath id={clipId}><rect x={L} y={T} width={W} height={H} /></clipPath></defs>
  <rect class="paper" x={L} y={T} width={W} height={H} />
  {#each vbands as b}<rect class={`band ${b.kind ?? 'spec'}`} x={Math.min(X(b.from), X(b.to))} y={T} width={Math.abs(X(b.to) - X(b.from))} height={H} />{/each}
  {#each hbands as b}<rect class={`band ${b.kind ?? 'spec'}`} x={L} y={Y(Math.max(b.from, b.to))} width={W} height={Math.abs(Y(b.from) - Y(b.to))} />{/each}
  <g class="grid">
    {#each yt as v}{#if Math.abs(v) < 1e-12}<line class="zero" x1={L} x2={L + W} y1={Y(0)} y2={Y(0)} />{/if}{/each}
  </g>
  {#each hlines as h}<line class={`ref ${h.kind ?? 'spec'}`} class:dash={h.dash !== false} x1={L} x2={L + W} y1={Y(h.at)} y2={Y(h.at)} />{#if h.label}<text class={`lbl ${h.kind ?? 'spec'}`} x={L + W - 4} y={Y(h.at) - 5} text-anchor="end">{h.label}</text>{/if}{/each}
  {#each vlines as v}<line class={`ref ${v.kind ?? 'muted'}`} class:dash={v.dash !== false} x1={X(v.at)} x2={X(v.at)} y1={T} y2={T + H} />{#if v.label}<text class={`lbl ${v.kind ?? 'muted'}`} x={X(v.at) + 5} y={T + 14}>{v.label}</text>{/if}{/each}
  <g clip-path={`url(#${clipId})`}>
    {#each series as s}<path class={`s ${s.kind ?? 'ink'}`} class:dash={s.dash} style={s.width ? `stroke-width:${s.width}` : ''} d={path(s)} />{/each}
  </g>
  {#each points as p}<circle class={`pt ${p.kind ?? 'ink'}`} cx={X(p.x)} cy={Y(p.y)} r={p.r ?? 4} />{#if p.label}<text class={`lbl ${p.kind ?? 'ink'}`} x={X(p.x) + 8} y={Y(p.y) - 7}>{p.label}</text>{/if}{/each}
  <rect class="frame" x={L} y={T} width={W} height={H} />
  <path class="frame" d={xt.map((v) => `M${X(v)} ${T + H}v-5M${X(v)} ${T}v4`).join('') + yt.map((v) => `M${L} ${Y(v)}h5M${L + W} ${Y(v)}h-5`).join('')} />
  {#if readout && cx !== null}
    <g class="cursor" class:playing={cursorX !== null}>
      <line x1={X(readout.x)} x2={X(readout.x)} y1={T} y2={T + H} />
      <circle cx={X(readout.x)} cy={Y(clampY(readout.y))} r="4" />
      <text class="num" x={X(readout.x) > L + W - 150 ? X(readout.x) - 7 : X(readout.x) + 7} y={T + H - 8} text-anchor={X(readout.x) > L + W - 150 ? 'end' : 'start'}>{fmt(readout.x)}{unitX ? ` ${unitX}` : ''}, {Number.isFinite(readout.y) ? readout.y.toFixed(3) : '—'}</text>
    </g>
  {/if}
  <g class="ticks num">
    {#each xt as v}<text x={X(v)} y={T + H + 16} text-anchor="middle">{fmt(v)}</text>{/each}
    {#each yt as v}<text x={L - 6} y={Y(v) + 4} text-anchor="end">{fmt(v)}</text>{/each}
  </g>
  <text class="axis" x={L + W / 2} y={height - 6} text-anchor="middle">{xLabel}</text>
  <text class="axis" x="12" y={T + H / 2} text-anchor="middle" transform={`rotate(-90 12 ${T + H / 2})`}>{yLabel}</text>
</svg>

<style>
  .plot { width: 100%; height: auto; display: block; font-family: var(--font-ui); cursor: crosshair; }
  .paper { fill: var(--paper); }
  .frame { fill: none; stroke: var(--frame); stroke-width: 1; }
  .zero { stroke: var(--muted); stroke-width: 0.8; stroke-dasharray: 2 3; }
  .s { fill: none; stroke-width: 2.2; stroke-linejoin: round; }
  .s.dash { stroke-dasharray: 7 4; }
  .ref { stroke-width: 1.1; }
  .ref.dash { stroke-dasharray: 7 4; }
  .band { opacity: 1; }
  .band.spec { fill: var(--spec-soft); } .band.bad { fill: var(--bad-soft); } .band.good { fill: var(--good-soft); } .band.grab { fill: var(--grab-soft); } .band.muted, .band.ink, .band.ghost { fill: var(--paper-line); }
  .ink { stroke: var(--ink); } .ghost { stroke: var(--ghost); } .spec { stroke: var(--spec); } .bad { stroke: var(--bad); } .grab { stroke: var(--grab); } .muted { stroke: var(--muted); } .good { stroke: var(--good); }
  .s.ghost { stroke-width: 1.4; }
  .pt { stroke: none; }
  .pt.ink { fill: var(--ink); } .pt.grab { fill: var(--grab); } .pt.bad { fill: var(--bad); } .pt.spec { fill: var(--spec); } .pt.good { fill: var(--good); } .pt.muted, .pt.ghost { fill: var(--muted); }
  text.lbl { font-size: 11.5px; stroke: none; }
  text.lbl.ink { fill: var(--ink); } text.lbl.spec { fill: var(--spec); } text.lbl.bad { fill: var(--bad); } text.lbl.grab { fill: var(--grab-ink); } text.lbl.muted, text.lbl.ghost { fill: var(--muted); } text.lbl.good { fill: var(--good); }
  .cursor line { stroke: var(--muted); stroke-width: 1; }
  .cursor circle { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; }
  .cursor.playing line, .cursor.playing circle { stroke: var(--grab); }
  .cursor text { font-size: 11px; fill: var(--muted); }
  .ticks text { font-size: 11px; fill: var(--muted); }
  .axis { font-size: 11px; fill: var(--muted); }
</style>

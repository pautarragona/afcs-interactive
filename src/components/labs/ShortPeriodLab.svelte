<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { roots, rk4 } from '../../sim/lti';
  import { Player, onFirstView } from '../ui/player.svelte';

  // Short-period model at constant speed, angles in degrees. Illustrative business-jet numbers.
  const Za = -1.2, Md = -6, T = 5, N = 500;
  const EX = 2; // angles are drawn twice their size so a few degrees are visible
  let Ma = $state(-7.8);
  let Mq = $state(-1.0);
  let scenario = $state<'gust' | 'stick'>('gust');
  let slow = $state(false);
  const player = new Player(T);
  $effect(() => { player.speed = slow ? 0.25 : 1; });

  const run = $derived.by(() => {
    const t: number[] = [], a: number[] = [], q: number[] = [], th: number[] = [];
    const x0 = scenario === 'gust' ? [5, 0, 0] : [0, 0, 0];
    rk4((tt, x) => {
      const d = scenario === 'stick' && tt < 0.5 ? -4 : 0;
      return [Za * x[0] + x[1], Ma * x[0] + Mq * x[1] + Md * d, x[1]];
    }, x0, T, N, (tt, x) => { t.push(tt); a.push(x[0]); q.push(x[1]); th.push(x[2]); });
    return { t, a, q, th };
  });

  // The previous run stays on the plot in grey, so a change can be compared with what came before.
  let prev = $state<{ t: number[]; a: number[] } | null>(null);
  let shown = $state<{ t: number[]; a: number[] } | null>(null);
  function play() {
    if (shown && (shown.a !== run.a)) prev = shown;
    shown = run;
    player.play();
  }

  const eig = $derived(roots([1, -(Za + Mq), Za * Mq - Ma]));
  const stable = $derived(eig.every((e) => e.re < -1e-9));
  const wn = $derived(Math.sqrt(Math.max(Za * Mq - Ma, 0)));
  const zeta = $derived(wn > 0 ? -(Za + Mq) / (2 * wn) : NaN);
  const wd = $derived(Number.isFinite(zeta) && zeta < 1 ? wn * Math.sqrt(1 - zeta * zeta) : 0);
  const settle = $derived.by(() => {
    const peak = Math.max(...run.a.map(Math.abs));
    let last = 0;
    run.a.forEach((v, i) => { if (Math.abs(v) > 0.05 * peak) last = run.t[i]; });
    return last;
  });

  // Scene at the current playback time
  const i = $derived(player.index(N));
  const alpha = $derived(run.a[i]);
  const theta = $derived(run.th[i]);
  const gamma = $derived(theta - alpha);
  const clampDeg = (v: number) => Math.max(-35, Math.min(35, v * EX));
  const thDraw = $derived(clampDeg(theta));
  const gaDraw = $derived(clampDeg(gamma));
  // Restoring moment from the weathervane effect, drawn as a force at the tail
  const tailForce = $derived(Math.max(-60, Math.min(60, -Ma * alpha * 1.6)));
  const rad = Math.PI / 180;
  const cx = 280, cy = 86, S = 2.4;
  const tail = $derived({ x: cx - 34 * S * Math.cos(thDraw * rad), y: cy + 34 * S * Math.sin(thDraw * rad) });
  function arc(r: number, from: number, to: number) {
    const p = (a: number) => `${cx + r * Math.cos(-a * rad)} ${cy + r * Math.sin(-a * rad)}`;
    return `M ${p(from)} A ${r} ${r} 0 0 ${to > from ? 0 : 1} ${p(to)}`;
  }

  let sheetEl: HTMLDivElement;
  $effect(() => onFirstView(sheetEl, play));
</script>

<div bind:this={sheetEl}>
<Sheet hint="Fly into a rising gust and watch the nose turn into the new airflow. Then weaken the weathervane or the damping and hit it again; the grey line is your previous run.">
  {#snippet actions()}
    <Switch label="Disturbance" bind:value={scenario} options={[{ value: 'gust', label: 'Rising gust, +5° α' }, { value: 'stick', label: 'Pull and release' }]} />
  {/snippet}

  <svg class="scene" viewBox="0 0 560 156" role="img" aria-label={`Side view: angle of attack ${alpha.toFixed(1)} degrees, pitch attitude ${theta.toFixed(1)} degrees`}>
    <defs><clipPath id="sp-clip"><rect x="0" y="26" width="560" height="122" /></clipPath></defs>
    <text class="note" x="12" y="14">t = {(player.t ?? T).toFixed(1)} s · angles drawn twice their size</text>
    <text class="note" x="548" y="14" text-anchor="end">grey lines: airflow, along the flight path</text>
    <!-- airflow, parallel to the flight path -->
    <g clip-path="url(#sp-clip)"><g transform={`rotate(${-gaDraw} ${cx} ${cy})`} class="flow">
      {#each [-52, -22, 26, 56] as dy}
        <line x1="-40" y1={cy + dy} x2="600" y2={cy + dy} />
        <path d={`M ${70} ${cy + dy - 4} L ${60} ${cy + dy} L ${70} ${cy + dy + 4}`} />
      {/each}
      <line class="path" x1="40" y1={cy} x2="520" y2={cy} />
    </g></g>
    {#if Math.abs(alpha) > 0.5}
      <path class="arc" d={arc(150, gaDraw, thDraw)} />
      <text class="lbl" x={cx + 156 * Math.cos(-thDraw * rad) + 6} y={cy + 156 * Math.sin(-thDraw * rad) + (thDraw > gaDraw ? -8 : 16)}><tspan class="m">α</tspan> {alpha.toFixed(1)}°</text>
    {/if}
    <g transform={`rotate(${-thDraw} ${cx} ${cy}) translate(${cx} ${cy}) scale(${S})`}>
      <path class="plane" d="M-34 0 C-28 -4 18 -5 28 -2 C34 -1 35 1 28 2 C18 4 -28 3 -34 1 Z M-34 0 L-40 -13 L-33 -13 L-25 -1 Z M-8 1 L8 1 L3 5 L-12 5 Z" />
    </g>
    {#if Math.abs(tailForce) > 4}
      <g class="force">
        <line x1={tail.x} y1={tail.y} x2={tail.x} y2={tail.y - tailForce} />
        <path d={`M ${tail.x - 5} ${tail.y - tailForce + Math.sign(tailForce) * 7} L ${tail.x} ${tail.y - tailForce} L ${tail.x + 5} ${tail.y - tailForce + Math.sign(tailForce) * 7}`} />
        <text x={tail.x - 10} y={tail.y - tailForce - Math.sign(tailForce) * 8 + 4} text-anchor="end">tail pushes the nose back</text>
      </g>
    {/if}
  </svg>

  <div class="row" style="margin-top: 8px">
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-6, 8]} height={230} xLabel="t [s]" yLabel="angle [°]" unitX="s" ariaLabel="Angle of attack and pitch attitude against time"
        cursorX={player.t}
        series={[
          ...(prev ? [{ x: prev.t, y: prev.a, kind: 'ghost' as const }] : []),
          { x: run.t, y: run.th, kind: 'spec' as const, width: 1.5 },
          { x: run.t, y: run.a, kind: stable ? 'ink' as const : 'bad' as const },
        ]}
        hlines={[{ at: 0, kind: 'muted', dash: false }]}
        vbands={scenario === 'stick' ? [{ from: 0, to: 0.5, kind: 'grab' }] : []} />
      <figcaption><b>Fig. 5.1</b> <span class="c-ink"></span>: angle of attack <i>α</i>. Blue: pitch attitude <i>θ</i>, where the nose points. Grey: previous run.{scenario === 'stick' ? ' Orange band: stick pulled.' : ''}</figcaption>
    </figure>
    <div class="side controls">
      <div class="play">
        <button class="btn" onclick={play}>{player.playing ? 'Restart' : 'Play'}</button>
        <Switch label="Speed" bind:value={slow} options={[{ value: false, label: 'Real time' }, { value: true, label: '4× slower' }]} />
      </div>
      <Slider bind:value={Ma} min={-15} max={3} step={0.1} unit="1/s²" digits={1}>Weathervane stiffness, <i class="m">M</i><sub>α</sub></Slider>
      <Slider bind:value={Mq} min={-4} max={0} step={0.05} unit="1/s" digits={2}>Pitch damping, <i class="m">M</i><sub>q</sub></Slider>
      <Readout cells={[
        { label: 'One nod takes', value: stable && wd > 0 ? (2 * Math.PI / wd).toFixed(1) : '—', unit: 's', sub: stable ? (wd > 0 ? '' : 'no overshoot') : 'diverges', state: stable ? '' : 'bad' },
        { label: 'Calm again after', value: stable ? settle.toFixed(1) : '—', unit: 's', sub: `ωn ${wn.toFixed(2)} rad/s, ζ ${Number.isFinite(zeta) ? zeta.toFixed(2) : '—'}`, state: stable ? '' : 'bad' },
      ]} />
    </div>
  </div>
</Sheet>
</div>

<style>
  .scene { display: block; width: 100%; height: auto; font-family: var(--font-ui); font-size: 12px; }
  .flow line { stroke: var(--rule); stroke-width: 1; }
  .flow path { stroke: var(--muted); fill: none; stroke-width: 1.2; }
  .flow .path { stroke: var(--muted); stroke-dasharray: 5 4; }
  .plane { fill: var(--ink); }
  .arc { fill: none; stroke: var(--grab); stroke-width: 1.5; }
  .lbl { fill: var(--grab-ink); font-size: 13px; paint-order: stroke; stroke: var(--paper); stroke-width: 5px; }
  .lbl .m { font-family: var(--font-text); font-style: italic; }
  .force line, .force path { stroke: var(--spec); stroke-width: 2; fill: none; }
  .force text { fill: var(--spec); paint-order: stroke; stroke: var(--paper); stroke-width: 5px; }
  .note { fill: var(--muted); font-size: 11px; }
  .play { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
</style>

<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4 } from '../../sim/lti';
  import { Player, onFirstView } from '../ui/player.svelte';

  // Point mass at constant angle of attack: lift ∝ V², drag = lift / (L/D), thrust set for trim.
  // Checked against Lanchester's period and damping to within 1 % (verify notes in the repo).
  const g = 9.81, T = 240, N = 960, SPEEDUP = 12;
  let V0 = $state(100);
  let LD = $state(12);
  let start = $state<-10 | 10>(-10);
  const player = new Player(T, SPEEDUP);

  const run = $derived.by(() => {
    const t: number[] = [], dv: number[] = [], x: number[] = [], h: number[] = [], gam: number[] = [];
    rk4((_, s) => {
      const [V, ga] = s;
      const r = (V / V0) ** 2;
      return [-g * Math.sin(ga) - (g * r) / LD + g / LD, (g / V) * (r - Math.cos(ga)), V * Math.cos(ga), V * Math.sin(ga)];
    }, [V0 + start, 0, 0, 0], T, N, (tt, s) => { t.push(tt); dv.push(s[0] - V0); gam.push(s[1]); x.push(s[2]); h.push(s[3]); });
    return { t, dv, x, h, gam };
  });

  const wn = $derived((Math.SQRT2 * g) / V0);
  const zeta = $derived(1 / (Math.SQRT2 * LD));
  const period = $derived((2 * Math.PI) / (wn * Math.sqrt(1 - zeta * zeta)));
  const half = $derived(Math.log(2) / (zeta * wn));

  // Scene: the flight path seen from the side. Heights are exaggerated so a few hundred metres show up.
  const W = 560, H = 170, PADX = 24, HMAX = 300;
  const sx = $derived((W - 2 * PADX) / run.x[run.x.length - 1]);
  const sy = (H / 2 - 18) / HMAX;
  const exag = $derived(Math.round(sy / sx));
  const px = (v: number) => PADX + v * sx;
  const py = (v: number) => H / 2 - v * sy;
  const pathD = $derived(run.x.map((v, k) => `${k ? 'L' : 'M'}${px(v).toFixed(1)} ${py(run.h[k]).toFixed(1)}`).join(' '));
  const i = $derived(player.index(N));
  const ac = $derived.by(() => {
    const k = Math.min(i, N - 1);
    const ang = Math.atan2(-(py(run.h[k + 1]) - py(run.h[k])), px(run.x[k + 1]) - px(run.x[k])) * 180 / Math.PI;
    return { x: px(run.x[i]), y: py(run.h[i]), ang };
  });
  const flownPath = $derived(run.x.slice(0, i + 1).map((v, k) => `${k ? 'L' : 'M'}${px(v).toFixed(1)} ${py(run.h[k]).toFixed(1)}`).join(' '));

  let el: HTMLDivElement;
  $effect(() => onFirstView(el, () => player.play()));
</script>

<div bind:this={el}>
<Sheet hint={`Start the aircraft a little too slow or too fast, hands off, and watch four minutes of flight pass in ${Math.round(T / SPEEDUP)} seconds.`}>
  {#snippet actions()}
    <Switch label="Start" bind:value={start} options={[{ value: -10, label: '10 m/s too slow' }, { value: 10, label: '10 m/s too fast' }]} />
  {/snippet}

  <svg class="scene" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`Flight path seen from the side. Height change ${run.h[i].toFixed(0)} metres, speed ${(V0 + run.dv[i]).toFixed(0)} metres per second.`}>
    <line class="trim" x1={PADX} y1={H / 2} x2={W - PADX} y2={H / 2} />
    <text class="note" x={W - PADX} y={H / 2 - 6} text-anchor="end">trimmed height</text>
    <path class="future" d={pathD} />
    <path class="flown" d={flownPath} />
    <g transform={`translate(${ac.x} ${ac.y}) rotate(${-ac.ang}) scale(0.62)`}>
      <path class="plane" d="M-34 0 C-28 -4 18 -5 28 -2 C34 -1 35 1 28 2 C18 4 -28 3 -34 1 Z M-34 0 L-40 -13 L-33 -13 L-25 -1 Z M-8 1 L8 1 L3 5 L-12 5 Z" />
    </g>
    <text class="tag" x="12" y="18"><tspan class="v">{(V0 + run.dv[i]).toFixed(0)} m/s</tspan>   height {run.h[i] >= 0 ? '+' : '−'}{Math.abs(run.h[i]).toFixed(0)} m</text>
    <text class="note" x="12" y={H + 12}>t = {(player.t ?? T).toFixed(0)} s, played {SPEEDUP}× faster · heights drawn {exag}× taller than distances</text>
  </svg>

  <div class="row" style="margin-top: 8px">
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-14, 14]} height={210} xLabel="t [s]" yLabel="speed change [m/s]" unitX="s" ariaLabel="Airspeed change against time"
        cursorX={player.t} series={[{ x: run.t, y: run.dv, kind: 'ink' }]} hlines={[{ at: 0, kind: 'muted', dash: false }]} />
      <figcaption><b>Fig. 5.3</b> Speed against time for the same flight. Compare its peaks with the high and low points of the path above.</figcaption>
    </figure>
    <div class="side controls">
      <button class="btn" style="justify-self: start" onclick={() => player.play()}>{player.playing ? 'Restart' : 'Play'}</button>
      <Slider bind:value={V0} min={50} max={250} step={1} unit="m/s" digits={0}>Cruise speed <i class="m">V</i></Slider>
      <Slider bind:value={LD} min={5} max={25} step={0.5} digits={1}>Glide efficiency, <i class="m">L/D</i></Slider>
      <Readout cells={[
        { label: 'One swing takes', value: period.toFixed(0), unit: 's', sub: `ωn ${wn.toFixed(3)} rad/s` },
        { label: 'Half gone after', value: half.toFixed(0), unit: 's', sub: `ζ ${zeta.toFixed(3)}` },
      ]} />
    </div>
  </div>
</Sheet>
</div>

<style>
  .scene { display: block; width: 100%; height: auto; font-family: var(--font-ui); font-size: 12px; }
  .trim { stroke: var(--spec); stroke-width: 1; stroke-dasharray: 5 4; }
  .future { fill: none; stroke: var(--rule); stroke-width: 1.5; }
  .flown { fill: none; stroke: var(--ink); stroke-width: 2; }
  .plane { fill: var(--ink); }
  .tag { fill: var(--muted); font-size: 13px; }
  .tag .v { fill: var(--ink); font-weight: 700; }
  .note { fill: var(--muted); font-size: 11px; }
</style>

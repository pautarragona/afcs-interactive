<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Readout from '../ui/Readout.svelte';

  let theta = $state(8);
  let gamma = $state(3);
  const alpha = $derived(theta - gamma);
  const rad = (d: number) => (d * Math.PI) / 180;
  const cx = 230, cy = 150;
  const ray = (deg: number, r: number) => [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];
  function arc(from: number, to: number, r: number) {
    const [x1, y1] = ray(from, r), [x2, y2] = ray(to, r);
    const sweep = to > from ? 0 : 1;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  const v = $derived(ray(gamma, 150));
  const b = $derived(ray(theta, 120));
  const stallish = $derived(alpha > 14);
</script>

<Sheet hint="Set the pitch attitude and the flight path. The angle of attack is whatever is left between them.">
  <div class="row">
    <figure class="grow">
      <svg viewBox="0 0 460 280" role="img" aria-label={`Pitch attitude ${theta} degrees, flight path ${gamma} degrees, angle of attack ${alpha} degrees`} class="angles">
        <defs><marker id="ang-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 1 L10 5 L0 9 Z" class="ah" /></marker></defs>
        <line class="horizon" x1="20" y1={cy} x2="440" y2={cy} />
        <text class="lbl" x="440" y={cy + 18} text-anchor="end">horizon</text>
        <g transform={`rotate(${-theta} ${cx} ${cy})`} class="plane-g">
          <path class="plane" transform={`translate(${cx} ${cy}) scale(2.1)`} d="M-34 0 C-28 -4 18 -5 28 -2 C34 -1 35 1 28 2 C18 4 -28 3 -34 1 Z M-34 0 L-40 -13 L-33 -13 L-25 -1 Z M-8 1 L8 1 L3 5 L-12 5 Z" />
        </g>
        <line class="body" x1={cx} y1={cy} x2={b[0]} y2={b[1]} marker-end="url(#ang-arrow)" />
        <text class="lbl ink" x={b[0] + 6} y={b[1] - 4}>body x-axis</text>
        <line class="vel" x1={cx} y1={cy} x2={v[0]} y2={v[1]} marker-end="url(#ang-arrow)" />
        <text class="lbl spec" x={v[0] + 6} y={v[1] + 14}>velocity V</text>
        <path class="arc th" d={arc(0, theta, 70)} /><text class="m-lbl" x={ray(theta / 2, 82)[0]} y={ray(theta / 2, 82)[1] + 4}>θ</text>
        <path class="arc ga" d={arc(0, gamma, 96)} /><text class="m-lbl spec-t" x={ray(gamma / 2, 108)[0]} y={ray(gamma / 2, 108)[1] + 4}>γ</text>
        <path class="arc al" class:warn={stallish} d={arc(gamma, theta, 132)} /><text class="m-lbl grab-t" class:warn={stallish} x={ray((gamma + theta) / 2, 146)[0]} y={ray((gamma + theta) / 2, 146)[1] + 4}>α</text>
      </svg>
      <figcaption><b>Fig. A.1</b> Side view, wings level, still air. The angle of attack is the angle between the body axis and the velocity.</figcaption>
    </figure>
    <div class="side controls">
      <Slider bind:value={theta} min={-10} max={25} step={0.5} unit="°" digits={1}>Pitch attitude <i class="m">θ</i></Slider>
      <Slider bind:value={gamma} min={-10} max={20} step={0.5} unit="°" digits={1}>Flight path angle <i class="m">γ</i></Slider>
      <Readout cells={[{ label: 'Angle of attack', sym: 'α = θ − γ', value: alpha.toFixed(1), unit: '°', state: stallish ? 'bad' : '', sub: stallish ? 'beyond a typical stall angle' : 'typical cruise: 2 to 6°' }]} />
    </div>
  </div>
</Sheet>

<style>
  .angles { width: 100%; height: auto; display: block; font-family: var(--font-ui); }
  .horizon { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 5 4; }
  .plane-g { transition: transform 160ms var(--ease); }
  .plane { fill: var(--ink); opacity: 0.18; }
  .body { stroke: var(--ink); stroke-width: 2; }
  .vel { stroke: var(--spec); stroke-width: 2; }
  .ah { fill: context-stroke; }
  .arc { fill: none; stroke-width: 1.4; }
  .arc.th { stroke: var(--ink); } .arc.ga { stroke: var(--spec); } .arc.al { stroke: var(--grab); stroke-width: 2.2; }
  .arc.al.warn { stroke: var(--bad); }
  .lbl { font-size: 12px; fill: var(--muted); } .lbl.ink { fill: var(--ink); } .lbl.spec { fill: var(--spec); }
  .m-lbl { font-family: var(--font-text); font-style: italic; font-size: 17px; fill: var(--ink); text-anchor: middle; }
  .spec-t { fill: var(--spec); } .grab-t { fill: var(--grab-ink); } .m-lbl.warn { fill: var(--bad); }
</style>

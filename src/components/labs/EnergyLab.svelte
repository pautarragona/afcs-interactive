<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4 } from '../../sim/lti';

  // Point-mass longitudinal model, illustrative: V0 = 100 m/s, L/D = 12, drag ∝ V² (parasite drag only)
  const g = 9.81, V0 = 100, DW0 = 1 / 12, TAU_G = 1.5, T = 120, V_STALL = 65;
  const rad = Math.PI / 180;
  let strategy = $state<'elev' | 'energy'>('elev');
  let gc = $state(3);
  let tauE = $state(2);
  const kV = 0.5; // 1/s, speed error gain in the throttle law

  function run(mode: 'elev' | 'energy', gcDeg: number, te: number) {
    const t: number[] = [], V: number[] = [], gam: number[] = [], h: number[] = [], thr: number[] = [];
    const cmd = (tt: number) => (tt >= 2 ? gcDeg * rad : 0);
    rk4((tt, x) => {
      const [v, gm, alt, tw] = x;
      const dw = DW0 * (v / V0) ** 2;
      const twCmd = mode === 'elev' ? DW0 : dw + Math.sin(cmd(tt)) + (kV * (V0 - v)) / g;
      return [g * (tw - dw - Math.sin(gm)), (cmd(tt) - gm) / TAU_G, v * Math.sin(gm), (Math.max(0, Math.min(0.5, twCmd)) - tw) / te];
    }, [V0, 0, 0, DW0], T, 12000, (tt, x) => {
      if (Math.round(tt * 100) % 20 !== 0) return;
      t.push(tt); V.push(x[0]); gam.push(x[1] / rad); h.push(x[2]); thr.push(x[3]);
    });
    return { t, V, gam, h, thr };
  }
  const other = $derived(run(strategy === 'elev' ? 'energy' : 'elev', gc, tauE));
  const r = $derived(run(strategy, gc, tauE));
  const vMin = $derived(Math.min(...r.V));
</script>

<Sheet hint="Command a climb. Compare pulling up with the elevator alone against coordinating elevator and thrust.">
  {#snippet actions()}
    <Switch label="Strategy" bind:value={strategy} options={[{ value: 'elev', label: 'Elevator only' }, { value: 'energy', label: 'Elevator + thrust' }]} />
  {/snippet}
  <div class="row">
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[50, 110]} xLabel="t [s]" yLabel="V [m/s]" unitX="s" ariaLabel="Airspeed during the climb"
        series={[{ x: other.t, y: other.V, kind: 'ghost' }, { x: r.t, y: r.V, kind: vMin < V_STALL ? 'bad' : 'ink' }]}
        hlines={[{ at: V0, kind: 'spec', label: 'speed to hold' }]} hbands={[{ from: 0, to: V_STALL, kind: 'bad', label: 'stall' }]} />
      <figcaption><b>Fig. 10.1</b> Airspeed. Grey: the other strategy. Red band: below an illustrative stall speed.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-20, Math.max(300, ...r.h, ...other.h)]} xLabel="t [s]" yLabel="Δh [m]" unitX="s" ariaLabel="Altitude gained"
        series={[{ x: other.t, y: other.h, kind: 'ghost' }, { x: r.t, y: r.h }]} />
      <figcaption><b>Fig. 10.2</b> Altitude gained. Same flight path command in both cases.</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls">
      <Slider bind:value={gc} min={-3} max={6} step={0.5} unit="°" digits={1}>Flight path command <i class="m">γ</i><sub>c</sub></Slider>
      <Slider bind:value={tauE} min={0.5} max={6} step={0.1} unit="s" digits={1}>Engine response time</Slider>
    </div>
    <div class="grow"><Readout cells={[
      { label: 'Lowest speed', value: vMin.toFixed(0), unit: 'm/s', state: vMin < V_STALL ? 'bad' : V0 - vMin < 3 ? 'good' : '' },
      { label: 'Speed after 120 s', value: r.V[r.V.length - 1].toFixed(0), unit: 'm/s' },
      { label: 'Thrust to weight', sym: 'T/W', value: r.thr[r.thr.length - 1].toFixed(3), sub: `trim: ${DW0.toFixed(3)}` },
      { label: 'Altitude gained', value: r.h[r.h.length - 1].toFixed(0), unit: 'm' },
    ]} /></div>
  </div>
</Sheet>

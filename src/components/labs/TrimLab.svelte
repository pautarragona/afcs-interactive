<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';

  // Illustrative aircraft, not a specific type. Wing loading 3000 N/m², air density 1.0 kg/m³ (about 3 km).
  const WS = 3000, rho = 1.0;
  const CL0 = 0.25, CLa = 5.0, Cm0 = 0.05, Cma = -0.8, Cmd = -1.4; // per rad; δe positive = trailing edge down
  let V = $state(100);
  let xcg = $state(0); // cg shift, changes Cmα: more aft cg → less negative Cmα

  const trimAt = (v: number, cmaShift: number) => {
    const CL = (2 * WS) / (rho * v * v);
    const a = (CL - CL0) / CLa;
    const d = -(Cm0 + (Cma + cmaShift) * a) / Cmd;
    return { CL, a: (a * 180) / Math.PI, d: (d * 180) / Math.PI };
  };
  const Vs = Array.from({ length: 81 }, (_, i) => 65 + i * 2);
  const cmaShift = $derived(xcg * 0.5);
  const cur = $derived(trimAt(V, cmaShift));
  const aCurve = $derived(Vs.map((v) => trimAt(v, cmaShift).a));
  const dCurve = $derived(Vs.map((v) => trimAt(v, cmaShift).d));
  const highAlpha = $derived(cur.a > 12);
</script>

<Sheet hint="Pick an airspeed. The bench finds the angle of attack and elevator angle that make lift equal weight and the pitching moment zero.">
  <div class="row">
    <figure class="grow">
      <Plot xRange={[65, 225]} yRange={[-8, 16]} xLabel="V [m/s]" yLabel="trim angle [°]" unitX="m/s" ariaLabel="Trim angle of attack and elevator against airspeed"
        series={[{ x: Vs, y: aCurve, kind: 'ink' }, { x: Vs, y: dCurve, kind: 'spec' }]}
        hlines={[{ at: 0, kind: 'muted', dash: false }]}
        points={[{ x: V, y: cur.a, kind: 'grab', label: `α = ${cur.a.toFixed(1)}°`, r: 5 }, { x: V, y: cur.d, kind: 'grab', label: `δe = ${cur.d.toFixed(1)}°`, r: 5 }]} />
      <figcaption><b>Fig. B.1</b> Trim curves. <span class="c-ink"></span>: angle of attack. Blue: elevator angle (positive trailing edge down). Orange: your airspeed.</figcaption>
    </figure>
    <div class="side controls">
      <Slider bind:value={V} min={65} max={225} step={1} unit="m/s" digits={0}>Airspeed <i class="m">V</i></Slider>
      <Slider bind:value={xcg} min={-0.6} max={0.6} step={0.05} digits={2}>Centre of gravity, forward to aft</Slider>
      <Readout cells={[
        { label: 'Lift coefficient', sym: 'C<sub>L</sub>', value: cur.CL.toFixed(2) },
        { label: 'Angle of attack', sym: 'α', value: cur.a.toFixed(1), unit: '°', state: highAlpha ? 'bad' : '', sub: highAlpha ? 'close to stall' : '' },
        { label: 'Elevator', sym: 'δ<sub>e</sub>', value: cur.d.toFixed(1), unit: '°', sub: cur.d < 0 ? 'trailing edge up' : 'trailing edge down' },
      ]} />
    </div>
  </div>
</Sheet>

<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4 } from '../../sim/lti';

  // Short period at constant air density; derivatives scaled with V from the design point V0
  const V0 = 100, Za0 = -1.2, Ma0 = -7.8, Mq0 = -1.0, Md0 = -8;
  let V = $state(180);
  let Kq0 = $state(0.3);
  const rad = Math.PI / 180;

  function derivs(v: number) { const k = v / V0; return { Za: Za0 * k, Ma: Ma0 * k * k, Mq: Mq0 * k, Md: Md0 * k * k }; }
  function shortPeriod(v: number, kq: number) {
    const { Za, Ma, Mq, Md } = derivs(v);
    const mq = Mq + Md * kq;
    const wn = Math.sqrt(Za * mq - Ma);
    return { wn, zeta: -(Za + mq) / (2 * wn) };
  }
  const kFixed = $derived(Kq0);
  const kSched = $derived(Kq0 * (V0 / V));
  const Vs = Array.from({ length: 91 }, (_, i) => 60 + 2 * i);
  const zFixed = $derived(Vs.map((v) => shortPeriod(v, Kq0).zeta));
  const zSched = $derived(Vs.map((v) => shortPeriod(v, Kq0 * (V0 / v)).zeta));
  const fixed = $derived(shortPeriod(V, kFixed));
  const sched = $derived(shortPeriod(V, kSched));

  function resp(v: number, kq: number) {
    const { Za, Ma, Mq, Md } = derivs(v);
    const t: number[] = [], q: number[] = [];
    rk4((_, x) => { const d = -1 * rad + kq * x[1]; return [Za * x[0] + x[1], Ma * x[0] + Mq * x[1] + Md * d]; }, [0, 0], 4, 800, (tt, x) => { t.push(tt); q.push(x[1]); });
    const qss = q[q.length - 1] || 1;
    return { t, q: q.map((x) => x / qss) };
  }
  const rF = $derived(resp(V, kFixed));
  const rS = $derived(resp(V, kSched));
</script>

<Sheet hint="The damper gain was tuned at 100 m/s. Fly faster or slower and compare keeping that gain with scheduling it on airspeed.">
  <div class="row">
    <figure class="grow">
      <Plot xRange={[60, 240]} yRange={[0, 1.2]} xLabel="V [m/s]" yLabel="damping ζ [–]" unitX="m/s" ariaLabel="Short-period damping against airspeed"
        series={[{ x: Vs, y: zFixed, kind: 'ink' }, { x: Vs, y: zSched, kind: 'spec' }]}
        hbands={[{ from: 0.35, to: 1.3, kind: 'good' }]} vlines={[{ at: V0, kind: 'muted', label: 'design point' }]}
        points={[{ x: V, y: fixed.zeta, kind: 'grab', r: 5 }, { x: V, y: sched.zeta, kind: 'grab', r: 5 }]} />
      <figcaption><b>Fig. 11.1</b> Short-period damping across the speed range. <span class="c-ink"></span>: fixed gain. Blue: scheduled gain. Green band: the Level 1 damping range of lesson 7.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, 4]} yRange={[0, 1.6]} xLabel="t [s]" yLabel="q, normalised [–]" unitX="s" ariaLabel="Normalised pitch rate response at the selected speed"
        series={[{ x: rF.t, y: rF.q, kind: 'ink' }, { x: rS.t, y: rS.q, kind: 'spec' }]} hlines={[{ at: 1, kind: 'muted' }]} />
      <figcaption><b>Fig. 11.2</b> Pitch rate after an elevator step at the selected speed, normalised. <span class="c-ink"></span>: fixed. Blue: scheduled.</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls">
      <Slider bind:value={V} min={60} max={240} step={1} unit="m/s" digits={0}>Airspeed <i class="m">V</i></Slider>
      <Slider bind:value={Kq0} min={0.05} max={0.5} step={0.01} unit="s" digits={2}>Gain at the design point</Slider>
    </div>
    <div class="grow"><Readout cells={[
      { label: 'Fixed gain', sym: 'K<sub>q</sub>', value: kFixed.toFixed(3), unit: 's', sub: `ζ = ${fixed.zeta.toFixed(2)}, ωn = ${fixed.wn.toFixed(2)}` },
      { label: 'Scheduled gain', sym: 'K<sub>q</sub>·V₀/V', value: kSched.toFixed(3), unit: 's', sub: `ζ = ${sched.zeta.toFixed(2)}, ωn = ${sched.wn.toFixed(2)}` },
      { label: 'Damping drift, fixed', value: (fixed.zeta - shortPeriod(V0, Kq0).zeta).toFixed(2), sub: 'versus the design point', state: Math.abs(fixed.zeta - shortPeriod(V0, Kq0).zeta) > 0.15 ? 'bad' : '' },
    ]} /></div>
  </div>
</Sheet>

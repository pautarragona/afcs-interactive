<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4, stepInfo } from '../../sim/lti';

  // Slow first-order plant 1/(5s+1), like airspeed responding to thrust; PI autothrottle;
  // actuator: 0.1 s lag, rate limit, position limit. Steady state needs u = step size.
  const Kp = 4, Ti = 2, tau = 5, tauA = 0.1, T = 30;
  let umax = $state(1.5);
  let rmax = $state(10);
  let amp = $state(1);
  let aw = $state<'none' | 'clamp'>('none');

  function run(limit: number, rate: number, a: number, mode: 'none' | 'clamp' | 'ideal') {
    const t: number[] = [], y: number[] = [], uc: number[] = [], ua: number[] = [];
    rk4((_, x) => {
      const [p, I, act] = x;
      const e = a - p;
      const cmd = Kp * (e + I / Ti);
      const sat = mode === 'ideal' ? cmd : Math.max(-limit, Math.min(limit, cmd));
      let du = (sat - act) / tauA;
      if (mode !== 'ideal') du = Math.max(-rate, Math.min(rate, du));
      const saturating = mode !== 'ideal' && Math.abs(cmd) > limit && Math.sign(e) === Math.sign(cmd);
      return [(-p + act) / tau, mode === 'clamp' && saturating ? 0 : e, du];
    }, [0, 0, 0], T, 6000, (tt, x) => {
      if (Math.round(tt * 200) % 10 !== 0) return;
      t.push(tt); y.push(x[0]); uc.push(Kp * (a - x[0] + x[1] / Ti)); ua.push(x[2]);
    });
    return { t, y, uc, ua };
  }
  const ideal = $derived(run(umax, rmax, amp, 'ideal'));
  const cur = $derived(run(umax, rmax, amp, aw));
  const info = $derived(stepInfo(cur.t, cur.y, amp));
  const infoIdeal = $derived(stepInfo(ideal.t, ideal.y, amp));
  const reachable = $derived(umax > amp);
</script>

<Sheet hint="A speed loop: a PI autothrottle drives a slow engine-and-airframe response. Ask for a bigger change or give the engine less thrust margin, and watch the integrator wind up.">
  {#snippet actions()}
    <Switch label="Anti-windup" bind:value={aw} options={[{ value: 'none', label: 'Off' }, { value: 'clamp', label: 'Clamping' }]} />
  {/snippet}
  <div class="row">
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-0.05, amp * 1.6]} xLabel="t [s]" yLabel="y(t), e.g. Δspeed" unitX="s" ariaLabel="Output with and without actuator limits"
        series={[{ x: ideal.t, y: ideal.y, kind: 'ghost' }, { x: cur.t, y: cur.y }]} hlines={[{ at: amp, kind: 'spec' }]} />
      <figcaption><b>Fig. 9.1</b> Output. Grey: the same controller with an unlimited actuator. <span class="c-ink"></span>: with limits.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-1, Math.max(5, amp * 4.5)]} xLabel="t [s]" yLabel="u(t), e.g. thrust" unitX="s" ariaLabel="Controller command and actual actuator position"
        series={[{ x: cur.t, y: cur.uc, kind: 'muted', dash: true }, { x: cur.t, y: cur.ua, kind: 'grab' }]}
        hbands={[{ from: umax, to: 100, kind: 'bad' }, { from: -100, to: -umax, kind: 'bad' }]} />
      <figcaption><b>Fig. 9.2</b> Dashed: what the controller asks for. Orange: what the actuator delivers. Red: beyond its limits.</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls">
      <Slider bind:value={amp} min={0.2} max={1.4} step={0.05} digits={2}>Requested change</Slider>
      <Slider bind:value={umax} min={1} max={5} step={0.05} digits={2}>Actuator limit <i class="m">u</i><sub>max</sub></Slider>
      <Slider bind:value={rmax} min={0.2} max={10} step={0.1} unit="1/s" digits={1}>Rate limit</Slider>
    </div>
    <div class="grow"><Readout cells={[
      { label: 'Overshoot', value: info.overshootPct.toFixed(0), unit: '%', state: info.overshootPct > infoIdeal.overshootPct + 10 ? 'bad' : info.overshootPct < 5 ? 'good' : '', sub: `unlimited actuator: ${infoIdeal.overshootPct.toFixed(0)} %` },
      { label: 'Settled within 2 %', value: info.settlingTime !== null ? info.settlingTime.toFixed(1) : 'not by 30 s', unit: info.settlingTime !== null ? 's' : '', sub: `unlimited: ${infoIdeal.settlingTime?.toFixed(1) ?? '—'} s` },
      { label: 'Peak command', value: Math.max(...cur.uc.map(Math.abs)).toFixed(2), sub: reachable ? `actuator can deliver ${umax.toFixed(2)}` : 'limit below the steady value needed', state: !reachable || Math.max(...cur.uc.map(Math.abs)) > umax ? 'bad' : '' },
    ]} /></div>
  </div>
</Sheet>

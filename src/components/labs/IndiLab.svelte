<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4, stepInfo } from '../../sim/lti';

  // Pitch-rate dynamics q̇ = Mq q + Mδ δ + d, first-order actuator. Both controllers are designed for Mδ = −8.
  const Mq = -1, Md0 = -8, T = 6, QC = 5, T_STEP = 0.5, T_DIST = 3.5;
  const Kp = 6, Ki = 9, Kv = 5; // classical PI on rate error (as desired q̇), INDI virtual-control gain
  let ratio = $state(1);
  let dist = $state(true);
  let tauA = $state(0.05);

  function run(kind: 'pi' | 'indi', r: number, withD: boolean, ta: number) {
    const Md = Md0 * r;
    const t: number[] = [], q: number[] = [];
    const qc = (tt: number) => (tt >= T_STEP ? QC : 0);
    const dd = (tt: number) => (withD && tt >= T_DIST ? -6 : 0);
    rk4((tt, x) => {
      const [qq, del, I] = x;
      const e = qc(tt) - qq;
      const qdot = Mq * qq + Md * del + dd(tt);
      const dc = kind === 'pi' ? (Kp * e + Ki * I) / Md0 : del + (Kv * e - qdot) / Md0;
      return [qdot, (dc - del) / ta, e];
    }, [0, 0, 0], T, 6000, (tt, x) => { if (Math.round(tt * 1000) % 10 === 0) { t.push(tt); q.push(x[0]); } });
    return { t, q };
  }
  const pi = $derived(run('pi', ratio, dist, tauA));
  const indi = $derived(run('indi', ratio, dist, tauA));
  const cut = (r: { t: number[]; q: number[] }) => ({ t: r.t.filter((x) => x >= T_STEP && x < T_DIST).map((x) => x - T_STEP), q: r.q.filter((_, i) => r.t[i] >= T_STEP && r.t[i] < T_DIST) });
  const iPi = $derived(stepInfo(cut(pi).t, cut(pi).q, QC));
  const iIndi = $derived(stepInfo(cut(indi).t, cut(indi).q, QC));
  const dip = (r: { t: number[]; q: number[] }) => (dist ? QC - Math.min(...r.q.filter((_, i) => r.t[i] >= T_DIST)) : 0);
</script>

<Sheet hint="Both controllers were designed for the same nominal aircraft. Make the real control effectiveness different from what they assume, add a disturbance, and compare.">
  {#snippet actions()}
    <Switch label="Disturbance at 3.5 s" bind:value={dist} options={[{ value: false, label: 'None' }, { value: true, label: 'Pitching moment' }]} />
  {/snippet}
  <div class="row">
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-1, 9]} xLabel="t [s]" yLabel="q [°/s]" unitX="s" ariaLabel="Pitch rate response of both controllers"
        series={[{ x: pi.t, y: pi.t.map((x) => (x >= T_STEP ? QC : 0)), kind: 'spec', dash: true }, { x: pi.t, y: pi.q, kind: 'muted' }, { x: indi.t, y: indi.q, kind: 'ink' }]}
        vlines={dist ? [{ at: T_DIST, kind: 'bad', label: 'disturbance' }] : []} />
      <figcaption><b>Fig. 12.1</b> Pitch rate following a 5 °/s command. Grey: classical PI. <span class="c-ink"></span>: INDI. Blue dashed: command.</figcaption>
    </figure>
    <div class="side controls">
      <Slider bind:value={ratio} min={0.4} max={2.5} step={0.05} digits={2}>True / assumed control effectiveness <i class="m">M</i><sub>δ</sub></Slider>
      <Slider bind:value={tauA} min={0.02} max={0.2} step={0.005} unit="s" digits={3}>Actuator time constant</Slider>
      <Readout cells={[
        { label: 'PI overshoot', value: iPi.overshootPct.toFixed(0), unit: '%', sub: `settles ${iPi.settlingTime?.toFixed(2) ?? '—'} s, dip ${dip(pi).toFixed(2)} °/s`, state: iPi.overshootPct > 15 ? 'bad' : '' },
        { label: 'INDI overshoot', value: iIndi.overshootPct.toFixed(0), unit: '%', sub: `settles ${iIndi.settlingTime?.toFixed(2) ?? '—'} s, dip ${dip(indi).toFixed(2)} °/s`, state: iIndi.overshootPct > 15 ? 'bad' : '' },
      ]} />
    </div>
  </div>
</Sheet>

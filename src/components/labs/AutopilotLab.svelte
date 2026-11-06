<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4, stepInfo } from '../../sim/lti';

  // Illustrative short-period aircraft at constant speed (autothrottle assumed)
  const Za = -1.2, Ma = -7.8, Mq = -1.0, Md = -8, V = 100;
  const rad = Math.PI / 180;
  let mode = $state<'att' | 'alt'>('att');
  let Kq = $state(0.3);
  let Kth = $state(1.0);
  let Kh = $state(0.15); // degrees of attitude command per metre of altitude error
  const TH_C = 5, H_C = 30;

  function run(kq: number, kth: number, kh: number, m: 'att' | 'alt') {
    const T = m === 'att' ? 8 : 40;
    const t: number[] = [], th: number[] = [], h: number[] = [], thc: number[] = [], de: number[] = [];
    const cmd = (tt: number, x: number[]) => (m === 'att' ? (tt >= 1 ? TH_C * rad : 0) : Math.max(-10 * rad, Math.min(10 * rad, kh * rad * ((tt >= 1 ? H_C : 0) - x[3]))));
    rk4((tt, x) => {
      const [a, q, theta] = x;
      const d = Math.max(-20 * rad, Math.min(20 * rad, kq * q + kth * (theta - cmd(tt, x))));
      return [Za * a + q, Ma * a + Mq * q + Md * d, q, V * (theta - a)];
    }, [0, 0, 0, 0], T, m === 'att' ? 1600 : 4000, (tt, x) => {
      t.push(tt); th.push(x[2] / rad); h.push(x[3]); const c = cmd(tt, x); thc.push(c / rad);
      de.push(Math.max(-20, Math.min(20, (kq * x[1] + kth * (x[2] - c)) / rad)));
    });
    return { t, th, h, thc, de, T };
  }
  const r = $derived(run(Kq, Kth, Kh, mode));
  const info = $derived(mode === 'att'
    ? stepInfo(r.t.filter((x) => x >= 1).map((x) => x - 1), r.th.filter((_, i) => r.t[i] >= 1), TH_C)
    : stepInfo(r.t.filter((x) => x >= 1).map((x) => x - 1), r.h.filter((_, i) => r.t[i] >= 1), H_C));
  const outer = $derived(mode === 'alt');
</script>

<Sheet hint="Close the attitude loop around the pitch damper first, then close the altitude loop around that. Each loop is tuned in its own time scale.">
  {#snippet actions()}
    <Switch label="Mode" bind:value={mode} options={[{ value: 'att', label: 'Attitude hold, +5°' }, { value: 'alt', label: 'Altitude hold, +30 m' }]} />
  {/snippet}
  <div class="row">
    <figure class="grow">
      {#if !outer}
        <Plot xRange={[0, r.T]} yRange={[-1, 8]} xLabel="t [s]" yLabel="θ [°]" unitX="s" ariaLabel="Pitch attitude following a 5 degree command"
          series={[{ x: r.t, y: r.thc, kind: 'spec', dash: true }, { x: r.t, y: r.th }]} />
        <figcaption><b>Fig. 8.1</b> Pitch attitude. Blue dashed: command.</figcaption>
      {:else}
        <Plot xRange={[0, r.T]} yRange={[-3, 45]} xLabel="t [s]" yLabel="Δh [m]" unitX="s" ariaLabel="Altitude following a 30 metre command"
          series={[{ x: r.t, y: r.t.map((x) => (x >= 1 ? H_C : 0)), kind: 'spec', dash: true }, { x: r.t, y: r.h }]} />
        <figcaption><b>Fig. 8.1</b> Altitude. Blue dashed: selected altitude.</figcaption>
      {/if}
    </figure>
    <figure class="grow">
      <Plot xRange={[0, r.T]} yRange={outer ? [-12, 12] : [-20, 20]} xLabel="t [s]" yLabel={outer ? 'θ and its command [°]' : 'elevator δe [°]'} unitX="s" ariaLabel={outer ? 'Attitude and attitude command from the altitude loop' : 'Elevator deflection'}
        series={outer ? [{ x: r.t, y: r.thc, kind: 'spec', dash: true }, { x: r.t, y: r.th }] : [{ x: r.t, y: r.de, kind: 'muted' }]}
        hbands={outer ? [] : [{ from: 20, to: 25, kind: 'bad' }, { from: -25, to: -20, kind: 'bad' }]} />
      <figcaption><b>Fig. 8.2</b> {outer ? 'The inner loop at work: the altitude loop commands attitude (blue), limited to ±10°.' : 'Elevator deflection, limited to ±20° (red bands).'}</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls">
      <Slider bind:value={Kq} min={0} max={0.6} step={0.01} unit="s" digits={2}>Inner: pitch rate <i class="m">K</i><sub>q</sub></Slider>
      <Slider bind:value={Kth} min={0} max={4} step={0.05} digits={2}>Middle: attitude <i class="m">K</i><sub>θ</sub></Slider>
      {#if outer}<Slider bind:value={Kh} min={0} max={0.6} step={0.01} unit="°/m" digits={2}>Outer: altitude <i class="m">K</i><sub>h</sub></Slider>{/if}
    </div>
    <div class="grow"><Readout cells={[
      { label: outer ? 'Altitude overshoot' : 'Attitude overshoot', value: info.overshootPct.toFixed(0), unit: '%', state: info.overshootPct > 20 ? 'bad' : info.overshootPct < 10 ? 'good' : '' },
      { label: 'Settled within 2 %', value: info.settlingTime !== null ? info.settlingTime.toFixed(1) : 'not yet', unit: info.settlingTime !== null ? 's' : '' },
      { label: 'Steady-state error', value: outer ? (H_C - r.h[r.h.length - 1]).toFixed(1) : (TH_C - r.th[r.th.length - 1]).toFixed(2), unit: outer ? 'm' : '°', sub: outer ? 'altitude integrates flight path' : 'attitude integrates pitch rate' },
    ]} /></div>
  </div>
</Sheet>

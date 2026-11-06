<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Plot from '../ui/Plot.svelte';
  import PZPlot from '../ui/PZPlot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { roots, rk4 } from '../../sim/lti';

  // Illustrative, poorly damped bare aircraft (not a specific type)
  const Za = -0.8, Ma = -6, Mq = -0.3, Md = -8;
  let Kq = $state(0);
  const T = 6;
  const rad = Math.PI / 180;

  const charOf = (k: number) => { const mq = Mq + Md * k; return [1, -(Za + mq), Za * mq - Ma]; };
  const eig = $derived(roots(charOf(Kq)));
  const locus = $derived.by(() => {
    const up: { re: number; im: number }[] = [], dn: { re: number; im: number }[] = [];
    for (let i = 0; i <= 200; i++) { const r = roots(charOf((i / 200) * 0.6)); up.push(r[0].im >= 0 ? r[0] : r[1]); dn.push(r[0].im >= 0 ? r[1] : r[0]); }
    return [up, dn];
  });
  const wn = $derived(Math.sqrt(charOf(Kq)[2]));
  const zeta = $derived(charOf(Kq)[1] / (2 * wn));
  const qss = (k: number) => (-Md * -1 * rad) / (Mq + Md * k - Ma / Za) / rad; // deg/s per −1° stick
  function sim(k: number) {
    const t: number[] = [], q: number[] = [];
    rk4((_, x) => { const d = -1 * rad + k * x[1]; return [Za * x[0] + x[1], Ma * x[0] + Mq * x[1] + Md * d]; }, [0, 0], T, 900, (tt, x) => { t.push(tt); q.push(x[1] / rad); });
    return { t, q };
  }
  const bare = sim(0);
  const aug = $derived(sim(Kq));
</script>

<Sheet hint="Feed pitch rate back to the elevator. The gain moves the short-period poles along their locus; the response shows the pilot's view.">
  <div class="row">
    <figure class="side" style="max-width: 340px">
      <PZPlot re={[-6, 1]} im={[-4, 4]} size={320} loci={locus} zetaLines={[0.5]} closed={eig} poles={[{ re: roots(charOf(0))[0].re, im: roots(charOf(0))[0].im }, { re: roots(charOf(0))[1].re, im: roots(charOf(0))[1].im }]} ariaLabel="Short-period poles against pitch damper gain" />
      <figcaption><b>Fig. 6.1</b> Short-period poles: bare aircraft (×) and with the damper (■). Blue dashed: <i>ζ</i> = 0.5.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[0, Math.max(...bare.q) * 1.1]} xLabel="t [s]" yLabel="q [°/s]" unitX="s" ariaLabel="Pitch rate after a one-degree stick step"
        series={[{ x: bare.t, y: bare.q, kind: 'ghost' }, { x: aug.t, y: aug.q }]} hlines={[{ at: qss(Kq), kind: 'spec', label: 'steady state' }]} />
      <figcaption><b>Fig. 6.2</b> Pitch rate after a 1° elevator step. Grey: bare aircraft. <span class="c-ink"></span>: with the damper.</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls"><Slider bind:value={Kq} min={0} max={0.6} step={0.005} unit="s" digits={3}>Pitch damper gain <i class="m">K</i><sub>q</sub></Slider></div>
    <div class="grow"><Readout cells={[
      { label: 'Damping ratio', sym: 'ζ', value: zeta < 1 ? zeta.toFixed(2) : '≥ 1', state: zeta >= 0.35 && zeta <= 1.3 ? 'good' : '', sub: 'bare aircraft: 0.22' },
      { label: 'Natural frequency', sym: 'ω<sub>n</sub>', value: wn.toFixed(2), unit: 'rad/s' },
      { label: 'Effective pitch damping', sym: 'M<sub>q</sub> + M<sub>δ</sub>K<sub>q</sub>', value: (Mq + Md * Kq).toFixed(2), unit: '1/s' },
      { label: 'Steady pitch rate', value: qss(Kq).toFixed(2), unit: '°/s', sub: `bare: ${qss(0).toFixed(2)} °/s` },
    ]} /></div>
  </div>
</Sheet>

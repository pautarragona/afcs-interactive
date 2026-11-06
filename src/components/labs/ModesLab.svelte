<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { roots, rk4 } from '../../sim/lti';

  const g = 9.81;
  const Za = -1.2;
  let Ma = $state(-7.8);
  let Mq = $state(-1.0);
  let V = $state(100);
  let LD = $state(12);

  // Short period: free response of q after a 1 s elevator pulse (normalised)
  const sp = $derived.by(() => {
    const t: number[] = [], q: number[] = [];
    const Md = -6;
    rk4((tt, x) => { const d = tt < 0.5 ? -1 : 0; return [Za * x[0] + x[1], Ma * x[0] + Mq * x[1] + Md * d]; }, [0, 0], 6, 1200, (tt, x) => { t.push(tt); q.push(x[1]); });
    // Normalise by the largest pitch rate in the first 1.5 s, so the shape is comparable between settings.
    const ref = Math.max(...q.slice(0, 301).map(Math.abs)) || 1;
    return { t, q: q.map((v) => v / ref) };
  });
  const spEig = $derived(roots([1, -(Za + Mq), Za * Mq - Ma]));
  const spWn = $derived(Math.sqrt(Math.max(Za * Mq - Ma, 0)));
  const spZeta = $derived(spWn > 0 ? -(Za + Mq) / (2 * spWn) : NaN);
  const spStable = $derived(spEig.every((e) => e.re < 0));

  // Phugoid, Lanchester approximation
  const phWn = $derived((Math.SQRT2 * g) / V);
  const phZeta = $derived(1 / (Math.SQRT2 * LD));
  const phWd = $derived(phWn * Math.sqrt(1 - phZeta * phZeta));
  const period = $derived((2 * Math.PI) / phWd);
  const half = $derived(Math.log(2) / (phZeta * phWn));
  const ph = $derived.by(() => {
    const t: number[] = [], u: number[] = [];
    const s = phZeta * phWn;
    for (let i = 0; i <= 400; i++) { const tt = (i / 400) * 240; t.push(tt); u.push(5 * Math.exp(-s * tt) * Math.cos(phWd * tt)); }
    return { t, u };
  });
  const f2 = (v: number) => v.toFixed(2).replace('-', '−');
</script>

<Sheet hint="Left: the fast short period, from the pitching-moment derivatives. Right: the slow phugoid, from speed and lift-to-drag ratio. Note the different time axes.">
  <div class="row">
    <div class="grow">
      <figure>
        <Plot xRange={[0, 6]} yRange={[-1.2, 1.6]} height={250} xLabel="t [s]" yLabel="q [–], normalised" unitX="s" ariaLabel="Short-period pitch rate after an elevator pulse"
          series={[{ x: sp.t, y: sp.q, kind: spStable ? 'ink' : 'bad' }]} hlines={[{ at: 0, kind: 'muted', dash: false }]} vbands={[{ from: 0, to: 0.5, kind: 'grab' }]} />
        <figcaption><b>Fig. 5.1</b> Short period: pitch rate after a half-second elevator pulse (orange band). Seconds.</figcaption>
      </figure>
      <div class="controls" style="margin-top: 10px">
        <Slider bind:value={Ma} min={-15} max={1} step={0.1} unit="1/s²" digits={1}><i class="m">M</i><sub>α</sub>, static stability</Slider>
        <Slider bind:value={Mq} min={-4} max={0} step={0.05} unit="1/s" digits={2}><i class="m">M</i><sub>q</sub>, pitch damping</Slider>
      </div>
    </div>
    <div class="grow">
      <figure>
        <Plot xRange={[0, 240]} yRange={[-6, 6]} height={250} xLabel="t [s]" yLabel="Δu [m/s]" unitX="s" ariaLabel="Phugoid airspeed oscillation"
          series={[{ x: ph.t, y: ph.u }]} hlines={[{ at: 0, kind: 'muted', dash: false }]} />
        <figcaption><b>Fig. 5.2</b> Phugoid: airspeed after a 5 m/s disturbance. Minutes, not seconds.</figcaption>
      </figure>
      <div class="controls" style="margin-top: 10px">
        <Slider bind:value={V} min={50} max={250} step={1} unit="m/s" digits={0}>Airspeed <i class="m">V</i></Slider>
        <Slider bind:value={LD} min={5} max={25} step={0.5} digits={1}>Lift-to-drag ratio <i class="m">L/D</i></Slider>
      </div>
    </div>
  </div>
  <div style="margin-top: 14px"><Readout cells={[
    { label: 'Short period', sym: 'ω<sub>n</sub>, ζ', value: spStable ? `${spWn.toFixed(2)}, ${Number.isFinite(spZeta) && spZeta < 1 ? spZeta.toFixed(2) : '≥ 1'}` : 'unstable', state: spStable ? '' : 'bad', sub: `eigenvalues ${spEig.map((e) => (Math.abs(e.im) > 1e-6 ? `${f2(e.re)}±j${Math.abs(e.im).toFixed(2)}` : f2(e.re))).slice(0, Math.abs(spEig[0].im) > 1e-6 ? 1 : 2).join(', ')}` },
    { label: 'Phugoid', sym: 'ω<sub>n</sub>, ζ', value: `${phWn.toFixed(3)}, ${phZeta.toFixed(3)}`, sub: 'rad/s, from (5.3)' },
    { label: 'Phugoid period', value: period.toFixed(0), unit: 's' },
    { label: 'Time to half amplitude', value: half.toFixed(0), unit: 's' },
  ]} /></div>
</Sheet>

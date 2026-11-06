<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Plot from '../ui/Plot.svelte';
  import PZPlot from '../ui/PZPlot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { roots, rk4 } from '../../sim/lti';

  const Za = -1.2; // 1/s, illustrative
  let Ma = $state(-7.8);
  let Mq = $state(-1.0);
  const T = 6;

  const tr = $derived(Za + Mq), det = $derived(Za * Mq - Ma);
  const eig = $derived(roots([1, -tr, det]));
  const stable = $derived(eig.every((e) => e.re < -1e-9));
  const sim = $derived.by(() => {
    const t: number[] = [], a: number[] = [], q: number[] = [];
    rk4((_, x) => [Za * x[0] + x[1], Ma * x[0] + Mq * x[1]], [2, 0], T, 600, (tt, x) => { t.push(tt); a.push(x[0]); q.push(x[1]); });
    return { t, a, q };
  });
  const wn = $derived(Math.sqrt(Math.max(det, 0)));
  const zeta = $derived(det > 0 ? -tr / (2 * wn) : NaN);
  const f = (v: number) => v.toFixed(2).replace('-', '−');
</script>

<Sheet hint="Change the two pitching-moment derivatives. The state matrix, its eigenvalues and the free motion all update together.">
  <div class="row">
    <div class="side controls">
      <Slider bind:value={Ma} min={-15} max={3} step={0.1} unit="1/s²" digits={1}>Static stability <i class="m">M</i><sub>α</sub></Slider>
      <Slider bind:value={Mq} min={-4} max={0.5} step={0.05} unit="1/s" digits={2}>Pitch damping <i class="m">M</i><sub>q</sub></Slider>
      <div class="panel matrix" aria-label="State matrix">
        <span class="m">A</span> =
        <table><tbody><tr><td>{f(Za)}</td><td>1</td></tr><tr><td class="hl">{f(Ma)}</td><td class="hl">{f(Mq)}</td></tr></tbody></table>
      </div>
      <Readout cells={[
        { label: 'Eigenvalues', value: eig.length === 2 && Math.abs(eig[0].im) > 1e-9 ? `${f(eig[0].re)} ± j${Math.abs(eig[0].im).toFixed(2)}` : eig.map((e) => f(e.re)).join(', '), state: stable ? '' : 'bad', sub: stable ? 'stable' : 'unstable' },
        { label: 'Damping', sym: 'ζ', value: Number.isFinite(zeta) && zeta < 1 && zeta > 0 ? zeta.toFixed(2) : '—', sub: `ω_n = ${Number.isFinite(wn) ? wn.toFixed(2) : '—'} rad/s` },
      ]} />
    </div>
    <figure class="side" style="max-width: 300px">
      <PZPlot re={[-4, 2]} im={[-4, 4]} size={300} poles={eig.map((e) => ({ re: e.re, im: e.im }))} ariaLabel="Eigenvalues of A" />
      <figcaption><b>Fig. B.2</b> Eigenvalues of <i>A</i>: the poles of the short period.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-6, 6]} xLabel="t [s]" yLabel="α [°], q [°/s]" unitX="s" ariaLabel="Free response from an initial angle of attack of 2 degrees"
        series={[{ x: sim.t, y: sim.a, kind: 'ink' }, { x: sim.t, y: sim.q, kind: 'spec' }]} hlines={[{ at: 0, kind: 'muted', dash: false }]} />
      <figcaption><b>Fig. B.3</b> Free motion after a 2° gust in angle of attack. Black: <i>α</i>. Blue: <i>q</i>.</figcaption>
    </figure>
  </div>
</Sheet>

<style>
  .matrix { display: flex; align-items: center; gap: 10px; font-family: var(--font-ui); font-size: 15px; }
  .matrix table { border-left: 1.5px solid var(--ink); border-right: 1.5px solid var(--ink); border-collapse: separate; border-spacing: 10px 2px; font-variant-numeric: tabular-nums; }
  .matrix td { text-align: right; }
  .matrix td.hl { color: var(--grab-ink); font-weight: 700; }
</style>

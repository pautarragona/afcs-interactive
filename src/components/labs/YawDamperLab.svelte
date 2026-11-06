<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { rk4 } from '../../sim/lti';

  // Illustrative two-state Dutch roll model (sideslip β, yaw rate r)
  const Yb = -0.15, Nb = 4.0, Nr = -0.2, Nd = 2.0;
  let Kr = $state(0.6);
  let tau = $state(1.5);
  let washout = $state(true);
  const T = 20, dP = 0.05;
  const rad = Math.PI / 180;

  function sim(k: number, wo: boolean) {
    const t: number[] = [], r: number[] = [];
    rk4((_, x) => {
      const [b, rr, w] = x;
      const rf = wo ? rr - w : rr; // washout s·τ/(sτ+1) via filter state w
      const d = dP - k * rf;
      return [Yb * b - rr, Nb * b + Nr * rr + Nd * d, (rr - w) / tau];
    }, [0, 0, 0], T, 2000, (tt, x) => { t.push(tt); r.push(x[1] / rad); });
    return { t, r };
  }
  const none = sim(0, false);
  const cur = $derived(sim(Kr, washout));
  const nrEff = $derived(Nr - Nd * Kr);
  const wn = Math.sqrt(Yb * Nr + Nb);
  const zBare = -(Yb + Nr) / (2 * wn);
  const zDamp = $derived(-(Yb + nrEff) / (2 * Math.sqrt(Yb * nrEff + Nb)));
  const rss = (k: number, wo: boolean) => ((-Nd * dP) / (Nb / Yb + (wo ? Nr : Nr - Nd * k))) / rad;
</script>

<Sheet hint="The pilot holds a small rudder input to turn. The yaw damper should kill the Dutch roll wobble, but should it also fight the turn?">
  {#snippet actions()}
    <Switch label="Feedback filter" bind:value={washout} options={[{ value: false, label: 'Direct' }, { value: true, label: 'Washout' }]} />
  {/snippet}
  <div class="row">
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[-0.2, Math.max(...none.r) * 1.15]} xLabel="t [s]" yLabel="r [°/s]" unitX="s" ariaLabel="Yaw rate during a rudder-held turn"
        series={[{ x: none.t, y: none.r, kind: 'ghost' }, { x: cur.t, y: cur.r }]} hlines={[{ at: rss(0, false), kind: 'spec', label: 'turn rate the pilot asked for' }]} />
      <figcaption><b>Fig. 6.3</b> Yaw rate with the rudder held. Grey: no damper. Black: with the damper.</figcaption>
    </figure>
    <div class="side controls">
      <Slider bind:value={Kr} min={0} max={2} step={0.02} unit="s" digits={2}>Yaw damper gain <i class="m">K</i><sub>r</sub></Slider>
      <Slider bind:value={tau} min={0.3} max={6} step={0.1} unit="s" digits={1}>Washout time constant <i class="m">τ</i><sub>w</sub></Slider>
      <Readout cells={[
        { label: 'Dutch roll damping', sym: 'ζ', value: zDamp.toFixed(2), sub: `no damper: ${zBare.toFixed(2)}`, state: zDamp > 0.3 ? 'good' : '' },
        { label: 'Steady turn rate', value: rss(Kr, washout).toFixed(2), unit: '°/s', state: !washout && Kr > 0.1 ? 'bad' : '', sub: washout ? 'washout lets the turn through' : 'the damper fights the turn' },
      ]} />
    </div>
  </div>
</Sheet>

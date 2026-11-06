<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { feedback, simulate, tf, poles } from '../../sim/lti';

  type Ty = 0 | 1 | 2;
  type In = 'step' | 'ramp' | 'parabola';
  let type = $state<Ty>(1);
  let input = $state<In>('ramp');
  const kRange: Record<Ty, [number, number]> = { 0: [0.2, 50], 1: [0.1, 8], 2: [0.2, 20] };
  let K = $state(2);
  $effect(() => { const [lo, hi] = kRange[type]; if (K < lo || K > hi) K = Math.min(hi, Math.max(lo, K)); });

  const T_END = 20;
  const G = $derived(type === 0 ? tf([K], [0.5, 1.5, 1]) : type === 1 ? tf([K], [0.2, 1.2, 1, 0]) : tf([K, 0.5 * K], [1, 3, 0, 0]));
  const r = (t: number) => (input === 'step' ? 1 : input === 'ramp' ? t : 0.5 * t * t);
  const sim = $derived(simulate(feedback(G), r, T_END, 401));
  const ref = $derived(sim.t.map(r));
  const err = $derived(sim.t.map((t, i) => ref[i] - sim.y[i]));
  const stable = $derived(poles(feedback(G)).every((p) => p.re < 0));

  const Kp = $derived(type === 0 ? K : Infinity);
  const Kv = $derived(type === 0 ? 0 : type === 1 ? K : Infinity);
  const Ka = $derived(type === 2 ? K / 6 : 0);
  const predicted = $derived(input === 'step' ? 1 / (1 + Kp) : input === 'ramp' ? 1 / Kv : 1 / Ka);
  const showK = (v: number) => (v === Infinity ? '∞' : v.toFixed(2));
  const showE = (v: number) => (v === Infinity ? '∞' : v === 0 ? '0' : v.toFixed(3));
</script>

<Sheet hint="Choose how many integrators the loop has and what it must follow, then tune the gain.">
  {#snippet actions()}
    <Switch label="Loop type" bind:value={type} options={[{ value: 0, label: 'Type 0' }, { value: 1, label: 'Type 1' }, { value: 2, label: 'Type 2' }]} />
    <Switch label="Reference" bind:value={input} options={[{ value: 'step', label: 'Step' }, { value: 'ramp', label: 'Ramp' }, { value: 'parabola', label: 'Parabola' }]} />
  {/snippet}
  <div class="row">
    <figure class="grow">
      <Plot xRange={[0, T_END]} yRange={input === 'step' ? [-0.1, 1.8] : undefined} xLabel="t [s]" yLabel="r(t), y(t)" unitX="s" ariaLabel="Reference and output"
        series={[{ x: sim.t, y: ref, kind: 'spec', dash: true }, { x: sim.t, y: sim.y, kind: stable ? 'ink' : 'bad' }]} />
      <figcaption><b>Fig. 2.1</b> Blue dashed: reference. <span class="c-ink"></span>: output of the closed loop.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, T_END]} yRange={stable ? [Math.min(-0.2, ...err.slice(40)) , Math.max(1.05, Math.min(5, Math.max(...err)))] : [-3, 3]} xLabel="t [s]" yLabel="e(t) = r − y" unitX="s" ariaLabel="Tracking error"
        series={[{ x: sim.t, y: err, kind: 'ink' }]} hlines={[{ at: 0, kind: 'muted', dash: false }, ...(Number.isFinite(predicted) && stable ? [{ at: predicted, kind: 'spec' as const, label: `predicted ${showE(predicted)}` }] : [])]} />
      <figcaption><b>Fig. 2.2</b> The error. Blue: the steady-state value predicted by (2.4).</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls"><Slider bind:value={K} min={kRange[type][0]} max={kRange[type][1]} log digits={2}>Loop gain <i class="m">K</i></Slider></div>
    <div class="grow"><Readout cells={[
      { label: 'Position constant', sym: 'K<sub>p</sub>', value: showK(Kp) },
      { label: 'Velocity constant', sym: 'K<sub>v</sub>', value: showK(Kv) },
      { label: 'Acceleration constant', sym: 'K<sub>a</sub>', value: showK(Ka) },
      { label: 'Steady-state error', sym: 'e<sub>ss</sub>', value: stable ? showE(predicted) : '—', state: !stable ? 'bad' : predicted === 0 ? 'good' : predicted === Infinity ? 'bad' : '', sub: stable ? `simulated at 20 s: ${err[err.length - 1].toFixed(3)}` : 'closed loop unstable' },
    ]} /></div>
  </div>
</Sheet>

<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Plot from '../ui/Plot.svelte';
  import PZPlot from '../ui/PZPlot.svelte';
  import Readout from '../ui/Readout.svelte';
  import Switch from '../ui/Switch.svelte';
  import { step, stepInfo, tf } from '../../sim/lti';

  let mode = $state<'first' | 'zero'>('first');
  let pole = $state(-1); // first-order pole location
  let zero = $state(-3); // zero location for the second-order system
  let prev = $state<{ t: number[]; y: number[] } | null>(null);

  const T = 8;
  // Second-order base: zeta 0.6, wn 2  →  s² + 2.4 s + 4. Zero at z, DC gain 1: (s - z)/(-z)
  const G = $derived(mode === 'first' ? tf([-pole], [1, -pole]) : tf([-4 / zero, 4], [1, 2.4, 4]));
  const r = $derived(step(G, T, 321));
  const tau = $derived(-1 / pole);
  const info = $derived(stepInfo(r.t, r.y, 1));
  const undershoot = $derived(Math.max(0, -Math.min(...r.y)));

  function onmove(id: string, re: number) {
    prev = r;
    if (id === 'p') pole = Math.min(-0.2, Math.max(-5.5, re));
    else zero = Math.abs(re) < 0.3 ? (re < 0 ? -0.3 : 0.3) : Math.max(-6, Math.min(6, re));
  }
  $effect(() => { mode; prev = null; });

  const cells = $derived(mode === 'first'
    ? [
        { label: 'Pole', value: pole.toFixed(2), unit: '1/s' },
        { label: 'Time constant', sym: 'τ', value: tau.toFixed(2), unit: 's' },
        { label: 'Reaches 63 %', value: tau.toFixed(2), unit: 's' },
        { label: 'Within 2 %', sym: '≈ 4τ', value: (4 * tau).toFixed(2), unit: 's' },
      ]
    : [
        { label: 'Zero', value: zero.toFixed(2), unit: '1/s', sub: zero > 0 ? 'right half-plane' : 'left half-plane' },
        { label: 'Overshoot', value: info.overshootPct.toFixed(1), unit: '%', sub: 'without the zero: 9.5 %' },
        { label: 'Initial undershoot', value: (100 * undershoot).toFixed(1), unit: '%', state: (undershoot > 0.005 ? 'bad' : '') as 'bad' | '' },
        { label: 'Final value', value: '1.00', sub: 'the zero keeps G(0) = 1' },
      ]);
</script>

<Sheet hint="Drag the orange marker along the real axis. The faint curve is where you were before.">
  {#snippet actions()}
    <Switch label="System" bind:value={mode} options={[{ value: 'first', label: 'First order' }, { value: 'zero', label: 'Second order with a zero' }]} />
  {/snippet}
  <div class="row">
    <figure class="side" style="max-width: 340px">
      {#if mode === 'first'}
        <PZPlot re={[-6, 1]} im={[-2.5, 2.5]} poles={[{ re: pole, im: 0, id: 'p', drag: true }]} {onmove} ariaLabel={`Pole at ${pole}`} />
      {:else}
        <PZPlot re={[-6.5, 6.5]} im={[-4, 4]} poles={[{ re: -1.2, im: 1.6 }, { re: -1.2, im: -1.6 }]} zeros={[{ re: zero, im: 0, id: 'z', drag: true }]} {onmove} ariaLabel={`Zero at ${zero}`} />
      {/if}
      <figcaption><b>Fig. C.1</b> {mode === 'first' ? 'One real pole. Drag it left to make the system faster.' : 'Poles fixed at −1.2 ± j1.6; drag the zero, also across into the right half-plane.'}</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, T]} yRange={[mode === 'zero' ? -0.6 : -0.05, 1.5]} xLabel="t [s]" yLabel="y(t) [–]" unitX="s" ariaLabel="Unit step response"
        series={[...(prev ? [{ x: prev.t, y: prev.y, kind: 'ghost' as const }] : []), { x: r.t, y: r.y }]}
        hlines={[{ at: 1, kind: 'spec' }, ...(mode === 'first' ? [{ at: 0.632, kind: 'muted' as const, label: '63 %' }] : [])]}
        vlines={mode === 'first' && tau <= T ? [{ at: tau, kind: 'muted', label: 't = τ' }] : []} />
      <figcaption><b>Fig. C.2</b> Unit step response. Hover to read values.</figcaption>
    </figure>
  </div>
  <div style="margin-top: 14px"><Readout {cells} /></div>
</Sheet>

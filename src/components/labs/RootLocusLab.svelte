<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import PZPlot from '../ui/PZPlot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { feedback, fromRoots, gain, logspace, roots, rootLocus, step, stepInfo, tf, padd, pscale, dcGain } from '../../sim/lti';

  type Preset = 'two' | 'zero' | 'three';
  const presets: Record<Preset, { p: number[]; z: number[] }> = {
    two: { p: [0, -2], z: [] },
    zero: { p: [0, -2], z: [-4] },
    three: { p: [0, -2, -4], z: [] },
  };
  let preset = $state<Preset>('three');
  let P = $state<number[]>([...presets.three.p]);
  let Z = $state<number[]>([...presets.three.z]);
  let K = $state(8);
  $effect(() => { P = [...presets[preset].p]; Z = [...presets[preset].z]; });

  const G = $derived(tf(Z.length ? fromRoots(Z.map((re) => ({ re, im: 0 }))) : [1], fromRoots(P.map((re) => ({ re, im: 0 })))));
  const gains = logspace(-3, 3, 320);
  const loci = $derived(rootLocus(G, gains));
  const cl = $derived(roots(padd(G.den, pscale(G.num, K))));
  const stable = $derived(cl.every((p) => p.re < -1e-9));
  const kCrit = $derived.by(() => { for (const k of gains) if (roots(padd(G.den, pscale(G.num, k))).some((p) => p.re > 1e-9)) return k; return null; });
  const T = $derived(feedback(gain(G, K)));
  const sr = $derived(step(T, 10, 321));
  const yF = $derived(dcGain(T));
  const info = $derived(stepInfo(sr.t, sr.y, yF));
  const dom = $derived([...cl].sort((a, b) => b.re - a.re)[0]);
  const domZeta = $derived(dom ? -dom.re / Math.hypot(dom.re, dom.im) : NaN);

  function onmove(id: string, re: number) {
    const [kind, i] = [id[0], Number(id.slice(1))];
    const v = Math.max(-7.5, Math.min(1.5, re));
    if (kind === 'p') P = P.map((x, j) => (j === i ? v : x));
    else Z = Z.map((x, j) => (j === i ? v : x));
  }
  const f = (v: number) => v.toFixed(2).replace('-', '−');
</script>

<Sheet hint="Drag the open-loop poles (×) and zeros (○) along the real axis, then raise the gain and watch the closed-loop poles (■) travel along the locus.">
  {#snippet actions()}
    <Switch label="Open loop" bind:value={preset} options={[{ value: 'two', label: '2 poles' }, { value: 'zero', label: '2 poles + zero' }, { value: 'three', label: '3 poles' }]} />
  {/snippet}
  <div class="row">
    <figure class="side" style="max-width: 400px">
      <PZPlot re={[-8, 2]} im={[-5, 5]} size={380} zetaLines={[0.6]} loci={loci}
        poles={P.map((re, i) => ({ re, im: 0, id: `p${i}`, drag: true }))} zeros={Z.map((re, i) => ({ re, im: 0, id: `z${i}`, drag: true }))}
        closed={cl} {onmove} ariaLabel="Root locus" />
      <figcaption><b>Fig. 3.1</b> Root locus of 1 + <i>K G</i>(<i>s</i>) = 0. Blue dashed: <i>ζ</i> = 0.6.</figcaption>
    </figure>
    <div class="grow">
      <figure>
        <Plot xRange={[0, 10]} yRange={[-0.2, Math.max(1.6, Math.min(3, (info.peak ?? 1) * 1.1))]} xLabel="t [s]" yLabel="y(t) [–]" unitX="s" ariaLabel="Closed-loop step response"
          series={[{ x: sr.t, y: sr.y, kind: stable ? 'ink' : 'bad' }]} hlines={[{ at: Number.isFinite(yF) ? yF : 1, kind: 'spec' }]} />
        <figcaption><b>Fig. 3.2</b> Closed-loop step response at the selected gain.</figcaption>
      </figure>
      <div class="controls" style="margin-top: 12px">
        <Slider bind:value={K} min={0.01} max={1000} log digits={2}>Gain <i class="m">K</i></Slider>
        <Readout cells={[
          { label: 'Dominant poles', value: dom ? (Math.abs(dom.im) > 1e-6 ? `${f(dom.re)} ± j${Math.abs(dom.im).toFixed(2)}` : f(dom.re)) : '—', state: stable ? '' : 'bad', sub: stable ? 'stable' : 'unstable' },
          { label: 'Their damping', sym: 'ζ', value: Number.isFinite(domZeta) ? domZeta.toFixed(2) : '—', state: stable && domZeta >= 0.6 ? 'good' : '' },
          { label: 'Overshoot', value: stable ? info.overshootPct.toFixed(1) : '—', unit: '%' },
          { label: 'Unstable above', value: kCrit ? kCrit.toPrecision(3) : 'never', sub: 'gain where a branch crosses' },
        ]} />
      </div>
    </div>
  </div>
</Sheet>

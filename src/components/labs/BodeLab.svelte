<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Switch from '../ui/Switch.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { bode, feedback, logspace, margins, series, step, stepInfo, tf, pade, poles, gain } from '../../sim/lti';

  let K = $state(1);
  let delay = $state(0);
  let lead = $state(false);
  const plant = tf([1], [0.2, 1.2, 1, 0]); // 1/(s(s+1)(0.2s+1))
  const leadC = tf([0.5, 1], [0.05, 1]); // (1 + s/2)/(1 + s/20)
  const L = $derived(gain(lead ? series(leadC, plant) : plant, K));
  const w = logspace(-2, 2, 400);
  const b = $derived(bode(L, w, delay));
  const m = $derived(margins(L, delay, -2, 2));
  const T = $derived(feedback(series(L, pade(delay))));
  const stable = $derived(poles(T).every((p) => p.re < -1e-9));
  const sr = $derived(step(T, 15, 301));
  const info = $derived(stepInfo(sr.t, sr.y, 1));
  const pmOk = $derived(m.pm !== null && m.pm >= 45);
  const magAt = (wx: number) => b.magDb[b.w.findIndex((v) => v >= wx)] ?? 0;
</script>

<Sheet hint="Raise the gain, add delay, or switch on the lead compensator. Margins are marked in orange on the plots.">
  {#snippet actions()}
    <Switch label="Controller" bind:value={lead} options={[{ value: false, label: 'Gain only' }, { value: true, label: 'Gain + lead' }]} />
  {/snippet}
  <div class="row">
    <div class="grow">
      <figure>
        <Plot xRange={[0.01, 100]} logX yRange={[-60, 60]} height={230} xLabel="ω [rad/s]" yLabel="|L(jω)| [dB]" unitX="rad/s" ariaLabel="Bode magnitude"
          series={[{ x: w, y: b.magDb }]} hlines={[{ at: 0, kind: 'muted', dash: false }]}
          vlines={[...(m.wc ? [{ at: m.wc, kind: 'grab' as const, label: 'ω_c' }] : []), ...(m.w180 ? [{ at: m.w180, kind: 'muted' as const }] : [])]}
          points={m.w180 && m.gm !== null ? [{ x: m.w180, y: -m.gm, kind: 'grab', label: `GM ${m.gm.toFixed(1)} dB` }] : []} />
      </figure>
      <figure>
        <Plot xRange={[0.01, 100]} logX yRange={[-360, -45]} yTicks={[-360, -270, -180, -90]} height={230} xLabel="ω [rad/s]" yLabel="∠L(jω) [°]" unitX="rad/s" ariaLabel="Bode phase"
          series={[{ x: w, y: b.phaseDeg }]} hlines={[{ at: -180, kind: 'bad', label: '−180°' }]}
          vlines={[...(m.wc ? [{ at: m.wc, kind: 'grab' as const }] : []), ...(m.w180 ? [{ at: m.w180, kind: 'muted' as const, label: 'ω_180' }] : [])]}
          points={m.wc && m.pm !== null ? [{ x: m.wc, y: m.pm - 180, kind: 'grab', label: `PM ${m.pm.toFixed(0)}°` }] : []} />
        <figcaption><b>Fig. 4.1</b> Bode plot of the open loop <i>L</i>(<i>s</i>). Orange: crossover and the margins measured there.</figcaption>
      </figure>
    </div>
    <div class="side">
      <figure>
        <Plot xRange={[0, 15]} yRange={[-0.2, 2]} height={260} xLabel="t [s]" yLabel="y(t) [–]" unitX="s" ariaLabel="Closed-loop step response"
          series={[{ x: sr.t, y: sr.y, kind: stable ? 'ink' : 'bad' }]} hlines={[{ at: 1, kind: 'spec' }]} />
        <figcaption><b>Fig. 4.2</b> Closed-loop step response.</figcaption>
      </figure>
      <div class="controls" style="margin-top: 12px">
        <Slider bind:value={K} min={0.1} max={30} log digits={2}>Gain <i class="m">K</i></Slider>
        <Slider bind:value={delay} min={0} max={0.4} step={0.01} unit="s" digits={2}>Time delay <i class="m">τ</i></Slider>
      </div>
    </div>
  </div>
  <div style="margin-top: 14px"><Readout cells={[
    { label: 'Crossover', sym: 'ω<sub>c</sub>', value: m.wc ? m.wc.toFixed(2) : '—', unit: 'rad/s' },
    { label: 'Phase margin', value: m.pm !== null ? m.pm.toFixed(0) : '—', unit: '°', state: !stable ? 'bad' : pmOk ? 'good' : '', sub: 'aim for 45° or more' },
    { label: 'Gain margin', value: m.gm !== null ? m.gm.toFixed(1) : '∞', unit: 'dB', state: !stable ? 'bad' : '', sub: 'aim for 6 dB or more' },
    { label: 'Overshoot', value: stable ? info.overshootPct.toFixed(0) : 'unstable', unit: stable ? '%' : '', state: stable ? '' : 'bad' },
  ]} /></div>
</Sheet>

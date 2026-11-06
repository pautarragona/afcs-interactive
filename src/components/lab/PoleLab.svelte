<script lang="ts">
  import { metrics } from '../../sim/secondOrder';
  import SPlane from './SPlane.svelte';
  import StepPlot from './StepPlot.svelte';
  import TitleBlock from './TitleBlock.svelte';
  import Dial from './Dial.svelte';
  import Attitude from './Attitude.svelte';
  import { lab, play, reset, setOmegaN, setZeta } from './state.svelte';

  let { fig = '1' }: { fig?: string } = $props();
  const m = $derived(metrics(lab.poles));
  const stable = $derived(m.stability === 'stable');
</script>

<section class="bench" aria-label="Interactive bench: s-plane and step response">
  <div class="bar">
    <p>Anything orange can be grabbed. Drag a pole ring or turn a dial needle.</p>
    <div class="actions">
      <button type="button" class="btn" onclick={play}>Play the response</button>
      <button type="button" class="btn-line" onclick={reset}>Reset</button>
    </div>
  </div>
  <div class="figs">
    <figure class="fig-s">
      <SPlane />
      <figcaption><b>Fig. {fig}.1</b> The s-plane. Drag a pole; its conjugate follows.</figcaption>
    </figure>
    <figure class="fig-t">
      <StepPlot />
      <figcaption><b>Fig. {fig}.2</b> Response to a unit step, like a sharp elevator command. Grey: your previous poles. Hover to read values.</figcaption>
    </figure>
  </div>
  <div class="lower">
    <div class="tb"><TitleBlock /></div>
    <div class="instruments">
      <Dial label="Damping ratio" min={0} max={1} major={0.5} minor={0.1} value={m.zeta} disabled={!stable} onchange={setZeta}>Damping <i class="m">ζ</i></Dial>
      <Dial label="Natural frequency" unit="rad/s" min={0} max={4} major={1} minor={0.5} value={m.omegaN} disabled={!stable} onchange={setOmegaN}>Frequency <i class="m">ω</i><sub>n</sub></Dial>
      <Attitude />
    </div>
  </div>
</section>

<style>
  .bench {
    border: 1.5px solid var(--frame);
    border-radius: var(--r-md);
    background-color: var(--paper);
    background-image: linear-gradient(var(--paper-line) 1px, transparent 1px), linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);
    background-size: 16px 16px;
    box-shadow: var(--sheet-shadow);
    padding: clamp(14px, 2.5vw, 22px);
    font-family: var(--font-ui);
  }
  .bar { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; justify-content: space-between; }
  .bar p { margin: 0; font-size: 14px; max-width: 46ch; }
  .actions { display: flex; gap: 8px; }
  .figs { display: flex; flex-wrap: wrap; gap: 16px 24px; margin-top: 14px; }
  figure { margin: 0; }
  .fig-s { flex: 1 1 260px; max-width: 360px; }
  .fig-t { flex: 999 1 420px; min-width: 0; }
  figcaption { font-family: var(--font-text); font-size: 15px; color: var(--muted); margin-top: 2px; }
  figcaption b { font-family: var(--font-ui); font-weight: 400; color: var(--ink); margin-right: 4px; }
  .lower { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; align-items: stretch; }
  .tb { flex: 999 1 440px; min-width: 0; }
  .instruments { flex: 1 1 320px; display: flex; justify-content: space-around; align-items: center; gap: 8px; background: var(--paper); border: 1.5px solid var(--frame); padding: 8px; }
</style>

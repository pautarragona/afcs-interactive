<script lang="ts">
  import SPlane from './SPlane.svelte';
  import StepPlot from './StepPlot.svelte';
  import Readouts from './Readouts.svelte';
  import { reset, lab } from './state.svelte';
</script>

<section class="lab" aria-label="Interactive s-plane and step response">
  <div class="lab-head">
    <p class="lab-hint">Drag either pole; its pair mirrors it. Keyboard: focus a pole and use the arrow keys.</p>
    <ul class="legend" aria-label="Colour key">
      <li><span class="swatch response"></span>What the system does</li>
      <li><span class="swatch target"></span>Target</li>
      <li><span class="swatch caution"></span>Caution</li>
      {#if lab.previous}<li><span class="swatch ghost"></span>Previous</li>{/if}
    </ul>
  </div>
  <div class="figures">
    <figure class="fig fig-splane">
      <figcaption>s-plane</figcaption>
      <SPlane />
    </figure>
    <figure class="fig fig-step">
      <figcaption>Step response</figcaption>
      <StepPlot />
    </figure>
  </div>
  <Readouts />
  <div class="lab-actions">
    <button type="button" class="btn-quiet" onclick={reset}>Reset poles</button>
  </div>
</section>

<style>
  .lab { background: var(--lab-bg); color: var(--lab-ink); border-radius: var(--radius-lg); padding: clamp(16px, 3vw, 28px); }
  .lab-head { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; justify-content: space-between; }
  .lab-hint { margin: 0; font-weight: 600; color: var(--lab-ink-strong); }
  .legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 16px; font-size: 15px; }
  .legend li { display: flex; align-items: center; gap: 8px; }
  .swatch { width: 18px; height: 3px; border-radius: 2px; display: inline-block; }
  .swatch.response { background: var(--plot-response); }
  .swatch.target { background: var(--plot-target); }
  .swatch.caution { background: var(--plot-caution); }
  .swatch.ghost { background: var(--plot-ghost); }
  .figures { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
  .fig { margin: 0; background: var(--fig-bg); border: var(--fig-border); border-radius: var(--radius-md); padding: 12px 14px; }
  .fig figcaption { font-weight: 700; font-size: 15px; margin-bottom: 4px; color: var(--lab-ink-strong); }
  .fig-splane { flex: 1 1 260px; max-width: 360px; }
  .fig-step { flex: 999 1 420px; min-width: 0; }
  .lab-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
  .btn-quiet { font: inherit; font-size: 15px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-sm); border: 1px solid var(--lab-rule); background: transparent; color: var(--lab-ink); cursor: pointer; }
  .btn-quiet:hover { border-color: var(--lab-ink); }
  .btn-quiet:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
</style>

<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';
  import Plot from '../ui/Plot.svelte';
  import Readout from '../ui/Readout.svelte';
  import { simulate, tf } from '../../sim/lti';

  const g = 9.81;
  let wn = $state(3);
  let zeta = $state(0.5);
  let V = $state(120);
  let T2 = $state(1.2);

  const nza = $derived(V / (g * T2));
  const cap = $derived((wn * wn) / nza);
  const level = $derived(cap >= 0.28 && cap <= 3.6 && zeta >= 0.35 && zeta <= 1.3 ? 1 : cap >= 0.16 && cap <= 10 && zeta >= 0.25 && zeta <= 2 ? 2 : 3);
  const db = $derived(T2 - (2 * zeta) / wn);

  // Pitch rate per unit stick, normalised to q_ss = 1 °/s; stick held 4 s then released
  const REL = 4, TE = 10;
  const q = $derived(simulate(tf([wn * wn * T2, wn * wn], [1, 2 * zeta * wn, wn * wn]), (t) => (t < REL ? 1 : 0), TE, 501));
  const theta = $derived.by(() => { const out: number[] = [0]; for (let i = 1; i < q.t.length; i++) out.push(out[i - 1] + 0.5 * (q.y[i] + q.y[i - 1]) * (q.t[i] - q.t[i - 1])); return out; });
  const thRel = $derived(theta[Math.round((REL / TE) * 500)]);

  // CAP chart, log-log: ζ 0.1…3, CAP 0.05…20
  const W = 300, H = 230, L = 44, B = 34, Tp = 10;
  const lx = (z: number) => L + ((Math.log10(z) + 1) / (Math.log10(3) + 1)) * (W - L - 10);
  const ly = (c: number) => Tp + (1 - (Math.log10(c) - Math.log10(0.05)) / (Math.log10(20) - Math.log10(0.05))) * (H - Tp - B);
  const box = (z0: number, z1: number, c0: number, c1: number) => ({ x: lx(z0), y: ly(c1), w: lx(z1) - lx(z0), h: ly(c0) - ly(c1) });
  const l1 = box(0.35, 1.3, 0.28, 3.6), l2 = box(0.25, 2, 0.16, 10);
  const pt = $derived({ x: lx(Math.min(3, Math.max(0.1, zeta))), y: ly(Math.min(20, Math.max(0.05, cap))) });
</script>

<Sheet hint="Shape the short period and see where it lands on the CAP chart, then check the attitude response a pilot would feel when releasing the stick.">
  <div class="row">
    <figure class="side" style="max-width: 360px">
      <svg viewBox={`0 0 ${W} ${H}`} class="cap" role="img" aria-label={`CAP ${cap.toFixed(2)}, damping ${zeta.toFixed(2)}, Level ${level}`}>
        <rect class="paper" x={L} y={Tp} width={W - L - 10} height={H - Tp - B} />
        <rect class="l2" x={l2.x} y={l2.y} width={l2.w} height={l2.h} />
        <rect class="l1" x={l1.x} y={l1.y} width={l1.w} height={l1.h} />
        <text class="lbl spec" x={l1.x + 4} y={l1.y + 13}>Level 1</text>
        <text class="lbl" x={l2.x + 4} y={l2.y + 13}>Level 2</text>
        <rect class="frame" x={L} y={Tp} width={W - L - 10} height={H - Tp - B} />
        {#each [0.1, 0.2, 0.5, 1, 2] as z}<text class="tick" x={lx(z)} y={H - B + 14} text-anchor="middle">{z}</text><line class="frame" x1={lx(z)} x2={lx(z)} y1={H - B} y2={H - B - 4} />{/each}
        {#each [0.1, 1, 10] as c}<text class="tick" x={L - 5} y={ly(c) + 4} text-anchor="end">{c}</text><line class="frame" x1={L} x2={L + 4} y1={ly(c)} y2={ly(c)} />{/each}
        <circle class="dot" class:bad={level === 3} cx={pt.x} cy={pt.y} r="6" />
        <text class="axis" x={(L + W - 10) / 2} y={H - 4} text-anchor="middle">short-period damping ζ [–]</text>
        <text class="axis" x="10" y={(Tp + H - B) / 2} text-anchor="middle" transform={`rotate(-90 10 ${(Tp + H - B) / 2})`}>CAP [1/(g·s²)]</text>
      </svg>
      <figcaption><b>Fig. 7.1</b> CAP against short-period damping, flight phase category A (MIL-F-8785C), log scales.</figcaption>
    </figure>
    <figure class="grow">
      <Plot xRange={[0, TE]} yRange={[-0.2, Math.max(6, Math.max(...theta) * 1.1)]} xLabel="t [s]" yLabel="θ [°], q [°/s]" unitX="s" ariaLabel="Pitch rate and attitude, stick held then released"
        series={[{ x: q.t, y: q.y, kind: 'spec' }, { x: q.t, y: theta, kind: 'ink' }]}
        vbands={[{ from: 0, to: REL, kind: 'grab' }]} hlines={[{ at: thRel, kind: 'muted', label: 'attitude at release' }]} />
      <figcaption><b>Fig. 7.2</b> Stick held for 4 s (orange band) then released. Blue: pitch rate, steady value 1 °/s. Black: pitch attitude; watch it after release.</figcaption>
    </figure>
  </div>
  <div class="row" style="margin-top: 14px; align-items: stretch">
    <div class="side controls">
      <Slider bind:value={wn} min={1} max={8} step={0.05} unit="rad/s" digits={2}><i class="m">ω</i><sub>sp</sub></Slider>
      <Slider bind:value={zeta} min={0.1} max={2} step={0.01} digits={2}><i class="m">ζ</i><sub>sp</sub></Slider>
      <Slider bind:value={V} min={60} max={250} step={1} unit="m/s" digits={0}>Airspeed <i class="m">V</i></Slider>
      <Slider bind:value={T2} min={0.3} max={3} step={0.05} unit="s" digits={2}>Lift lag <i class="m">T</i><sub>θ2</sub></Slider>
    </div>
    <div class="grow"><Readout cells={[
      { label: 'Load factor per α', sym: 'n<sub>z</sub>/α', value: nza.toFixed(1), unit: 'g/rad' },
      { label: 'CAP', value: cap.toFixed(2), unit: '1/(g·s²)' },
      { label: 'Rating', value: level === 1 ? 'Level 1' : level === 2 ? 'Level 2' : 'Level 3', state: level === 1 ? 'good' : level === 3 ? 'bad' : '' },
      { label: 'Dropback', sym: 'DB/q<sub>ss</sub>', value: db.toFixed(2), unit: 's', sub: db < 0 ? 'attitude keeps creeping on' : 'attitude drops back' },
    ]} /></div>
  </div>
</Sheet>

<style>
  .cap { width: 100%; height: auto; display: block; font-family: var(--font-ui); }
  .paper { fill: var(--paper); }
  .frame { fill: none; stroke: var(--frame); stroke-width: 1; }
  .l2 { fill: var(--paper-line); stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 3; }
  .l1 { fill: var(--spec-soft); stroke: var(--spec); stroke-width: 1.3; }
  .lbl { font-size: 11px; fill: var(--muted); } .lbl.spec { fill: var(--spec); }
  .tick, .axis { font-size: 10.5px; fill: var(--muted); }
  .dot { fill: var(--grab); stroke: var(--paper); stroke-width: 2; transition: cx 120ms var(--ease), cy 120ms var(--ease); }
  .dot.bad { fill: var(--bad); }
</style>

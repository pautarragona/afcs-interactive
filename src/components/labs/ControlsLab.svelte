<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Slider from '../ui/Slider.svelte';

  let pitch = $state(0); // stick: -1 forward, +1 back
  let roll = $state(0); // stick: -1 left, +1 right
  let yaw = $state(0); // pedals: -1 left, +1 right
  // Illustrative attitude change after a short input, degrees
  const th = $derived(pitch * 12), ph = $derived(roll * 30), ps = $derived(yaw * 15);
  const word = (v: number, neg: string, pos: string) => (Math.abs(v) < 0.05 ? 'centred' : v > 0 ? pos : neg);
</script>

<Sheet hint="Move the stick and pedals. Each view shows the rotation it produces about one body axis.">
  <div class="views">
    <figure>
      <svg viewBox="-70 -50 140 100" role="img" aria-label={`Side view, nose ${th >= 0 ? 'up' : 'down'} ${Math.abs(th).toFixed(0)} degrees`}>
        <line class="ref" x1="-70" y1="0" x2="70" y2="0" />
        <g style={`transform: rotate(${-th}deg)`} class="rot"><path class="ac" d="M-34 0 C-28 -4 18 -5 28 -2 C34 -1 35 1 28 2 C18 4 -28 3 -34 1 Z M-34 0 L-40 -13 L-33 -13 L-25 -1 Z M-8 1 L8 1 L3 5 L-12 5 Z" /><path class={`surf ${Math.abs(pitch) > 0.05 ? 'on' : ''}`} d={`M-34 0 l-8 ${-pitch * 5}`} /></g>
        <circle class="axis-dot" r="3" /><text class="t" x="-66" y="44">pitch about y, rate q</text>
      </svg>
      <figcaption>Stick {word(pitch, 'forward', 'back')}: elevator trailing edge {word(pitch, 'down', 'up')}, nose {word(pitch, 'down', 'up')}.</figcaption>
    </figure>
    <figure>
      <svg viewBox="-70 -50 140 100" role="img" aria-label={`Rear view, bank ${Math.abs(ph).toFixed(0)} degrees ${ph >= 0 ? 'right' : 'left'}`}>
        <line class="ref" x1="-70" y1="0" x2="70" y2="0" />
        <g style={`transform: rotate(${ph}deg)`} class="rot"><path class="ac" d="M-56 1 L-6 -1 L6 -1 L56 1 L56 3 L6 3 L-6 3 L-56 3 Z M-2 -16 L2 -16 L2 -4 L-2 -4 Z M-16 -6 L16 -6 L16 -4 L-16 -4 Z" /><circle class="ac" r="6" cy="1" /><path class={`surf ${Math.abs(roll) > 0.05 ? 'on' : ''}`} d={`M-50 2 l0 ${roll * 6} M50 2 l0 ${-roll * 6}`} /></g>
        <circle class="axis-dot" r="3" /><text class="t" x="-66" y="44">roll about x, rate p</text>
      </svg>
      <figcaption>Stick {word(roll, 'left', 'right')}: {Math.abs(roll) < 0.05 ? 'ailerons neutral' : roll > 0 ? 'right aileron up, left down, right wing drops' : 'left aileron up, right down, left wing drops'}.</figcaption>
    </figure>
    <figure>
      <svg viewBox="-70 -50 140 100" role="img" aria-label={`Top view, nose ${ps >= 0 ? 'right' : 'left'} ${Math.abs(ps).toFixed(0)} degrees`}>
        <line class="ref" x1="-70" y1="0" x2="70" y2="0" />
        <g style={`transform: rotate(${ps}deg)`} class="rot"><path class="ac" d="M-36 -2 L30 -3 C36 -2 36 2 30 3 L-36 2 Z M-6 -44 L4 -44 L8 -3 L8 3 L4 44 L-6 44 L-10 3 L-10 -3 Z M-36 -14 L-30 -14 L-28 14 L-34 14 Z" /><path class={`surf ${Math.abs(yaw) > 0.05 ? 'on' : ''}`} d={`M-36 0 l-8 ${yaw * 5}`} /></g>
        <circle class="axis-dot" r="3" /><text class="t" x="-66" y="44">yaw about z, rate r</text>
      </svg>
      <figcaption>Pedals {word(yaw, 'left', 'right')}: rudder trailing edge {word(yaw, 'left', 'right')}, nose {word(yaw, 'left', 'right')}.</figcaption>
    </figure>
  </div>
  <div class="controls ctl">
    <Slider bind:value={pitch} min={-1} max={1} step={0.05}>Stick, forward to back</Slider>
    <Slider bind:value={roll} min={-1} max={1} step={0.05}>Stick, left to right</Slider>
    <Slider bind:value={yaw} min={-1} max={1} step={0.05}>Pedals, left to right</Slider>
  </div>
</Sheet>

<style>
  .views { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  @media (max-width: 720px) { .views { grid-template-columns: 1fr; } }
  figure { background: var(--paper); border: 1.5px solid var(--frame); padding: 8px; }
  svg { width: 100%; height: auto; display: block; font-family: var(--font-ui); }
  .ref { stroke: var(--muted); stroke-width: 0.6; stroke-dasharray: 3 3; }
  .rot { transition: transform 220ms var(--ease); transform-box: view-box; transform-origin: 0 0; }
  .ac { fill: var(--ink); }
  .surf { stroke: var(--ink); stroke-width: 2.5; stroke-linecap: round; }
  .surf.on { stroke: var(--grab); }
  .axis-dot { fill: var(--grab); }
  .t { font-size: 8px; fill: var(--muted); }
  figcaption { min-height: 3.2em; }
  .ctl { margin-top: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 720px) { .ctl { grid-template-columns: 1fr; } }
  @media (prefers-reduced-motion: reduce) { .rot { transition: none; } }
</style>

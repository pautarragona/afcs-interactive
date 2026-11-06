<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    digits?: number;
    log?: boolean;
    children: Snippet;
  }
  let { value = $bindable(), min, max, step = 0.01, unit = '', digits = 2, log = false, children }: Props = $props();
  const id = `sl-${Math.random().toString(36).slice(2, 8)}`;
  // Log sliders move an internal 0…1000 position.
  const toPos = (v: number) => (1000 * Math.log(v / min)) / Math.log(max / min);
  const fromPos = (p: number) => min * (max / min) ** (p / 1000);
  let pos = $state(log ? toPos(value) : value);
  $effect(() => { if (log) { const p = toPos(value); if (Math.abs(p - pos) > 0.5) pos = p; } });
  function input(e: Event) {
    const v = Number((e.currentTarget as HTMLInputElement).value);
    if (log) { pos = v; value = Number(fromPos(v).toPrecision(4)); } else value = v;
  }
  const fill = $derived(log ? pos / 10 : ((value - min) / (max - min)) * 100);
</script>

<div class="slider">
  <label for={id}>{@render children()}</label>
  <output for={id} class="num">{value.toFixed(digits)}{unit ? ` ${unit}` : ''}</output>
  <input {id} type="range" min={log ? 0 : min} max={log ? 1000 : max} step={log ? 1 : step} value={log ? pos : value} oninput={input} style={`--fill:${fill}%`} />
</div>

<style>
  .slider { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 2px 12px; font-family: var(--font-ui); font-size: 14px; }
  output { font-weight: 700; }
  input { grid-column: 1 / -1; width: 100%; margin: 6px 0 0; height: 28px; background: transparent; appearance: none; -webkit-appearance: none; cursor: pointer; }
  input::-webkit-slider-runnable-track { height: 4px; background: linear-gradient(to right, var(--ink) var(--fill), var(--rule) var(--fill)); border-radius: 2px; }
  input::-moz-range-track { height: 4px; background: var(--rule); border-radius: 2px; }
  input::-moz-range-progress { height: 4px; background: var(--ink); border-radius: 2px; }
  input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; margin-top: -7px; border-radius: 50%; background: var(--paper); border: 2.5px solid var(--grab); transition: transform 120ms var(--ease), box-shadow 120ms var(--ease); }
  input::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--paper); border: 2.5px solid var(--grab); }
  input:hover::-webkit-slider-thumb, input:active::-webkit-slider-thumb { transform: scale(1.18); box-shadow: var(--lift-shadow); }
  input:focus-visible { outline: none; }
  input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--grab-soft); }
</style>

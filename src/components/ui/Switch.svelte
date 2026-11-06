<script lang="ts" generics="T extends string | number | boolean">
  interface Props { value: T; options: { value: T; label: string }[]; label: string }
  let { value = $bindable(), options, label }: Props = $props();
  const name = `sw-${Math.random().toString(36).slice(2, 8)}`;
</script>

<fieldset class="switch">
  <legend>{label}</legend>
  <div class="opts">
    {#each options as o}
      <label class:on={o.value === value}>
        <input type="radio" {name} checked={o.value === value} onchange={() => (value = o.value)} />{o.label}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .switch { border: none; margin: 0; padding: 0; font-family: var(--font-ui); font-size: 14px; }
  legend { padding: 0; margin-bottom: 6px; }
  .opts { display: flex; flex-wrap: wrap; border: 1px solid var(--frame); border-radius: var(--r-sm); overflow: hidden; width: fit-content; }
  label { position: relative; padding: 9px 14px; min-height: 40px; display: flex; align-items: center; cursor: pointer; border-left: 1px solid var(--rule); transition: background-color 140ms var(--ease), color 140ms var(--ease); }
  label:first-child { border-left: none; }
  label:hover { background: var(--paper-line); }
  label.on { background: var(--ink); color: var(--page-bg); }
  input { position: absolute; opacity: 0; pointer-events: none; }
  label:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: -2px; }
</style>

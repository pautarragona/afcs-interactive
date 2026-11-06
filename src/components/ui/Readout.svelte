<script lang="ts" module>
  export interface Cell { label: string; sym?: string; value: string; unit?: string; sub?: string; state?: 'good' | 'bad' | '' }
</script>

<script lang="ts">
  let { cells }: { cells: Cell[] } = $props();
</script>

<table class="tb num" aria-live="polite">
  <caption>Live values</caption>
  <tbody>
    <tr>
      {#each cells as c}
        <td class={c.state ?? ''}>
          <span class="lbl">{c.label}</span>{#if c.sym}<span class="sym m">{@html c.sym}</span>{/if}
          <span class="val">{c.value}{#if c.unit} <small>{c.unit}</small>{/if}</span>
          {#if c.sub}<span class="sub">{c.sub}</span>{/if}
        </td>
      {/each}
    </tr>
  </tbody>
</table>

<style>
  .tb { width: 100%; border-collapse: collapse; background: var(--paper); border: 1.5px solid var(--frame); font-family: var(--font-ui); font-size: 13px; table-layout: fixed; }
  caption { position: absolute; left: -9999px; }
  td { border: 1px solid var(--rule); padding: 8px 12px; vertical-align: top; transition: background-color 220ms var(--ease); }
  .lbl { color: var(--muted); }
  .sym { float: right; font-size: 15px; }
  .val { display: block; font-size: 24px; font-weight: 700; line-height: 1.3; transition: color 220ms var(--ease); }
  .val small { font-size: 13px; font-weight: 400; color: var(--muted); }
  .sub { display: block; color: var(--muted); font-size: 12.5px; }
  .bad .val { color: var(--bad); }
  .good .val { color: var(--good); }
  td.good { background: var(--good-soft); }
  @media (max-width: 640px) { .tb tr { display: grid; grid-template-columns: 1fr 1fr; } .tb td { display: block; } }
</style>

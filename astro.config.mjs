import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

// Served from GitHub Pages at https://pautarragona.github.io/afcs-interactive/
export default defineConfig({
  site: 'https://pautarragona.github.io',
  base: '/afcs-interactive',
  trailingSlash: 'ignore',
  integrations: [svelte(), mdx()],
});

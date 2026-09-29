import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  site: 'https://www.refugeeworkrights.org',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [react(), sitemap()],
  vite: {
    // Lets both server code and the scorecard island import the per-country
    // .yaml data files in src/data/scorecards/ as plain objects.
    plugins: [yaml()],
  },
});

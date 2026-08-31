/// <reference types="astro/client" />

// YAML imports are handled by @rollup/plugin-yaml (see astro.config.mjs).
declare module '*.yaml' {
  const data: any;
  export default data;
}

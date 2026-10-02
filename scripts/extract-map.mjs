// Converts the theme's JQVMap registration (rwrap.world.js) into plain JSON:
// pre-projected SVG path strings per country plus a precomputed bbox for the
// detail-card inset map (replaces the original's runtime getBBox() hack).
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import pathBounds from 'svg-path-bounds';

// Theme from the Pantheon code backup — see the extraction note in copy-media.mjs.
const SRC =
  process.env.RWRAP_THEME ||
  `${process.env.RWRAP_DUMP || '/Users/jeremygaines/Code/refugee-work-rights-rebuild/pantheon-dump'}/code/refugee-work-rights-action-platform_live_2026-08-13T22-00-00_UTC_code/wp-content/themes/rwrap`;

const js = readFileSync(`${SRC}/assets/scripts/rwrap.world.js`, 'utf8');
const start = js.indexOf('{', js.indexOf("'addMap', 'rwrap'"));
const end = js.lastIndexOf(')');
const def = JSON.parse(js.slice(start, end));

const countries = {};
for (const [code, { path, name }] of Object.entries(def.paths)) {
  const [left, top, right, bottom] = pathBounds(path);
  countries[code] = { name, path, bbox: { x: left, y: top, width: right - left, height: bottom - top } };
}

mkdirSync('src/data', { recursive: true });
writeFileSync(
  'src/data/world-map.json',
  JSON.stringify({ width: def.width, height: def.height, countries }, null, 1),
);
console.log(`✓ world-map.json (${Object.keys(countries).length} paths, viewBox 0 0 ${def.width} ${def.height})`);

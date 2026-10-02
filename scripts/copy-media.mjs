// Copies into public/ every asset the extracted content actually references:
// uploads (images, CSVs, PDFs) from the Pantheon files dump, plus the theme's
// built CSS/fonts/SVGs and the Gutenberg block-library stylesheet.
import { readFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { collectUploadPaths } from './lib.mjs';

// Pantheon backups extracted under pantheon-dump/ (gitignored):
//   mkdir -p pantheon-dump/code pantheon-dump/files
//   tar xzf *_code.tar.gz -C pantheon-dump/code && tar xzf *_files.tar.gz -C pantheon-dump/files
const DUMP =
  process.env.RWRAP_DUMP || '/Users/jeremygaines/Code/refugee-work-rights-rebuild/pantheon-dump';
const FILES = `${DUMP}/files/files_live`;
const CODE = `${DUMP}/code/refugee-work-rights-action-platform_live_2026-08-13T22-00-00_UTC_code`;
const THEME_DIST = `${CODE}/wp-content/themes/rwrap/dist`;

// 1. Theme assets → public/assets/theme/ (markup rewrites dist/ → /assets/theme/)
mkdirSync('public/assets/theme/fonts', { recursive: true });
for (const f of readdirSync(THEME_DIST)) {
  const src = join(THEME_DIST, f);
  if (f === 'fonts') {
    for (const font of readdirSync(src)) copyFileSync(join(src, font), `public/assets/theme/fonts/${font}`);
  } else if (/\.(svg|png)$/.test(f)) {
    copyFileSync(src, `public/assets/theme/${f}`);
  }
}
// The theme stylesheet is imported by the layout (not served from public/) so
// Astro bundles it; fonts referenced relatively are vendored alongside in src/styles.
mkdirSync('src/styles/fonts', { recursive: true });
copyFileSync(`${THEME_DIST}/main.117f9532d10cf5730551.css`, 'src/styles/legacy.css');
// legacy.css references the SVG icon font relative to itself
copyFileSync(`${THEME_DIST}/refugee-work-rights.svg`, 'src/styles/refugee-work-rights.svg');
for (const font of readdirSync(`${THEME_DIST}/fonts`)) {
  copyFileSync(join(THEME_DIST, 'fonts', font), `src/styles/fonts/${font}`);
}

// 2. Gutenberg block-library CSS (enqueued on every page by WP core)
copyFileSync(
  `${CODE}/wp-includes/css/dist/block-library/style.min.css`,
  'src/styles/wp-block-library.css',
);

// 3. Every /wp-content/uploads/... path referenced by extracted content
const refs = new Set();
for (const dir of ['src/content/pages', 'src/data']) {
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.json')) collectUploadPaths(readFileSync(join(dir, f), 'utf8'), refs);
  }
}
// Favicons (referenced from the layout head, not page content)
for (const size of ['32x32', '192x192', '180x180', '270x270']) {
  refs.add(`/wp-content/uploads/2022/07/cropped-Fav-WR-1-${size}.png`);
}
// Footer logos (referenced from the footer component, not page content)
for (const logo of [
  'RAWR-Logo-White.png',
  'Asylum-Access-Logo-white.png',
  'CGD-Logo-White.png',
  'Refugees-International-Logo-white.png',
]) {
  refs.add(`/wp-content/uploads/2022/07/${logo}`);
}

let copied = 0;
let downloaded = 0;
const missing = [];
for (const ref of refs) {
  const rel = ref.replace('/wp-content/uploads/', '');
  const src = join(FILES, rel);
  const dest = join('public', ref);
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(src)) {
    copyFileSync(src, dest);
    copied++;
    continue;
  }
  // Not in the Pantheon files dump (e.g. resized variants, older year folders) —
  // fetch straight from the live site instead.
  const res = await fetch('https://refugeeworkrights.org' + encodeURI(ref), {
    headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
  });
  if (res.ok) {
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  } else {
    missing.push(`${ref} (HTTP ${res.status})`);
  }
}
console.log(`✓ media: ${copied} copied from dump, ${downloaded} downloaded from live, ${missing.length} missing`);
if (missing.length) {
  writeFileSync('scripts/missing-media.txt', missing.sort().join('\n'));
  console.log('  → see scripts/missing-media.txt');
}

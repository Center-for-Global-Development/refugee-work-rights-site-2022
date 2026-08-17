// Scrapes the live site's server-rendered HTML (no JS) into per-page JSON
// snapshots plus the shared head CSS, so the Astro build is hermetic.
import { load } from 'cheerio';
import { mkdirSync, writeFileSync } from 'node:fs';
import { LIVE, rewriteUrls } from './lib.mjs';

// All published pages (DB inventory), minus the junk `test` page.
// Paths follow live permalinks including parent nesting.
const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'about', path: '/about/' },
  { slug: 'campaign-history', path: '/about/campaign-history/' },
  { slug: 'learn-about-refugee-work-rights', path: '/learn-about-refugee-work-rights/' },
  { slug: 'legal-foundations', path: '/learn-about-refugee-work-rights/legal-foundations/' },
  { slug: 'key-research', path: '/learn-about-refugee-work-rights/key-research/' },
  { slug: 'take-action', path: '/take-action/' },
  { slug: 'our-supporters', path: '/our-supporters/' },
  { slug: 'press', path: '/press/' },
  { slug: 'contact-us', path: '/contact-us/' },
  { slug: 'scorecard', path: '/scorecard/' },
  { slug: 'scorecard-methodology', path: '/scorecard-methodology/' },
  { slug: 'dataset', path: '/dataset/' },
  { slug: 'about-the-refugee-rights-toolkit', path: '/about-the-refugee-rights-toolkit/' },
  { slug: 'privacy-policy', path: '/privacy-policy/' },
  { slug: 'terms-and-conditions', path: '/terms-and-conditions/' },
];

mkdirSync('src/content/pages', { recursive: true });
mkdirSync('src/styles', { recursive: true });

let sharedCaptured = false;

for (const page of PAGES) {
  const res = await fetch(LIVE + page.path, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' } });
  if (!res.ok) throw new Error(`${page.path}: HTTP ${res.status}`);
  const $ = load(await res.text());

  // Shared, site-wide head CSS — identical on every page; capture once.
  // Split around the block-library stylesheet to preserve WP's cascade order:
  // img-auto-sizes + emoji → block-library (vendored file) → classic-theme +
  // global-styles → theme CSS → wp-custom-css.
  if (!sharedCaptured) {
    writeFileSync(
      'src/styles/wp-inline-pre.css',
      [
        '/* Vendored WP inline head styles emitted before block-library (captured from live) */',
        style($, '#wp-img-auto-sizes-contain-inline-css'),
        style($, '#wp-emoji-styles-inline-css'),
      ].join('\n'),
    );
    writeFileSync(
      'src/styles/wp-inline-post.css',
      [
        '/* Vendored WP inline head styles emitted after block-library (captured from live) */',
        style($, '#classic-theme-styles-inline-css'),
        style($, '#global-styles-inline-css'),
      ].join('\n'),
    );
    writeFileSync('src/styles/wp-custom.css', style($, '#wp-custom-css'));
    sharedCaptured = true;
  }

  const main = $('main.main');
  if (!main.length) throw new Error(`${page.path}: no <main class="main">`);

  const record = {
    slug: page.slug,
    path: page.path,
    title: $('head title').text(),
    bodyClass: $('body').attr('class') || '',
    // Per-page Gutenberg layout CSS (flex/grid container rules) emitted at end of body.
    blockSupportsCss: style($, '#core-block-supports-inline-css'),
    main: rewriteUrls(main.html().trim()),
  };
  writeFileSync(`src/content/pages/${page.slug}.json`, JSON.stringify(record, null, 2));
  console.log(`✓ ${page.path} (${record.main.length} bytes of main HTML)`);
}

function style($, sel) {
  return ($(sel).html() || '').trim();
}

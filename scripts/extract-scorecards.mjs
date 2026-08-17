// Snapshots the three WP REST endpoints the Vue scorecard app consumed,
// trimmed to the fields the UI actually uses.
import { mkdirSync, writeFileSync } from 'node:fs';
import { LIVE, rewriteUrls } from './lib.mjs';

mkdirSync('src/data', { recursive: true });

const posts = await getJson('/wp-json/wp/v2/scorecard?per_page=100&orderby=title&order=asc');
const scorecards = posts.map((p) => ({
  id: p.id, // WP post ID — used to rebuild the original postid-N body class
  slug: p.slug,
  title: p.title.rendered,
  content: rewriteUrls(p.content.rendered),
  country_id: p.country_id,
  levels: p.levels, // { overall, de_jure, de_facto } as strings '0'-'5'
  survey_data: p.survey_data ? rewriteUrls(p.survey_data) : '',
}));
writeFileSync('src/data/scorecards.json', JSON.stringify(scorecards, null, 2));
console.log(`✓ scorecards.json (${scorecards.length} countries)`);

const keys = await getJson('/wp-json/rwrap/v1/keys/');
writeFileSync('src/data/keys.json', JSON.stringify(keys, null, 2));
console.log('✓ keys.json');

const footnotes = await getJson('/wp-json/rwrap/v1/footnotes/');
for (const k of Object.keys(footnotes)) {
  if (typeof footnotes[k] === 'string') footnotes[k] = rewriteUrls(footnotes[k]);
}
writeFileSync('src/data/footnotes.json', JSON.stringify(footnotes, null, 2));
console.log('✓ footnotes.json');

async function getJson(path) {
  const res = await fetch(LIVE + path, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

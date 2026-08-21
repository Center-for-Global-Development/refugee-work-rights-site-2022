// Build-time data — one editable YAML file per country in src/data/scorecards/
// (the filename is the country's URL slug) — plus the presentation constants
// that lived in the Vue store (store.js). This module is bundled into the
// client island, so the per-country files are inlined at build time via
// import.meta.glob; no runtime fetch.
import keysJson from '../data/keys.yaml';
import footnotesJson from '../data/footnotes.yaml';
import mapJson from '../data/world-map.json';

export interface Levels {
  de_jure: string;
  de_facto: string;
}

export interface ScorecardCard {
  id: number;
  country_id: string;
  title: string;
  content: string;
  levels: Levels; // key order drives chip order: de_jure then de_facto
  overall: string;
  survey_data: string;
  slug: string;
}

// Level → map fill color (store.js mapcolors getter). Note level 4 is #ffdf4f
// here while the chip CSS uses #fcdf4f — a drift present on the live site, kept.
export const COLOR_MAP: Record<string, string> = {
  '0': '#848484',
  '1': '#944d77',
  '2': '#f15b49',
  '3': '#faa841',
  '4': '#ffdf4f',
  '5': '#a0cf77',
};
export const HOVER_MAP: Record<string, string> = {
  '0': '#636363',
  '1': '#693755',
  '2': '#cc4e3d',
  '3': '#d48d36',
  '4': '#cec544',
  '5': '#7ca05d',
};
export const UNSCORED_FILL = '#cbcbcb'; // jqvmap `color`/`hoverColor` params
export const CARD_MAP_FILL = '#f4f3f0'; // jqvmap default fill used by the card inset map

export const CARD_TITLES: Record<keyof Levels, string> = { de_jure: 'De Jure', de_facto: 'De Facto' };

const scorecardModules = import.meta.glob('../data/scorecards/*.yaml', { eager: true }) as Record<
  string,
  { default: any }
>;

function checkCard(slug: string, s: any): void {
  const bad = (msg: string) => {
    throw new Error(`src/data/scorecards/${slug}.yaml: ${msg}`);
  };
  if (typeof s.id !== 'number') bad('missing numeric "id"');
  if (typeof s.title !== 'string' || !s.title) bad('missing "title"');
  if (typeof s.country_id !== 'string' || !/^[A-Za-z]{2}$/.test(s.country_id))
    bad('"country_id" must be a 2-letter country code');
  for (const key of ['de_jure', 'de_facto', 'overall']) {
    const v = s.levels?.[key];
    if (typeof v !== 'string' || !/^[0-5]$/.test(v))
      bad(`levels.${key} must be a quoted score "0"–"5" (got ${JSON.stringify(v)})`);
  }
  if (typeof s.content !== 'string') bad('missing "content"');
}

// Sorted by filename (= slug), which matches the original list/display order.
export const scorecards: ScorecardCard[] = Object.entries(scorecardModules)
  .map(([file, mod]) => {
    const slug = file.replace(/^.*\//, '').replace(/\.yaml$/, '');
    const s = mod.default;
    checkCard(slug, s);
    return {
      id: s.id,
      country_id: s.country_id,
      title: s.title,
      content: s.content,
      levels: { de_jure: s.levels.de_jure, de_facto: s.levels.de_facto },
      overall: s.levels.overall,
      survey_data: s.survey_data || '',
      slug,
    };
  })
  .sort((a, b) => (a.slug < b.slug ? -1 : 1));

export const scorecardsBySlug: Record<string, ScorecardCard> = Object.fromEntries(
  scorecards.map((c) => [c.slug, c]),
);
export const scorecardsById: Record<string, ScorecardCard> = Object.fromEntries(
  scorecards.map((c) => [c.country_id.toLowerCase(), c]),
);

// country code (lowercase) → fill / hover fill, keyed off the overall level
export const mapColors: Record<string, string> = {};
export const mapHoverColors: Record<string, string> = {};
for (const c of scorecards) {
  const code = c.country_id.toLowerCase();
  mapColors[code] = COLOR_MAP[c.overall] ?? COLOR_MAP['0'];
  mapHoverColors[code] = HOVER_MAP[c.overall] ?? HOVER_MAP['0'];
}

export const cardKeys = keysJson as Record<keyof Levels, Record<string, string>>;
export const footNotes = footnotesJson as {
  description_tab_footnotes: string;
  survey_data_tab_footnotes: string;
};

export interface MapCountry {
  name: string;
  path: string;
  bbox: { x: number; y: number; width: number; height: number };
}
export const worldMap = mapJson as {
  width: number;
  height: number;
  countries: Record<string, MapCountry>;
};

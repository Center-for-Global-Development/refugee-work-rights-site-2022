// Build-time data (extracted from the WP REST API + theme map file) plus the
// presentation constants that lived in the Vue store (store.js).
import rawScorecards from '../data/scorecards.json';
import keysJson from '../data/keys.json';
import footnotesJson from '../data/footnotes.json';
import mapJson from '../data/world-map.json';

export interface Levels {
  de_jure: string;
  de_facto: string;
}

export interface ScorecardCard {
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

export const scorecards: ScorecardCard[] = rawScorecards.map((s) => ({
  country_id: s.country_id,
  title: s.title,
  content: s.content,
  levels: { de_jure: s.levels.de_jure, de_facto: s.levels.de_facto },
  overall: s.levels.overall,
  survey_data: s.survey_data || '',
  slug: s.slug,
}));

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

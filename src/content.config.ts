// Content collections (Astro 5 Content Layer).
//
// `pages` — one Markdown file per site page in src/content/pages/.
// Two authoring modes, chosen per file:
//   * default: the body is the page's raw HTML (the scraped WordPress markup),
//     rendered verbatim via set:html for pixel parity with the old site.
//   * prose: true — the body is real Markdown, rendered inside the theme's
//     page-header + "header-with-text box-default" layout. Use this for new
//     or rewritten pages (the placeholder pages already use it).
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    // Site-relative, with leading and trailing slash ("/about/"; "/" for home).
    path: z.string().regex(/^\/([^\s]*\/)?$/, 'path must start and end with "/"'),
    // WP body classes; omit on new pages to get a sensible default.
    bodyClass: z.string().optional(),
    // Per-page Gutenberg layout CSS emitted by WP (raw pages only).
    blockSupportsCss: z.string().default(''),
    // Markdown authoring mode (see above).
    prose: z.boolean().default(false),
    // prose mode: <h1> in the page header (defaults from title), and the
    // optional <h2> of the content box (defaults from heading).
    heading: z.string().optional(),
    boxHeading: z.string().optional(),
  }),
});

export const collections = { pages };

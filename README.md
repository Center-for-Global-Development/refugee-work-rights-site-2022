# Refugee Work Rights — Static Rebuild

Static Astro rebuild of [refugeeworkrights.org](https://refugeeworkrights.org) (formerly WordPress on Pantheon), with the interactive Scorecard rebuilt as a React island. Built as an exact visual copy of the live site — verified byte-identical screenshots on the content pages at desktop and mobile widths.

## Stack

- **Astro 5** (static output, trailing slashes, directory format) — 75 pages: 16 content pages, `/scorecard/` + 58 pre-rendered country deep links, 404.
- **React 19 island** (`src/scorecard/`) for the scorecard SPA: world map (inline SVG from the theme's pre-projected JQVMap path set — no jQuery/jqvmap/d3), list view, country card overlay, keys legend, tooltips via Floating UI. Client-side pushState routing preserves the original Vue app's URL semantics, including its quirks (map click and card close drop `?viewAs=list`; list click and ESC preserve it).
- **Pagefind** for search (build-time index) inside the original full-screen modal.
- **Vendored CSS** for pixel parity (`src/styles/`): the theme's built stylesheet (`legacy.css`), WordPress block-library + inline global styles, and the WP Customizer "Additional CSS" (`wp-custom.css`, the current navy/gold branding). Only `overrides.css` is new (Pagefind result styling).

## Data & content (committed, editable)

Everything the build needs is committed — no WordPress, database, or network needed to build:

- `src/content/pages/*.md` — one file per site page (an Astro content collection, schema in `src/content.config.ts`): YAML frontmatter (`title`, `path`, WP `bodyClass`, per-page Gutenberg layout CSS) plus the page body.
- `src/data/scorecards/*.yaml` — one file per country for the scorecard app (filename = URL slug): scores under `levels:`, the Description tab HTML under `content:`, the Data tab HTML under `survey_data:`.
- `src/data/keys.yaml` / `footnotes.yaml` — the scorecard legend/tooltip texts and tab footnotes.
- `src/data/world-map.json` — the 178 country SVG paths from `rwrap.world.js`, with precomputed bboxes. Generated; not hand-edited.
- `public/wp-content/uploads/` — media at their original URLs (37 PDFs referenced in content 404 on the live site too and are intentionally absent).

### Editing content

**Pages** have two authoring modes, per file:

- *Raw HTML* (the default, used by the migrated pages): the Markdown body is the scraped WordPress `<main>` markup, emitted verbatim for pixel parity. Edit the HTML in place.
- *Markdown* (`prose: true` in frontmatter, used by the placeholder pages — `press.md`, `our-supporters.md`, `take-action.md`, `campaign-history.md`): the body is real Markdown, rendered inside the theme's standard page-header + content-box layout. `heading:` sets the `<h1>`, optional `boxHeading:` sets the box's `<h2>`; an empty body renders just the page header. New pages should use this mode — frontmatter `bodyClass` can be omitted (a sensible default is derived from the filename).

**Scorecard countries**: to rescore a country, edit the three quoted `levels:` values (`"0"`–`"5"`, drives the map color, chips, and tooltips) in its file under `src/data/scorecards/`. To add a country, add a new `.yaml` file (list order is alphabetical by filename) — its deep link page, list entry, and map coloring all follow automatically. To update a chart, drop the image under `public/wp-content/uploads/` and point the `<img>` in `survey_data:` at it. Malformed files fail `astro build` with a message naming the file and field.

The one-time extraction scripts (`npm run extract`, `scripts/*.mjs`) predate this structure and still emit the original JSON snapshots; the committed files are now the source of truth, so don't re-run extraction without porting the scripts' output format.

## Commands

```sh
npm install
npm run build     # astro build + pagefind index → dist/
npm run preview   # serve dist/ locally
node scripts/parity.mjs   # screenshot-diff every route against the live site
```

## Deploying (Cloudflare Workers, git-connected)

The repo is self-contained — all content/data/media are committed snapshots, so Cloudflare builds everything from a clean checkout with no local step.

**One-time setup** in the Cloudflare dashboard: Workers & Pages → Create → Workers → *Import a repository* → select this repo. Cloudflare reads `wrangler.jsonc`; leave the deploy command as `npx wrangler deploy`. Because `wrangler.jsonc` declares `build.command: "npm run build"`, wrangler itself runs the Astro build + Pagefind indexing before uploading `dist/` — no separate build command needed. Every push to `main` then deploys automatically (and PRs get preview URLs).

`wrangler.jsonc` defines a script-less static-assets Worker: `dist/` is uploaded as-is, `html_handling: auto-trailing-slash` matches Astro's directory-format URLs (`/about` → `/about/`), and unknown routes serve Astro's `404.html`. `public/_headers` (copied into `dist/`) sets caching. Manual deploys still work with `npx wrangler login` + `npm run deploy`.

No domain configuration is needed — every internal link is root-relative, so the site works unchanged on the `*.workers.dev` URL and later on the real domain. The only absolute self-references are the per-page `<link rel="canonical">` tags and the gtag linker config, which intentionally point at `refugeeworkrights.org`.

## Deliberate differences from the live site

- Dropped: New Relic, Burst statistics, AIOS right-click blocker, WP emoji loader, speculation-rules, the dead Universal Analytics snippet (`UA-106234503-1`). The live Site Kit gtag (`GT-PJN8PSGF`) **is** carried over.
- Search: the live site's modal had an empty search area (WP search was gutted); the rebuild restores the search form backed by Pagefind. Country scorecard content is client-rendered and therefore not in the search index (matches the modal-less reality of the old site's JS-rendered content).
- Invisible bug fixes in the scorecard port: ESC listener leaks, a crash for country codes without map paths, un-dismissable touch tooltips.
- `<meta name="robots" content="noindex, nofollow">` is preserved because the live site has it (WP "discourage search engines" is on). **Remove it in `src/layouts/Base.astro` if the new site should be indexed.**
- Map rendering: the SVG is scaled via `viewBox` instead of jqvmap's pixel transforms — identical layout, sub-pixel anti-aliasing differs on map edges.
- Internal links are normalized to trailing-slash form (WP redirected bare paths like `/dataset`; the static build serves directory URLs, so extraction and the scorecard nav emit `/dataset/` directly).
- Cloudflare's email obfuscation (`/cdn-cgi/l/email-protection`, `__cf_email__` spans) is decoded back to real `mailto:` links at extraction time — the decoder script doesn't exist on a static host, so the obfuscated markup would have rendered as broken "[email protected]" text.

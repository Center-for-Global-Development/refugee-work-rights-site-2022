# Refugee Work Rights

Source for [www.refugeeworkrights.org](https://www.refugeeworkrights.org): a static Astro site with the interactive Scorecard as a React island, deployed to Cloudflare Workers on every push to `main`.

## Stack

- **Astro 5** (static output, trailing slashes, directory format) — 75 pages: 16 content pages, `/scorecard/` + 58 pre-rendered country deep links, 404.
- **React 19 island** (`src/scorecard/`) for the scorecard: world map (inline SVG, no jQuery/d3), list view, country card overlay, keys legend, tooltips via Floating UI. Client-side pushState routing keeps the URLs shareable (`/scorecard/<country>/`, `?viewAs=list`).
- **Pagefind** for search (build-time index), shown in the full-screen search modal. Scorecard country content is client-rendered and so isn't in the index.
- **CSS** in `src/styles/`: the original theme stylesheet (`legacy.css`), WordPress block-library and global styles, and the navy/gold branding (`wp-custom.css`). Site-specific additions go in `overrides.css`.
- **SEO**: canonical URLs and `@astrojs/sitemap` use `https://www.refugeeworkrights.org` (the `site` in `astro.config.mjs`); `public/robots.txt` allows indexing and points at the sitemap index.
- **Analytics**: Google tag `GT-PJN8PSGF`, in `src/layouts/Base.astro`.

## Content

Everything the build needs is committed — no database or network access required.

- `src/content/pages/*.md` — one file per page (content collection, schema in `src/content.config.ts`): frontmatter (`title`, `path`, optional `bodyClass` and per-page layout CSS) plus the body.
- `src/data/scorecards/*.yaml` — one file per country (filename = URL slug): scores under `levels:`, the Description tab HTML under `content:`, the Data tab HTML under `survey_data:`.
- `src/data/keys.yaml` / `footnotes.yaml` — scorecard legend/tooltip texts and tab footnotes.
- `src/data/world-map.json` — the 178 country SVG paths with precomputed bboxes. Generated; don't hand-edit.
- `public/wp-content/uploads/` — media, at the same URLs as on the old WordPress site.

### Editing pages

Each page file uses one of two modes:

- **Markdown** (`prose: true` in frontmatter): the body is real Markdown, rendered inside the standard page-header + content-box layout. `heading:` sets the `<h1>`, optional `boxHeading:` sets the box's `<h2>`; an empty body renders just the page header. `bodyClass` can be omitted (it's derived from the filename). **Use this for new pages.** Examples: `press.md`, `our-supporters.md`, `take-action.md`, `campaign-history.md`.
- **Raw HTML** (the default; most existing pages): the body is HTML markup emitted verbatim. Edit the HTML in place.

### Editing the scorecard

- **Rescore a country**: edit the three quoted `levels:` values (`"0"`–`"5"`) in its file under `src/data/scorecards/`. These drive the map color, chips, and tooltips.
- **Add a country**: add a new `.yaml` file. Its deep-link page, list entry (alphabetical by filename), and map coloring follow automatically.
- **Update a chart**: put the image under `public/wp-content/uploads/` and point the `<img>` in `survey_data:` at it.

Malformed files fail `astro build` with a message naming the file and field.

## Commands

```sh
npm install
npm run dev       # dev server
npm run build     # astro build + pagefind index → dist/
npm run preview   # serve dist/ locally
npm run deploy    # manual deploy (after `npx wrangler login`); normally CI does this
```

## Deployment

Cloudflare Workers Builds is connected to this repo: every push to `main` deploys to production, and PRs get preview URLs. `wrangler.jsonc` declares `build.command: "npm run build"`, so `wrangler deploy` builds and indexes the site itself before uploading `dist/`.

The Worker (`refugee-work-rights-site-2022`) is static assets only, with no script. `html_handling: auto-trailing-slash` matches Astro's directory URLs (`/about` → `/about/`), unknown routes serve `404.html`, and `public/_headers` sets cache lifetimes. A Cloudflare redirect rule sends the bare `refugeeworkrights.org` to `www`. All internal links are root-relative, so preview URLs work unchanged.

## History: migration from WordPress

The site was previously WordPress on Pantheon. In 2026 it was rebuilt as an exact visual copy (screenshot-identical on content pages at desktop and mobile widths) and moved to Cloudflare. It was built from Pantheon backups (code, database, files) taken 2026-08-13. Those `*.tar.gz`/`*.sql.gz` files are gitignored and not part of the repo.

- **Extraction**: `npm run extract` (`scripts/extract-*.mjs`, `copy-media.mjs`) scraped the live pages, scorecard data, map paths, and media into JSON snapshots. Those were then restructured into the Markdown/YAML files above, which are now the source of truth. The scripts still emit the old JSON format, so don't re-run them. `scripts/parity.mjs` screenshot-diffed every route against the WordPress site; now that the domain serves this build, it only compares the site against itself. `scripts/missing-media.txt` lists 37 PDFs that content links to but that already 404ed on the old site; they're intentionally absent.
- **Scorecard**: ported from the original Vue/jqvmap app, keeping its URL behavior, including quirks (map click and card close drop `?viewAs=list`; list click and ESC keep it). It fixes some bugs: ESC listener leaks, a crash for country codes without map paths, and touch tooltips that couldn't be dismissed. The map now scales via `viewBox` instead of jqvmap's pixel transforms: same layout, slightly different anti-aliasing on edges.
- **Dropped**: New Relic, Burst statistics, AIOS right-click blocker, WP emoji loader, speculation-rules, and the dead Universal Analytics snippet (`UA-106234503-1`). The Site Kit Google tag was kept.
- **Other changes**:
  - Search, which WordPress had gutted, now works via Pagefind.
  - Internal links use trailing slashes (WordPress used to redirect bare paths).
  - Cloudflare email-obfuscation markup was decoded back to real `mailto:` links.
  - The WordPress `noindex, nofollow` meta was removed at launch, and the sitemap and robots.txt were added.

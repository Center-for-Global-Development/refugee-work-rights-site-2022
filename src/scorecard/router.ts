// Minimal history router for the scorecard SPA. The whole route surface is
// /scorecard/[slug]/ plus ?viewAs=list, and the original app's quirky
// query-string semantics are preserved by each call site choosing whether to
// keep the query. Shared by the ScorecardNav and ScorecardApp islands
// (single module instance via the shared Vite chunk).
import { useSyncExternalStore } from 'react';

export interface Route {
  slug: string | null;
  viewAs: string | null;
}

const subscribers = new Set<() => void>();
let snapshot: Route = { slug: null, viewAs: null };

function read(): Route {
  const m = window.location.pathname.match(/^\/scorecard(?:\/([^/?#]+))?\/?$/);
  return {
    slug: m?.[1] ? decodeURIComponent(m[1]) : null,
    viewAs: new URLSearchParams(window.location.search).get('viewAs'),
  };
}

function refresh() {
  snapshot = read();
  subscribers.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  snapshot = read();
  window.addEventListener('popstate', refresh);
}

function push(url: string) {
  history.pushState(null, '', url);
  refresh();
}

/** Navigate to a card (or back to the index with slug=null). */
export function navigate(slug: string | null, opts: { preserveQuery?: boolean } = {}) {
  let url = slug ? `/scorecard/${encodeURIComponent(slug)}/` : '/scorecard/';
  if (opts.preserveQuery && window.location.search) url += window.location.search;
  push(url);
}

/** The Map View / List View nav links — always drop the current slug. */
export function navigateView(view: 'map' | 'list') {
  push(view === 'list' ? '/scorecard/?viewAs=list' : '/scorecard/');
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => snapshot,
    () => snapshot,
  );
}

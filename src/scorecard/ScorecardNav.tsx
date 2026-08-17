// Ports shared/scorecard-nav.component.js — rendered in the page header,
// outside the app island, sharing the same router store instance.
// The Methodology/Dataset items were server-rendered <li> slot children;
// live had them without trailing slashes (WP redirected), but the static
// build serves directory URLs, so the canonical trailing-slash form is used.
import { navigateView, useRoute } from './router';

export default function ScorecardNav() {
  const route = useRoute();
  const isList = route.viewAs === 'list';

  const go = (view: 'map' | 'list') => (e: React.MouseEvent) => {
    e.preventDefault();
    navigateView(view);
  };

  return (
    <div className="scorecard-nav">
      <div>
        <ul className="menu">
          <li className={!isList ? 'active' : ''}>
            <a href="/scorecard/" className="nav-item" onClick={go('map')}>
              Map View
            </a>
          </li>
          <li className={isList ? 'active' : ''}>
            <a href="/scorecard/?viewAs=list" className="nav-item" onClick={go('list')}>
              List View
            </a>
          </li>
          <li>
            <a href="/scorecard-methodology/">Scorecard Methodology</a>
          </li>
          <li>
            <a href="/dataset/">Dataset</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

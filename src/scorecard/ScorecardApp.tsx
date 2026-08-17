// The scorecard SPA root — ports ScoreCardView + ScoreCardProvider. Data is
// bundled at build time, so the route-blocking loader is gone by design.
import { MapView } from './MapView';
import { ListView } from './ListView';
import { Card } from './Card';
import { KeysPanel } from './KeysPanel';
import { useRoute } from './router';

export default function ScorecardApp() {
  const route = useRoute();
  const isList = route.viewAs === 'list';
  return (
    <div className="scorecard-wrapper">
      <div>{isList ? <ListView /> : <MapView />}</div>
      <Card />
      <KeysPanel />
    </div>
  );
}

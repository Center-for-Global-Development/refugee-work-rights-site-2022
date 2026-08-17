// Ports shared/show-key-button.component.js.
import { showCardKey } from './keysStore';

export function ShowKeyButton() {
  return (
    <button className="map-button key-button" onClick={showCardKey}>
      Key
    </button>
  );
}

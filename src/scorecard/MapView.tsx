// Ports components/scorecard-map: the JQVMap world map re-rendered as a plain
// inline SVG from the theme's pre-projected path set (rwrap.world.js), with
// jqvmap's zoom semantics (zoomStep 1.4, 4 steps, viewport-centered) and the
// Tether tooltip replaced by Floating UI.
import { useMemo, useRef, useState } from 'react';
import { useFloating, offset, shift, autoUpdate } from '@floating-ui/react-dom';
import {
  CARD_TITLES,
  mapColors,
  mapHoverColors,
  scorecardsById,
  UNSCORED_FILL,
  worldMap,
} from './data';
import { navigate } from './router';
import { ShowKeyButton } from './ShowKeyButton';

const ZOOM_STEP = 1.4;
const ZOOM_MAX_STEP = 4;

function MapToolbar({ onZoom }: { onZoom: (dir: 'in' | 'out') => void }) {
  return (
    <div className="map-toolbar">
      <ShowKeyButton />
      <div className="map-button-group">
        <button className="map-button" onClick={() => onZoom('in')}>
          +
        </button>
        <button className="map-button" onClick={() => onZoom('out')}>
          -
        </button>
      </div>
    </div>
  );
}

export function MapView() {
  const [zoomCurStep, setZoomCurStep] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredPath = useRef<SVGPathElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    strategy: 'fixed',
    middleware: [shift({ crossAxis: true }), offset(0)],
    whileElementsMounted: autoUpdate,
  });

  const hoveredCard = hovered ? scorecardsById[hovered] : undefined;

  const scale = ZOOM_STEP ** (zoomCurStep - 1);
  const cx = worldMap.width / 2;
  const cy = worldMap.height / 2;

  const codes = useMemo(() => Object.keys(worldMap.countries), []);

  function hoverRegion(code: string, el: SVGPathElement) {
    setHovered(code);
    if (scorecardsById[code]) {
      hoveredPath.current = el;
      // Anchor the tooltip's bottom-center to the country's bbox center,
      // matching Tether's `bottom center` → `middle center` attachment.
      const rect = el.getBoundingClientRect();
      refs.setReference({
        getBoundingClientRect: () =>
          new DOMRect(rect.x + rect.width / 2, rect.y + rect.height / 2, 0, 0),
      });
    }
  }

  return (
    <div
      className="map"
      style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff' }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${worldMap.width} ${worldMap.height}`}>
        <g transform={`translate(${cx * (1 - scale)} ${cy * (1 - scale)}) scale(${scale})`}>
          {codes.map((code) => (
            <path
              key={code}
              className="jqvmap-region"
              d={worldMap.countries[code].path}
              stroke="#4d4d4d"
              strokeWidth={0}
              fill={
                hovered === code
                  ? (mapHoverColors[code] ?? UNSCORED_FILL)
                  : (mapColors[code] ?? UNSCORED_FILL)
              }
              onMouseEnter={(e) => hoverRegion(code, e.currentTarget)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                const card = scorecardsById[code];
                if (card) {
                  setHovered(null);
                  navigate(card.slug); // drops ?viewAs, as the original did
                }
              }}
            />
          ))}
        </g>
      </svg>
      <MapToolbar
        onZoom={(dir) =>
          setZoomCurStep((step) =>
            dir === 'in' ? Math.min(step + 1, ZOOM_MAX_STEP) : Math.max(step - 1, 1),
          )
        }
      />
      {hoveredCard && (
        <div
          ref={refs.setFloating}
          // display:block overrides .jqvmap-label's display:none (jqvmap showed it via .show())
          style={{ ...floatingStyles, pointerEvents: 'none', display: 'block' }}
          className="jqvmap-label rwrap-theme-arrows rwrap-element rwrap-element-attached-bottom rwrap-element-attached-center rwrap-target-attached-middle rwrap-target-attached-center"
        >
          <div className="rwrap-content map-label">
            <h3 className="map-label-title">{hoveredCard.title}</h3>
            <ul className="scorecard-categories map-label-scores">
              <li className="scorecard-category">
                <span className={`scorecard-level scorecard-level-${hoveredCard.levels.de_jure}`}>
                  {hoveredCard.levels.de_jure}
                </span>
                <span className="card-category-label">{CARD_TITLES.de_jure}</span>
              </li>
              <li className="scorecard-category">
                <span className={`scorecard-level scorecard-level-${hoveredCard.levels.de_facto}`}>
                  {hoveredCard.levels.de_facto}
                </span>
                <span className="card-category-label">{CARD_TITLES.de_facto}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

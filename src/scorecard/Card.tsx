// Ports components/card: the country detail overlay with inset locator map,
// score chips, and Description/Data tabs. Footnotes are bundled (no lazy load).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CARD_MAP_FILL,
  footNotes,
  mapColors,
  scorecardsBySlug,
  worldMap,
  type ScorecardCard,
} from './data';
import { navigate, useRoute } from './router';
import { CardHeading } from './CardHeading';
import { useVueTransition } from './useVueTransition';

const TABS = { description: 0, survey: 1 } as const;
// The card "fade" transition's longest leg is the image half's .45s opacity.
const CARD_TRANSITION_MS = 450;

function CardMap({ country }: { country: string }) {
  // Renders as div.card-map.scorecard-component-image (Vue class passthrough
  // from <card-map class="scorecard-component-image">).
  const code = country.toLowerCase();
  const target = worldMap.countries[code];
  if (!target) return <div className="card-map scorecard-component-image" />; // ACF codes without a map path (guarded; crashed in the original)
  const { x, y, width, height } = target.bbox;
  const viewBox = `${x - width / 2} ${y - height / 2} ${width * 2} ${height * 2}`;
  return (
    <div className="card-map scorecard-component-image">
      <svg viewBox={viewBox}>
        {Object.entries(worldMap.countries).map(([c, entry]) => (
          <path
            key={c}
            d={entry.path}
            fill={c === code ? (mapColors[code] ?? CARD_MAP_FILL) : CARD_MAP_FILL}
            className={c === code ? 'selected' : undefined}
          />
        ))}
      </svg>
    </div>
  );
}

export function Card() {
  const route = useRoute();
  const routedCard = route.slug ? scorecardsBySlug[route.slug] : undefined;
  // Keep rendering the last card during the exit transition.
  const lastCard = useRef<ScorecardCard | undefined>(undefined);
  if (routedCard) lastCard.current = routedCard;

  const [currentTab, setCurrentTab] = useState<number>(TABS.description);
  const resetTab = useCallback(() => setCurrentTab(TABS.description), []);
  const { mounted, className } = useVueTransition(
    !!routedCard,
    'fade',
    CARD_TRANSITION_MS,
    resetTab, // original resets the tab after the exit animation (@after-leave)
  );

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && routedCard) {
        navigate(null, { preserveQuery: true }); // ESC preserves ?viewAs
      }
    };
    document.addEventListener('keyup', onKeyUp);
    return () => document.removeEventListener('keyup', onKeyUp);
  }, [routedCard]);

  const card = lastCard.current;
  if (!mounted || !card) return null;

  const showDescription = currentTab === TABS.description;
  const showSurvey = currentTab === TABS.survey;

  return (
    <div className={`scorecard scorecard-component ${className}`.trim()}>
      <CardMap key={card.country_id} country={card.country_id} />
      <section className="scorecard-component-content">
        <header className="scorecard-heading">
          <div className="scorecard-heading-row">
            <a
              href="/scorecard/"
              className="scorecard-close-button"
              onClick={(e) => {
                e.preventDefault();
                navigate(null); // close button drops ?viewAs, as the original did
              }}
            >
              <i className="icon icon-cancel"></i>
            </a>
          </div>
          <CardHeading card={card} />
        </header>
        <ul className="scorecard-tabs">
          <li className={`tabs-title${showDescription ? ' is-active' : ''}`}>
            <button onClick={() => setCurrentTab(TABS.description)}>Description</button>
          </li>
          <li className={`tabs-title${showSurvey ? ' is-active' : ''}`}>
            <button onClick={() => setCurrentTab(TABS.survey)}>Data</button>
          </li>
        </ul>
        <div className="scorecard-tabs-content entry-content scorecard-content">
          {showDescription && (
            <section id="description" className="tabs-panel">
              <div dangerouslySetInnerHTML={{ __html: card.content }} />
              <div dangerouslySetInnerHTML={{ __html: footNotes.description_tab_footnotes }} />
            </section>
          )}
          {showSurvey && (
            <section id="survey" className="tabs-panel">
              <div dangerouslySetInnerHTML={{ __html: card.survey_data }} />
              <div dangerouslySetInnerHTML={{ __html: footNotes.survey_data_tab_footnotes }} />
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

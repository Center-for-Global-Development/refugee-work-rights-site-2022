// Ports shared/card-item.component.js: CardHeading + CardCategory + Tip.
// Class names (incl. the Tether-era rwrap-* classes) are kept verbatim so the
// vendored theme CSS renders the tooltips identically.
import { useState, useRef } from 'react';
import { useFloating, offset, shift, autoUpdate } from '@floating-ui/react-dom';
import { CARD_TITLES, cardKeys, type Levels, type ScorecardCard } from './data';

function Tip({ level, description }: { level: string; description: string }) {
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    strategy: 'fixed',
    middleware: [offset(10), shift({ crossAxis: true })],
    whileElementsMounted: autoUpdate,
  });
  return (
    <span ref={refs.setReference} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <span
        ref={refs.setFloating}
        style={{ ...floatingStyles, display: 'block' }}
        className={`scorecard-level-tip rwrap-theme-arrows-${level} rwrap-element rwrap-element-attached-top rwrap-element-attached-center rwrap-target-attached-bottom rwrap-target-attached-center`}
      >
        <span className="rwrap-content" style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: description }} />
      </span>
    </span>
  );
}

export function CardCategory({ level, type }: { level: string; type: keyof Levels }) {
  const [tipVisible, setTipVisible] = useState(false);
  // The original touch handler could only ever *show* the tooltip; a tap now
  // toggles it so touch users can dismiss it (invisible-fix).
  const touched = useRef(false);
  const description = cardKeys[type]?.[`level_${level}`] ?? '';
  return (
    <button
      className="card-category"
      style={{ position: 'relative' }}
      onMouseOver={() => {
        if (!touched.current) setTipVisible(true);
      }}
      onMouseOut={() => {
        if (!touched.current) setTipVisible(false);
      }}
      onTouchStart={() => {
        touched.current = true;
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setTipVisible(touched.current ? !tipVisible : true);
      }}
    >
      <span className={`scorecard-level scorecard-level-${level}`}>{level}</span>
      <span className="card-category-label">{CARD_TITLES[type]}</span>
      {tipVisible && <Tip level={level} description={description} />}
    </button>
  );
}

export function CardHeading({ card }: { card: ScorecardCard }) {
  return (
    <div className="card-heading">
      <h1 className="scorecard-title">{card.title}</h1>
      <ul className="scorecard-categories">
        {(Object.keys(card.levels) as (keyof Levels)[]).map((type) => (
          <li className="scorecard-category" key={type}>
            <CardCategory type={type} level={card.levels[type]} />
          </li>
        ))}
      </ul>
    </div>
  );
}

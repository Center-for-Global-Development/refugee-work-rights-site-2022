// Ports components/scorecard-keys: the slide-up legend overlay. Keys data is
// bundled, so the "Loading ..." state never occurs.
import { useEffect } from 'react';
import { cardKeys, type Levels } from './data';
import { hideCardKey, useCardKeyOpen } from './keysStore';
import { useVueTransition } from './useVueTransition';

const LEVELS = ['5', '4', '3', '2', '1', '0'];
const SECTIONS: { type: keyof Levels; heading: string }[] = [
  { type: 'de_jure', heading: 'De Jure' },
  { type: 'de_facto', heading: 'De Facto' },
];

export function KeysPanel() {
  const open = useCardKeyOpen();
  const { mounted, className } = useVueTransition(open, 'slide-card-up', 250);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) hideCardKey();
    };
    document.addEventListener('keyup', onKeyUp);
    return () => document.removeEventListener('keyup', onKeyUp);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className={`scorecard-keys ${className}`.trim()}>
      <div className="scorecard-heading-row">
        <button onClick={hideCardKey} className="scorecard-close-button">
          <i className="icon icon-cancel"></i>
        </button>
      </div>
      <div className="scorecard-keys-row">
        {SECTIONS.map(({ type, heading }) =>
          cardKeys[type] ? (
            <section className="scorecard-key-section" key={type}>
              <header className="scorecard-key-header">
                <div>
                  <h3>{heading}</h3>
                </div>
              </header>
              {LEVELS.map((level) => (
                <div className={`scorecard-key-level scorecard-level-${level}`} key={level}>
                  <span className="scorecard-key-level-number">{level}</span>
                  <p dangerouslySetInnerHTML={{ __html: cardKeys[type][`level_${level}`] ?? '' }} />
                </div>
              ))}
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}

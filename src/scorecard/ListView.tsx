// Ports components/scorecard-list.
import { scorecards, type ScorecardCard } from './data';
import { navigate, useRoute } from './router';
import { CardHeading } from './CardHeading';
import { ShowKeyButton } from './ShowKeyButton';

function CardListItem({ card, isCurrent }: { card: ScorecardCard; isCurrent: boolean }) {
  return (
    <div
      className={`card-list-item${isCurrent ? ' current-card-list-item' : ''}`}
      onClick={() => navigate(card.slug, { preserveQuery: true })}
    >
      <CardHeading card={card} />
    </div>
  );
}

export function ListView() {
  const route = useRoute();
  return (
    <div className="scorecard-list">
      <div className="scorecard-list-content">
        <div className="scorecard-header-row scorecard-list-toolbar">
          <ShowKeyButton />
        </div>
        <div className="scorecard-list-items">
          {scorecards.map((card) => (
            <CardListItem key={card.country_id} card={card} isCurrent={route.slug === card.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}

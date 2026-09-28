import { discountPct, inr } from '../lib/format';
import type { Offer } from '../lib/types';

interface Props {
  offer: Offer;
  rank?: number;
  picked?: boolean;
  budget?: number;
}

const CANCEL_LABEL: Record<Offer['cancellation'], string> = {
  free: 'Free cancellation',
  paid: 'Paid cancellation',
  none: 'Non-refundable',
};

const OfferCard = ({ offer, rank, picked, budget }: Props) => {
  const off = discountPct(offer.price, offer.listPrice);
  const overBudget = budget !== undefined && offer.price > budget;

  return (
    <article className={picked ? 'card card--glow' : 'card card--tight'}>
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <div className="row mb-2" style={{ gap: 'var(--s2)' }}>
            {rank !== undefined && <span className="tiny mono">#{rank}</span>}
            <span className="tiny">{offer.vendor}</span>
            {picked && <span className="pill pill--info">agent's pick</span>}
          </div>
          <h3 className="h3 mb-2">{offer.title}</h3>
        </div>
      </div>

      <div className="row mb-2" style={{ flexWrap: 'wrap' }}>
        <span className="amount" style={{ fontSize: 18 }}>{inr(offer.price)}</span>
        {off > 0 && (
          <>
            <span className="tiny" style={{ textDecoration: 'line-through' }}>{inr(offer.listPrice)}</span>
            <span className="pill pill--auto">{off}% off</span>
          </>
        )}
        {overBudget && <span className="pill pill--block">over budget</span>}
      </div>

      <div className="row mb-3" style={{ flexWrap: 'wrap' }}>
        <span className="tiny">{offer.rating.toFixed(1)} from {offer.reviews.toLocaleString('en-IN')} reviews</span>
        <span className="tiny">{CANCEL_LABEL[offer.cancellation]}</span>
        {offer.score !== undefined && <span className="tiny">Scored {offer.score}</span>}
      </div>

      {offer.facts.length > 0 && (
        <ul className={offer.reasons?.length ? 'facts mb-4' : 'facts'}>
          {offer.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      )}

      {offer.reasons && offer.reasons.length > 0 && (
        <ul className="reasons">
          {offer.reasons.slice(0, 3).map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
    </article>
  );
};

export default OfferCard;

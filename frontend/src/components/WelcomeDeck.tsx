import type { CSSProperties } from 'react';
import { IconCheck } from './Icons';

/**
 * The welcome screen's hero: three Sable surfaces fanned like cards held in
 * one hand.
 *
 * They are not decoration — each is a real screen from the app, and read
 * together they are the whole product in one glance: what it paid, where the
 * line is, and the moment it reached that line and stopped. The front card's
 * ledger draws itself once, after the deal settles, and halts past the mark.
 */
const WelcomeDeck = () => (
  <div className="deck" role="img" aria-label="Sable found a hotel at ₹12,400, which is over the ₹2,000 it may pay on its own, so it stopped and asked.">
    <article className="deck__card deck__card--back" aria-hidden="true">
      <span className="deck__vendor">Croma</span>
      <p className="deck__price">₹18,240</p>
      <p className="tiny mt-2">
        <IconCheck size={11} /> Paid and verified
      </p>
    </article>

    <article className="deck__card deck__card--mid" aria-hidden="true">
      <span className="deck__vendor">Your limit</span>
      <p className="deck__price">₹2,000</p>
      <p className="tiny mt-2">It pays alone below this</p>
    </article>

    <article className="deck__card deck__card--front" aria-hidden="true">
      <div className="row-between">
        <span className="deck__vendor">Taj Holiday Village</span>
        <span className="pill pill--ask">
          <span className="dot dot--live" />
          needs you
        </span>
      </div>
      <p className="deck__price">₹12,400</p>

      <div className="ledger__line ledger__line--hero">
        <span
          className="ledger__fill"
          style={{ '--at': '84%', '--at-num': 84 } as CSSProperties}
        />
        <span className="ledger__mark" style={{ '--mark': '38%' } as CSSProperties} />
      </div>

      <p className="tiny">Past your line, so it stopped here</p>
    </article>
  </div>
);

export default WelcomeDeck;

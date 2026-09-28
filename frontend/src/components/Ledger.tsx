import type { CSSProperties } from 'react';
import { inr } from '../lib/format';

interface Props {
  /** Where you are now. Printed large, on the left. */
  value: number;
  /** The full scale of the line. */
  max: number;
  /** The amount the tick stands at. Defaults to the end of the scale. */
  mark?: number;
  leftLabel: string;
  rightLabel?: string;
  /** A ceiling that is never crossed reads in oxblood rather than ink. */
  hard?: boolean;
  tone?: 'jade' | 'amber' | 'metal';
}

/**
 * The ledger line — the one device this product is about.
 *
 * A value, a rule, and the mark where the agent must stop. Every limit in the
 * app is drawn this way, so the shape itself comes to mean "a boundary",
 * whether it is today's spend, a per-payment cap, or the price of one offer.
 * When the fill runs past the mark, you are asking for something that needs you.
 */
const Ledger = ({ value, max, mark, leftLabel, rightLabel, hard, tone = 'jade' }: Props) => {
  const stop = mark ?? max;
  const pct = (n: number) => (max > 0 ? Math.max(0, Math.min(100, (n / max) * 100)) : 0);

  return (
    <div className="ledger">
      <div className="ledger__ends">
        <span className="amount" style={{ fontSize: 34 }}>{inr(value)}</span>
        <span className="amount small" style={{ color: 'var(--ink-3)' }}>{inr(stop)}</span>
      </div>

      <div className="ledger__line">
        <span
          className="ledger__fill"
          style={{ '--at': `${pct(value)}%`, '--ledger-tone': `var(--${tone})` } as CSSProperties}
        />
        <span
          className={hard ? 'ledger__mark ledger__mark--hard' : 'ledger__mark'}
          style={{ '--mark': `${pct(stop)}%` } as CSSProperties}
        />
      </div>

      <div className="ledger__ends">
        <span className="tiny">{leftLabel}</span>
        {rightLabel && <span className="tiny">{rightLabel}</span>}
      </div>
    </div>
  );
};

export default Ledger;

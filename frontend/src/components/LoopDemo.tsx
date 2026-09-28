import { useEffect, useState } from 'react';
import { IconCheck } from './Icons';

/**
 * One errand, played back.
 *
 * The nine stages mean nothing as a list of nine words — every agent claims
 * the same verbs. What is worth showing is what Sable actually does at each
 * one, and the moment it stops and hands the decision back. So this runs a
 * real errand end to end, in miniature, and pauses where a person is needed.
 */
interface Stage { name: string; detail: string; /** Where a person is needed. */ halt?: boolean }

const PLAY: Stage[] = [
  { name: 'Understand', detail: 'Goa · 3 nights · ceiling ₹15,000' },
  { name: 'Search', detail: '14 vendors queried' },
  { name: 'Compare', detail: '6 match the sentence' },
  { name: 'Decide', detail: 'Taj Holiday Village · ₹12,400' },
  { name: 'Monitor', detail: 'Held 4 hours in case it fell' },
  { name: 'Prepare', detail: 'Checkout built, nothing submitted' },
  { name: 'Request approval', detail: 'Over your ₹2,000 limit — stops here', halt: true },
  { name: 'Execute', detail: 'Single-use card, charged once' },
  { name: 'Verify', detail: 'Receipt matched to the amount' },
];

const LoopDemo = () => {
  const [at, setAt] = useState(0);

  useEffect(() => {
    /* Someone who has asked for less motion gets the finished run instead. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAt(PLAY.length);
      return;
    }
    const step = PLAY[at]?.halt ? 2100 : 900;
    const t = setTimeout(() => setAt((n) => (n >= PLAY.length ? 0 : n + 1)), step);
    return () => clearTimeout(t);
  }, [at]);

  return (
    <ol className="loop">
      {PLAY.map((stage, i) => {
        const done = i < at;
        const active = i === at;
        const state = done ? 'done' : active ? 'active' : 'pending';

        return (
          <li key={stage.name} className={`loopstep loopstep--${state}`}>
            <div className="loopstep__rail">
              <span className="loopstep__bullet">
                {done ? <IconCheck size={13} className="tick" /> : i + 1}
              </span>
            </div>
            <div>
              <div className="loopstep__name">{stage.name}</div>
              {(done || active) && <p className="loopstep__note">{stage.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default LoopDemo;

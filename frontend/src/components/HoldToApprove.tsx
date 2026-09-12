import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { IconCheck } from './Icons';

interface Props {
  label: string;
  onComplete: () => void;
  holdMs?: number;
}

/**
 * Authorising a payment takes a deliberate gesture, not a tap you can make by
 * accident. The fill shows how far through that gesture you are; letting go
 * rewinds it.
 *
 * The commitment is a timer and the fill is a CSS transition, so a throttled
 * frame loop can never leave the button looking alive but doing nothing.
 */
const HoldToApprove = ({ label, onComplete, holdMs = 900 }: Props) => {
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const finish = useCallback(() => {
    setHolding(false);
    setDone(true);
    onComplete();
  }, [onComplete]);

  const start = () => {
    if (done) return;
    setHolding(true);
    timer.current = setTimeout(finish, holdMs);
  };

  const cancel = () => {
    if (done) return;
    clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <button
      className="hold"
      data-armed={holding || done}
      data-done={done}
      aria-label={label}
      style={
        {
          '--p': done || holding ? 1 : 0,
          '--hold-dur': holding ? `${holdMs}ms` : '220ms',
        } as CSSProperties
      }
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      /* Keyboard and assistive tech get one decisive activation instead. */
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !done) {
          e.preventDefault();
          finish();
        }
      }}
    >
      <span className="hold__fill" />
      <span className="hold__label">
        {done && <IconCheck size={17} />}
        {done ? 'Approved' : label}
      </span>
    </button>
  );
};

export default HoldToApprove;

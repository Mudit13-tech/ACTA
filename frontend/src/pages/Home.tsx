import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconArrow, IconBell, IconSearch, IconShield, IconSliders } from '../components/Icons';
import { Wordmark } from '../components/Brand';
import CommandInput from '../components/CommandInput';
import AgentArt from '../components/AgentArt';
import { greeting, useProfile } from '../context/ProfileContext';
import { useAgent } from '../context/AgentContext';
import { usePolicy } from '../context/PolicyContext';
import { useCountUp } from '../hooks/useCountUp';
import { inr, inrCompact } from '../lib/format';
import type { Run, RunStatus } from '../lib/types';

const STATUS_TEXT: Record<RunStatus, string> = {
  running: 'Working',
  monitoring: 'Watching the price',
  'awaiting-approval': 'Waiting for you',
  completed: 'Done',
  declined: 'You declined it',
  blocked: 'Stopped by your limits',
};

/* Tapping one writes it into the command, so the first task costs no typing. */
const EXAMPLES = [
  'Hotel in Goa, 3 nights, under ₹15,000',
  'A 27-inch monitor under ₹20,000',
  'Headphones under ₹10,000 at 20% off',
];

/* What the agent does before it ever needs you. */
const CAPABILITIES = [
  { Icon: IconSearch, title: 'Searches for you', body: 'Queries every vendor it can reach, not just the first.' },
  { Icon: IconSliders, title: 'Compares prices', body: 'Scores each offer on price, rating and cancellation terms.' },
  { Icon: IconShield, title: 'Pays within limits', body: 'Settles below your line, and stops at it above.' },
];

/** One line of live status, with the run's position in the loop. */
const FlightRow = ({ run, onOpen }: { run: Run; onOpen: () => void }) => {
  const stage = run.stages.find((s) => s.status === 'active') ?? run.stages.find((s) => s.status === 'pending');
  const done = run.stages.filter((s) => s.status === 'done' || s.status === 'skipped').length;
  const step = Math.min(done + 1, 9);

  return (
    <button className="rowitem" onClick={onOpen}>
      <span className="grow">
        <span className="h3 clamp-2">{run.goal.text}</span>
        <span className="tiny">{stage ? stage.name : 'Working'} — step {step} of 9</span>
        {/* The loop's progress, drawn as the same rule as every other limit. */}
        <span className="ledger__line" style={{ marginBottom: 0 }}>
          <span
            className="ledger__fill"
            style={{ '--at': `${(step / 9) * 100}%`, '--ledger-tone': 'var(--metal)' } as CSSProperties}
          />
        </span>
      </span>
      <span className="spinner" />
    </button>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { pending, runs, spentToday, connection } = useAgent();
  const { policy } = usePolicy();
  const { profile } = useProfile();

  const [text, setText] = useState('');

  const running = runs.filter((r) => r.status === 'running' || r.status === 'monitoring');
  const settled = runs
    .filter((r) => r.id !== pending[0]?.id && r.status !== 'running' && r.status !== 'monitoring')
    .slice(0, 4);
  const spent = useCountUp(spentToday);
  const waiting = pending[0];
  const waitingPick = waiting?.offers.find((o) => o.id === waiting.pickId);
  const ready = text.trim().length > 2;
  const at = policy.dailyCap > 0 ? Math.min(100, (spentToday / policy.dailyCap) * 100) : 0;
  /* The spectrum fill already says how close the day is to its cap; this puts
     the same reading in words, for anyone the colour does not reach. */
  const standing = at >= 100 ? 'At your cap for today' : at >= 75 ? 'Close to your cap' : at > 0 ? 'Well inside your cap' : 'Nothing spent today';

  /* The three questions you open the app with: did it do anything, does it
     need me, and was any of it worth it. All three come from runs already in
     hand, so the row costs no extra request. */
  const today = new Date().toDateString();
  const startedToday = runs.filter((r) => new Date(r.createdAt).toDateString() === today).length;
  const saved = runs.reduce((total, run) => {
    if (!run.receipt) return total;
    const pick = run.offers.find((o) => o.id === run.pickId);
    if (!pick) return total;
    return total + Math.max(0, pick.listPrice - pick.price);
  }, 0);

  const send = () => navigate(`/new?goal=${encodeURIComponent(text.trim())}`);

  /* One counter drives the stagger, so sections enter in the order they read
     however many of them are actually on screen. */
  let order = 0;
  const step = () => ({ '--i': order++ } as CSSProperties);

  return (
    <Screen title="" bare>
      <header className="masthead">
        <Wordmark size={17} />
        <button
          className="iconbtn"
          onClick={() => navigate('/approvals')}
          aria-label={pending.length ? `${pending.length} waiting for you` : 'Nothing waiting for you'}
          style={{ position: 'relative' }}
        >
          <IconBell size={17} />
          {pending.length > 0 && (
            <span
              className="dot dot--live"
              style={{ position: 'absolute', top: 9, right: 10, color: 'var(--amber)' }}
            />
          )}
        </button>
      </header>

      {/* The one thing that needs a human outranks everything, including the
          command. It is also the only raised surface on this screen. */}
      {waiting && waitingPick && (
        <section className="section section--first enter" style={step()}>
          <button
            className="card card--asking"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => navigate(`/run/${waiting.id}`)}
          >
            <div className="row-between mb-4">
              <span className="pill pill--ask">
                <span className="dot dot--live" style={{ color: 'var(--amber)' }} />
                Needs you
              </span>
              <span className="tiny">{waitingPick.vendor}</span>
            </div>
            <p className="amount" style={{ fontSize: 52 }}>{inr(waitingPick.price)}</p>
            <p className="small mt-3 mb-4">{waitingPick.title}</p>
            <span className="row" style={{ color: 'var(--amber)' }}>
              <span className="small" style={{ color: 'inherit' }}>Review and approve</span>
              <IconArrow size={15} />
            </span>
          </button>
        </section>
      )}

      {/* The command. The question is the field, so the first screen is the
          product rather than a door to it. */}
      <section className={`section enter${waiting ? '' : ' section--first'}`} style={step()}>
        <span className="hello mb-4">
          <span className="hello__when">{greeting()},</span>
          <span className="hello__who">{profile.name}.</span>
        </span>

        <div className="commandwrap">
          <CommandInput
            id="command"
            label="What do you need done?"
            value={text}
            onChange={setText}
            onSubmit={() => { if (ready) send(); }}
            placeholder="Search. Compare. Buy."
          />
        </div>

        <div className="command__send mt-4" data-ready={ready}>
          <button className="btn btn--block" onClick={send} disabled={!ready}>
            <IconArrow size={17} /> Send it
          </button>
        </div>

        {!text && (
          <div className="chiprow mt-4">
            {EXAMPLES.map((example) => (
              <button key={example} className="chip" onClick={() => setText(example)}>
                {example}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Today, against the edge you set. Tapping goes to where you set it. */}
      <section className="section enter" style={step()}>
        <button
          className="meter"
          onClick={() => navigate('/limits')}
          aria-label={`Spent ${inr(spentToday)} of ${inr(policy.dailyCap)} today. Change your limits.`}
        >
          <div className="meter__figures">
            <span>
              <span className="amount" style={{ fontSize: 38, display: 'block' }}>{inr(spent)}</span>
              <span className="tiny">Spent today</span>
            </span>
            <span className="meter__cap">
              <span className="eyebrow eyebrow--bare">Daily cap</span>
              <span className="amount" style={{ fontSize: 19, display: 'block', color: 'var(--ink-2)' }}>
                {inr(policy.dailyCap)}
              </span>
            </span>
          </div>

          {/* The fill carries the temper spectrum, so the colour at its leading
              edge is itself the reading: green while there is room, running to
              oxblood as the cap arrives. */}
          <div className="ledger__line ledger__line--hero">
            <span
              className="ledger__fill"
              style={{ '--at': `${at}%`, '--at-num': at } as CSSProperties}
            />
            <span className="ledger__mark" />
          </div>

          <span className="row-between">
            <span className="tiny">{standing}</span>
            <span className="tiny">Change your limits</span>
          </span>
        </button>

        <div className="stats mt-2">
          <span>
            <span className="stats__v">{startedToday}</span>
            <span className="stats__k">started today</span>
          </span>
          <span>
            <span className={pending.length ? 'stats__v' : 'stats__v stats__v--quiet'}>
              {pending.length}
            </span>
            <span className="stats__k">waiting on you</span>
          </span>
          <span>
            <span className={saved > 0 ? 'stats__v' : 'stats__v stats__v--quiet'}>
              {saved > 0 ? inrCompact(saved) : '—'}
            </span>
            <span className="stats__k">saved on list</span>
          </span>
        </div>
      </section>

      {running.length > 0 && (
        <section className="section enter" style={step()}>
          <p className="eyebrow mb-3">In flight</p>
          <div className="stack stack-2">
            {running.map((run) => (
              <FlightRow key={run.id} run={run} onOpen={() => navigate(`/run/${run.id}`)} />
            ))}
          </div>
        </section>
      )}

      {settled.length > 0 && (
        <section className="section enter" style={step()}>
          <p className="eyebrow mb-3">Settled</p>
          <div className="list">
            {settled.map((run) => (
              <button key={run.id} className="settled" onClick={() => navigate(`/run/${run.id}`)}>
                <span className="grow">
                  <span className="h3 clamp-2">{run.goal.text}</span>
                  <span className="tiny">{run.receipt ? run.receipt.vendor : STATUS_TEXT[run.status]}</span>
                </span>
                {run.receipt ? (
                  <span className="amount small">{inr(run.receipt.amount)}</span>
                ) : (
                  <span className="tiny">{STATUS_TEXT[run.status]}</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Nothing to look back on yet, so answer the only question a new user
          has: what will this do without me? Someone whose single task is still
          awaiting approval is just as new as someone with no tasks at all. */}
      {settled.length === 0 && running.length === 0 && connection !== 'connecting' && (
        <section className="section enter" style={step()}>
          <AgentArt />
          <div className="strip">
            {CAPABILITIES.map(({ Icon, title, body }) => (
              <article key={title} className="capability">
                <Icon size={20} className="capability__icon" />
                <h2 className="h3">{title}</h2>
                <p className="tiny">{body}</p>
              </article>
            ))}
          </div>
          <button className="rowitem mt-5" onClick={() => navigate('/about')}>
            <span className="grow small">How Sable decides, and where it stops</span>
            <IconArrow size={15} />
          </button>
        </section>
      )}
    </Screen>
  );
};

export default Home;

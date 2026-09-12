import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconArrow, IconBell, IconCheck, IconPlus } from '../components/Icons';
import { greeting, useProfile } from '../context/ProfileContext';
import { useAgent } from '../context/AgentContext';
import { usePolicy } from '../context/PolicyContext';
import { useCountUp } from '../hooks/useCountUp';
import { inr } from '../lib/format';
import type { Run, RunStatus } from '../lib/types';

const STATUS_TEXT: Record<RunStatus, string> = {
  running: 'Working',
  monitoring: 'Watching the price',
  'awaiting-approval': 'Waiting for you',
  completed: 'Done',
  declined: 'You declined it',
  blocked: 'Stopped by your limits',
};

const HOW_IT_WORKS_KEY = 'acta.introSeen';

const STEPS = [
  { n: 1, title: 'Say what you want', body: 'In your own words, with the most you will pay.' },
  { n: 2, title: 'Set the limit once', body: 'Below it the agent pays. Above it, it asks you first.' },
  { n: 3, title: 'Approve or decline', body: 'You see the price, the vendor and why it stopped.' },
];

/** One line of live status for a task, used in the running list. */
const RunningRow = ({ run, onOpen }: { run: Run; onOpen: () => void }) => {
  const stage = run.stages.find((s) => s.status === 'active') ?? run.stages.find((s) => s.status === 'pending');
  const done = run.stages.filter((s) => s.status === 'done' || s.status === 'skipped').length;

  return (
    <button className="rowitem" onClick={onOpen}>
      <span className="grow">
        <span className="h3 clamp-2">{run.goal.text}</span>
        <span className="tiny">
          {stage ? stage.name : 'Working'} — step {Math.min(done + 1, 9)} of 9
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
  const { profile, initial } = useProfile();

  const [introDone, setIntroDone] = useState(() => {
    try {
      return localStorage.getItem(HOW_IT_WORKS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const dismissIntro = () => {
    try {
      localStorage.setItem(HOW_IT_WORKS_KEY, '1');
    } catch {
      /* storage blocked — it will show again next time, which is harmless */
    }
    setIntroDone(true);
  };

  const running = runs.filter((r) => r.status === 'running' || r.status === 'monitoring');
  const settled = runs.filter((r) => r.status === 'completed').length;
  const recent = runs.filter((r) => r.id !== pending[0]?.id && r.status !== 'running' && r.status !== 'monitoring').slice(0, 3);
  const spent = useCountUp(spentToday);
  const waiting = pending[0];
  const waitingPick = waiting?.offers.find((o) => o.id === waiting.pickId);

  return (
    <Screen title="" bare>
      {/* Who you are, what time it is, and anything shouting for attention. */}
      <header className="greeting">
        <button className="avatar" onClick={() => navigate('/settings')} aria-label="Your settings">
          {initial}
        </button>
        <span className="grow">
          <span className="tiny" style={{ display: 'block' }}>{greeting()}</span>
          <span className="h2" style={{ fontSize: 21 }}>{profile.name}</span>
        </span>
        <button
          className="iconbtn"
          onClick={() => navigate('/approvals')}
          aria-label={pending.length ? `${pending.length} waiting for you` : 'Nothing waiting'}
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

      {/* The one thing that needs a human comes first, always. */}
      {waiting && waitingPick ? (
        <section className="section section--first">
          <button className="card card--glow enter" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate(`/run/${waiting.id}`)}>
            <div className="row-between mb-4">
              <span className="pill pill--ask"><span className="dot dot--live" />Needs you</span>
              <span className="tiny">{waitingPick.vendor}</span>
            </div>
            <p className="amount" style={{ fontSize: 42 }}>{inr(waitingPick.price)}</p>
            <p className="small mt-2 mb-4">{waitingPick.title}</p>
            <span className="row" style={{ color: 'var(--metal)' }}>
              <span className="small" style={{ color: 'inherit' }}>Review and approve</span>
              <IconArrow size={15} />
            </span>
          </button>
        </section>
      ) : (
        <section className="section section--first">
          <div className="card card--quiet enter" style={{ padding: 0 }}>
            <p className="h1">What do you need done?</p>
            <p className="body mt-3">
              Tell the agent in a sentence. It searches, compares and pays — up to{' '}
              {inr(policy.autoApproveLimit)} on its own.
            </p>
          </div>
        </section>
      )}

      <section className="section">
        <button className="btn btn--block" onClick={() => navigate('/new')}>
          <IconPlus size={17} /> New task
        </button>
      </section>

      {/* Anything in flight, with its live position in the loop. */}
      {running.length > 0 && (
        <section className="section">
          <p className="eyebrow mb-3">Working now</p>
          <div className="stack stack-2">
            {running.map((run, i) => (
              <span key={run.id} className="enter" style={{ '--i': i } as React.CSSProperties}>
                <RunningRow run={run} onOpen={() => navigate(`/run/${run.id}`)} />
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Today, in one glance. */}
      <section className="section">
        <p className="eyebrow mb-3">Today</p>
        <div className="card">
          <div className="row-between">
            <span className="small">Spent by the agent</span>
            <span className="amount" style={{ fontSize: 20 }}>{inr(spent)}</span>
          </div>
          <div
            className="mt-3"
            style={{ height: 3, borderRadius: 3, background: 'var(--hairline-2)', overflow: 'hidden' }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.round((spentToday / policy.dailyCap) * 100))}%`,
                height: '100%',
                background: 'var(--jade)',
                transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            />
          </div>
          <p className="tiny mt-2">
            {inr(policy.dailyCap)} is the most it may spend today. {settled} task{settled === 1 ? '' : 's'} finished.
          </p>
        </div>
      </section>

      {running.length === 0 && recent.length > 0 && (
        <section className="section">
          <p className="eyebrow mb-3">Recently</p>
          <div className="stack stack-2">
            {recent.map((run, i) => (
              <button
                key={run.id}
                className="rowitem enter"
                style={{ '--i': i } as CSSProperties}
                onClick={() => navigate(`/run/${run.id}`)}
              >
                <span className="grow">
                  <span className="h3 clamp-2">{run.goal.text}</span>
                  <span className="tiny">
                    {run.receipt ? `Paid ${inr(run.receipt.amount)} to ${run.receipt.vendor}` : STATUS_TEXT[run.status]}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Shown until someone has read it once. */}
      {!introDone && connection !== 'offline' && (
        <section className="section">
          <div className="card card--flat">
            <div className="row-between mb-4">
              <p className="h3">How this works</p>
              <button className="btn btn--sm btn--outline" onClick={dismissIntro}>
                <IconCheck size={14} /> Got it
              </button>
            </div>
            <ol className="stack stack-4">
              {STEPS.map((s) => (
                <li key={s.n} className="row row-top">
                  <span className="loopstep__bullet">{s.n}</span>
                  <span className="grow">
                    <span className="h3" style={{ display: 'block' }}>{s.title}</span>
                    <span className="tiny">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="section">
        <button className="rowitem" onClick={() => navigate('/about')}>
          <span className="grow small">What ACTA is building</span>
          <IconArrow size={15} />
        </button>
      </section>
    </Screen>
  );
};

export default Home;

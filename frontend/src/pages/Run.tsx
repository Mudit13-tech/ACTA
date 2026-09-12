import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Screen from '../components/Screen';
import ActionLoop from '../components/ActionLoop';
import OfferCard from '../components/OfferCard';
import Sheet from '../components/Sheet';
import { IconAlert, IconCheck, IconClock, IconShield } from '../components/Icons';
import HoldToApprove from '../components/HoldToApprove';
import { useCountUp } from '../hooks/useCountUp';
import { useAgent } from '../context/AgentContext';
import { usePolicy } from '../context/PolicyContext';
import api from '../services/api';
import { inr, timeOf } from '../lib/format';
import type { Run as RunModel, RunStatus } from '../lib/types';

const HEADLINE: Record<RunStatus, { pill: string; label: string; line: string }> = {
  running: { pill: 'pill--info', label: 'running', line: 'The agent is working through the loop.' },
  monitoring: { pill: 'pill--info', label: 'watching', line: 'Holding until your condition is met.' },
  'awaiting-approval': { pill: 'pill--ask', label: 'needs you', line: 'Policy says this one is yours to call.' },
  completed: { pill: 'pill--auto', label: 'complete', line: 'Paid and verified with the vendor.' },
  declined: { pill: 'pill--muted', label: 'declined', line: 'You declined — nothing was paid.' },
  blocked: { pill: 'pill--block', label: 'blocked', line: 'Your policy stopped this before any money moved.' },
};

const Run = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { getRun, approve, decline, fastForward, connection } = useAgent();
  const { policy, reload: reloadPolicy } = usePolicy();
  const [dismissed, setDismissed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [trustNext, setTrustNext] = useState(false);
  /* A deep link can name a run the list hasn't loaded — fetch that one directly. */
  const [fetched, setFetched] = useState<RunModel>();
  const [missing, setMissing] = useState(false);

  const known = getRun(id);
  const run = known ?? fetched;
  const paid = useCountUp(run?.receipt?.amount ?? 0);

  useEffect(() => {
    if (known || connection !== 'online') return;
    api
      .getRun(id)
      .then(setFetched)
      .catch(() => setMissing(true));
  }, [id, known, connection]);
  const awaiting = run?.status === 'awaiting-approval';
  /* The approval sheet is open by definition while a decision is owed — that
     decision is the whole point of the screen — until the user waves it away. */
  const sheetOpen = awaiting && !dismissed;

  if (!run) {
    return (
      <Screen title="Task" back="/tasks">
        <div className="empty">
          {missing || connection === 'offline' ? (
            <>
              <IconAlert size={26} />
              <p className="small">
                {connection === 'offline' ? "Can't reach the agent right now." : 'This task is no longer available.'}
              </p>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/tasks')}>
                Back to tasks
              </button>
            </>
          ) : (
            <>
              <span className="spinner" />
              <p className="small">Loading the task…</p>
            </>
          )}
        </div>
      </Screen>
    );
  }

  const head = HEADLINE[run.status];
  const pick = run.offers.find((o) => o.id === run.pickId);
  const active = run.stages.find((s) => s.status === 'active' || s.status === 'blocked');
  const others = run.offers.filter((o) => o.id !== run.pickId);

  const onApprove = async () => {
    /* The server records the payment and the vendor trust in one call. */
    await approve(run.id, trustNext);
    if (trustNext) await reloadPolicy();
    setDismissed(false);
  };

  const onDecline = async () => {
    await decline(run.id);
    setDismissed(false);
  };

  return (
    <Screen title="Task" sub={timeOf(run.createdAt)} back="/tasks">
      {/* ── Status ───────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 18 }}>
        <div className="row mb-3">
          <span className={`pill ${head.pill}`}>
            {(run.status === 'running' || run.status === 'monitoring') && <span className="dot" />}
            {head.label}
          </span>
          <span className="tiny">ceiling {inr(run.goal.budget)}</span>
        </div>
        <h1 className="h2">“{run.goal.text}”</h1>
        <p className="small mt-2">{head.line}</p>

        {(run.status === 'running' || run.status === 'monitoring') && active && (
          <div className="card card--tight row" style={{ marginTop: 14, gap: 12 }}>
            <span className="spinner" />
            <span className="grow">
              <span className="small" style={{ display: 'block' }}>{active.name}</span>
              {active.note && <span className="tiny">{active.note}</span>}
            </span>
          </div>
        )}

        {run.status === 'monitoring' && (
          <button className="btn btn--ghost btn--block btn--sm mt-3" onClick={() => void fastForward(run.id)}>
            <IconClock size={15} /> Skip the wait
          </button>
        )}

        {awaiting && (
          <button className="btn btn--block mt-3" onClick={() => setDismissed(false)}>
            <IconShield size={17} /> Review the approval
          </button>
        )}
      </section>

      {/* ── Receipt ──────────────────────────────────────────── */}
      {run.receipt && (
        <section className="section fade-in">
          <div className="card card--glow">
            <div className="row mb-3">
              <span className="pill pill--auto"><IconCheck size={12} /> verified</span>
              <span className="tiny">{timeOf(run.receipt.paidAt)}</span>
            </div>
            <p className="tiny mb-2">Paid to {run.receipt.vendor}</p>
            <p className="amount" style={{ fontSize: 30, marginBottom: 12 }}>{inr(paid)}</p>
            <div className="kv"><span className="kv__k">Reference</span><span className="kv__v mono tiny">{run.receipt.reference}</span></div>
            <div className="kv"><span className="kv__k">Method</span><span className="kv__v tiny">{run.receipt.method}</span></div>
            <div className="kv">
              <span className="kv__k">Authorised by</span>
              <span className="kv__v tiny">
                {run.verdict?.autoPay ? 'Policy — automatic' : 'You'}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Watch feed ───────────────────────────────────────── */}
      {run.watch.length > 0 && (
        <section className="section">
          <p className="eyebrow mb-3">Price watch</p>
          <div className="card card--tight stack stack-6">
            {run.watch.map((w, i) => (
              <div key={i} className="row-between">
                <span className="tiny mono">{timeOf(w.at)}</span>
                <span className="small grow">{w.note}</span>
                {w.price > 0 && <span className="amount tiny">{inr(w.price)}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── The loop ─────────────────────────────────────────── */}
      <section className="section">
        <p className="eyebrow mb-3">Action loop</p>
        <ActionLoop stages={run.stages} />
      </section>

      {/* ── Options ──────────────────────────────────────────── */}
      {pick && (
        <section className="section">
          <p className="eyebrow mb-3">The choice</p>
          <OfferCard offer={pick} picked budget={run.goal.budget} />

          {others.length > 0 && (
            <>
              <button
                className="btn btn--outline btn--block btn--sm mt-3"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? 'Hide' : `Show the ${others.length} options it rejected`}
              </button>
              {showAll && (
                <div className="list fade-in mt-3">
                  {others.map((o, i) => (
                    <OfferCard key={o.id} offer={o} rank={i + 2} budget={run.goal.budget} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Approval sheet ───────────────────────────────────── */}
      <Sheet open={sheetOpen} onClose={() => setDismissed(true)} title="Approve this payment?">
        {pick && (
          <>
            <div className="card card--flat mb-4">
              <p className="tiny">{pick.vendor}</p>
              <p className="h3" style={{ margin: '3px 0 8px' }}>{pick.title}</p>
              <p className="amount" style={{ fontSize: 30, marginBottom: 10 }}>{inr(pick.price)}</p>
              <ul className="facts">
                {pick.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>

            <p className="label mb-3">Why you're being asked</p>
            <ul className="reasons mb-5">
              {(run.verdict?.reasons ?? []).map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>

            {!policy.trustedVendors.includes(pick.vendor) && (
              <button
                className="rowitem mb-4"
                onClick={() => setTrustNext((v) => !v)}
                role="switch"
                aria-checked={trustNext}
              >
                <span className="grow small">Trust {pick.vendor} for future tasks</span>
                <span className="switch" data-on={trustNext} />
              </button>
            )}

            <div className="stack stack-3">
              <HoldToApprove label={`Hold to pay ${inr(pick.price)}`} onComplete={() => void onApprove()} />
              <button className="btn btn--danger btn--block" onClick={() => void onDecline()}>Decline</button>
            </div>
            <p className="tiny center mt-3">Nothing is charged until you finish the hold.</p>
          </>
        )}
      </Sheet>
    </Screen>
  );
};

export default Run;

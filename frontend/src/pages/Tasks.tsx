import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconList, IconPlus } from '../components/Icons';
import { useAgent } from '../context/AgentContext';
import { dayOf, inr, timeOf } from '../lib/format';
import type { ActivityEvent, RunStatus } from '../lib/types';

const STATUS: Record<RunStatus, { cls: string; label: string }> = {
  running: { cls: 'pill--info', label: 'Working' },
  monitoring: { cls: 'pill--info', label: 'Watching price' },
  'awaiting-approval': { cls: 'pill--ask', label: 'Needs you' },
  completed: { cls: 'pill--auto', label: 'Done' },
  declined: { cls: 'pill--muted', label: 'Declined' },
  blocked: { cls: 'pill--block', label: 'Stopped' },
};

const EVENT_TONE: Record<ActivityEvent['kind'], string> = {
  started: 'var(--ink-3)',
  approved: 'var(--jade)',
  declined: 'var(--ink-3)',
  paid: 'var(--jade)',
  verified: 'var(--jade)',
  blocked: 'var(--oxblood)',
  watching: 'var(--amber)',
};

const Tasks = () => {
  const navigate = useNavigate();
  const { runs, activity, clearHistory, connection } = useAgent();
  const [tab, setTab] = useState<'tasks' | 'history'>('tasks');

  const byDay = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const event of activity) {
      map.set(dayOf(event.at), [...(map.get(dayOf(event.at)) ?? []), event]);
    }
    return [...map.entries()];
  }, [activity]);

  return (
    <Screen
      title="Tasks"
      action={
        tab === 'history' && activity.length > 0 ? (
          <button className="btn btn--sm btn--outline" onClick={() => void clearHistory()}>Clear</button>
        ) : undefined
      }
    >
      <section className="section section--first">
        <div className="segmented">
          <button aria-pressed={tab === 'tasks'} onClick={() => setTab('tasks')}>Tasks</button>
          <button aria-pressed={tab === 'history'} onClick={() => setTab('history')}>History</button>
        </div>
      </section>

      {tab === 'tasks' ? (
        <section className="section">
          {runs.length === 0 ? (
            <div className="empty">
              {connection === 'connecting' ? (
                <>
                  <span className="skeleton" style={{ width: '100%', height: 60 }} />
                  <span className="skeleton" style={{ width: '100%', height: 60 }} />
                </>
              ) : (
                <>
                  <IconList size={24} />
                  <p className="small">No tasks yet.</p>
                  <p className="tiny">Start one and you can watch every step it takes.</p>
                  <button className="btn btn--sm btn--ghost mt-2" onClick={() => navigate('/new')}>
                    <IconPlus size={15} /> New task
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="stack stack-2">
              {runs.map((run, i) => {
                const pick = run.offers.find((o) => o.id === run.pickId);
                const status = STATUS[run.status];
                return (
                  <button
                    key={run.id}
                    className="rowitem enter"
                    style={{ '--i': i } as CSSProperties}
                    onClick={() => navigate(`/run/${run.id}`)}
                  >
                    <span className="grow">
                      <span className="h3 clamp-2">{run.goal.text}</span>
                      <span className="tiny">
                        {run.receipt ? `Paid ${inr(run.receipt.amount)} to ${run.receipt.vendor}` : pick ? `${pick.vendor}, ${inr(pick.price)}` : `Up to ${inr(run.goal.budget)}`}
                      </span>
                    </span>
                    <span className={`pill ${status.cls}`}>
                      {(run.status === 'running' || run.status === 'monitoring') && <span className="dot dot--live" />}
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="section">
          {activity.length === 0 ? (
            <div className="empty">
              <IconList size={24} />
              <p className="small">Nothing logged yet.</p>
              <p className="tiny">Every action the agent takes is recorded here, with its reason.</p>
            </div>
          ) : (
            byDay.map(([day, events]) => (
              <div key={day} className="mb-5">
                <p className="eyebrow mb-3">{day}</p>
                <div className="stack stack-2">
                  {events.map((event, i) => (
                    <button
                      key={event.id}
                      className="rowitem enter"
                      style={{ '--i': i } as CSSProperties}
                      onClick={() => navigate(`/run/${event.runId}`)}
                    >
                      <span className="dot" style={{ color: EVENT_TONE[event.kind] }} />
                      <span className="grow">
                        <span className="row-between">
                          <span className="small">{event.title}</span>
                          <span className="tiny">{timeOf(event.at)}</span>
                        </span>
                        <span className="tiny" style={{ display: 'block' }}>{event.detail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </Screen>
  );
};

export default Tasks;

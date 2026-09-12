import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconCheck, IconChevron, IconShield } from '../components/Icons';
import HoldToApprove from '../components/HoldToApprove';
import { useAgent } from '../context/AgentContext';
import { usePolicy } from '../context/PolicyContext';
import { inr, timeOf } from '../lib/format';

const Approvals = () => {
  const navigate = useNavigate();
  const { pending, approve, decline, runs } = useAgent();
  const { policy } = usePolicy();

  const watching = runs.filter((r) => r.status === 'monitoring');

  return (
    <Screen title="Approvals" sub={pending.length ? `${pending.length} waiting on you` : 'Nothing waiting'}>
      <section className="section" style={{ paddingTop: 18 }}>
        <div className="card card--flat row" style={{ gap: 12 }}>
          <IconShield size={20} />
          <span className="grow">
            <span className="small" style={{ display: 'block' }}>
              {policy.autoPayEnabled ? `Payments up to ${inr(policy.autoApproveLimit)} go through on their own` : 'Every payment comes to you'}
            </span>
            <span className="tiny">Everything else lands here first</span>
          </span>
        </div>
      </section>

      {pending.length === 0 ? (
        <div className="empty">
          <IconCheck size={26} />
          <p className="small">No approvals waiting.</p>
          <p className="tiny">When a task hits the edge of your policy, the agent stops here.</p>
          <button className="btn btn--ghost btn--sm mt-2" onClick={() => navigate('/new')}>
            Start a task
          </button>
        </div>
      ) : (
        <section className="section">
          <div className="list">
            {pending.map((run) => {
              const pick = run.offers.find((o) => o.id === run.pickId);
              if (!pick) return null;
              return (
                <article key={run.id} className="card card--glow fade-in">
                  <div className="row-between mb-2">
                    <span className="pill pill--ask">approval needed</span>
                    <span className="tiny">{timeOf(run.createdAt)}</span>
                  </div>

                  <p className="tiny mb-2">{pick.vendor}</p>
                  <h3 className="h3 mb-2">{pick.title}</h3>
                  <p className="amount" style={{ fontSize: 24, marginBottom: 10 }}>{inr(pick.price)}</p>

                  <ul className="reasons mb-4">
                    {(run.verdict?.reasons ?? []).slice(0, 2).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>

                  <div className="stack stack-2">
                    <HoldToApprove label={`Hold to pay ${inr(pick.price)}`} onComplete={() => void approve(run.id)} />
                    <div className="row">
                      <button className="btn btn--danger btn--sm grow" onClick={() => void decline(run.id)}>Decline</button>
                      <button className="btn btn--outline btn--sm grow" onClick={() => navigate(`/run/${run.id}`)}>
                        Why it stopped
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {watching.length > 0 && (
        <section className="section">
          <p className="eyebrow mb-3">Waiting on a condition</p>
          <div className="list">
            {watching.map((r) => (
              <button key={r.id} className="rowitem" onClick={() => navigate(`/run/${r.id}`)}>
                <span className="pill pill--info"><span className="dot" />watching</span>
                <span className="grow small">{r.goal.text}</span>
                <IconChevron size={16} />
              </button>
            ))}
          </div>
        </section>
      )}
    </Screen>
  );
};

export default Approvals;

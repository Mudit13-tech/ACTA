import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconArrow } from '../components/Icons';
import { useAgent } from '../context/AgentContext';
import { usePolicy } from '../context/PolicyContext';
import api, { type GoalPreview } from '../services/api';
import { inr } from '../lib/format';

const EXAMPLES = [
  'A 27-inch monitor under ₹20,000',
  'Hotel in Goa, 3 nights, under ₹15,000',
  'Headphones under ₹10,000 at 20% off',
  'Table for four tomorrow at 8 PM',
];

const KIND: Record<string, string> = {
  shopping: 'Shopping',
  travel: 'Travel',
  reservation: 'Reservation',
};

const MIN = 1000;
const MAX = 100000;

const NewTask = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { startRun } = useAgent();
  const { policy } = usePolicy();

  const [text, setText] = useState(params.get('goal') ?? '');
  const [budget, setBudget] = useState(20000);
  const [understood, setUnderstood] = useState<GoalPreview>();
  const [starting, setStarting] = useState(false);

  /* The agent reads the sentence back while you type, so nothing it does later
     is a surprise. Debounced to keep typing smooth. */
  useEffect(() => {
    const goal = text.trim();
    if (!goal) {
      setUnderstood(undefined);
      return;
    }
    const timer = setTimeout(() => {
      api.previewGoal(goal, budget).then(setUnderstood).catch(() => setUnderstood(undefined));
    }, 300);
    return () => clearTimeout(timer);
  }, [text, budget]);

  const start = async () => {
    setStarting(true);
    const id = await startRun(text.trim(), budget);
    setStarting(false);
    if (id) navigate(`/run/${id}`);
  };

  const ceiling = understood?.budget ?? budget;
  const willAsk = ceiling > policy.autoApproveLimit;

  return (
    <Screen title="New task" back="/">
      <section className="section section--first">
        <div className="field">
          <label className="label" htmlFor="goal">What do you need done?</label>
          <textarea
            id="goal"
            className="textarea"
            placeholder="Find a highly rated hotel in Goa for 3 nights under ₹15,000 and book it"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>
        <div className="chiprow mt-3">
          {EXAMPLES.map((example) => (
            <button key={example} className="chip" onClick={() => setText(example)}>{example}</button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="row-between mb-3">
          <span className="label">Most you will pay</span>
          <span className="amount" style={{ fontSize: 19 }}>{inr(budget)}</span>
        </div>
        <input
          className="slider"
          type="range"
          min={MIN}
          max={MAX}
          step={500}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          style={{ '--fill': `${((budget - MIN) / (MAX - MIN)) * 100}%` } as CSSProperties}
          aria-label="Most you will pay"
        />
        {understood && understood.budget !== budget && (
          <p className="tiny mt-3" style={{ color: 'var(--metal)' }}>
            Your sentence says {inr(understood.budget)}, so the agent will use that.
          </p>
        )}
      </section>

      {understood && (
        <section className="section fade-in">
          <p className="eyebrow mb-3">What the agent understood</p>
          <div className="card">
            <div className="kv"><span className="kv__k">Looking for</span><span className="kv__v">{KIND[understood.category]}</span></div>
            <div className="kv"><span className="kv__k">Spending at most</span><span className="kv__v amount">{inr(understood.budget)}</span></div>
            <div className="kv">
              <span className="kv__k">Buys when</span>
              <span className="kv__v">
                {understood.minDiscountPct ? `It drops ${understood.minDiscountPct}% below list` : 'It finds the best match'}
              </span>
            </div>
            {understood.constraints.length > 0 && (
              <div className="kv"><span className="kv__k">Also wants</span><span className="kv__v">{understood.constraints.join(', ')}</span></div>
            )}
          </div>
          <p className="tiny mt-3">
            {willAsk
              ? `More than ${inr(policy.autoApproveLimit)}, so the agent will stop and ask you before paying.`
              : `Within your ${inr(policy.autoApproveLimit)} limit, so the agent can pay without asking.`}
          </p>
        </section>
      )}

      <section className="section">
        <button className="btn btn--block" disabled={!text.trim() || starting} onClick={() => void start()}>
          {starting ? <span className="spinner" /> : <IconArrow size={17} />}
          {starting ? 'Starting' : 'Start the task'}
        </button>
      </section>
    </Screen>
  );
};

export default NewTask;

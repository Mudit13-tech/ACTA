import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconArrow } from '../components/Icons';
import { usePolicy } from '../context/PolicyContext';
import { STAGES } from '../lib/stages';
import { inr } from '../lib/format';

/**
 * The case for the product. It lives on its own screen so the app itself can
 * open on your actual state instead of a sales page.
 */
const About = () => {
  const navigate = useNavigate();
  const { policy } = usePolicy();

  const permissions = [
    { action: 'Search and compare', verdict: 'On its own', tone: 'auto' },
    { action: 'Watch a price', verdict: 'On its own', tone: 'auto' },
    { action: 'Prepare the checkout', verdict: 'On its own', tone: 'auto' },
    { action: `Pay up to ${inr(policy.autoApproveLimit)}`, verdict: policy.autoPayEnabled ? 'On its own' : 'Asks you', tone: policy.autoPayEnabled ? 'auto' : 'ask' },
    { action: `Pay more than ${inr(policy.autoApproveLimit)}`, verdict: 'Asks you', tone: 'ask' },
    { action: 'Use a new vendor', verdict: policy.requireApprovalNewVendor ? 'Asks you' : 'On its own', tone: policy.requireApprovalNewVendor ? 'ask' : 'auto' },
    { action: `Spend beyond ${inr(policy.hardCeiling)}`, verdict: 'Never', tone: 'block' },
  ];

  return (
    <Screen title="What ACTA is" back="/">
      <section className="section section--first">
        <h1 className="h1">An agent that finishes the errand.</h1>
        <p className="body mt-4">
          Assistants recommend and payment systems charge, but nothing joins the two — so every
          purchase still comes back to you. ACTA is the layer in between, and the boundary you set
          is what makes it safe to hand over.
        </p>
      </section>

      <section className="section">
        <p className="eyebrow mb-4">What it does with one sentence</p>
        <blockquote className="card card--flat mb-4">
          <p className="display" style={{ fontSize: 18, lineHeight: 1.45 }}>
            “Find me the best hotel in Goa under ₹15,000 and book it if it meets my requirements.”
          </p>
        </blockquote>
        <ol className="stack stack-1">
          {STAGES.map((stage, i) => (
            <li key={stage.id} className="row" style={{ padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
              <span className="amount tiny" style={{ width: 20, color: 'var(--metal)' }}>{i + 1}</span>
              <span className="small grow">{stage.name}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <p className="eyebrow mb-4">Where it stops</p>
        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          {permissions.map((p) => (
            <div key={p.action} className="kv">
              <span className="kv__k grow">{p.action}</span>
              <span className={`pill pill--${p.tone}`}>{p.verdict}</span>
            </div>
          ))}
        </div>
        <button className="btn btn--outline btn--block btn--sm mt-4" onClick={() => navigate('/limits')}>
          Change these limits
        </button>
      </section>

      <section className="section">
        <p className="eyebrow mb-4">Later</p>
        <ul className="stack stack-1">
          {[
            'Renew a subscription only if the price held',
            'Pay an invoice once the amount is verified',
            'Buy when a watched product reaches its price',
            'Compare vendors and prepare the purchase',
          ].map((item) => (
            <li key={item} className="small" style={{ padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <button className="btn btn--block" onClick={() => navigate('/new')}>
          <IconArrow size={17} /> Start a task
        </button>
        <p className="tiny center mt-4">Vendors, prices and payments in this build are simulated.</p>
      </section>
    </Screen>
  );
};

export default About;

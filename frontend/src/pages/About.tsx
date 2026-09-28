import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconArrow } from '../components/Icons';
import { Wordmark } from '../components/Brand';
import LoopDemo from '../components/LoopDemo';
import { usePolicy } from '../context/PolicyContext';
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
    <Screen title="What Sable is" back="/">
      <section className="section section--first">
        <div className="card card--glow tint--violet">
          <Wordmark size={26} />
          <p className="tiny mt-2 mb-4">Quiet authority</p>
          <h1 className="h1">An agent that finishes the errand.</h1>
          <p className="body mt-4">
            Assistants recommend and payment systems charge, but nothing joins the two — so every
            purchase still comes back to you. Sable is the layer in between, and the boundary you
            set is what makes it safe to hand over.
          </p>
        </div>
      </section>

      {/* One sentence, and then that sentence actually running. */}
      <section className="section">
        <p className="display" style={{ fontSize: 19, lineHeight: 1.45 }}>
          “Find me the best hotel in Goa under ₹15,000 and book it if it meets my requirements.”
        </p>
        <div className="ruled mt-5">
          <LoopDemo />
        </div>
      </section>

      <section className="section">
        <p className="eyebrow mb-4">Where it stops</p>
        <div className="list">
          {permissions.map((p) => (
            <div key={p.action} className="row">
              <span className="grow small">{p.action}</span>
              <span className={`pill pill--${p.tone}`}>{p.verdict}</span>
            </div>
          ))}
        </div>
        <button className="btn btn--outline btn--block btn--sm mt-5" onClick={() => navigate('/limits')}>
          Change these limits
        </button>
      </section>

      <section className="section">
        <p className="eyebrow mb-4">Later</p>
        <div className="list">
          {[
            'Renew a subscription only if the price held',
            'Pay an invoice once the amount is verified',
            'Buy when a watched product reaches its price',
            'Compare vendors and prepare the purchase',
          ].map((item) => (
            <p key={item} className="small">{item}</p>
          ))}
        </div>
      </section>

      <section className="section section--foot">
        <button className="btn btn--block" onClick={() => navigate('/')}>
          <IconArrow size={17} /> Start a task
        </button>
        <p className="tiny center mt-4">Vendors, prices and payments in this build are simulated.</p>
      </section>
    </Screen>
  );
};

export default About;

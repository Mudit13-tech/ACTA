import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import Sheet from '../components/Sheet';
import { Wordmark } from '../components/Brand';
import { IconArrow, IconCard, IconInfo, IconMoon, IconShield, IconSun, IconUser } from '../components/Icons';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { usePolicy } from '../context/PolicyContext';
import { useAgent } from '../context/AgentContext';
import { inr } from '../lib/format';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, initial, update, signOut, device } = useProfile();
  const { mode, toggle } = useTheme();
  const { policy } = usePolicy();
  const { runs, clearHistory } = useAgent();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const save = () => {
    update({ name: name.trim() || 'Guest', email: email.trim() });
    setEditing(false);
  };

  const since = new Date(profile.since).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <Screen title="Settings">
      {/* Who the agent is acting for. */}
      <section className="section section--first">
        <div className="card card--glow tint--straw row" style={{ gap: 'var(--s4)' }}>
          <span className="avatar avatar--lg">{initial}</span>
          <span className="grow">
            <span className="h2" style={{ display: 'block' }}>{profile.name}</span>
            <span className="tiny">{profile.email || `Using Sable since ${since}`}</span>
          </span>
          <button className="btn btn--sm btn--ghost" onClick={() => setEditing(true)}>Edit</button>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow mb-3">Your agent</p>
        <div className="stack stack-2">
          <button className="rowitem" onClick={() => navigate('/limits')}>
            <IconShield size={19} />
            <span className="grow">
              <span className="h3" style={{ display: 'block' }}>Limits</span>
              <span className="tiny">
                Pays up to {inr(policy.autoApproveLimit)} alone, {inr(policy.dailyCap)} a day
              </span>
            </span>
            <IconArrow size={15} />
          </button>

          <div className="rowitem" style={{ cursor: 'default' }}>
            <IconCard size={19} />
            <span className="grow">
              <span className="h3" style={{ display: 'block' }}>Payment method</span>
              <span className="tiny">Sable virtual card, ending {profile.card} — single-use per task</span>
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow mb-3">Appearance</p>
        <button className="rowitem" onClick={toggle} role="switch" aria-checked={mode === 'dark'}>
          {mode === 'dark' ? <IconMoon size={19} /> : <IconSun size={19} />}
          <span className="grow">
            <span className="h3" style={{ display: 'block' }}>Dark appearance</span>
            <span className="tiny">Follows your device until you choose here</span>
          </span>
          <span className="switch" data-on={mode === 'dark'} />
        </button>
      </section>

      <section className="section">
        <p className="eyebrow mb-3">About</p>
        <div className="stack stack-2">
          <button className="rowitem" onClick={() => navigate('/about')}>
            <IconInfo size={19} />
            <span className="grow">
              <span className="h3" style={{ display: 'block' }}>What Sable is</span>
              <span className="tiny">How the agent decides, and where it stops</span>
            </span>
            <IconArrow size={15} />
          </button>

          <div className="card card--flat">
            <div className="kv"><span className="kv__k">Tasks run</span><span className="kv__v">{runs.length}</span></div>
            <div className="kv"><span className="kv__k">Member since</span><span className="kv__v">{since}</span></div>
            <div className="kv"><span className="kv__k">This device</span><span className="kv__v tiny">{device.slice(0, 13)}</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="stack stack-2">
          <button className="btn btn--outline btn--block btn--sm" onClick={() => void clearHistory()}>
            Clear finished tasks
          </button>
          <button className="btn btn--danger btn--block btn--sm" onClick={signOut}>
            Sign out
          </button>
        </div>
        <p className="tiny center mt-3">
          Clearing keeps anything still running or waiting on you. Signing out returns you to the
          welcome screen; your tasks and limits stay where they are.
        </p>
      </section>

      {/* The name, signed off once at the bottom of the deepest screen. */}
      <section className="section section--foot">
        <div className="brand brand--center">
          <Wordmark size={15} />
        </div>
        <p className="tiny center mt-3">The trust layer between an agent and your money.</p>
      </section>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Your details">
        <div className="stack stack-4">
          <div className="field">
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn--block" onClick={save}>
            <IconUser size={16} /> Save details
          </button>
        </div>
      </Sheet>
    </Screen>
  );
};

export default Settings;

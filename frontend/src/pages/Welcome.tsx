import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sheet from '../components/Sheet';
import WelcomeDeck from '../components/WelcomeDeck';
import { Wordmark } from '../components/Brand';
import { AppleMark, GoogleMark } from '../components/AuthMarks';
import { IconArrow, IconMoon, IconSun } from '../components/Icons';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

/**
 * The way in.
 *
 * There is no server-side account in this build, so all three routes lead to
 * the same place: a name for the agent to act under, kept on this device. The
 * note under the buttons says so plainly rather than letting the provider
 * marks imply an account that does not exist.
 */
const Welcome = () => {
  const navigate = useNavigate();
  const { profile, signIn } = useProfile();
  const { mode, toggle } = useTheme();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name === 'Guest' ? '' : profile.name);
  const [email, setEmail] = useState(profile.email);

  const enter = () => {
    signIn({ name: name.trim() || 'Guest', email: email.trim() });
    navigate('/', { replace: true });
  };

  return (
    <main className="screen screen--nonav">
      <div className="auth">
        <header className="auth__head">
          <Wordmark size={16} />
          <button
            className="iconbtn"
            onClick={toggle}
            aria-label={mode === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          >
            {mode === 'dark' ? <IconMoon size={17} /> : <IconSun size={17} />}
          </button>
        </header>

        <WelcomeDeck />

        <div className="auth__pitch">
          <h1 className="auth__title">
            It runs the errand.
            <br />
            You draw the line.
          </h1>
          <p className="auth__sub">
            Sable searches, compares and pays for you — then stops dead at the number you set.
          </p>
        </div>

        <div className="auth__actions">
          <button className="provider provider--dark" onClick={() => setOpen(true)}>
            <GoogleMark />
            Continue with Google
          </button>
          <button className="provider provider--pearl" onClick={() => setOpen(true)}>
            <AppleMark />
            Continue with Apple
          </button>
          <button className="textbtn" onClick={() => setOpen(true)}>
            Set up with a name instead
          </button>
        </div>

        <p className="auth__note">
          Prototype build. No account is created — your details stay on this device, and every
          vendor, price and payment is simulated.
        </p>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Who is Sable acting for?">
        <div className="stack stack-4">
          <div className="field">
            <label className="label" htmlFor="setup-name">Name</label>
            <input
              id="setup-name"
              className="input"
              value={name}
              placeholder="Your name"
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enter()}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="setup-email">Email — optional</label>
            <input
              id="setup-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enter()}
            />
          </div>
          <button className="btn btn--block" onClick={enter}>
            <IconArrow size={17} /> Enter Sable
          </button>
          <p className="tiny center">
            You can change this any time in Settings.
          </p>
        </div>
      </Sheet>
    </main>
  );
};

export default Welcome;

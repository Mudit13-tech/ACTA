import { useLocation } from 'react-router-dom';
import { useAgent } from '../context/AgentContext';
import { IconAlert } from './Icons';

/**
 * The whole app is server-driven, so a stopped backend should say so plainly
 * rather than looking like an app that does nothing.
 *
 * The welcome screen is the exception: nothing on it asks the agent for
 * anything, so a backend warning there is noise in front of the front door.
 */
const ConnectionBanner = () => {
  const { connection, reload } = useAgent();
  const { pathname } = useLocation();
  if (connection !== 'offline' || pathname.startsWith('/welcome')) return null;

  return (
    <div className="banner" role="status" aria-live="polite">
      <IconAlert size={16} />
      <span className="grow">
        Can't reach the agent.
        <span className="tiny" style={{ display: 'block' }}>
          Start the backend: <span className="mono">python manage.py runserver</span>
        </span>
      </span>
      <button className="btn btn--sm btn--ghost" onClick={() => void reload()}>Retry</button>
    </div>
  );
};

export default ConnectionBanner;

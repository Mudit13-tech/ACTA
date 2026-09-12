import { useAgent } from '../context/AgentContext';
import { IconAlert } from './Icons';

/**
 * The whole app is server-driven, so a stopped backend should say so plainly
 * rather than looking like an app that does nothing.
 */
const ConnectionBanner = () => {
  const { connection, reload } = useAgent();
  if (connection !== 'offline') return null;

  return (
    <div className="banner" role="status">
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

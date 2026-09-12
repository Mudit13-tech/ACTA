import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconAlert } from '../components/Icons';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Screen title="Not found">
      <div className="empty">
        <IconAlert size={26} />
        <p className="small">That screen doesn't exist.</p>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/')}>Back to home</button>
      </div>
    </Screen>
  );
};

export default NotFound;

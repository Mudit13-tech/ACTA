import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import TabBar from './TabBar';
import ConnectionBanner from './ConnectionBanner';
import { isPushed } from '../lib/nav';

/**
 * The phone frame. One scroll container, one tab bar, and a push transition
 * that follows the direction you actually travelled — router history tells us
 * which way that was.
 */
const AppShell = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const ref = useRef<HTMLDivElement>(null);
  const back = navigationType === 'POP';

  useEffect(() => {
    ref.current?.querySelector('.screen')?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="device" ref={ref}>
      <span className="grain" aria-hidden="true" />
      <ConnectionBanner />
      <div key={pathname} className={back ? 'route route--back' : 'route'}>
        <Outlet />
      </div>
      {!isPushed(pathname) && <TabBar />}
    </div>
  );
};

export default AppShell;

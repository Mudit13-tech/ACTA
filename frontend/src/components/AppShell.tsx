import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import TabBar from './TabBar';
import ConnectionBanner from './ConnectionBanner';

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
      <ConnectionBanner />
      <div key={pathname} className={back ? 'route route--back' : 'route'}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
};

export default AppShell;

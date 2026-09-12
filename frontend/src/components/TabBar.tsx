import type { CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAgent } from '../context/AgentContext';
import { IconHome, IconList, IconShield, IconSettings } from './Icons';

const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/tasks', label: 'Tasks', Icon: IconList, end: false },
  { to: '/approvals', label: 'Approvals', Icon: IconShield, end: false },
  { to: '/settings', label: 'Settings', Icon: IconSettings, end: false },
];

/** Detail screens belong to the tab they were opened from. */
const OWNED_BY: { prefix: string; index: number }[] = [
  { prefix: '/run', index: 1 },
  { prefix: '/new', index: 1 },
  { prefix: '/limits', index: 3 },
  { prefix: '/about', index: 3 },
];

const TabBar = () => {
  const { pending } = useAgent();
  const { pathname } = useLocation();

  const owned = OWNED_BY.find((o) => pathname.startsWith(o.prefix));
  const matched = TABS.findIndex((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
  const index = owned ? owned.index : Math.max(0, matched);

  return (
    <nav className="tabbar" aria-label="Primary" style={{ '--index': index } as CSSProperties}>
      <span className="tabbar__indicator" aria-hidden="true" />
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tab" aria-label={label} title={label}>
          <Icon size={21} />
          {to === '/approvals' && pending.length > 0 && <span className="tab__dot">{pending.length}</span>}
        </NavLink>
      ))}
    </nav>
  );
};

export default TabBar;

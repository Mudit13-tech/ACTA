import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBack } from './Icons';

interface Props {
  title: ReactNode;
  sub?: string;
  /** Shows a back chevron; string navigates to that path, true goes back. */
  back?: string | boolean;
  action?: ReactNode;
  flush?: boolean;
  /** Screens that draw their own header, like Home's greeting. */
  bare?: boolean;
  children: ReactNode;
}

/**
 * Every screen is the same three-part phone layout: a fixed app bar, one
 * scrolling body that clears the tab bar, and nothing else competing for the
 * thumb zone.
 */
const Screen = ({ title, sub, back, action, flush, bare, children }: Props) => {
  const navigate = useNavigate();

  return (
    <>
      {!bare && (
      <header className="topbar">
        {back && (
          <button
            className="iconbtn"
            aria-label="Back"
            onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          >
            <IconBack size={19} />
          </button>
        )}
        <div className="topbar__title">
          {title}
          {sub && <span className="topbar__sub">{sub}</span>}
        </div>
        {action}
      </header>
      )}
      <main className={flush ? 'screen screen--flush' : 'screen'}>{children}</main>
    </>
  );
};

export default Screen;

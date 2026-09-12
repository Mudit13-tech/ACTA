import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom sheet — the phone-native way to ask for a decision.
 *
 * It mounts into the device frame rather than the current screen: the screen
 * is an animated box, which traps a stacking context and would paint the sheet
 * underneath the tab bar.
 */
const Sheet = ({ open, onClose, title, children }: Props) => {
  const [host, setHost] = useState<Element | null>(null);

  useEffect(() => {
    setHost(document.querySelector('.device'));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !host) return null;

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" />
        {title && <h2 className="h2 mb-4">{title}</h2>}
        {children}
      </div>
    </div>,
    host,
  );
};

export default Sheet;

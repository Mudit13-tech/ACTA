import { useEffect, useRef } from 'react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  autoFocus?: boolean;
}

/**
 * The sentence you hand the agent, written in the display face.
 *
 * It grows with the sentence instead of scrolling inside itself — an errand is
 * short, and you should be able to see all of it before you send it. Home and
 * New task share this so the sentence looks the same in both hands.
 */
const CommandInput = ({ id, label, value, onChange, onSubmit, placeholder, autoFocus }: Props) => {
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();

    /* The display face loads after first paint and is narrower than the
       fallback, so a height measured too early leaves dead space under the
       sentence. Measure again once the real font is in, and on resize. */
    document.fonts?.ready.then(fit).catch(() => {});
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [value]);

  return (
    <>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <textarea
        id={id}
        ref={box}
        className="command"
        rows={1}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (onSubmit && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
    </>
  );
};

export default CommandInput;

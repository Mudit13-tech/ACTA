/**
 * Sable — the brand marks, in one place so every screen draws the same ones.
 *
 * The mark is a heraldic lozenge: the diamond a house carries its colours on.
 * It is keyed, never filled — the boundary is the point — with a single jade
 * stone at the centre for the money that passes through it. Stroke weight and
 * joins match the icon set in `Icons.tsx`, so the logo reads as family.
 */

interface P {
  size?: number;
  className?: string;
}

/** The lozenge alone. Takes its outline from `currentColor`. */
export const Mark = ({ size = 22, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 2 19 12 12 22 5 12z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M5 12h14" stroke="currentColor" strokeWidth="0.9" opacity="0.34" />
    {/* A custom property only reaches SVG through style, not a fill attribute. */}
    <path d="M12 7.4 15.4 12 12 16.6 8.6 12z" style={{ fill: 'var(--jade)' }} />
  </svg>
);

/**
 * The lockup: mark, then the name in the display serif under wide tracking.
 * `size` drives the lettering; the mark scales with it.
 */
export const Wordmark = ({ size = 22, className }: P) => (
  <span className={className ? `wordmark ${className}` : 'wordmark'} style={{ fontSize: size }}>
    <Mark size={size * 0.95} className="wordmark__mark" />
    <span className="wordmark__type">Sable</span>
  </span>
);

export default Wordmark;

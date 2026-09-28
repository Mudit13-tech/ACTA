/**
 * The empty state's one drawn element: a mechanical hand offering a card.
 *
 * Line-art only, in the same stroke language as the icon set — 1.7 round
 * joins, no fill — so it inherits `currentColor` and therefore themes with
 * the rest of the app. Drawn rather than imported: at this size a raster
 * asset would need two files for light and dark and still soften on retina.
 */
const AgentArt = () => (
  <svg
    className="empty-art"
    viewBox="0 0 132 96"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="presentation"
    aria-hidden="true"
    focusable="false"
  >
    {/* The card, held out flat */}
    <rect x="52" y="10" width="68" height="42" rx="5" />
    <path d="M52 23h68" />
    <path d="M61 40h13" opacity="0.5" />
    <path d="M104 40h7" opacity="0.5" />
    {/* The one jade note the brand allows: the chip */}
    <rect x="61" y="29" width="9" height="6.5" rx="1.5" style={{ stroke: 'var(--jade)' }} />

    {/* Thumb, over the card's near corner */}
    <path d="M52 34c-4 0-7 1.5-9 4" />

    {/* Two fingers beneath, taking its weight */}
    <path d="M43 38h-9a5 5 0 0 0 0 10h11" />
    <path d="M45 48h-9a5 5 0 0 0 0 10h13" />

    {/* Wrist, forearm, and the pivot that makes it mechanical */}
    <path d="M34 58h-6a6 6 0 0 1-6-6V44a6 6 0 0 1 6-6h2" />
    <path d="M22 52H12a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h12" />
    <circle cx="16" cy="63" r="2.4" />
    <path d="M24 74v8" />
    <path d="M14 82h20" />
  </svg>
);

export default AgentArt;

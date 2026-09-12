/** Minimal 24px stroke icon set — one visual language across every screen. */

interface P {
  size?: number;
  className?: string;
}

const svg = (d: string) =>
  function Icon({ size = 22, className }: P) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {d.split('|').map((path, i) => (
          <path key={i} d={path} />
        ))}
      </svg>
    );
  };

export const IconHome = svg('M3 10.4 12 3.5l9 6.9|M5.6 9.4V20h12.8V9.4|M9.7 20v-5.6h4.6V20');
export const IconAgent = svg(
  'M12 3.2 13.7 8l4.8 1.7-4.8 1.7L12 16.2l-1.7-4.8L5.5 9.7 10.3 8z|M18.4 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
);
export const IconShield = svg('M12 3.3 19 6v5.6c0 4.2-2.8 7.4-7 9.1-4.2-1.7-7-4.9-7-9.1V6z|M9.2 12.2l2 2 3.6-3.9');
export const IconActivity = svg('M3.5 12.5h3.6l2.2-6 3.6 12 2.3-6h5.3');
export const IconSliders = svg(
  'M4 7h9|M17 7h3|M4 17h3|M11 17h9|M15 4.6v4.8|M7.5 14.6v4.8',
);
export const IconChevron = svg('M9.5 5.5 16 12l-6.5 6.5');
export const IconBack = svg('M14.5 5.5 8 12l6.5 6.5');
export const IconCheck = svg('M5 12.6 9.6 17 19 7.4');
export const IconAlert = svg('M12 8.4v4.4|M12 16.4v.2|M12 3.6 21 19.6H3z');
export const IconClose = svg('M6 6l12 12|M18 6 6 18');
export const IconEye = svg('M2.8 12S6.6 6 12 6s9.2 6 9.2 6-3.8 6-9.2 6-9.2-6-9.2-6z|M12 14.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z');
export const IconWallet = svg(
  'M4 8.4A2 2 0 0 1 6 6.4h11.5a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z|M4 8.4V6.2c0-1 .8-1.8 1.8-1.8h9.4|M19.5 11.6h-3.2a2 2 0 0 0 0 4h3.2',
);
export const IconClock = svg('M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8z|M12 7.6V12l3 1.8');
export const IconSearch = svg('M11 18.2a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4z|M16.4 16.4 20.5 20.5');
export const IconBolt = svg('M13.2 3 5.6 13.4h5.4L10.4 21 18.4 10.6h-5.5z');
export const IconSun = svg(
  'M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4|M12 2.9v2.2|M12 18.9v2.2|M21.1 12h-2.2|M5.1 12H2.9|M18.4 5.6l-1.6 1.6|M7.2 16.8l-1.6 1.6|M18.4 18.4l-1.6-1.6|M7.2 7.2 5.6 5.6',
);
export const IconMoon = svg('M20.4 13.6A8.5 8.5 0 0 1 10.4 3.6a8.5 8.5 0 1 0 10 10z');
export const IconList = svg('M4 6.6h16|M4 12h16|M4 17.4h10');
export const IconPlus = svg('M12 5v14|M5 12h14');
export const IconArrow = svg('M4.8 12h14.4|M13.6 6.4 19.2 12l-5.6 5.6');
export const IconSettings = svg(
  'M12 15.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2|M19.4 13.6a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2v.18a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.96-1.13l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.4 12.8h-.18a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5.46 5.84l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.55v-.18a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.55 1.03h.18a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.55 1.03z',
);
export const IconBell = svg('M18 8.6a6 6 0 1 0-12 0c0 6.3-2.4 8.1-2.4 8.1h16.8S18 14.9 18 8.6|M13.7 20.4a2 2 0 0 1-3.46 0');
export const IconCard = svg('M3.4 8.6A2.2 2.2 0 0 1 5.6 6.4h12.8a2.2 2.2 0 0 1 2.2 2.2v6.8a2.2 2.2 0 0 1-2.2 2.2H5.6a2.2 2.2 0 0 1-2.2-2.2z|M3.4 10.6h17.2');
export const IconUser = svg('M19.2 20v-1.8a4 4 0 0 0-4-4H8.8a4 4 0 0 0-4 4V20|M12 10.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8');
export const IconInfo = svg('M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8|M12 11.4v5|M12 7.8v.2');

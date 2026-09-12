import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { deviceKey } from '../services/api';

export interface Profile {
  name: string;
  email: string;
  /** Last four of the simulated card the agent pays with. */
  card: string;
  since: string;
}

const KEY = 'acta.profile';

const DEFAULT_PROFILE: Profile = {
  name: 'Guest',
  email: '',
  card: '4492',
  since: new Date().toISOString(),
};

interface ProfileCtx {
  profile: Profile;
  initial: string;
  update: (patch: Partial<Profile>) => void;
  device: string;
}

const Ctx = createContext<ProfileCtx | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch {
      /* storage blocked — the profile lasts for this session only */
    }
  }, [profile]);

  const update = useCallback((patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch })), []);

  const value = useMemo(
    () => ({
      profile,
      initial: (profile.name.trim()[0] ?? 'G').toUpperCase(),
      update,
      device: deviceKey(),
    }),
    [profile, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useProfile = (): ProfileCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
};

/** "Good evening" — matched to the hour the app is opened. */
export const greeting = (date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

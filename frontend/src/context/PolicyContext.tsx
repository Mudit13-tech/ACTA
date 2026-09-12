import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import api, { ApiError } from '../services/api';
import type { Policy } from '../lib/types';

/** Mirrors the server defaults; used only until the real policy arrives. */
export const DEFAULT_POLICY: Policy = {
  autoPayEnabled: true,
  autoApproveLimit: 2000,
  dailyCap: 25000,
  hardCeiling: 100000,
  trustedVendors: [],
  requireApprovalNewVendor: true,
  requireApprovalPaidCancellation: true,
};

interface PolicyCtx {
  policy: Policy;
  loading: boolean;
  /** Set when the last write was rejected — surfaced on the policy screen. */
  error: string;
  update: (patch: Partial<Policy>) => Promise<void>;
  trustVendor: (vendor: string) => Promise<void>;
  untrustVendor: (vendor: string) => Promise<void>;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<PolicyCtx | undefined>(undefined);

export const PolicyProvider = ({ children }: { children: ReactNode }) => {
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setPolicy(await api.getPolicy());
      setError('');
    } catch (e) {
      if (!(e instanceof ApiError && e.offline)) setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Optimistic: the switch moves at once, and snaps back if the server says no. */
  const update = useCallback(
    async (patch: Partial<Policy>) => {
      const previous = policy;
      setPolicy((p) => ({ ...p, ...patch }));
      try {
        setPolicy(await api.patchPolicy(patch));
        setError('');
      } catch (e) {
        setPolicy(previous);
        setError((e as Error).message);
      }
    },
    [policy],
  );

  const trustVendor = useCallback(
    (vendor: string) =>
      policy.trustedVendors.includes(vendor)
        ? Promise.resolve()
        : update({ trustedVendors: [...policy.trustedVendors, vendor] }),
    [policy.trustedVendors, update],
  );

  const untrustVendor = useCallback(
    (vendor: string) => update({ trustedVendors: policy.trustedVendors.filter((v) => v !== vendor) }),
    [policy.trustedVendors, update],
  );

  const reset = useCallback(() => update(DEFAULT_POLICY), [update]);

  const value = useMemo(
    () => ({ policy, loading, error, update, trustVendor, untrustVendor, reset, reload }),
    [policy, loading, error, update, trustVendor, untrustVendor, reset, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const usePolicy = (): PolicyCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePolicy must be used inside PolicyProvider');
  return ctx;
};

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import api, { ApiError, type RunUpdate } from '../services/api';
import type { ActivityEvent, Run } from '../lib/types';

type Connection = 'connecting' | 'online' | 'offline';

interface AgentCtx {
  runs: Run[];
  activity: ActivityEvent[];
  pending: Run[];
  spentToday: number;
  connection: Connection;
  error: string;
  getRun: (id: string) => Run | undefined;
  startRun: (text: string, budget: number) => Promise<string | undefined>;
  approve: (id: string, trustVendor?: boolean) => Promise<void>;
  decline: (id: string) => Promise<void>;
  fastForward: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<AgentCtx | undefined>(undefined);

/** How long to wait before asking the server for the next stage. */
const TICK_MS = 780;
const MONITOR_TICK_MS = 1500;

export const AgentProvider = ({ children }: { children: ReactNode }) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [spentToday, setSpentToday] = useState(0);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [error, setError] = useState('');

  /** Guards against two advance calls for the same run overlapping. */
  const advancing = useRef<string | null>(null);

  const handle = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.offline) {
      setConnection('offline');
      return;
    }
    setError((e as Error).message);
  }, []);

  const reload = useCallback(async () => {
    try {
      const [runList, activityFeed] = await Promise.all([api.listRuns(), api.getActivity()]);
      setRuns(runList);
      setActivity(activityFeed.events);
      setSpentToday(activityFeed.spentToday);
      setConnection('online');
      setError('');
    } catch (e) {
      handle(e);
    }
  }, [handle]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Folds a mutation response back into local state. */
  const applyUpdate = useCallback((update: RunUpdate) => {
    setRuns((prev) => {
      const known = prev.some((r) => r.id === update.run.id);
      return known ? prev.map((r) => (r.id === update.run.id ? update.run : r)) : [update.run, ...prev];
    });
    if (update.events.length) {
      setActivity((prev) => [...[...update.events].reverse(), ...prev].slice(0, 100));
    }
    // A payment lands against the daily cap, so re-read the server's figure.
    if (update.events.some((e) => e.kind === 'paid')) {
      void api
        .getActivity()
        .then((a) => setSpentToday(a.spentToday))
        .catch(() => undefined);
    }
  }, []);

  /* The clock: the server advances one stage per call, and we pace the calls. */
  useEffect(() => {
    if (connection === 'offline') return;
    const live = runs.find((r) => r.status === 'running' || r.status === 'monitoring');
    if (!live || advancing.current === live.id) return;

    const timer = setTimeout(async () => {
      advancing.current = live.id;
      try {
        applyUpdate(await api.advance(live.id));
        setConnection('online');
      } catch (e) {
        handle(e);
      } finally {
        advancing.current = null;
      }
    }, live.status === 'monitoring' ? MONITOR_TICK_MS : TICK_MS);

    return () => clearTimeout(timer);
  }, [runs, connection, applyUpdate, handle]);

  const startRun = useCallback(
    async (text: string, budget: number) => {
      try {
        const run = await api.startRun(text, budget);
        setRuns((prev) => [run, ...prev]);
        setConnection('online');
        setError('');
        // The creation event is already logged server-side.
        void api.getActivity().then((a) => {
          setActivity(a.events);
          setSpentToday(a.spentToday);
        });
        return run.id;
      } catch (e) {
        handle(e);
        return undefined;
      }
    },
    [handle],
  );

  const approve = useCallback(
    async (id: string, trustVendor = false) => {
      try {
        applyUpdate(await api.approve(id, trustVendor));
      } catch (e) {
        handle(e);
      }
    },
    [applyUpdate, handle],
  );

  const decline = useCallback(
    async (id: string) => {
      try {
        applyUpdate(await api.decline(id));
      } catch (e) {
        handle(e);
      }
    },
    [applyUpdate, handle],
  );

  const fastForward = useCallback(
    async (id: string) => {
      try {
        applyUpdate(await api.fastForward(id));
      } catch (e) {
        handle(e);
      }
    },
    [applyUpdate, handle],
  );

  const clearHistory = useCallback(async () => {
    try {
      await api.clearActivity();
      await reload();
    } catch (e) {
      handle(e);
    }
  }, [reload, handle]);

  const getRun = useCallback((id: string) => runs.find((r) => r.id === id), [runs]);
  const pending = useMemo(() => runs.filter((r) => r.status === 'awaiting-approval'), [runs]);

  const value = useMemo(
    () => ({
      runs,
      activity,
      pending,
      spentToday,
      connection,
      error,
      getRun,
      startRun,
      approve,
      decline,
      fastForward,
      clearHistory,
      reload,
    }),
    [runs, activity, pending, spentToday, connection, error, getRun, startRun, approve, decline, fastForward, clearHistory, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAgent = (): AgentCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAgent must be used inside AgentProvider');
  return ctx;
};

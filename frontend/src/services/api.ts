/**
 * Client for the ACTA backend. The server owns the action loop and the trust
 * layer — this file only moves JSON.
 *
 * Identity: there is no sign-in yet, so every request carries a device key the
 * browser generates once and keeps. The backend scopes policy, runs and
 * activity to it.
 */

import type { ActivityEvent, Offer, Policy, Run } from '../lib/types';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const DEVICE_STORAGE_KEY = 'acta.device';

const newKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

let cachedKey: string | undefined;

export const deviceKey = (): string => {
  if (cachedKey) return cachedKey;
  try {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    cachedKey = stored ?? newKey();
    if (!stored) localStorage.setItem(DEVICE_STORAGE_KEY, cachedKey);
  } catch {
    // Private browsing or blocked storage: stay usable for this session only.
    cachedKey = newKey();
  }
  return cachedKey;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  /** True when the backend could not be reached at all. */
  get offline(): boolean {
    return this.status === 0;
  }
}

/** Pulls the most useful line out of a DRF error body. */
const messageFrom = (data: unknown, fallback: string): string => {
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    const first = body.detail ?? body.non_field_errors ?? Object.values(body)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  }
  return fallback;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-ACTA-Device': deviceKey(),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach the ACTA backend.", 0, null);
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new ApiError(messageFrom(data, `Request failed (${response.status})`), response.status, data);
  }
  return data as T;
}

const post = <T,>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

/** What a mutating run endpoint returns: the run, plus any activity it produced. */
export interface RunUpdate {
  run: Run;
  events: ActivityEvent[];
  moved?: boolean;
}

export interface GoalPreview {
  text: string;
  category: Run['goal']['category'];
  budget: number;
  minDiscountPct: number | null;
  constraints: string[];
}

export const api = {
  health: () => request<{ status: string; offers: number }>('/health/'),

  catalog: (category?: string) =>
    request<Offer[]>(`/catalog/${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  getPolicy: () => request<Policy>('/policy/'),
  patchPolicy: (patch: Partial<Policy>) =>
    request<Policy>('/policy/', { method: 'PATCH', body: JSON.stringify(patch) }),

  previewGoal: (goal: string, budget: number) => post<GoalPreview>('/goal/preview/', { goal, budget }),

  listRuns: () => request<Run[]>('/runs/'),
  getRun: (id: string) => request<Run>(`/runs/${id}/`),
  startRun: (goal: string, budget: number) => post<Run>('/runs/', { goal, budget }),

  advance: (id: string) => post<RunUpdate>(`/runs/${id}/advance/`),
  approve: (id: string, trustVendor = false) => post<RunUpdate>(`/runs/${id}/approve/`, { trustVendor }),
  decline: (id: string) => post<RunUpdate>(`/runs/${id}/decline/`),
  fastForward: (id: string) => post<RunUpdate>(`/runs/${id}/fast-forward/`),

  getActivity: () => request<{ events: ActivityEvent[]; spentToday: number }>('/activity/'),
  clearActivity: () => request<void>('/activity/', { method: 'DELETE' }),
};

export default api;

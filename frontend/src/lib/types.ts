/** Domain model for ACTA — the trust and transaction layer for AI agents. */

export type Category = 'shopping' | 'travel' | 'reservation';

export type StageId =
  | 'understand'
  | 'search'
  | 'compare'
  | 'decide'
  | 'monitor'
  | 'prepare'
  | 'approval'
  | 'execute'
  | 'verify';

export type StageStatus = 'pending' | 'active' | 'done' | 'blocked' | 'failed' | 'skipped';

export interface Stage {
  id: StageId;
  name: string;
  status: StageStatus;
  note?: string;
  log: string[];
}

export interface Goal {
  /** Raw text the user typed. */
  text: string;
  category: Category;
  /** Budget ceiling in paise-free rupees. */
  budget: number;
  /** Only buy once the listed discount is met, e.g. 20 for "at least 20% off". */
  minDiscountPct?: number;
  /** Free-form constraints lifted out of the goal text. */
  constraints: string[];
}

export interface Offer {
  id: string;
  vendor: string;
  title: string;
  /** Current price in ₹. */
  price: number;
  /** Original list price, used to derive the discount. */
  listPrice: number;
  rating: number;
  reviews: number;
  /** Short descriptive facts shown on the offer card. */
  facts: string[];
  cancellation: 'free' | 'paid' | 'none';
  /** Score assigned during the compare stage (0–100). */
  score?: number;
  /** Why the agent ranked it where it did. */
  reasons?: string[];
}

/** The outcome of checking an offer against the user's autonomy policy. */
export interface PolicyVerdict {
  /** Agent may execute payment with no human in the loop. */
  autoPay: boolean;
  /** Agent must stop and ask. */
  needsApproval: boolean;
  /** Policy forbids the transaction outright. */
  blocked: boolean;
  reasons: string[];
}

export type RunStatus =
  | 'running'
  | 'awaiting-approval'
  | 'monitoring'
  | 'completed'
  | 'declined'
  | 'blocked';

export interface Receipt {
  reference: string;
  paidAt: string;
  amount: number;
  method: string;
  vendor: string;
  verified: boolean;
}

export interface Run {
  /** Server primary key, as a string. */
  id: string;
  goal: Goal;
  status: RunStatus;
  createdAt: string;
  stages: Stage[];
  offers: Offer[];
  pickId?: string;
  verdict?: PolicyVerdict;
  receipt?: Receipt;
  /** Price movements observed during the monitor stage. */
  watch: { at: string; price: number; note: string }[];
}

export interface Policy {
  /** Master switch — off means the agent always stops before paying. */
  autoPayEnabled: boolean;
  /** Purchases at or below this amount can execute automatically. */
  autoApproveLimit: number;
  /** Hard ceiling on what the agent may spend per day without asking. */
  dailyCap: number;
  /** Vendors the agent has transacted with before. */
  trustedVendors: string[];
  requireApprovalNewVendor: boolean;
  requireApprovalPaidCancellation: boolean;
  /** Anything above this simply cannot be executed by the agent. */
  hardCeiling: number;
}

export interface ActivityEvent {
  id: string;
  runId: string;
  at: string;
  kind: 'started' | 'approved' | 'declined' | 'paid' | 'verified' | 'blocked' | 'watching';
  title: string;
  detail: string;
  amount?: number;
}

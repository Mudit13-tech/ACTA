import { useEffect, useState } from 'react';
import Screen from '../components/Screen';
import Sheet from '../components/Sheet';
import { IconAlert, IconClose, IconShield } from '../components/Icons';
import { usePolicy } from '../context/PolicyContext';
import { useAgent } from '../context/AgentContext';
import api from '../services/api';
import { inr } from '../lib/format';

const LIMITS = [500, 1000, 2000, 5000, 10000];

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button className="rowitem" onClick={() => void onChange(!checked)} role="switch" aria-checked={checked}>
    <span className="grow">
      <span className="small" style={{ display: 'block' }}>{label}</span>
      <span className="tiny">{hint}</span>
    </span>
    <span className="switch" data-on={checked} />
  </button>
);

const Limits = () => {
  const { policy, update, trustVendor, untrustVendor, reset, error } = usePolicy();
  const { spentToday } = useAgent();
  const [addOpen, setAddOpen] = useState(false);
  const [known, setKnown] = useState<string[]>([]);

  /* Vendors the connectors actually carry, so you can trust one ahead of time. */
  useEffect(() => {
    api
      .catalog()
      .then((offers) => setKnown([...new Set(offers.map((o) => o.vendor))].sort()))
      .catch(() => setKnown([]));
  }, []);

  const untrusted = known.filter((v) => !policy.trustedVendors.includes(v));

  return (
    <Screen
      title="Limits"
      sub="What the agent may do on its own"
      back="/settings"
      action={<button className="btn btn--ghost btn--sm" onClick={() => void reset()}>Reset</button>}
    >
      {error && (
        <section className="section" style={{ paddingTop: 18, paddingBottom: 0 }}>
          <div className="card card--tight row" style={{ gap: 10, borderColor: 'rgba(255,95,95,0.4)' }}>
            <IconAlert size={17} />
            <span className="grow small">{error}</span>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 18 }}>
        <div className="card card--glow row" style={{ gap: 12 }}>
          <IconShield size={22} />
          <span className="grow small">
            These rules run before every payment. The agent cannot step outside them — not for a
            better deal, not for a closing offer.
          </span>
        </div>
      </section>

      {/* ── Auto-pay ─────────────────────────────────────────── */}
      <section className="section">
        <p className="eyebrow mb-3">Paying</p>
        <div className="list">
          <Toggle
            label="Let the agent pay"
            hint={policy.autoPayEnabled ? 'Inside the limits below' : 'Off — every payment waits for you'}
            checked={policy.autoPayEnabled}
            onChange={(v) => void update({ autoPayEnabled: v })}
          />
        </div>

        <div className="card" style={{ marginTop: 12, opacity: policy.autoPayEnabled ? 1 : 0.5 }}>
          <div className="row-between mb-3">
            <span className="label">Pay without asking, up to</span>
            <span className="amount" style={{ fontSize: 17 }}>{inr(policy.autoApproveLimit)}</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={20000}
            step={500}
            value={policy.autoApproveLimit}
            onChange={(e) => void update({ autoApproveLimit: Number(e.target.value) })}
            disabled={!policy.autoPayEnabled}
            aria-label="Auto-approve limit"
          />
          <div className="chiprow mt-3">
            {LIMITS.map((l) => (
              <button
                key={l}
                className="chip"
                aria-pressed={policy.autoApproveLimit === l}
                onClick={() => void update({ autoApproveLimit: l })}
                disabled={!policy.autoPayEnabled}
              >
                {inr(l)}
              </button>
            ))}
          </div>
          <p className="tiny mt-3">
            Anything above this amount stops and asks you first.
          </p>
        </div>
      </section>

      {/* ── Caps ─────────────────────────────────────────────── */}
      <section className="section">
        <p className="eyebrow mb-3">Ceilings</p>
        <div className="card">
          <div className="row-between mb-3">
            <span className="label">Most it may spend in a day</span>
            <span className="amount" style={{ fontSize: 17 }}>{inr(policy.dailyCap)}</span>
          </div>
          <input
            className="slider"
            type="range"
            min={5000}
            max={200000}
            step={5000}
            value={policy.dailyCap}
            onChange={(e) => void update({ dailyCap: Number(e.target.value) })}
            aria-label="Daily cap"
          />
          <p className="tiny mt-3">
            {inr(spentToday)} used today. A task that would cross this cap is blocked outright.
          </p>

          <hr className="divider" style={{ margin: '14px 0' }} />

          <div className="row-between mb-3">
            <span className="label">Never spend more than</span>
            <span className="amount" style={{ fontSize: 17 }}>{inr(policy.hardCeiling)}</span>
          </div>
          <input
            className="slider"
            type="range"
            min={10000}
            max={500000}
            step={10000}
            value={policy.hardCeiling}
            onChange={(e) => void update({ hardCeiling: Number(e.target.value) })}
            aria-label="Hard ceiling"
          />
          <p className="tiny mt-3">
            The agent will never execute a transaction above this, approval or not.
          </p>
        </div>
      </section>

      {/* ── Always ask ───────────────────────────────────────── */}
      <section className="section">
        <p className="eyebrow mb-3">Always ask me first</p>
        <div className="list">
          <Toggle
            label="A vendor I have not used before"
            hint="First transaction with any new merchant"
            checked={policy.requireApprovalNewVendor}
            onChange={(v) => void update({ requireApprovalNewVendor: v })}
          />
          <Toggle
            label="Anything costly to cancel"
            hint="Non-refundable rates and paid cancellations"
            checked={policy.requireApprovalPaidCancellation}
            onChange={(v) => void update({ requireApprovalPaidCancellation: v })}
          />
        </div>
      </section>

      {/* ── Vendors ──────────────────────────────────────────── */}
      <section className="section">
        <div className="row-between mb-3">
          <p className="eyebrow">Vendors I trust</p>
          <button className="btn btn--ghost btn--sm" onClick={() => setAddOpen(true)}>Add</button>
        </div>

        {policy.trustedVendors.length === 0 ? (
          <p className="small">No vendor is trusted yet — every merchant will ask for approval.</p>
        ) : (
          <div className="list">
            {policy.trustedVendors.map((v) => (
              <div key={v} className="rowitem" style={{ cursor: 'default' }}>
                <span className="grow small">{v}</span>
                <button className="iconbtn" aria-label={`Remove ${v}`} onClick={() => void untrustVendor(v)}>
                  <IconClose size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="tiny mt-3">
          Trusted vendors skip the new-vendor check. Every other rule still applies.
        </p>
      </section>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Trust a vendor">
        {untrusted.length === 0 ? (
          <p className="small">Every known vendor is already trusted.</p>
        ) : (
          <div className="list">
            {untrusted.map((v) => (
              <button
                key={v}
                className="rowitem"
                onClick={() => {
                  void trustVendor(v);
                  setAddOpen(false);
                }}
              >
                <span className="grow small">{v}</span>
                <span className="pill pill--muted">add</span>
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </Screen>
  );
};

export default Limits;

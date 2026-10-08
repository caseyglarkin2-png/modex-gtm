'use client';
/**
 * THE SETTINGS FORM (X13, GAP OS sales execution engine, 2026-10-08). Presentational plus one POST to /api/gap/settings
 * (the X03 store: validation and refusals live there). The seller sets where the morning briefing goes and at what New
 * York hour, which addresses may command GAP by email, the operating mode (prepare or review; execute is defined and
 * refused until the CONFIRM + SEND contract is amended) and the daily targets the scorecard counts against. No secret
 * is shown or set here (GAP_ACTION_SECRET lives in Vercel).
 */
import { useState } from 'react';
import { TARGET_KINDS, type SellerSettings, type TargetKind } from '@/lib/gap/work/settings';

const TARGET_FIELD_LABELS: Record<TargetKind, string> = {
  first_touches: 'First touches per day',
  follow_ups: 'Follow-ups per day',
  calls: 'Calls per day',
  replies_handled: 'Replies handled per day',
  deal_steps: 'Deal steps per day',
  meetings_booked: 'Meetings booked per day',
};

const FIELD_NAMES: Record<string, string> = {
  briefingTo: 'Briefing address',
  briefingHourNy: 'Briefing hour',
  commandSenders: 'Command senders',
  mode: 'Mode',
  targets: 'Targets',
};

const REASONS: Record<string, string> = {
  briefing_to_is_gap_mailbox: 'that is the GAP mailbox itself; a reply to it would land in Sent and never be read. Use your own address.',
  command_sender_is_gap_mailbox: 'the GAP mailbox cannot command itself. Use your own addresses.',
  execute_mode_not_amended: 'execute (a send on an email APPROVE) is refused until the CONFIRM + SEND contract is amended.',
  invalid_email: 'that is not an email address.',
  hour_out_of_range: 'the hour is 0 to 23, New York time.',
  target_not_a_count: 'a target is a whole number of activities per day.',
  unknown_target_kind: 'that is not an activity GAP counts.',
  unknown_mode: 'the modes are prepare and review.',
};

export function SellerSettingsForm({ initial, gapMailbox, legacyDigest }: { initial: SellerSettings; gapMailbox: string | null; legacyDigest: boolean }) {
  const [briefingTo, setBriefingTo] = useState(initial.briefingTo ?? '');
  const [hour, setHour] = useState(String(initial.briefingHourNy));
  const [senders, setSenders] = useState(initial.commandSenders.join(', '));
  const [mode, setMode] = useState<SellerSettings['mode']>(initial.mode);
  const [targets, setTargets] = useState<Record<TargetKind, string>>(() => Object.fromEntries(TARGET_KINDS.map((k) => [k, initial.targets[k] === undefined ? '' : String(initial.targets[k])])) as Record<TargetKind, string>);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setSaved(null);
    setError(null);
    const body = {
      briefingTo: briefingTo.trim() ? briefingTo.trim() : null,
      briefingHourNy: Number(hour),
      commandSenders: senders.split(',').map((s) => s.trim()).filter(Boolean),
      mode,
      targets: Object.fromEntries(TARGET_KINDS.filter((k) => targets[k].trim() !== '').map((k) => [k, Number(targets[k])])),
    };
    try {
      const res = await fetch('/api/gap/settings/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => ({}))) as { error?: string; field?: string; settings?: SellerSettings };
      if (!res.ok) {
        const field = json.field ? FIELD_NAMES[json.field] ?? json.field : 'Settings';
        setError(`${field}: ${REASONS[json.error ?? ''] ?? (json.error ?? 'not saved')}`);
        return;
      }
      const s = json.settings;
      setSaved(s ? `Saved. The briefing goes to ${s.briefingTo ?? 'nobody (no address)'} at ${s.briefingHourNy}:00 New York; ${s.commandSenders.length} ${s.commandSenders.length === 1 ? 'address' : 'addresses'} may command by email; mode ${s.mode}; ${Object.keys(s.targets).length} ${Object.keys(s.targets).length === 1 ? 'target' : 'targets'} set.` : 'Saved.');
    } catch (e) {
      setError(`Settings: ${e instanceof Error ? e.message : 'not saved'}`);
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm';
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The morning briefing</h2>
        <label className="block text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Briefing address</span>
          <input className={input} type="email" value={briefingTo} onChange={(e) => setBriefingTo(e.target.value)} placeholder="you@company.com (empty: no briefing)" />
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Briefing hour (New York, 0 to 23)</span>
          <input className={input} type="number" min={0} max={23} value={hour} onChange={(e) => setHour(e.target.value)} />
        </label>
        <p className="text-xs text-[var(--muted-foreground)]">
          GAP sends from {gapMailbox ?? 'the GAP mailbox'} and never to it: a reply to oneself lands in Sent and is never read.
          {legacyDigest ? ' The HubSpot pipeline digest still arrives separately each morning until you say it stops.' : ''}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Working from your inbox</h2>
        <label className="block text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Command senders (comma separated)</span>
          <input className={input} type="text" value={senders} onChange={(e) => setSenders(e.target.value)} placeholder="the addresses whose replies may command GAP" />
        </label>
        <fieldset className="space-y-1 text-sm">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Mode</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="prepare" checked={mode === 'prepare'} onChange={() => setMode('prepare')} /> Prepare: GAP prepares work; an email APPROVE creates no draft
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="review" checked={mode === 'review'} onChange={() => setMode('review')} /> Review: an email APPROVE creates the Gmail draft; the send stays CONFIRM + SEND here
          </label>
          <p className="text-xs text-[var(--muted-foreground)]">Execute (a send on an email APPROVE) is defined and refused until the CONFIRM + SEND contract is amended.</p>
        </fieldset>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Daily targets (the scorecard counts what GAP proved or you recorded)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TARGET_KINDS.map((k) => (
            <label key={k} className="block text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{TARGET_FIELD_LABELS[k]}</span>
              <input className={input} type="number" min={0} step={1} value={targets[k]} onChange={(e) => setTargets({ ...targets, [k]: e.target.value })} placeholder="no target" />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60">
          {busy ? 'Saving' : 'Save settings'}
        </button>
        {saved ? <p className="text-sm" data-testid="settings-saved">{saved}</p> : null}
        {error ? <p className="text-sm text-red-600" data-testid="settings-error">{error}</p> : null}
      </div>
    </form>
  );
}

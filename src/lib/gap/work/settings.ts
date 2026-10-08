/**
 * SELLER SETTINGS (X03, GAP OS sales execution engine, 2026-10-08). Where the morning briefing goes and at what New
 * York hour, which addresses may command GAP by email, the operating mode and the daily activity targets. They live in
 * the product (SystemConfig `gap:seller:settings`, one JSON row), never in an env var, so Casey changes them on the
 * settings page and a change is a `seller.settings_changed` ledger row.
 *
 * Invariants (pinned by tests/unit/gap/seller-settings.test.ts):
 *   - the GAP mailbox itself (GAP_GMAIL_USER_EMAIL) is never the briefing address and never a command sender: a reply
 *     to oneself lands in Sent, which intake never reads (the independent review's B6)
 *   - `execute` (a send on an email APPROVE) is defined and REFUSED until Casey records the amendment of the
 *     CONFIRM + SEND contract (the review's B1); `prepare` and `review` are the modes today
 *   - absent or unreadable settings read as the DEFAULTS: no briefing, no command senders, prepare, 7 am, no targets
 *     (nothing is ever sent to nobody, and nothing acts on an email with no senders allowed)
 *   - addresses are lowercased and deduplicated; the hour is a whole number 0..23; a target is a whole number of a
 *     known activity kind
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const SELLER_SETTINGS_KEY = 'gap:seller:settings';
export const SELLER_SETTINGS_EVENT = 'seller.settings_changed';

/** The modes the product defines. `execute` is refused by validation until its amendment is recorded. */
export const OPERATING_MODES = ['prepare', 'review', 'execute'] as const;
export type OperatingMode = (typeof OPERATING_MODES)[number];
export type AllowedMode = Exclude<OperatingMode, 'execute'>;

/** The activity kinds a daily target can name (the scorecard, X13, counts the same kinds). */
export const TARGET_KINDS = ['first_touches', 'follow_ups', 'calls', 'replies_handled', 'deal_steps', 'meetings_booked'] as const;
export type TargetKind = (typeof TARGET_KINDS)[number];

export interface SellerSettings {
  /** Where the morning briefing goes; null means no briefing. */
  briefingTo: string | null;
  /** The New York hour the briefing is sent at (0..23). */
  briefingHourNy: number;
  /** Addresses whose email replies may command GAP (lowercase, deduplicated); empty means no email commands. */
  commandSenders: string[];
  mode: AllowedMode;
  targets: Partial<Record<TargetKind, number>>;
}

export const DEFAULT_SELLER_SETTINGS: SellerSettings = Object.freeze({
  briefingTo: null,
  briefingHourNy: 7,
  commandSenders: [],
  mode: 'prepare',
  targets: {},
}) as SellerSettings;

export type SettingsRefusal = { ok: false; field: keyof SellerSettings; reason: string };
export type SettingsValidation = { ok: true; value: SellerSettings } | SettingsRefusal;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

/** Pure. `env.gapMailbox` is the GAP sending mailbox (null when unconfigured: then nothing is refused on that ground). */
export function validateSellerSettings(input: unknown, env: { gapMailbox: string | null }): SettingsValidation {
  const refuse = (field: keyof SellerSettings, reason: string): SettingsRefusal => ({ ok: false, field, reason });
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const mailbox = env.gapMailbox ? norm(env.gapMailbox) : null;

  let briefingTo: string | null = null;
  if (o.briefingTo !== null && o.briefingTo !== undefined && norm(o.briefingTo) !== '') {
    briefingTo = norm(o.briefingTo);
    if (!EMAIL.test(briefingTo)) return refuse('briefingTo', 'invalid_email');
    if (mailbox && briefingTo === mailbox) return refuse('briefingTo', 'briefing_to_is_gap_mailbox');
  }

  const hour = o.briefingHourNy === undefined ? DEFAULT_SELLER_SETTINGS.briefingHourNy : o.briefingHourNy;
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) return refuse('briefingHourNy', 'hour_out_of_range');

  const rawSenders = o.commandSenders === undefined ? [] : o.commandSenders;
  if (!Array.isArray(rawSenders)) return refuse('commandSenders', 'invalid_email');
  const senders: string[] = [];
  for (const raw of rawSenders) {
    const s = norm(raw);
    if (!EMAIL.test(s)) return refuse('commandSenders', 'invalid_email');
    if (mailbox && s === mailbox) return refuse('commandSenders', 'command_sender_is_gap_mailbox');
    if (!senders.includes(s)) senders.push(s);
  }

  const mode = o.mode === undefined ? DEFAULT_SELLER_SETTINGS.mode : o.mode;
  if (mode === 'execute') return refuse('mode', 'execute_mode_not_amended');
  if (mode !== 'prepare' && mode !== 'review') return refuse('mode', 'unknown_mode');

  const targets: Partial<Record<TargetKind, number>> = {};
  const rawTargets = o.targets === undefined || o.targets === null ? {} : o.targets;
  if (typeof rawTargets !== 'object' || Array.isArray(rawTargets)) return refuse('targets', 'target_not_a_count');
  for (const [k, v] of Object.entries(rawTargets as Record<string, unknown>)) {
    if (!(TARGET_KINDS as readonly string[]).includes(k)) return refuse('targets', 'unknown_target_kind');
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) return refuse('targets', 'target_not_a_count');
    targets[k as TargetKind] = v;
  }

  return { ok: true, value: { briefingTo, briefingHourNy: hour, commandSenders: senders, mode, targets } };
}

/** The stored settings, or the defaults when absent or unreadable (never throws). */
export async function loadSellerSettings(prisma: PrismaLike): Promise<SellerSettings> {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key: SELLER_SETTINGS_KEY } });
    if (!row?.value) return { ...DEFAULT_SELLER_SETTINGS };
    const parsed = JSON.parse(String(row.value));
    // Stored rows were validated at save time; re-validate so a hand-edited row never yields an unsafe shape.
    const v = validateSellerSettings(parsed, { gapMailbox: null });
    return v.ok ? v.value : { ...DEFAULT_SELLER_SETTINGS };
  } catch {
    return { ...DEFAULT_SELLER_SETTINGS };
  }
}

/** One upsert on the key plus one ledger row naming who changed what. Pass a VALIDATED value. */
export async function saveSellerSettings(prisma: PrismaLike, value: SellerSettings, actor: string): Promise<SellerSettings> {
  const stored = JSON.stringify(value);
  await prisma.systemConfig.upsert({
    where: { key: SELLER_SETTINGS_KEY },
    create: { key: SELLER_SETTINGS_KEY, value: stored },
    update: { value: stored },
  });
  await prisma.gapAuditEvent.create({
    data: { kind: SELLER_SETTINGS_EVENT, actor, subject_type: 'seller_settings', subject_id: SELLER_SETTINGS_KEY, payload: JSON.parse(stored) },
  });
  return value;
}

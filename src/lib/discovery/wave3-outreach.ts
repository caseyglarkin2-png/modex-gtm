/**
 * Wave 3 outreach copy — exec-level committee outreach for national enterprise
 * accounts (PepsiCo, Sysco, DHL, etc.). Unlike the proximity play, these targets
 * are not near a live reference site, so the lead angle is their real Tier-A yard
 * footprint (from the buyer-committee research), then honest capability framings.
 *
 * Recipient-facing, claims only what the data backs (the facility count), persona-
 * scoped CTA, no em dashes. Rotating framings let a committee get non-duplicate copy.
 *
 * Intentionally import-free so the activation script can import it under tsx without
 * pulling the app's `@/` alias chain. personaScopeLocal mirrors personaScope in
 * outreach.ts (kept small and stable).
 */

/** Mirror of personaScope (outreach.ts): ops titles win over network titles. */
function personaScopeLocal(title?: string): 'yard ops' | 'network' | null {
  const t = (title || '').toLowerCase();
  if (/yard|dock|terminal|plant|\bsite\b|warehouse|distribution|operations|\bops\b/.test(t)) return 'yard ops';
  if (/transport|logistics|supply chain|fleet|network/.test(t)) return 'network';
  return null;
}

export interface Wave3Contact {
  company: string;
  firstName: string;
  title?: string;
  /** Number of Tier-A facilities (facilities_in_tierA from the committee research). */
  facilities?: number;
}

export interface Wave3Outreach {
  subject: string;
  body: string;
}

interface Framing {
  subject: (c: Wave3Contact) => string;
  opener: (c: Wave3Contact) => string;
}

const FRAMINGS: Framing[] = [
  // 0 — footprint: their real Tier-A yard count (backed by the research).
  {
    subject: (c) => (c.facilities ? `YardFlow across your ${c.facilities} yards` : 'YardFlow across your yard network'),
    opener: (c) =>
      c.facilities
        ? `You run ${c.facilities} Tier-A yards. YardFlow gives you one live view across all of them, gate to dock.`
        : 'You run yards across a national network. YardFlow gives you one live view across all of them, gate to dock.',
  },
  // 1 — network: visibility across many yards.
  {
    subject: () => 'One live view across your yards',
    opener: () =>
      'Running trailers across many yards leaves blind spots between sites. YardFlow puts every yard on one live map.',
  },
  // 2 — efficiency: dwell / lost trailers (capability framing, not a site claim).
  {
    subject: () => 'Stop losing trailers in your own yards',
    opener: () =>
      'Most yards lose hours a day to trailers nobody can locate. YardFlow tracks every trailer from gate to dock in real time.',
  },
  // 3 — scale: gate/dock dwell at enterprise volume.
  {
    subject: () => 'Cut gate and dock dwell at scale',
    opener: () =>
      'At your trailer volumes, minutes per move add up fast. YardFlow cuts gate and dock dwell with live yard tracking.',
  },
];

export const WAVE3_FRAMING_COUNT = FRAMINGS.length;

/**
 * Build a Wave 3 committee draft. `angleIndex` rotates the framing so each member
 * of a committee gets a distinct angle (wraps past WAVE3_FRAMING_COUNT).
 */
export function buildWave3Outreach(c: Wave3Contact, angleIndex = 0): Wave3Outreach {
  const framing = FRAMINGS[((angleIndex % FRAMINGS.length) + FRAMINGS.length) % FRAMINGS.length];
  const scope = personaScopeLocal(c.title);
  const body = [
    `Hi ${c.firstName || 'there'},`,
    '',
    framing.opener(c),
    '',
    `We'd love to show you the live yard ops and see if it's worth a look for your ${scope || 'network'}. Open to a quick 15 minutes?`,
    '',
    'Best,',
    'Casey',
  ].join('\n');
  return { subject: framing.subject(c), body };
}

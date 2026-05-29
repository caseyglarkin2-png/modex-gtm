import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * B.T3 — DossierIntro
 *
 * Renders the editorial intro authored in `pack.account.dossierIntro`
 * at the top of the microsite. Returns null if the field is absent so
 * legacy packs without it render unchanged.
 *
 * Typography: serif italic display body, max ~65ch wide, neon-cyan
 * border-left accent on the first sentence to anchor the eye. A small
 * "Last audit refresh: {Mon YYYY}" caption (B.T8) sits below, derived
 * from `pack.builtAt`.
 */

function formatAuditMonth(iso: string): string | null {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return null;
  }
}

export function DossierIntro({ pack }: { pack: DemoPack }) {
  const intro = pack.account.dossierIntro;
  if (!intro) return null;
  // Split into first sentence + remainder so the first sentence carries
  // the neon-accent typographic treatment. Fallback: render as one block
  // if no period is found.
  const firstDot = intro.indexOf('. ');
  const lead = firstDot > 0 ? intro.slice(0, firstDot + 1) : intro;
  const rest = firstDot > 0 ? intro.slice(firstDot + 2) : '';
  const auditMonth = formatAuditMonth(pack.builtAt);
  return (
    <section
      data-ms-section-id="dossier-intro"
      className="mx-auto w-full max-w-3xl px-5 py-7 max-[480px]:px-[18px]"
    >
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]/85">
        Audit intro
      </div>
      <p className="m-0 max-w-[65ch] text-[17px] leading-[1.6] text-white max-[480px]:text-[15.5px]">
        <span className="border-l-2 border-[#00B4FF] pl-3 font-semibold text-white">
          {lead}
        </span>
        {rest ? <span className="text-white/80"> {rest}</span> : null}
      </p>
      {auditMonth ? (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/45">
          Last audit refresh · {auditMonth}
        </p>
      ) : null}
    </section>
  );
}

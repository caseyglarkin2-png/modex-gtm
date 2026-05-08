import Link from 'next/link';
import { getAccentClasses } from '@/components/microsites/theme';
import type { AccountMicrositeData } from '@/lib/microsites/schema';
import { getVariantRoutes } from '@/lib/microsites/rules';

type MicrositesTabProps = {
  accounts: AccountMicrositeData[];
};

export function MicrositesTab({ accounts }: MicrositesTabProps) {
  const showcaseAccounts = accounts
    .filter((a) => a.showcase)
    .sort((a, b) => (a.showcaseOrder ?? 99) - (b.showcaseOrder ?? 99));
  const otherAccounts = accounts
    .filter((a) => !a.showcase)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Microsites Gallery ({accounts.length})</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Internal index of public-facing account microsites — {showcaseAccounts.length} showcase, {otherAccounts.length} other.
        </p>
      </div>

      {showcaseAccounts.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">Showcase</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {showcaseAccounts.map((account) => {
              const accent = getAccentClasses(account.theme?.accentColor);
              const variants = getVariantRoutes(account);
              const heroSection = account.sections.find((s) => s.type === 'hero');
              const headline = heroSection && 'headline' in heroSection ? heroSection.headline : '';
              return (
                <Link
                  key={account.slug}
                  href={`/for/${account.slug}`}
                  className="group block rounded-lg border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:border-[var(--primary)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${accent.bg}`} />
                    <span className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                      {account.accountName}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
                    <span
                      className={`rounded border px-2 py-0.5 font-bold ${
                        account.band === 'A'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-cyan-300 bg-cyan-50 text-cyan-700'
                      }`}
                    >
                      Band {account.band}
                    </span>
                    <span>{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{account.sections.length} sections</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">All Accounts</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="space-y-4">
          {otherAccounts.map((account) => {
            const accent = getAccentClasses(account.theme?.accentColor);
            const variants = getVariantRoutes(account);
            return (
              <div key={account.slug} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${accent.bg}`} />
                      <Link
                        href={`/for/${account.slug}`}
                        className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)]"
                      >
                        {account.accountName}
                      </Link>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
                      <span className="uppercase tracking-[0.15em]">{account.vertical}</span>
                      <span>|</span>
                      <span>{account.network.facilityCount} facilities</span>
                      <span>|</span>
                      <span>{account.people.length} people</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[10px]">
                    <span
                      className={`rounded border px-2 py-0.5 font-bold ${
                        account.band === 'A'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : account.band === 'B'
                          ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                          : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      Band {account.band}
                    </span>
                    <span className="font-mono text-xs text-[var(--muted-foreground)]">{account.priorityScore}</span>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <Link
                        key={v.slug}
                        href={`/for/${account.slug}/${v.slug}`}
                        className={`rounded-full px-3 py-1 text-xs ${accent.text} ${accent.bgSubtle} border ${accent.border} transition-colors hover:opacity-80`}
                      >
                        {v.personName}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
                  {account.sections.length} sections · {account.personVariants.length} person variants · {account.proofBlocks.length} proof blocks
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

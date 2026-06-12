import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';

/**
 * Self-hosted tracked sales docs (evidence-layer plan 4.6).
 *
 * HubSpot Documents track views in the UI only — no API, no intent stamps,
 * no Pulse. These pages serve the same PDFs from OUR surface wearing the
 * microsite tracker, so every doc view feeds the intent engine with
 * per-second dwell and person-level attribution.
 *
 * Link format for sends:
 *   /docs/<slug>?acct=<account-slug>&p=<person-slug>
 * acct/p ride the same resolution paths the /for and /demo microsites use.
 * Bare links (no params) still track as anonymous 'docs' traffic.
 *
 * NOTE: the PDFs here are the Jun 10 versions pulled from HubSpot as
 * placeholders — Casey has newer versions coming; drop-in replace the
 * files in public/docs/ when ready.
 */

const DOCS: Record<string, { title: string; file: string }> = {
  'pilot-program': {
    title: 'YardFlow Pilot Program',
    file: '/docs/pilot-program.pdf',
  },
  'pricing-and-packaging': {
    title: 'YardFlow Pricing and Packaging',
    file: '/docs/pricing-and-packaging.pdf',
  },
  'roi-one-pager': {
    title: 'YardFlow ROI One-Pager',
    file: '/docs/roi-one-pager.pdf',
  },
  'solution-overview': {
    title: 'YardFlow Solution Overview',
    file: '/docs/solution-overview.pdf',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCS[slug];
  return {
    title: doc ? `${doc.title} | YardFlow by FreightRoll` : 'Document',
    // 1:1 sales collateral — same noindex posture as the /for spear pages.
    robots: { index: false, follow: false },
  };
}

export default async function TrackedDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const doc = DOCS[slug];
  if (!doc) notFound();

  const acct = typeof sp.acct === 'string' && sp.acct ? sp.acct : '';
  const person = typeof sp.p === 'string' && sp.p ? sp.p : undefined;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <MicrositeTracker
        accountName={acct || 'docs'}
        accountSlug={acct || 'docs'}
        path={`/docs/${slug}`}
        personSlug={person}
        variantSlug={`doc-${slug}`}
      />
      <header className="px-6 py-3 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-sm font-medium">{doc.title}</span>
        <a
          href={`${doc.file}`}
          download
          data-ms-cta-id={`doc-download-${slug}`}
          className="text-xs text-neutral-400 hover:text-neutral-100 underline underline-offset-2"
        >
          Download PDF
        </a>
      </header>
      <object
        data={doc.file}
        type="application/pdf"
        className="flex-1 w-full"
        aria-label={doc.title}
      >
        <div className="p-10 text-center text-sm text-neutral-400">
          <p className="mb-4">Your browser cannot display the PDF inline.</p>
          <a
            href={doc.file}
            download
            data-ms-cta-id={`doc-download-${slug}`}
            className="underline underline-offset-2 text-neutral-100"
          >
            Download {doc.title}
          </a>
        </div>
      </object>
    </main>
  );
}

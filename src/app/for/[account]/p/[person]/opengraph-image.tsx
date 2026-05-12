/**
 * Personalized OG image for /for/[account]?p=[person] shares.
 *
 * The canonical reader-aware page URL is /for/{account}?p={person} (the
 * /for/{account}/{person} path redirects to it). When the page's
 * generateMetadata resolves a ?p= reader, it points og:image at THIS
 * route. Unfurl bots fetch this URL directly with no query string, so
 * the personSlug rides in the path.
 *
 * Falls back gracefully: if the account is unknown → 404; if the
 * person slug doesn't match a variant on the account → render the
 * standard (non-personalized) OG.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { MicrositeMemoSocialImage } from '@/components/microsites/memo-social-image';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { resolveReader } from '@/lib/microsites/reader-context';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const PREPARED_DATE = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

async function loadMemoFonts() {
  const fontsDir = join(process.cwd(), 'src/assets/fonts');
  const [fraunces, monaSans] = await Promise.all([
    readFile(join(fontsDir, 'Fraunces-Regular.ttf')),
    readFile(join(fontsDir, 'MonaSans-Regular.ttf')),
  ]);
  return { fraunces, monaSans };
}

export default async function PersonalizedOpenGraphImage({
  params,
}: {
  params: Promise<{ account: string; person: string }>;
}) {
  const { account, person } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const reader = resolveReader(data, person);
  const personName = reader?.variant.person.name ?? reader?.variant.person.firstName;
  const personTitle = reader?.variant.person.title;
  const preparedFor = personName
    ? personTitle
      ? `Prepared for ${personName} · ${personTitle}`
      : `Prepared for ${personName}`
    : undefined;

  const footprintShort = data.coverFootprint ?? data.network?.facilityCount;
  const verticalLabel = formatVertical(data.vertical);
  const contextLine = footprintShort
    ? `${short(footprintShort, 56)} · ${verticalLabel}`
    : verticalLabel;

  const title = data.coverHeadline ?? `Yard execution as a network constraint for ${data.accountName}`;

  const fonts = await loadMemoFonts();

  return new ImageResponse(
    (
      <MicrositeMemoSocialImage
        accentColor={data.theme?.accentColor}
        eyebrow={`Private analysis · ${PREPARED_DATE}`}
        title={title}
        accountName={data.accountName}
        byline="YardFlow private brief · prepared by Casey Larkin"
        contextLine={contextLine}
        preparedFor={preparedFor}
      />
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: fonts.fraunces, style: 'normal', weight: 400 },
        { name: 'Mona Sans', data: fonts.monaSans, style: 'normal', weight: 400 },
      ],
    },
  );
}

function short(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

const VERTICAL_LABELS: Record<string, string> = {
  cpg: 'CPG',
  beverage: 'Beverage',
  automotive: 'Automotive',
  'heavy-equipment': 'Heavy equipment',
  retail: 'Retail',
  'building-materials': 'Building materials',
  industrial: 'Industrial',
  grocery: 'Grocery',
  pharma: 'Pharma',
  'logistics-3pl': '3PL · Logistics',
};

function formatVertical(v: string): string {
  return VERTICAL_LABELS[v] ?? v;
}

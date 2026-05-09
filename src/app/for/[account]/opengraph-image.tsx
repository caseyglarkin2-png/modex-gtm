import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { MicrositeMemoSocialImage } from '@/components/microsites/memo-social-image';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';

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

/**
 * Load the Fraunces and Mona Sans TTFs that ship in src/assets/fonts.
 *
 * We read the bytes off the filesystem with fs/promises rather than the
 * fetch(new URL(..., import.meta.url)) pattern: the fetch-import.meta
 * approach failed in production with a 500 because Next.js's Turbopack
 * build doesn't inline non-imported binary assets that way. fs.readFile
 * from process.cwd() is the documented escape hatch and works because
 * Vercel ships the entire project root with each Function bundle.
 *
 * Fraunces ships as a single variable TTF (opsz/wght/SOFT/WONK axes);
 * satori reads only one axis position, so we register it as the default
 * "Fraunces" family and let the renderer synthesize emphasis where the
 * social image needs it. Mona Sans is the Regular static cut.
 */
async function loadMemoFonts() {
  const fontsDir = join(process.cwd(), 'src/assets/fonts');
  const [fraunces, monaSans] = await Promise.all([
    readFile(join(fontsDir, 'Fraunces-Regular.ttf')),
    readFile(join(fontsDir, 'MonaSans-Regular.ttf')),
  ]);
  return { fraunces, monaSans };
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const facilityCount = data.network?.facilityCount;
  const contextLine = facilityCount
    ? `${facilityCount}-facility footprint · ${data.vertical}`
    : data.vertical;

  const fonts = await loadMemoFonts();

  return new ImageResponse(
    (
      <MicrositeMemoSocialImage
        accentColor={data.theme?.accentColor}
        eyebrow={`Private analysis · ${PREPARED_DATE}`}
        title={`Yard execution as a network constraint for ${data.accountName}`}
        byline="YardFlow private brief · prepared by Casey Larkin"
        contextLine={contextLine}
      />
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Fraunces',
          data: fonts.fraunces,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Mona Sans',
          data: fonts.monaSans,
          style: 'normal',
          weight: 400,
        },
      ],
    },
  );
}

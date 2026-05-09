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
 * Load the Newsreader and Inter Tight TTFs that ship in src/assets/fonts.
 *
 * We read the bytes off the filesystem with fs/promises rather than the
 * fetch(new URL(..., import.meta.url)) pattern: the fetch-import.meta
 * approach failed in production with a 500 because Next.js's Turbopack
 * build doesn't inline non-imported binary assets that way. fs.readFile
 * from process.cwd() is the documented escape hatch and works because
 * Vercel ships the entire project root with each Function bundle.
 *
 * Both files are variable fonts; satori (the engine behind ImageResponse)
 * doesn't currently traverse weight axes, so we register one weight per
 * fontFamily slot and let satori synthesize bolds where needed.
 */
async function loadMemoFonts() {
  const fontsDir = join(process.cwd(), 'src/assets/fonts');
  const [newsreader, interTight] = await Promise.all([
    readFile(join(fontsDir, 'Newsreader-Regular.ttf')),
    readFile(join(fontsDir, 'InterTight-Regular.ttf')),
  ]);
  return { newsreader, interTight };
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
          name: 'Newsreader',
          data: fonts.newsreader,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'Inter Tight',
          data: fonts.interTight,
          style: 'normal',
          weight: 500,
        },
      ],
    },
  );
}

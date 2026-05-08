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

  return new ImageResponse(
    (
      <MicrositeMemoSocialImage
        accentColor={data.theme?.accentColor}
        eyebrow={`Private analysis · ${PREPARED_DATE}`}
        title={`Yard execution as a network constraint for ${data.accountName}`}
        byline="YardFlow private brief · prepared by Casey Larkin"
        contextLine={contextLine}
        stats={[
          ...(facilityCount ? [{ label: 'Network', value: String(facilityCount) }] : []),
          { label: 'Tier', value: data.tier },
          { label: 'Vertical', value: data.vertical }
            ,
        ]}
      />
    ),
    size,
  );
}
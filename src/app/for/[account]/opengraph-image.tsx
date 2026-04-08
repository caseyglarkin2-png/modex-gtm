import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { MicrositeSocialImage } from '@/components/microsites/social-image';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { materializeMicrositeSections } from '@/lib/microsites/roi';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const sections = materializeMicrositeSections(data, data.sections);
  const hero = sections.find((section) => section.type === 'hero');
  const roi = sections.find((section) => section.type === 'roi');

  return new ImageResponse(
    (
      <MicrositeSocialImage
        accentColor={data.theme?.accentColor}
        eyebrow="Private Field Brief"
        secondaryTitle={data.accountName}
        title="Yard execution brief"
        summary={hero?.headline ?? data.metaDescription}
        stats={[
          { label: 'Priority', value: `${data.band} ${data.priorityScore}` },
          { label: 'Network', value: data.network.facilityCount },
          ...(roi?.totalAnnualSavings ? [{ label: 'ROI signal', value: roi.totalAnnualSavings }] : []),
          ...(roi?.paybackPeriod ? [{ label: 'Payback', value: roi.paybackPeriod }] : []),
        ]}
        footer={data.vertical}
      />
    ),
    size,
  );
}
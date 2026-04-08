import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { MicrositeSocialImage } from '@/components/microsites/social-image';
import { resolveMicrositeProposalBrief } from '@/lib/microsites/proposal';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = resolveMicrositeProposalBrief(slug);
  if (!proposal) notFound();

  return new ImageResponse(
    (
      <MicrositeSocialImage
        accentColor={proposal.accentColor}
        eyebrow="Board-ready proposal"
        secondaryTitle={proposal.accountName}
        title="Yard execution proposal"
        summary={proposal.hero.headline}
        stats={[
          { label: 'Priority', value: `${proposal.band} ${proposal.priorityScore}` },
          ...(proposal.network?.facilityCount ? [{ label: 'Network', value: proposal.network.facilityCount }] : []),
          ...(proposal.roi?.totalAnnualSavings ? [{ label: 'Modeled value', value: proposal.roi.totalAnnualSavings }] : []),
          ...(proposal.roi?.paybackPeriod ? [{ label: 'Payback', value: proposal.roi.paybackPeriod }] : []),
        ]}
        footer={proposal.tier}
      />
    ),
    size,
  );
}
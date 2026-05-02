import { ImageResponse } from 'next/og';
import { MicrositeSocialImage } from '@/components/microsites/social-image';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <MicrositeSocialImage
        accentColor="#06B6D4"
        eyebrow="YardFlow by FreightRoll RevOps OS"
        title="YardFlow proposal-grade microsites"
        summary="Board-ready account pages, person-specific variants, and ROI-backed proposals built to book operator meetings."
        stats={[
          { label: 'Focus', value: '20 target accounts' },
          { label: 'Priority', value: 'Meeting creation' },
          { label: 'Format', value: 'Shareable briefs' },
        ]}
        footer="FreightRoll"
      />
    ),
    size,
  );
}

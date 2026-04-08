import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { MicrositeSocialImage } from '@/components/microsites/social-image';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { resolveMicrositeBySlug } from '@/lib/microsites/rules';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ account: string; person: string }>;
}) {
  const { account, person } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const resolved = resolveMicrositeBySlug(data, person);
  if (!resolved) notFound();

  return new ImageResponse(
    (
      <MicrositeSocialImage
        accentColor={data.theme?.accentColor}
        eyebrow="Person-specific operating brief"
        secondaryTitle={resolved.person.name}
        title={resolved.person.title}
        summary={resolved.variant.openingHook}
        stats={[
          { label: 'Account', value: data.accountName },
          { label: 'Priority', value: `${data.band} ${data.priorityScore}` },
          ...(resolved.variant.kpiLanguage[0] ? [{ label: 'Primary lens', value: resolved.variant.kpiLanguage[0] }] : []),
        ]}
        footer={resolved.person.function}
      />
    ),
    size,
  );
}
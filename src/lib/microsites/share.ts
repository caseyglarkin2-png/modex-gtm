import type { Metadata } from 'next';
import { buildMicrositeAbsoluteUrl } from '@/lib/site-url';

export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;

interface PublicShareMetadataInput {
  title: string;
  description: string;
  pathname: string;
  imagePath: string;
  imageAlt: string;
  noIndex?: boolean;
}

export function buildPublicShareMetadata({
  title,
  description,
  pathname,
  imagePath,
  imageAlt,
  noIndex = true,
}: PublicShareMetadataInput): Metadata {
  // Public share / OG / canonical URLs always point at the canonical
  // microsite domain (yardflow.ai), not the modex-gtm Vercel preview.
  // Same-origin matters for D8.1 (localStorage hand-off to /roi).
  const url = buildMicrositeAbsoluteUrl(pathname);
  const imageUrl = buildMicrositeAbsoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'YardFlow by FreightRoll',
      url,
      images: [
        {
          url: imageUrl,
          width: SOCIAL_IMAGE_WIDTH,
          height: SOCIAL_IMAGE_HEIGHT,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'twitter:image:alt': imageAlt,
    },
  };
}
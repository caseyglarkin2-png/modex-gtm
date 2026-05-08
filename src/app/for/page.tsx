export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PublicLanding } from '@/components/microsites/public-landing';

export const metadata: Metadata = {
  title: 'YardFlow — The First Yard Network System',
  robots: { index: false, follow: false },
};

// On the public yardflow.ai domain this serves the branded landing page; on the
// internal app domain it redirects into the Content Studio Microsites tab. The
// per-account /for/[account] and /for/[account]/[person] routes remain
// unchanged and are still served on both domains.
export default async function ForIndexPage() {
  const host = (await headers()).get('host') ?? '';
  if (host.includes('yardflow.ai')) {
    return <PublicLanding />;
  }
  redirect('/studio?tab=microsites');
}

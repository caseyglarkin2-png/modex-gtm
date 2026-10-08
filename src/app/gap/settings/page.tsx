/**
 * /gap/settings   (X13, GAP OS sales execution engine, 2026-10-08)
 *
 * The seller's settings in the product: the morning briefing address and hour, the addresses that may command GAP by
 * email, the operating mode and the daily targets the scorecard counts against. The store and every rule are
 * src/lib/gap/work/settings.ts behind GET/POST /api/gap/settings; this page renders the form. Session only, behind the
 * GAP flags. Nothing here sends, drafts, enrolls or writes HubSpot.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { loadSellerSettings } from '@/lib/gap/work/settings';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { SellerSettingsForm } from '@/components/gap/seller-settings-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP settings' };

export default async function SettingsPage() {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/settings/'));
  const settings = await loadSellerSettings(prisma);
  const gapMailbox = gapGmailSender()?.userEmail ?? process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() ?? null;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Where the morning briefing goes, who may command GAP from their inbox, the mode, and the daily targets the scorecard on Work counts against.
        </p>
      </div>
      <SellerSettingsForm initial={settings} gapMailbox={gapMailbox} legacyDigest />
    </div>
  );
}

'use server';

import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { runReenrichContactsCron } from '@/lib/cron/reenrich-contacts';
import { prisma } from '@/lib/prisma';
import { GET as runSyncHubspotRoute } from '@/app/api/cron/sync-hubspot/route';
import { requireAdminAction } from '@/lib/require-admin';
import crypto from 'node:crypto';

async function writeRunbookAudit(action: 'reenrich-contacts' | 'sync-hubspot', mode: 'run' | 'dry_run' = 'run') {
  const at = new Date().toISOString();
  const signer = process.env.CRON_SECRET || 'missing-cron-secret';
  const signature = crypto
    .createHash('sha256')
    .update(`${action}:${mode}:${at}:${signer}`)
    .digest('hex');

  await prisma.systemConfig.upsert({
    where: { key: `runbook:${action}:last` },
    update: {
      value: JSON.stringify({ action, mode, at, signature }),
    },
    create: {
      key: `runbook:${action}:last`,
      value: JSON.stringify({ action, mode, at, signature }),
    },
  });
}

export async function runReenrichContactsNowAction() {
  await requireAdminAction();
  await writeRunbookAudit('reenrich-contacts', 'run');
  await runReenrichContactsCron();
  revalidatePath('/admin/crons');
}

export async function runSyncHubspotDryRunNowAction() {
  await requireAdminAction();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('CRON_SECRET is required to run sync-hubspot action.');
  }
  await writeRunbookAudit('sync-hubspot', 'dry_run');
  const request = new NextRequest('http://internal/api/cron/sync-hubspot?dry_run=1', {
    headers: { authorization: `Bearer ${secret}` },
  });
  await runSyncHubspotRoute(request);
  revalidatePath('/admin/crons');
  revalidatePath('/ops');
}

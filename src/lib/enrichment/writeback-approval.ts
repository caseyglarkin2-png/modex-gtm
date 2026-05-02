import { createHash, randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { WritebackPreviewItem } from '@/lib/enrichment/writeback-preview';

const PREVIEW_KEY_PREFIX = 'enrichment_writeback_preview';
const APPROVAL_KEY_PREFIX = 'enrichment_writeback_approval';

type StoredPreview = {
  personaId: number;
  checksum: string;
  preview: WritebackPreviewItem[];
  createdAt: string;
};

type StoredApproval = {
  token: string;
  personaId: number;
  checksum: string;
  expiresAt: string;
  createdAt: string;
};

function stableSortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSortValue);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    out[key] = stableSortValue((value as Record<string, unknown>)[key]);
  }
  return out;
}

export function computePreviewChecksum(preview: WritebackPreviewItem[]): string {
  const normalized = stableSortValue(preview);
  const payload = JSON.stringify(normalized);
  return createHash('sha256').update(payload).digest('hex');
}

function previewKey(personaId: number, checksum: string): string {
  return `${PREVIEW_KEY_PREFIX}:${personaId}:${checksum}`;
}

function approvalKey(token: string): string {
  return `${APPROVAL_KEY_PREFIX}:${token}`;
}

export async function storeWritebackPreview(
  personaId: number,
  checksum: string,
  preview: WritebackPreviewItem[],
): Promise<void> {
  const key = previewKey(personaId, checksum);
  const value: StoredPreview = {
    personaId,
    checksum,
    preview,
    createdAt: new Date().toISOString(),
  };
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  });
}

export async function loadWritebackPreview(
  personaId: number,
  checksum: string,
): Promise<StoredPreview | null> {
  const key = previewKey(personaId, checksum);
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as StoredPreview;
  } catch {
    return null;
  }
}

export async function issueWritebackApprovalToken(
  personaId: number,
  checksum: string,
  ttlMinutes = 30,
): Promise<{ token: string; expiresAt: string }> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const key = approvalKey(token);
  const value: StoredApproval = {
    token,
    personaId,
    checksum,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await prisma.systemConfig.create({
    data: {
      key,
      value: JSON.stringify(value),
    },
  });

  return { token, expiresAt };
}

export async function consumeWritebackApprovalToken(args: {
  token: string;
  personaId: number;
  checksum: string;
}): Promise<boolean> {
  const key = approvalKey(args.token);
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return false;

  let parsed: StoredApproval;
  try {
    parsed = JSON.parse(row.value) as StoredApproval;
  } catch {
    return false;
  }

  const valid =
    parsed.personaId === args.personaId &&
    parsed.checksum === args.checksum &&
    new Date(parsed.expiresAt).getTime() > Date.now();

  if (!valid) return false;

  await prisma.systemConfig.delete({ where: { key } });
  return true;
}

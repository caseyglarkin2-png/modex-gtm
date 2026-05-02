import { prisma } from '@/lib/prisma';

type LockPayload = {
  token: string;
  expiresAt: string;
};

function parseLock(value?: string): LockPayload | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as LockPayload;
  } catch {
    return null;
  }
}

function lockKey(name: string): string {
  return `lock:${name}`;
}

export async function acquireEnrichmentLock(name: string, ttlMs: number): Promise<{ acquired: boolean; token: string | null }> {
  const key = lockKey(name);
  const now = Date.now();

  const existing = await prisma.systemConfig.findUnique({ where: { key } });
  const existingLock = parseLock(existing?.value);
  if (existingLock && new Date(existingLock.expiresAt).getTime() > now) {
    return { acquired: false, token: null };
  }

  const token = `${name}:${now}:${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = new Date(now + ttlMs).toISOString();
  const value = JSON.stringify({ token, expiresAt } satisfies LockPayload);

  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  const verify = await prisma.systemConfig.findUnique({ where: { key } });
  const verifiedLock = parseLock(verify?.value);
  if (!verifiedLock || verifiedLock.token !== token) {
    return { acquired: false, token: null };
  }

  return { acquired: true, token };
}

export async function releaseEnrichmentLock(name: string, token: string): Promise<void> {
  const key = lockKey(name);
  const existing = await prisma.systemConfig.findUnique({ where: { key } });
  const existingLock = parseLock(existing?.value);
  if (!existingLock || existingLock.token !== token) return;

  await prisma.systemConfig.delete({ where: { key } }).catch(() => undefined);
}

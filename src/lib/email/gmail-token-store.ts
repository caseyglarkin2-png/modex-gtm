import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encrypted per-user Gmail refresh-token store.
 *
 * Each user's Google refresh token is stored AES-256-GCM encrypted at rest in
 * the `gmail_tokens` table so a non-Casey operator (e.g. Jake) can send as
 * themselves. The encryption key comes from `TOKEN_ENCRYPTION_KEY`. When that
 * env var is absent or invalid, the store is a graceful no-op (returns
 * null/false) and the send path falls back to Casey's env token.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * Resolve the 32-byte encryption key from `TOKEN_ENCRYPTION_KEY`. Accepts a
 * 64-char hex string or a 44-char base64 string (both decode to 32 bytes).
 * Returns null when the env var is missing or the wrong length.
 */
export function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;

  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    const buf = Buffer.from(raw, 'hex');
    return buf.length === KEY_BYTES ? buf : null;
  }

  if (raw.length === 44) {
    const buf = Buffer.from(raw, 'base64');
    return buf.length === KEY_BYTES ? buf : null;
  }

  return null;
}

/** Whether per-user token encryption is configured (key present + valid). */
export function isTokenStoreConfigured(): boolean {
  return getKey() !== null;
}

/**
 * Encrypt + upsert a user's refresh token. Returns false (no-op) if the store
 * is not configured, or if the upsert fails.
 */
export async function storeRefreshTokenForUser(
  prisma: any,
  email: string,
  refreshToken: string,
): Promise<boolean> {
  const key = getKey();
  if (!key) return false;

  try {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(refreshToken, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const normalizedEmail = email.toLowerCase();
    const data = {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      auth_tag: authTag.toString('base64'),
    };

    await prisma.gmailToken.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, ...data },
      update: { ...data },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Decrypt + return a user's refresh token, or null if absent / not configured /
 * decrypt fails (e.g. wrong key or tampered auth tag).
 */
export async function getRefreshTokenFor(
  prisma: any,
  email: string,
): Promise<string | null> {
  const key = getKey();
  if (!key) return null;

  try {
    const row = await prisma.gmailToken.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!row) return null;

    const iv = Buffer.from(row.iv, 'base64');
    const authTag = Buffer.from(row.auth_tag, 'base64');
    const encrypted = Buffer.from(row.encrypted, 'base64');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

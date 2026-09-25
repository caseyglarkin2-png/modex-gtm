import { generateKeyPairSync, createVerify } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { delegatedAssertion, GMAIL_DELEGATED_SCOPE } from '@/lib/email/google-delegated';
import { buildMimeMessage, createGmailDraft } from '@/lib/email/gmail-sender';
import { __resetSuppressionGate } from '@/lib/email/suppression-gate';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({
  client_email: 'clawd-yardflow-mail@example.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  token_uri: 'https://oauth2.googleapis.com/token',
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  __resetSuppressionGate();
});

describe('gapGmailSender (GAP-only identity)', () => {
  it('is null when GAP_GMAIL_USER_EMAIL is unset, so non-GAP and unconfigured paths keep the env identity', () => {
    expect(gapGmailSender({})).toBeNull();
    expect(gapGmailSender({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai' })).toBeNull();
  });
  it('prefers the delegated service account, lowercases the mailbox, defaults the display name', () => {
    expect(gapGmailSender({ GAP_GMAIL_USER_EMAIL: 'Casey@YardFlow.ai', GAP_GOOGLE_DWD_SA_JSON: SA, GAP_GOOGLE_REFRESH_TOKEN: 'rt' })).toEqual({
      serviceAccountJson: SA,
      userEmail: 'casey@yardflow.ai',
      displayName: 'Casey Larkin',
    });
    expect(gapGmailSender({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'rt' })).toMatchObject({ refreshToken: 'rt', userEmail: 'casey@yardflow.ai' });
  });
});

describe('domain-wide delegation assertion', () => {
  it('impersonates the mailbox with gmail.modify and verifies against the service account key', () => {
    const jwt = delegatedAssertion(SA, 'casey@yardflow.ai', GMAIL_DELEGATED_SCOPE, 1_790_000_000);
    const [h, p, sig] = jwt.split('.');
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    expect(claims).toMatchObject({ sub: 'casey@yardflow.ai', scope: 'https://www.googleapis.com/auth/gmail.modify', iss: 'clawd-yardflow-mail@example.iam.gserviceaccount.com' });
    expect(createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, Buffer.from(sig, 'base64url'))).toBe(true);
  });
});

describe('MIME From and mailbox alignment', () => {
  it('buildMimeMessage emits From: Casey Larkin <casey@yardflow.ai> for the GAP sender, never freightroll', () => {
    const mime = buildMimeMessage({ to: 'joey.maggard@kroger.com', subject: 'Doors versus spots', html: '<p>x</p>', sender: gapGmailSender({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_DWD_SA_JSON: SA })! });
    expect(mime).toMatch(/^From: Casey Larkin <casey@yardflow\.ai>\r?$/m);
    expect(mime).not.toMatch(/^From:.*freightroll/m);
  });

  it('createGmailDraft with the GAP sender mints a delegated token and writes ONLY to the yardflow mailbox drafts endpoint', async () => {
    vi.stubEnv('CLAWD_CONTROL_PLANE_URL', 'https://clawd.example.test');
    vi.stubEnv('CLAWD_CONTROL_PLANE_TOKEN', 't');
    const calls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (url.includes('/api/suppression/contract')) return json({ ok: true, results: [{ email: 'joey.maggard@kroger.com', blocked: false, reason: '' }] });
      if (url.includes('oauth2.googleapis.com/token')) {
        expect(String(init?.body)).toContain('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer');
        return json({ access_token: 'delegated-at' });
      }
      if (url.includes('/drafts')) {
        const raw = JSON.parse(String(init?.body)).message.raw as string;
        expect(Buffer.from(raw, 'base64url').toString()).toMatch(/^From: Casey Larkin <casey@yardflow\.ai>/m);
        expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer delegated-at');
        return json({ id: 'r-1', message: { id: 'm-1', threadId: 't-1' } });
      }
      throw new Error(`unexpected ${url}`);
    });
    const sender = gapGmailSender({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_DWD_SA_JSON: SA })!;
    const r = await createGmailDraft({ to: 'joey.maggard@kroger.com', subject: 'Doors versus spots', html: '<p>x</p>', sender });
    expect(r).toMatchObject({ draftId: 'r-1', threadId: 't-1' });
    expect(calls.find((c) => c.includes('/drafts'))).toBe('POST https://gmail.googleapis.com/gmail/v1/users/casey%40yardflow.ai/drafts');
    expect(calls.some((c) => /messages\/send|drafts\/send/.test(c))).toBe(false);
  });
});

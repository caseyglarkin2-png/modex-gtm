import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifySlackSignature } from '@/lib/slack/verify';

const SECRET = 'shhh';
function sign(body: string, ts: string) {
  return 'v0=' + createHmac('sha256', SECRET).update(`v0:${ts}:${body}`).digest('hex');
}

it('accepts a correctly signed, fresh request', () => {
  const ts = '1700000000';
  const body = 'command=%2Fyardflow-page&text=acme';
  expect(verifySlackSignature(body, { 'x-slack-signature': sign(body, ts), 'x-slack-request-timestamp': ts }, SECRET, Number(ts))).toBe(true);
});

it('rejects a bad signature', () => {
  const ts = '1700000000';
  expect(verifySlackSignature('body', { 'x-slack-signature': 'v0=deadbeef', 'x-slack-request-timestamp': ts }, SECRET, Number(ts))).toBe(false);
});

it('rejects a stale timestamp (>5 min)', () => {
  const ts = '1700000000';
  const body = 'x';
  expect(verifySlackSignature(body, { 'x-slack-signature': sign(body, ts), 'x-slack-request-timestamp': ts }, SECRET, Number(ts) + 60 * 6)).toBe(false);
});

it('rejects when headers are missing', () => {
  expect(verifySlackSignature('x', {}, SECRET, 1700000000)).toBe(false);
});

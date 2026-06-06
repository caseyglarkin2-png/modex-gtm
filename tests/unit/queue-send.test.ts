import { describe, it, expect, vi } from 'vitest';
import { sendQueueItem, type SendDeps } from '@/lib/queue/send';

function baseDeps(over: Partial<SendDeps> = {}): SendDeps {
  return {
    claim: vi.fn().mockResolvedValue(1),
    loadItem: vi.fn().mockResolvedValue({ id: 1, status: 'approved' }),
    guard: vi.fn().mockResolvedValue({ ok: true }),
    send: vi.fn().mockResolvedValue({ providerMessageId: 'm1', threadId: 't1' }),
    persistProviderIds: vi.fn().mockResolvedValue(undefined),
    runSideEffects: vi.fn().mockResolvedValue({ emailLogId: 99 }),
    finalize: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('sendQueueItem', () => {
  it('no-ops when the claim is lost (concurrent double-trigger)', async () => {
    const deps = baseDeps({ claim: vi.fn().mockResolvedValue(0) });
    const res = await sendQueueItem(1, { deps });
    expect(res).toEqual({ status: 'skipped', skippedReason: 'already_claimed' });
    expect(deps.send).not.toHaveBeenCalled();
  });

  it('marks skipped (not failed) when a guard blocks, without sending', async () => {
    const deps = baseDeps({ guard: vi.fn().mockResolvedValue({ ok: false, reason: 'unsubscribed' }) });
    const res = await sendQueueItem(1, { deps });
    expect(res).toEqual({ status: 'skipped', skippedReason: 'unsubscribed' });
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.finalize).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'skipped', skipped_reason: 'unsubscribed' }));
  });

  it('sends, persists provider ids BEFORE side-effects, then finalizes sent', async () => {
    const order: string[] = [];
    const deps = baseDeps({
      send: vi.fn().mockImplementation(async () => { order.push('send'); return { providerMessageId: 'm1', threadId: 't1' }; }),
      persistProviderIds: vi.fn().mockImplementation(async () => { order.push('persist'); }),
      runSideEffects: vi.fn().mockImplementation(async () => { order.push('side'); return { emailLogId: 99 }; }),
      finalize: vi.fn().mockImplementation(async () => { order.push('final'); }),
    });
    const res = await sendQueueItem(1, { deps });
    expect(res).toEqual({ status: 'sent', emailLogId: 99, providerMessageId: 'm1', threadId: 't1' });
    expect(order).toEqual(['send', 'persist', 'side', 'final']);
    expect(deps.persistProviderIds).toHaveBeenCalledWith(1, { provider_message_id: 'm1', thread_id: 't1' });
    expect(deps.finalize).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'sent', email_log_id: 99, sideeffects_done: true }));
  });

  it('send throws -> failed, alreadySent:false (safe to retry), no provider id persisted', async () => {
    const deps = baseDeps({ send: vi.fn().mockRejectedValue(new Error('Gmail 500')) });
    const res = await sendQueueItem(1, { deps });
    expect(res).toMatchObject({ status: 'failed', alreadySent: false });
    if (res.status === 'failed') expect(res.errorMessage).toContain('Gmail 500');
    expect(deps.persistProviderIds).not.toHaveBeenCalled();
    expect(deps.finalize).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'failed' }));
  });

  it('TRAP STATE: send succeeds then side-effects throw -> failed, alreadySent:true, provider id persisted, sideeffects_done:false', async () => {
    const deps = baseDeps({ runSideEffects: vi.fn().mockRejectedValue(new Error('Prisma pool timeout')) });
    const res = await sendQueueItem(1, { deps });
    expect(res).toMatchObject({ status: 'failed', alreadySent: true });
    expect(deps.persistProviderIds).toHaveBeenCalledWith(1, { provider_message_id: 'm1', thread_id: 't1' });
    expect(deps.finalize).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'failed', sideeffects_done: false }));
  });
});

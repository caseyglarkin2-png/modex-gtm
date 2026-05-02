import { describe, expect, it } from 'vitest';
import { buildSendGuardState } from '@/lib/generated-content/send-guard';

describe('buildSendGuardState', () => {
  it('flags outdated version warning', () => {
    const guard = buildSendGuardState({
      selectedVersion: 2,
      latestVersion: 3,
      pendingJobs: 0,
      processingJobs: 0,
      previewMode: true,
      acknowledgedGuard: false,
    });

    expect(guard.isOutdatedVersion).toBe(true);
    expect(guard.warningMessage).toContain('older than latest version 3');
    expect(guard.guardBlocksSend).toBe(true);
  });

  it('flags queue in-flight warning', () => {
    const guard = buildSendGuardState({
      selectedVersion: 3,
      latestVersion: 3,
      pendingJobs: 1,
      processingJobs: 0,
      previewMode: true,
      acknowledgedGuard: true,
    });

    expect(guard.hasQueueInFlight).toBe(true);
    expect(guard.warningMessage).toContain('still in queue');
    expect(guard.guardBlocksSend).toBe(false);
  });

  it('requires preview and acknowledgement when guard is active', () => {
    const guard = buildSendGuardState({
      selectedVersion: 1,
      latestVersion: 2,
      pendingJobs: 1,
      processingJobs: 0,
      previewMode: false,
      acknowledgedGuard: false,
    });

    expect(guard.requiresGuard).toBe(true);
    expect(guard.guardBlocksSend).toBe(true);
  });

  it('returns no warning when current and queue clear', () => {
    const guard = buildSendGuardState({
      selectedVersion: 2,
      latestVersion: 2,
      pendingJobs: 0,
      processingJobs: 0,
      previewMode: false,
      acknowledgedGuard: false,
    });

    expect(guard.requiresGuard).toBe(false);
    expect(guard.guardBlocksSend).toBe(false);
    expect(guard.warningMessage).toBeNull();
  });
});

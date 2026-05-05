import { describe, expect, it } from 'vitest';
import { canDirectSendAsset, getAssetDeliveryMode } from '@/lib/generated-content/asset-send-contract';

describe('asset send contract', () => {
  it('marks cold outbound assets as direct-send', () => {
    expect(getAssetDeliveryMode('one_pager')).toBe('direct-send');
    expect(getAssetDeliveryMode('cold_hook')).toBe('direct-send');
    expect(canDirectSendAsset('one_pager')).toBe(true);
  });

  it('marks meeting and call assets as preview-only', () => {
    expect(getAssetDeliveryMode('meeting_prep')).toBe('preview-only');
    expect(getAssetDeliveryMode('call_script')).toBe('preview-only');
    expect(canDirectSendAsset('meeting_prep')).toBe(false);
  });

  it('marks public and bundle assets as copy-export-only', () => {
    expect(getAssetDeliveryMode('microsite')).toBe('copy-export-only');
    expect(getAssetDeliveryMode('studio_handoff_bundle')).toBe('copy-export-only');
    expect(canDirectSendAsset('microsite')).toBe(false);
  });
});

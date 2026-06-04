import { describe, it, expect, vi, beforeEach } from 'vitest';

const getByName = vi.fn();
const create = vi.fn();

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => true,
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
  getHubSpotClient: () => ({
    crm: { properties: { coreApi: { getByName: (...a: unknown[]) => getByName(...a), create: (...a: unknown[]) => create(...a) } } },
  }),
}));

import {
  ensureYardflowIcpScoreProperty,
  __resetYardflowPropertyCache,
  YARDFLOW_ICP_SCORE_PROPERTY,
} from '@/lib/hubspot/properties';

beforeEach(() => {
  getByName.mockReset();
  create.mockReset();
  __resetYardflowPropertyCache();
});

describe('ensureYardflowIcpScoreProperty', () => {
  it('no-ops when the property already exists', async () => {
    getByName.mockResolvedValue({ name: YARDFLOW_ICP_SCORE_PROPERTY });
    await ensureYardflowIcpScoreProperty();
    expect(getByName).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the property as a number when missing', async () => {
    getByName.mockRejectedValue(new Error('not found'));
    create.mockResolvedValue({ name: YARDFLOW_ICP_SCORE_PROPERTY });
    await ensureYardflowIcpScoreProperty();
    expect(create).toHaveBeenCalledTimes(1);
    const [objectType, def] = create.mock.calls[0] as [string, { name: string; type: string }];
    expect(objectType).toBe('companies');
    expect(def.name).toBe(YARDFLOW_ICP_SCORE_PROPERTY);
    expect(def.type).toBe('number');
  });

  it('tolerates a concurrent create (already exists)', async () => {
    getByName.mockRejectedValue(new Error('not found'));
    create.mockRejectedValue(new Error('Property already exists'));
    await expect(ensureYardflowIcpScoreProperty()).resolves.toBeUndefined();
  });

  it('rethrows genuine create errors', async () => {
    getByName.mockRejectedValue(new Error('not found'));
    create.mockRejectedValue(new Error('500 internal server error'));
    await expect(ensureYardflowIcpScoreProperty()).rejects.toThrow(/500/);
  });

  it('memoizes — a second call makes no further API calls', async () => {
    getByName.mockResolvedValue({ name: YARDFLOW_ICP_SCORE_PROPERTY });
    await ensureYardflowIcpScoreProperty();
    await ensureYardflowIcpScoreProperty();
    expect(getByName).toHaveBeenCalledTimes(1);
  });
});

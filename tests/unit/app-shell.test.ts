import { describe, expect, it } from 'vitest';
import { isPublicAppPath } from '@/components/app-shell';

describe('isPublicAppPath', () => {
  it('treats public proposal and microsite routes as public shell pages', () => {
    expect(isPublicAppPath('/proposal')).toBe(true);
    expect(isPublicAppPath('/proposal/frito-lay')).toBe(true);
    expect(isPublicAppPath('/for')).toBe(true);
    expect(isPublicAppPath('/for/general-mills')).toBe(true);
    expect(isPublicAppPath('/login')).toBe(true);
    expect(isPublicAppPath('/unsubscribe')).toBe(true);
  });

  it('keeps dashboard routes inside the authenticated app shell', () => {
    expect(isPublicAppPath('/')).toBe(false);
    expect(isPublicAppPath('/accounts')).toBe(false);
    expect(isPublicAppPath('/analytics')).toBe(false);
    expect(isPublicAppPath(null)).toBe(false);
  });
});
/**
 * The seller's employment control (owner resolution, 2026-10-05): VERIFY CURRENT ROLE shows the five outcomes in
 * seller words (the Walmart pattern reads "Still at Walmart Inc., but the stored transportation role changed. Verify
 * current remit before using."), CURRENT ROLE IS WRONG still records status role_changed, and a HubSpot-only person
 * mounts with hubspotContactId + title and posts to /api/gap/people/verify-role. No em dashes anywhere.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EmploymentControl } from '@/components/gap/employment-control';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const WALMART = 'Walmart Inc.';
const STORED = 'Sr Director - West Transportation Command Center';
const POST_URL = 'https://www.linkedin.com/in/christian-burton-57161518b/';
const fetchMock = vi.fn();
const answer = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });
const verification = (over: Record<string, unknown>) => ({ verdict: 'different_role', employmentVerdict: 'current', company: WALMART, title: null, priorTitle: STORED, sourceUrl: POST_URL, sourceDate: '2026-10-05', confidence: 'high', tier: 'strong', summary: 'A colleague was promoted into the role.', ...over });
const lastCall = () => ({ url: fetchMock.mock.calls.at(-1)![0] as string, body: JSON.parse((fetchMock.mock.calls.at(-1)![1] as { body: string }).body) });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const outcome = async () => {
  const el = await screen.findByTestId('employment-outcome');
  return el.textContent ?? '';
};

describe('VERIFY CURRENT ROLE: five outcomes in seller words', () => {
  const mount = () => render(<EmploymentControl personaId={42} name="C M" accountName={WALMART} title={STORED} />);
  it('different_role with no title: still here, the stored transportation role changed, verify current remit', async () => {
    mount();
    answer({ verification: verification({}), read: { state: 'CURRENT_CONFIRMED' }, role: { state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    expect(await outcome()).toBe('Still at Walmart Inc., but the stored transportation role changed. Verify current remit before using.');
    expect(lastCall().url).toBe('/api/gap/personas/42/employment/verify');
  });
  it('different_role with the new title: still here, the role changed to the new title, usable', async () => {
    mount();
    answer({ verification: verification({ title: 'Vice President, Transportation' }), read: { state: 'CURRENT_CONFIRMED' }, role: { state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: 'Vice President, Transportation', usableForRanking: true } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    const text = await outcome();
    expect(text).toMatch(/^Still at Walmart Inc\.; the role changed to "Vice President, Transportation"/);
    expect(text).toMatch(/linkedin\.com/);
  });
  it('same_role: still in the stored role at the account, with the source', async () => {
    mount();
    answer({ verification: verification({ verdict: 'same_role', title: 'Senior Director, West Transportation Command Center', priorTitle: null }), read: { state: 'CURRENT_CONFIRMED' }, role: { state: 'ROLE_CURRENT_CONFIRMED', effectiveTitle: 'Senior Director, West Transportation Command Center', usableForRanking: true } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    const text = await outcome();
    expect(text).toMatch(/^Verified from linkedin\.com: still Senior Director, West Transportation Command Center at Walmart Inc\./);
  });
  it('left: now at the other employer; not eligible here; not do-not-contact', async () => {
    mount();
    answer({ verification: verification({ verdict: 'left', employmentVerdict: 'left', company: 'Target', title: 'VP Transportation' }), read: { state: 'LEFT_COMPANY_CONFIRMED' }, role: { state: 'ROLE_UNVERIFIED' } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    const text = await outcome();
    expect(text).toMatch(/^Verified from linkedin\.com: now at Target, VP Transportation\. Not eligible for Walmart Inc\. outreach; not do-not-contact\./);
  });
  it('conflict: sources disagree, verify before using', async () => {
    mount();
    answer({ verification: verification({ verdict: 'conflict', employmentVerdict: 'unknown', title: null, summary: 'Two sources disagree.' }), read: { state: 'CURRENT_UNVERIFIED' }, role: { state: 'ROLE_CONFLICT', usableForRanking: false } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    const text = await outcome();
    expect(text).toMatch(/^Sources disagree about C M's current role at Walmart Inc\. \(Two sources disagree\.\)\. Verify before using\./);
  });
  it('unknown: no source-backed answer, nothing asserted', async () => {
    mount();
    answer({ verification: verification({ verdict: 'unknown', employmentVerdict: 'unknown', company: null, sourceUrl: null, tier: 'weak', summary: 'no source found' }), read: { state: 'CURRENT_UNVERIFIED' }, role: { state: 'ROLE_UNVERIFIED' } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    expect(await outcome()).toBe('No source-backed answer (no source found). Nothing was asserted.');
  });
  it('a refusal reads as a sentence; nothing rendered carries an em dash', async () => {
    const { container } = mount();
    answer({ error: 'human_correction_stands' }, 409);
    fireEvent.click(screen.getByTestId('employment-verify'));
    expect(await outcome()).toMatch(/Not recorded: human correction stands/);
    expect(container.textContent).not.toMatch(/—/);
  });
  it('without a stored title the sentence says "the stored role"', async () => {
    render(<EmploymentControl personaId={42} name="C M" accountName={WALMART} />);
    answer({ verification: verification({}), read: { state: 'CURRENT_CONFIRMED' }, role: { state: 'ROLE_CHANGED_CONFIRMED' } });
    fireEvent.click(screen.getByTestId('employment-verify'));
    expect(await outcome()).toBe('Still at Walmart Inc., but the stored role changed. Verify current remit before using.');
  });
});

describe('CURRENT ROLE IS WRONG stays: status role_changed with the corrected title to the persona route', () => {
  it('posts status role_changed and the new title; the outcome names the role state', async () => {
    render(<EmploymentControl personaId={42} name="C M" accountName={WALMART} title={STORED} />);
    fireEvent.click(screen.getByTestId('employment-wrong-role'));
    expect(screen.getByTestId('employment-form')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('New title'), { target: { value: 'Vice President, Transportation' } });
    answer({ ok: true, read: { state: 'CURRENT_CONFIRMED' }, role: { state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: 'Vice President, Transportation', usableForRanking: true } }, 201);
    fireEvent.click(screen.getByTestId('employment-save'));
    expect(await outcome()).toMatch(/^Recorded: C M's role at Walmart Inc\. is now "Vice President, Transportation"/);
    const { url, body } = lastCall();
    expect(url).toBe('/api/gap/personas/42/employment');
    expect(body).toMatchObject({ status: 'role_changed', newTitle: 'Vice President, Transportation', newCompany: null });
  });
  it('the departure form still records left with the new company', async () => {
    render(<EmploymentControl personaId={42} name="C M" accountName={WALMART} />);
    fireEvent.click(screen.getByTestId('employment-left'));
    fireEvent.change(screen.getByLabelText('New company'), { target: { value: 'Target' } });
    answer({ ok: true, read: { state: 'LEFT_COMPANY_CONFIRMED' }, role: { state: 'ROLE_UNVERIFIED' } }, 201);
    fireEvent.click(screen.getByTestId('employment-save'));
    expect(await outcome()).toMatch(/^Recorded: C M left Walmart Inc\. \(now Target\)\. Not eligible for Walmart Inc\. outreach; not do-not-contact\./);
    expect(lastCall().body).toMatchObject({ status: 'left', newCompany: 'Target' });
  });
});

describe('a HubSpot-only person mounts with hubspotContactId + title and verifies through /api/gap/people/verify-role', () => {
  it('shows only VERIFY CURRENT ROLE, posts the HubSpot body, and reads the outcome from read', async () => {
    render(<EmploymentControl hubspotContactId="7001" name="C M" accountName={WALMART} title={STORED} />);
    expect(screen.queryByTestId('employment-left')).toBeNull();
    expect(screen.queryByTestId('employment-wrong-role')).toBeNull();
    expect(screen.getByTestId('employment-control')).toHaveAttribute('data-hubspot-contact', '7001');
    answer({ verification: verification({}), read: { state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false }, recorded: true, auditId: 'a' });
    fireEvent.click(screen.getByTestId('employment-verify'));
    expect(await outcome()).toBe('Still at Walmart Inc., but the stored transportation role changed. Verify current remit before using.');
    const { url, body } = lastCall();
    expect(url).toBe('/api/gap/people/verify-role');
    expect(body).toEqual({ hubspotContactId: '7001', accountName: WALMART, name: 'C M', title: STORED });
  });
  it('the verify button is disabled while the check runs', async () => {
    render(<EmploymentControl hubspotContactId="7001" name="C M" accountName={WALMART} title={STORED} />);
    let release: (v: unknown) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((r) => { release = r; }));
    fireEvent.click(screen.getByTestId('employment-verify'));
    expect(screen.getByTestId('employment-verify')).toBeDisabled();
    expect(screen.getByTestId('employment-verify').textContent).toMatch(/Verifying/);
    release({ ok: true, status: 200, json: async () => ({ verification: verification({ verdict: 'unknown', sourceUrl: null, company: null, summary: null }), read: { state: 'ROLE_UNVERIFIED' } }) });
    await waitFor(() => expect(screen.getByTestId('employment-verify')).not.toBeDisabled());
  });
});

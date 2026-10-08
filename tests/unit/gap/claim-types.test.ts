/**
 * R22 / R23: a verified sentence is a claim of ONE type with its permitted interpretation and its forbidden leap; a
 * job posting supports only its own text and its status when stated; an expired or reposted listing is not new
 * demand; an RFP carries its scope and due date; a software deployment is technology context, never yard pain; a
 * leadership move is who-to-approach context; a finance line is never operational pain; a physical change keeps
 * the existing first-touch path.
 */
import { describe, expect, it } from 'vitest';
import { claimClassOf, classifyClaim } from '@/lib/gap/research/claim-types';

describe('classifyClaim', () => {
  it('a physical network change is the existing first-touch claim', () => {
    const c = classifyClaim('PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.');
    expect(c.type).toBe('physical_change');
    expect(claimClassOf(c)).toBe('FACT');
    expect(c.forbids).toMatch(/proves congestion/);
  });
  it('a job posting with yard, dock or trailer duties is a job claim with the role and the stated status; it never implies a missing system', () => {
    const open = classifyClaim('PepsiCo is now hiring a Yard Operations Manager in Dallas who will be responsible for trailer spotting, gate check-in and dock scheduling.');
    expect(open.type).toBe('job_posting');
    expect(open.attributes.role?.toLowerCase()).toMatch(/yard operations manager/);
    expect(open.attributes.postingStatus).toBe('open');
    expect(open.forbids).toMatch(/lack a system/);
    const closed = classifyClaim('The Dock Supervisor position at the Kroger Denver DC is no longer accepting applications.');
    expect(closed.type).toBe('job_posting');
    expect(closed.attributes.postingStatus).toBe('closed');
    const reposted = classifyClaim('Kroger has reposted its Transportation Coordinator job opening for the Houston distribution center.');
    expect(reposted.attributes.postingStatus).toBe('reposted');
    // An unrelated software role is not a yard claim.
    expect(classifyClaim('PepsiCo is hiring a Senior Software Engineer for its consumer app team.').type).toBe('other');
  });
  it('a procurement notice carries the stated due date and issuer; nothing says the contract is open', () => {
    const c = classifyClaim('The Port of Houston Authority issued a request for proposals for a yard management system; proposals are due November 14, 2026.');
    expect(c.type).toBe('procurement');
    expect(c.attributes.dueDate).toBe('2026-11-14');
    expect(c.attributes.issuer).toMatch(/Port of Houston Authority/);
    expect(c.forbids).toMatch(/contract is open/);
    expect(classifyClaim('Kroger published an RFQ for drayage services at its Ohio distribution centers.').attributes.dueDate).toBeNull();
  });
  it('a technology deployment names the system; a partnership names the partner; a leadership move names the direction; a finance line is context', () => {
    const t = classifyClaim('Kroger implemented a new warehouse management system from Manhattan Associates across its Ohio distribution centers.');
    expect(t.type).toBe('technology');
    expect(t.attributes.counterparty).toMatch(/Manhattan Associates/);
    expect(t.forbids).toMatch(/software deployment implies a yard need/);
    const p = classifyClaim('PepsiCo signed a multi-year agreement with Gatik for autonomous middle-mile freight.');
    expect(p.type).toBe('partnership');
    expect(p.attributes.counterparty).toMatch(/Gatik/);
    const l = classifyClaim('PepsiCo named Jane Doe as Senior Vice President of Supply Chain.');
    expect(l).toMatchObject({ type: 'leadership', attributes: { move: 'appointed' } });
    expect(classifyClaim('The CFO of Kroger stepped down on October 1.').attributes.move).toBe('departed');
    expect(classifyClaim('PepsiCo reported organic revenue growth of 2.1% and raised its full-year guidance.').type).toBe('financial');
    expect(classifyClaim('The company published its sustainability report.').type).toBe('other');
  });
});

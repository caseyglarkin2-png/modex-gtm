import { describe, it, expect } from 'vitest';
import { hasRoleGate, hasIntent, classifyContact } from '../../src/lib/revops/qualification/model';
import type { QualContact, QualCompany } from '../../src/lib/revops/qualification/types';

const base = { hs_seniority: '', hs_role: '', jobtitle: '' };

const noIntent = {
  intent_score: '', last_intent_at: '', last_intent_source: '',
  hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '',
};

const tam: QualCompany = { id: 'c1', name: 'Acme', icpScore: 85 };
const offTam: QualCompany = { id: 'c2', name: 'Tiny', icpScore: 40 };
const opsDir = { ...noIntent, hs_seniority: 'director', hs_role: 'operations', jobtitle: 'Director of Operations' } as QualContact;

describe('hasRoleGate', () => {
  it('includes senior leaders of any function', () => {
    expect(hasRoleGate({ ...base, hs_seniority: 'vp' })).toBe(true);
    expect(hasRoleGate({ ...base, hs_seniority: 'director' })).toBe(true);
    expect(hasRoleGate({ ...base, hs_seniority: 'executive' })).toBe(true);
  });
  it('includes structured operations role', () => {
    expect(hasRoleGate({ ...base, hs_role: 'operations' })).toBe(true);
  });
  it('includes ops job titles even at manager level', () => {
    expect(hasRoleGate({ ...base, jobtitle: 'Supply Chain Manager' })).toBe(true);
    expect(hasRoleGate({ ...base, jobtitle: 'Director of Yard Operations' })).toBe(true);
    expect(hasRoleGate({ ...base, jobtitle: 'Logistics Coordinator' })).toBe(true);
  });
  it('excludes junior off-function people', () => {
    expect(hasRoleGate({ ...base, hs_seniority: 'entry', hs_role: 'information_technology', jobtitle: 'IT Analyst' })).toBe(false);
    expect(hasRoleGate({ ...base, hs_seniority: 'employee', hs_role: 'marketing', jobtitle: 'Marketing Associate' })).toBe(false);
  });
});

describe('hasIntent', () => {
  it('false with no signals', () => { expect(hasIntent(noIntent)).toBe(false); });
  it('true on intent_score >= 1', () => { expect(hasIntent({ ...noIntent, intent_score: '1' })).toBe(true); });
  it('true on a reply', () => { expect(hasIntent({ ...noIntent, hs_sales_email_last_replied: '2026-06-01' })).toBe(true); });
  it('true on a booked meeting', () => { expect(hasIntent({ ...noIntent, engagements_last_meeting_booked: '2026-06-01' })).toBe(true); });
  it('true on demo visit source', () => { expect(hasIntent({ ...noIntent, last_intent_source: '/demo/acme' })).toBe(true); });
  it('true on 2 opens + 1 click', () => { expect(hasIntent({ ...noIntent, hs_email_open: '2', hs_email_replied: '1' })).toBe(true); });
  it('false on opens without reply', () => { expect(hasIntent({ ...noIntent, hs_email_open: '5' })).toBe(false); });
});

describe('classifyContact', () => {
  it('none when account below ICP threshold', () => {
    expect(classifyContact(offTam, opsDir)).toBe('none');
  });
  it('none when no company', () => {
    expect(classifyContact(null, opsDir)).toBe('none');
  });
  it('none for off-role at TAM account', () => {
    expect(classifyContact(tam, { ...noIntent, hs_seniority: 'entry', hs_role: 'finance', jobtitle: 'Accountant' } as QualContact)).toBe('none');
  });
  it('mql for ops director at TAM, no intent', () => {
    expect(classifyContact(tam, opsDir)).toBe('mql');
  });
  it('sql for ops director at TAM with intent', () => {
    expect(classifyContact(tam, { ...opsDir, intent_score: '2' })).toBe('sql');
  });
});

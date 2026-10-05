import { describe, expect, it } from 'vitest';
import { parseResearchedContacts, parseDomainAnswer } from '@/lib/discovery/research';

describe('parseDomainAnswer', () => {
  it('returns a bare corporate domain', () => {
    expect(parseDomainAnswer('kuehne-nagel.com')).toBe('kuehne-nagel.com');
  });

  it('extracts the domain from a sentence and strips www', () => {
    expect(parseDomainAnswer('The corporate email domain is acme.com.')).toBe('acme.com');
    expect(parseDomainAnswer('https://www.xpo.com/about')).toBe('xpo.com');
  });

  it('rejects free providers and non-answers', () => {
    expect(parseDomainAnswer('gmail.com')).toBeNull();
    expect(parseDomainAnswer('NONE')).toBeNull();
    expect(parseDomainAnswer('I am not sure.')).toBeNull();
    expect(parseDomainAnswer('')).toBeNull();
  });
});

describe('parseResearchedContacts', () => {
  it('parses a plain JSON array incl. local/corporate scope', () => {
    const out = parseResearchedContacts(
      '[{"name":"Jane Doe","title":"VP Supply Chain","scope":"corporate","linkedinUrl":"https://linkedin.com/in/janedoe","reason":"owns network"},{"name":"Bob Lee","title":"Regional Transportation Mgr","scope":"local"}]',
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ name: 'Jane Doe', firstName: 'Jane', lastName: 'Doe', scope: 'corporate' });
    expect(out[1].scope).toBe('local');
  });

  it('defaults scope to corporate when omitted or invalid', () => {
    const out = parseResearchedContacts('[{"name":"No Scope"},{"name":"Bad Scope","scope":"nonsense"}]');
    expect(out[0].scope).toBe('corporate');
    expect(out[1].scope).toBe('corporate');
  });

  it('extracts JSON from a ```json fenced block with surrounding prose', () => {
    const text = 'Here are the contacts I found:\n```json\n[{"name":"John Smith","title":"Director of Logistics"}]\n```\nHope that helps.';
    const out = parseResearchedContacts(text);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('John Smith');
    expect(out[0].firstName).toBe('John');
    expect(out[0].lastName).toBe('Smith');
  });

  it('drops entries without a usable name and splits multi-word last names', () => {
    const out = parseResearchedContacts(
      '[{"title":"no name"},{"name":"Maria Van Der Berg","title":"Ops"}]',
    );
    expect(out).toHaveLength(1);
    expect(out[0].firstName).toBe('Maria');
    expect(out[0].lastName).toBe('Van Der Berg');
  });

  it('returns [] for non-JSON / garbage', () => {
    expect(parseResearchedContacts('I could not find anyone.')).toEqual([]);
    expect(parseResearchedContacts('')).toEqual([]);
  });
});

describe('operator-first contact research (GAP seller correction, 2026-10-04)', () => {
  it('asks for explicit responsibility slots in order, never generic decision makers', async () => {
    const { buildContactResearchPrompt } = await import('@/lib/discovery/research');
    const p = buildContactResearchPrompt('PepsiCo');
    const order = ['"DIRECT_OPERATOR"', '"TRANSPORTATION_TECH"', '"EXECUTIVE_SPONSOR"', '"SITE_OPERATOR"'].map((k) => p.indexOf(k));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(p).toMatch(/Transportation Operations Manager/);
    expect(p).toMatch(/sourceUrl/);
    expect(p).toMatch(/Never guess an email/);
    expect(p).not.toMatch(/decision-makers|5 to 6 people|VP\/Director of Supply Chain/);
  });
  it('the slot comes from the GAP person prior, not the model', async () => {
    const { parseResearchedContacts } = await import('@/lib/discovery/research');
    const [vp, op, sourcing] = parseResearchedContacts('[{"slot":"DIRECT_OPERATOR","name":"Vic Vp","title":"VP Supply Chain","sourceUrl":"https://x.example/a"},{"slot":"EXECUTIVE_SPONSOR","name":"Mark Op","title":"Transportation Operations Manager","sourceUrl":"https://x.example/b"},{"name":"Sam Src","title":"Director Transportation Strategic Sourcing","sourceUrl":"https://x.example/c"}]');
    expect(vp.slot).toBe('EXECUTIVE_SPONSOR');
    expect(op.slot).toBe('DIRECT_OPERATOR');
    expect(sourcing.slot).toBe('OTHER');
  });
  it('drops anyone without a source URL and anything outside a slot; operator first, at most 2 per slot', async () => {
    const { parseResearchedContacts, sourceBackedBySlot } = await import('@/lib/discovery/research');
    const people = parseResearchedContacts(JSON.stringify([
      { name: 'No Source', title: 'Director of Transportation' },
      { name: 'Ann Sponsor', title: 'VP Supply Chain', sourceUrl: 'https://x.example/1' },
      { name: 'Bo Op', title: 'Director, Logistics', linkedinUrl: 'https://www.linkedin.com/in/bo' },
      { name: 'Cy Op', title: 'Director of Transportation', sourceUrl: 'https://x.example/2' },
      { name: 'Di Op', title: 'Transportation Operations Manager', sourceUrl: 'https://x.example/3' },
      { name: 'Ed Proc', title: 'VP Transportation Procurement', sourceUrl: 'https://x.example/4' },
      { name: 'Bad Url', title: 'Director of Transportation', sourceUrl: 'not a url' },
    ]));
    expect(sourceBackedBySlot(people).map((p) => p.name)).toEqual(['Cy Op', 'Di Op', 'Ann Sponsor']);
  });
  it('an email survives only with the page where it was published', async () => {
    const { parseResearchedContacts } = await import('@/lib/discovery/research');
    const [a, b] = parseResearchedContacts('[{"name":"Guess Who","title":"Director of Transportation","email":"guess.who@acme.com","sourceUrl":"https://x.example/1"},{"name":"Pub Lished","title":"Director of Transportation","email":"pub@acme.com","emailSourceUrl":"https://acme.com/contact","sourceUrl":"https://x.example/2"}]');
    expect(a.email).toBeUndefined();
    expect(b).toMatchObject({ email: 'pub@acme.com', emailSourceUrl: 'https://acme.com/contact' });
  });
});

import { describe, expect, it } from 'vitest';
import { parseResearchedContacts } from '@/lib/discovery/research';

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

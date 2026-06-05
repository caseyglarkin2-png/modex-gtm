import { describe, expect, it } from 'vitest';
import { parseResearchedContacts } from '@/lib/discovery/research';

describe('parseResearchedContacts', () => {
  it('parses a plain JSON array', () => {
    const out = parseResearchedContacts(
      '[{"name":"Jane Doe","title":"VP Supply Chain","linkedinUrl":"https://linkedin.com/in/janedoe","reason":"owns network"}]',
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Supply Chain',
      linkedinUrl: 'https://linkedin.com/in/janedoe',
    });
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

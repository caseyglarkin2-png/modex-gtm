import { describe, expect, it } from 'vitest';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';

describe('resolveGeneratedContentRendering', () => {
  it('converts one-pager json payloads to html', () => {
    const rendering = resolveGeneratedContentRendering(JSON.stringify({
      headline: 'Automate Yard Flow',
      subheadline: 'Reduce dwell',
      painPoints: [],
      solutionSteps: [],
      outcomes: [],
      proofStats: [],
      customerQuote: 'Quote',
      bestFit: 'Best fit',
      publicContext: 'Context',
    }), 'Acme Foods');

    expect(rendering.source).toBe('json_one_pager');
    expect(rendering.html).toContain('YardFlow');
    expect(rendering.html).toContain('For Acme Foods');
  });

  it('returns html content unchanged', () => {
    const rendering = resolveGeneratedContentRendering('<h1>Hello</h1>', 'Acme Foods');
    expect(rendering.source).toBe('html');
    expect(rendering.html).toBe('<h1>Hello</h1>');
  });

  it('wraps and escapes plain text', () => {
    const rendering = resolveGeneratedContentRendering('Hello <script>alert(1)</script>', 'Acme Foods');
    expect(rendering.source).toBe('plain_text');
    expect(rendering.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('handles malformed json without throwing', () => {
    const rendering = resolveGeneratedContentRendering('{"headline":', 'Acme Foods');
    expect(rendering.source).toBe('json_invalid');
    expect(rendering.html).toContain('{&quot;headline&quot;:');
  });
});

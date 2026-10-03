// @vitest-environment node
/**
 * Semantic Tailwind tokens must resolve.
 *
 * The app writes shadcn-style semantic utilities (text-muted-foreground,
 * bg-background, border-input, ring-ring, ...) everywhere. Tailwind v4 only
 * generates those when an @theme block maps --color-<token> to a colour.
 * Without the mapping the class compiles to NOTHING: muted text inherits the
 * foreground colour, border-input falls back to currentColor, and every
 * ring-ring focus ring on the shared primitives renders transparent.
 *
 * (a) Static: every semantic token the source uses has a --color-<token>
 *     mapping in an @theme block, pointing at a variable defined on BOTH
 *     :root and .dark.
 * (b) Compile: the real @tailwindcss/postcss pipeline over globals.css emits
 *     a rule for each core semantic utility.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const GLOBALS = path.join(ROOT, 'src/app/globals.css');
const CSS = readFileSync(GLOBALS, 'utf8');

const TOKENS = [
  'background', 'foreground', 'muted', 'muted-foreground', 'border', 'input', 'ring',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'accent',
  'accent-foreground', 'destructive', 'destructive-foreground', 'card', 'card-foreground',
  'popover', 'popover-foreground', 'success', 'warning',
];
const PREFIXES = [
  'text', 'bg', 'border', 'border-[trblxy]', 'ring', 'ring-offset', 'outline', 'fill', 'stroke',
  'divide', 'placeholder', 'from', 'via', 'to', 'decoration', 'caret', 'accent', 'shadow',
];
// Longest token first so "muted-foreground" wins over "muted".
const TOKEN_ALT = [...TOKENS].sort((a, b) => b.length - a.length).join('|');
const USAGE = new RegExp(
  `(?:^|[\\s'"\`{:])(?:${PREFIXES.join('|')})-(${TOKEN_ALT})(?:/\\d+)?(?=[\\s'"\`}]|$)`,
  'gm',
);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) return walk(abs);
    return /\.(tsx?|jsx?)$/.test(name) ? [abs] : [];
  });
}

function tokensUsed(source: string): Set<string> {
  const out = new Set<string>();
  for (const m of source.matchAll(USAGE)) out.add(m[1]);
  return out;
}

function themeMappings(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const block of css.matchAll(/@theme(?:\s+inline)?\s*\{([^}]*)\}/g)) {
    for (const d of block[1].matchAll(/--color-([a-z-]+)\s*:\s*var\(--([a-z-]+)\)\s*;/g)) out[d[1]] = d[2];
  }
  return out;
}

function vars(selector: string): Set<string> {
  const re = new RegExp(`(^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`);
  const m = CSS.match(re);
  if (!m) throw new Error(`globals.css has no ${selector} block`);
  return new Set([...m[2].matchAll(/--([a-z-]+)\s*:/g)].map((d) => d[1]));
}

describe('semantic token inventory', () => {
  it('the usage regex finds tokens in real class strings (self-test)', () => {
    expect([...tokensUsed('className="text-muted-foreground hover:bg-muted/30 ring-offset-background"')].sort())
      .toEqual(['background', 'muted', 'muted-foreground']);
    expect([...tokensUsed("cn('focus-visible:ring-ring border-input')")].sort()).toEqual(['input', 'ring']);
    expect([...tokensUsed('className="bg-[var(--muted)] text-mutedish"')]).toEqual([]);
  });

  const used = new Set<string>();
  for (const file of walk(path.join(ROOT, 'src'))) {
    for (const t of tokensUsed(readFileSync(file, 'utf8'))) used.add(t);
  }

  it('finds a real set of semantic tokens in src/', () => {
    for (const t of ['muted-foreground', 'background', 'foreground', 'ring', 'input', 'primary']) {
      expect(used.has(t), `inventory lost ${t}`).toBe(true);
    }
  });

  const mappings = themeMappings(CSS);
  const rootVars = vars(':root');
  const darkVars = vars('.dark');

  for (const token of [...used].sort()) {
    it(`--color-${token} is mapped in @theme and its variable exists on :root and .dark`, () => {
      const target = mappings[token];
      expect(target, `${token} is used in src/ but globals.css has no @theme --color-${token} mapping`).toBeDefined();
      expect(rootVars.has(target), `--${target} (for --color-${token}) is not defined on :root`).toBe(true);
      expect(darkVars.has(target), `--${target} (for --color-${token}) is not defined on .dark`).toBe(true);
    });
  }
});

describe('semantic utilities compile through @tailwindcss/postcss', () => {
  const CLASSES = [
    'text-muted-foreground', 'bg-background', 'text-foreground', 'border-border', 'border-input',
    'ring-ring', 'ring-offset-background', 'bg-primary', 'text-primary-foreground', 'bg-muted',
    'bg-accent', 'bg-card', 'bg-secondary',
  ];

  it('emits a rule for every core semantic utility', async () => {
    // Scan an empty dir and feed candidates via @source inline so the compile
    // is deterministic and fast, but run the app's real globals.css through it.
    const scratch = mkdtempSync(path.join(os.tmpdir(), 'tw-sem-'));
    try {
      const input = `${CSS}\n@source inline("${CLASSES.join(' ')}");\n`;
      const result = await postcss([tailwind({ base: scratch })]).process(input, {
        from: path.join(path.dirname(GLOBALS), 'semantic-tokens-probe.css'),
      });
      const out = result.css;
      for (const cls of CLASSES) {
        const selector = `.${cls}`;
        const start = out.indexOf(`${selector} {`);
        expect(start, `compiled CSS has no rule for ${selector}`).toBeGreaterThan(-1);
        const body = out.slice(start, out.indexOf('}', start));
        expect(body, `${selector} does not read a theme variable`).toMatch(/var\(--[a-z-]+\)/);
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }, 60_000);
});

describe('shared primitives draw a visible focus ring', () => {
  const ui = (f: string) => readFileSync(path.join(ROOT, 'src/components/ui', f), 'utf8');

  // A primitive that relies on ring-ring is only as visible as the mapping above.
  for (const f of ['button.tsx', 'tabs.tsx', 'dialog.tsx', 'sheet.tsx', 'badge.tsx']) {
    it(`${f} focuses with ring-ring`, () => {
      expect(ui(f)).toMatch(/focus(?:-visible)?:ring-ring/);
    });
  }
  for (const f of ['input.tsx', 'textarea.tsx', 'select.tsx']) {
    it(`${f} focuses with a primary ring`, () => {
      expect(ui(f)).toMatch(/focus(?:-visible)?:ring-\[var\(--primary\)\]/);
    });
  }

  it('the button ring sits off the fill (default buttons are filled with the ring colour)', () => {
    // --ring equals --primary, so a ring flush against a bg-primary button is
    // invisible. The 2px offset in the page colour separates them.
    const base = ui('button.tsx');
    expect(base, 'button focus ring is thinner than 2px').toMatch(/focus-visible:ring-2/);
    expect(base, 'button focus ring has no offset from the fill').toMatch(/focus-visible:ring-offset-2/);
    expect(base, 'button ring offset is not painted in the page colour').toMatch(/ring-offset-background/);
  });
});

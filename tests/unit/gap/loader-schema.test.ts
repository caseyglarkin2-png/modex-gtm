/**
 * The account loaders read softly: a failed read degrades to empty so the page never breaks. That also means a
 * misspelled column fails SILENTLY in production (2026-10-02: `captured_at` on GapSignal emptied every account's
 * signals for ten minutes; the untyped client let it typecheck). This pins every select / where / orderBy key the
 * loaders send against the real Prisma schema.
 */
import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { loadAccountInputs } from '@/lib/gap/account-intel/load';
import { loadAccountContext } from '@/lib/gap/context/load';

const models = new Map(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]));
const modelOf = (delegate: string) => models.get(delegate.charAt(0).toUpperCase() + delegate.slice(1));

function check(model: string, args: Record<string, unknown> | undefined, errors: string[]) {
  const m = models.get(model);
  if (!m || !args) return;
  const fields = new Map(m.fields.map((f) => [f.name, f]));
  const keys = (o: unknown, where: string) => {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (['AND', 'OR', 'NOT'].includes(k)) {
        for (const x of Array.isArray(v) ? v : [v]) keys(x, where);
        continue;
      }
      const f = fields.get(k);
      if (!f) {
        errors.push(`${model}.${where}: unknown field "${k}"`);
        continue;
      }
      // A relation's nested select is checked against its own model.
      if (where === 'select' && f.kind === 'object' && v && typeof v === 'object' && 'select' in (v as object)) check(f.type, v as Record<string, unknown>, errors);
    }
  };
  keys(args.select, 'select');
  keys(args.where, 'where');
  for (const o of Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]) keys(o, 'orderBy');
}

function schemaCheckingPrisma(errors: string[]) {
  return new Proxy(
    {},
    {
      get: (_t, delegate: string) => {
        if (typeof delegate !== 'string' || delegate.startsWith('$') || !modelOf(delegate)) return undefined;
        const model = modelOf(delegate)!.name;
        return new Proxy(
          {},
          {
            get: (_u, method: string) => async (args: Record<string, unknown>) => {
              check(model, args, errors);
              if (model === 'Account' && method === 'findUnique') return { name: 'Acme Foods', tier: null, priority_band: null, vertical: null, parent_brand: null, hubspot_company_id: null, updated_at: new Date(), best_intro_path: null, owner: 'Casey', next_action: null };
              if (method === 'findUnique' || method === 'findFirst') return null;
              if (method === 'count') return 0;
              return [];
            },
          },
        );
      },
    },
  );
}

describe('account loaders read only real columns', () => {
  it('loadAccountInputs and loadAccountContext send no unknown select / where / orderBy key', async () => {
    const errors: string[] = [];
    const prisma = schemaCheckingPrisma(errors);
    const i = await loadAccountInputs(prisma, 'Acme Foods', new Date('2026-10-02T12:00:00Z'));
    expect(i).not.toBeNull();
    await loadAccountContext(prisma, i!, new Date('2026-10-02T12:00:00Z'));
    expect(errors).toEqual([]);
  });
  it('the checker itself catches a misspelled column', () => {
    const errors: string[] = [];
    check('GapSignal', { select: { captured_at: true } }, errors);
    expect(errors).toEqual(['GapSignal.select: unknown field "captured_at"']);
  });
});

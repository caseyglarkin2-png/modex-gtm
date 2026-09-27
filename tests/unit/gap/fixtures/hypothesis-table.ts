/**
 * `prospectingHypothesis.findFirst` over an in-memory table, including the
 * supersession relation filter (`superseded_by: { is: null }`) the current
 * work queries use. Everything else goes through the shared where evaluator,
 * which throws on an operator it does not know.
 */
import { findFirstFrom } from './where';

type Row = Record<string, any>;

export function hypothesisFindFirst(rows: () => Row[]) {
  return async (args: { where?: Row; orderBy?: Row | Row[] } = {}): Promise<Row | null> => {
    const { superseded_by: rel, ...where } = args.where ?? {};
    let table = rows();
    if (rel !== undefined) {
      if (!(rel && typeof rel === 'object' && 'is' in rel && rel.is === null)) throw new Error('hypothesis fixture: unsupported superseded_by filter');
      const superseded = new Set(table.map((r) => r.supersedes_id).filter(Boolean));
      table = table.filter((r) => !superseded.has(r.id));
    }
    return findFirstFrom(table, { where, orderBy: args.orderBy });
  };
}

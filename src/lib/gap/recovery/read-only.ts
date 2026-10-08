/**
 * READ-ONLY DATABASE ACCESS FOR RECOVERY TOOLS (R65, 2026-10-07). Server only.
 *
 * `readOnlyPrisma` wraps a Prisma client so a recovery dry run CANNOT write: every model write (create, update,
 * upsert, delete and their many forms), raw SQL in either direction and transactions throw before reaching the
 * database. Reads (findMany, findFirst, findUnique, count, groupBy, aggregate) pass through unchanged.
 *
 * `strandedRepairCommand` is the stranded-draft dry run's argument rule: it runs only with `--dry-run`; without it the
 * script refuses (exit 2) and reads nothing, because the adoption itself is the R11 service's job
 * (story/draft-from-fact.ts), run by the seller's draft control or with explicit authorization.
 */

const WRITES = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'updateManyAndReturn', 'upsert', 'delete', 'deleteMany']);
const CLIENT_REFUSED = new Set(['$executeRaw', '$executeRawUnsafe', '$queryRaw', '$queryRawUnsafe', '$transaction', '$runCommandRaw']);

export class ReadOnlyRefusal extends Error {
  constructor(what: string) {
    super(`read-only: ${what} refused (this tool never writes)`);
    this.name = 'ReadOnlyRefusal';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readOnlyPrisma<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof prop !== 'string') return value;
      if (CLIENT_REFUSED.has(prop)) return () => {
        throw new ReadOnlyRefusal(prop);
      };
      if (prop.startsWith('$') || value === null || typeof value !== 'object') return value;
      // A model delegate: its reads pass, its writes throw.
      return new Proxy(value as object, {
        get(model, method, r) {
          const fn = Reflect.get(model, method, r);
          if (typeof method === 'string' && WRITES.has(method)) return () => {
            throw new ReadOnlyRefusal(`${prop}.${method}`);
          };
          return typeof fn === 'function' ? fn.bind(model) : fn;
        },
      });
    },
  });
}

export type StrandedRepairCommand = { ok: true; json: boolean } | { ok: false; code: 2; message: string };

export function strandedRepairCommand(argv: readonly string[]): StrandedRepairCommand {
  const unknown = argv.filter((a) => a !== '--dry-run' && a !== '--json');
  if (unknown.length) return { ok: false, code: 2, message: `Unknown argument ${unknown[0]}. Usage: repair-stranded-drafts.ts --dry-run [--json]` };
  if (!argv.includes('--dry-run')) {
    return { ok: false, code: 2, message: 'Refused: this script only reads (--dry-run). It lists what the R11 proposal service would adopt; the adoption itself runs through that service (story/draft-from-fact.ts), from the seller\'s draft control or with explicit authorization. Nothing was read or written.' };
  }
  return { ok: true, json: argv.includes('--json') };
}

/** The database a run reads, said without credentials: the host and the database name only. */
export function databaseLabel(url: string | undefined): string {
  if (!url) return 'no DATABASE_URL';
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ''}${u.pathname}`;
  } catch {
    return 'an unparseable DATABASE_URL';
  }
}

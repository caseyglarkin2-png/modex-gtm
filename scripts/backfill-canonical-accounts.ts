import { runCanonicalBackfill } from '@/lib/revops/account-identity-backfill';

async function main() {
  const argNames = process.argv
    .slice(2)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const result = await runCanonicalBackfill({
    accountNames: argNames.length > 0 ? argNames : undefined,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});

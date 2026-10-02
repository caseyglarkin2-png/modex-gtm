/**
 * READ-ONLY dogfood of the person prior (gap/people/person-prior.ts) over a HubSpot contact export.
 * Usage: npx tsx scripts/gap/person-prior-dogfood.ts <export.json> [--rows]
 * The export is a JSON array of rows (header first) with "Company Name" and "Job Title" columns. Writes nothing
 * anywhere; prints lane / region counts, the false-positive patterns and the strongest primary titles.
 * Person geography is read from the TITLE only: the export's City / Country columns are the COMPANY's.
 */
import { readFileSync } from 'node:fs';
import { readPerson, LANE_LABEL, type PersonLane } from '../../src/lib/gap/people/person-prior';

const [file, flag] = process.argv.slice(2);
const rows = JSON.parse(readFileSync(file, 'utf8')) as Array<Array<string | null>>;
const head = rows[0];
const col = (name: string) => head.indexOf(name);
const company = col('Company Name');
const title = col('Job Title');
const data = rows.slice(1).map((r) => ({ company: String(r[company] ?? ''), title: String(r[title] ?? '') }));

const read = data.map((d) => ({ ...d, r: readPerson(d.title) }));
const REPORT: Record<PersonLane, string> = {
  PRIMARY_OPERATOR: 'PRIMARY OPERATOR',
  ADJACENT_OPERATOR: 'ADJACENT OPERATOR',
  FACILITY_OPERATOR: 'ADJACENT OPERATOR',
  EXECUTIVE_SPONSOR: 'ADJACENT OPERATOR',
  TRANSFORMATION_TECH: 'TRANSFORMATION / TECH',
  PROCUREMENT_COMMERCIAL: 'PROCUREMENT / COMMERCIAL',
  NON_OPERATING: 'NON-OPERATING FALSE POSITIVE',
  NEEDS_REVIEW: 'NEEDS REVIEW',
};
const count = <T,>(xs: T[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<T, number>());
const companies = count(data.map((d) => d.company));
const top = [...companies.entries()].sort((a, b) => b[1] - a[1])[0];
console.log(`contacts ${data.length} · companies ${companies.size} · largest ${top[0]} ${top[1]} (${Math.round((100 * top[1]) / data.length)}%)`);
for (const [scope, set] of [['ALL', read], [`WITHOUT ${top[0]}`, read.filter((x) => x.company !== top[0])], [`${top[0]} ONLY`, read.filter((x) => x.company === top[0])]] as const) {
  const lanes = count(set.map((x) => REPORT[x.r.lane]));
  const regions = count(set.map((x) => x.r.region));
  console.log(`\n${scope} (${set.length})`);
  for (const k of ['PRIMARY OPERATOR', 'ADJACENT OPERATOR', 'TRANSFORMATION / TECH', 'PROCUREMENT / COMMERCIAL', 'NON-OPERATING FALSE POSITIVE', 'NEEDS REVIEW']) console.log(`  ${k.padEnd(30)} ${lanes.get(k) ?? 0}`);
  console.log(`  US / NA confirmed ${regions.get('US_NA') ?? 0} · other region ${regions.get('OTHER_REGION') ?? 0} · location unknown ${regions.get('UNKNOWN') ?? 0}`);
}
const primaryUS = read.filter((x) => x.r.lane === 'PRIMARY_OPERATOR');
console.log(`\nprimary operators, US / NA stated: ${primaryUS.filter((x) => x.r.region === 'US_NA').length}; unknown: ${primaryUS.filter((x) => x.r.region === 'UNKNOWN').length}; other region: ${primaryUS.filter((x) => x.r.region === 'OTHER_REGION').length}`);
console.log('\nfalse positives of the bare word "transportation" (lane: why)');
for (const x of read.filter((x) => /transport/i.test(x.title) && !['PRIMARY_OPERATOR', 'ADJACENT_OPERATOR', 'FACILITY_OPERATOR'].includes(x.r.lane))) console.log(`  ${LANE_LABEL[x.r.lane]}: ${x.title}`);
if (flag === '--rows') {
  console.log('\nrows');
  for (const x of read) console.log(`  ${REPORT[x.r.lane].padEnd(28)} ${x.r.region.padEnd(12)} ${x.r.scope.padEnd(8)} ${x.company} | ${x.title}`);
}

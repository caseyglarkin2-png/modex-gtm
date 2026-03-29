#!/usr/bin/env node
/**
 * check-force-dynamic.js
 *
 * Fails the build if any page.tsx calls DB functions without force-dynamic.
 * Run via: node scripts/check-force-dynamic.js
 * Added to package.json lint step.
 */

const fs = require('fs');
const path = require('path');

const DB_PATTERNS = [/dbGet\w+\(/, /prisma\.\w+\.find/, /prisma\.\w+\.create/, /prisma\.\w+\.update/];
const FORCE_DYNAMIC = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/;

// Walk src/app recursively for page.tsx files
function findPages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findPages(full));
    else if (entry.name === 'page.tsx') results.push(full);
  }
  return results;
}

const appDir = path.join(__dirname, '..', 'src', 'app');
const pages = findPages(appDir);

let failures = 0;

for (const absPath of pages) {
  const content = fs.readFileSync(absPath, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), absPath);

  const hasDbCall = DB_PATTERNS.some((p) => p.test(content));
  if (!hasDbCall) continue;

  const hasForceDynamic = FORCE_DYNAMIC.test(content);
  if (!hasForceDynamic) {
    console.error(`[FAIL] Missing force-dynamic in DB page: ${rel}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} page(s) call the DB without force-dynamic. Railway build WILL fail.`);
  console.error("Fix: add \"export const dynamic = 'force-dynamic';\" near the top of each failing page.\n");
  process.exit(1);
} else {
  const dbPages = pages.filter(p => {
    const c = fs.readFileSync(p, 'utf8');
    return DB_PATTERNS.some(pat => pat.test(c));
  });
  console.log(`[OK] All ${dbPages.length} DB pages have force-dynamic.`);
}

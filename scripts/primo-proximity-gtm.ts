/**
 * Primo Brands Proximity GTM Builder
 *
 * Reads all yard-audit roster.json files + Primo site locations,
 * computes distances, and outputs a ranked proximity campaign workbook.
 */

import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';

// ── Primo Brands sites with known coordinates ──────────────────────────
// Geocoded from public factory addresses (Primo Brands / BlueTriton / Nestle Waters NA)
const PRIMO_SITES: PrimoSite[] = [
  { name: "US PL Ontario Factory", city: "Ontario", state: "CA", lat: 34.0365, lng: -117.5931, solutions: ["Driver Journey"] },
  { name: "US PL Hot Springs Factory", city: "Hot Springs", state: "AR", lat: 34.6332, lng: -93.0672, solutions: ["Driver Journey", "YMS"] },
  { name: "US DC Hot Springs (WHSE)", city: "Hot Springs", state: "AR", lat: 34.5037, lng: -93.0552, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL Allentown Factory", city: "Breinigsville", state: "PA", lat: 40.5333, lng: -75.6333, solutions: ["Driver Journey", "RTLS", "Machine Vision Gate"] },
  { name: "US PL Cabazon Factory", city: "Cabazon", state: "CA", lat: 33.9164, lng: -116.7873, solutions: ["Driver Journey"] },
  { name: "US PL Hawkins Factory", city: "Hawkins", state: "TX", lat: 32.5690, lng: -95.2150, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL Hollis Factory", city: "Hollis", state: "ME", lat: 43.5950, lng: -70.6450, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL Madison Factory", city: "Madison", state: "WI", lat: 43.0558, lng: -89.3268, solutions: ["Driver Journey"] },
  { name: "US PL Mecosta Factory", city: "Stanwood", state: "MI", lat: 43.5803, lng: -85.2097, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL Poland Spring Factory", city: "Poland Spring", state: "ME", lat: 44.0558, lng: -70.3475, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL S Houston Factory", city: "Houston", state: "TX", lat: 29.6650, lng: -95.3850, solutions: ["Driver Journey"] },
  { name: "US PL Zephyrhills Factory", city: "Zephyrhills", state: "FL", lat: 28.2461, lng: -82.1811, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL Allentown NPL Factory", city: "Breinigsville", state: "PA", lat: 40.5280, lng: -75.6350, solutions: ["Driver Journey"] },
  { name: "US PL Dallas 2 Factory", city: "Dallas", state: "TX", lat: 32.6949, lng: -96.9470, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL Kingfield Factory", city: "Kingfield", state: "ME", lat: 44.9580, lng: -70.1530, solutions: ["Driver Journey"] },
  { name: "US PL Denver Factory", city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, solutions: ["Driver Journey"] },
  { name: "US PL Greenwood Indiana", city: "Greenwood", state: "IN", lat: 39.5945, lng: -86.1167, solutions: ["Driver Journey"] },
  { name: "US PL McBee Factory", city: "McBee", state: "SC", lat: 34.4700, lng: -80.2586, solutions: ["Driver Journey"] },
  { name: "US PL Sacramento Factory", city: "Sacramento", state: "CA", lat: 38.5158, lng: -121.3809, solutions: ["Driver Journey"] },
  { name: "US PL Pasadena Factory", city: "Pasadena", state: "TX", lat: 29.5605, lng: -95.1167, solutions: ["Driver Journey", "YMS"] },
  { name: "US PL High Springs Factory", city: "High Springs", state: "FL", lat: 29.8283, lng: -82.5967, solutions: ["Driver Journey"] },
  { name: "US PL Saratoga Spring Factory", city: "Saratoga Springs", state: "NY", lat: 43.0710, lng: -73.7846, solutions: ["Driver Journey"] },
  { name: "US PL Hot Springs 2 Factory", city: "Hot Springs", state: "AR", lat: 34.6100, lng: -93.0500, solutions: ["Driver Journey", "YMS"] },
  { name: "US DC NFI - Breinigsville", city: "Breinigsville", state: "PA", lat: 40.5340, lng: -75.6290, solutions: ["Driver Journey"] },
];

interface PrimoSite {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  solutions: string[];
}

interface Facility {
  account: string;
  accountSlug: string;
  idx: number;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  type?: string;
}

interface ProximityMatch {
  facility: Facility;
  primoSite: PrimoSite;
  distanceMiles: number;
}

interface AccountProximity {
  slug: string;
  account: string;
  totalFacilities: number;
  nearbyFacilities: ProximityMatch[];
  closestDistance: number;
  uniquePrimoSites: string[];
  uniqueRegions: string[];
  solutionsNearby: string[];
  tier: 1 | 2 | 3;
}

function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PROXIMITY_RADIUS_MILES = 50;

async function main() {
  const auditDir = path.resolve(__dirname, '../output/yard-audits');
  const slugs = fs.readdirSync(auditDir).filter(f => {
    const stat = fs.statSync(path.join(auditDir, f));
    return stat.isDirectory() && fs.existsSync(path.join(auditDir, f, 'roster.json'));
  });

  console.log(`Loading rosters for ${slugs.length} accounts...`);

  // Load all facilities
  const allFacilities: Facility[] = [];
  for (const slug of slugs) {
    const roster = JSON.parse(fs.readFileSync(path.join(auditDir, slug, 'roster.json'), 'utf-8'));
    for (const f of roster.facilities) {
      if (f.lat && f.lng) {
        allFacilities.push({
          account: roster.account,
          accountSlug: slug,
          idx: f.idx,
          name: f.name,
          city: f.city || '',
          state: f.state || '',
          lat: f.lat,
          lng: f.lng,
          type: f.type || '',
        });
      }
    }
  }
  console.log(`Loaded ${allFacilities.length} geocoded facilities across ${slugs.length} accounts.`);

  // Find proximity matches
  const matchesByAccount = new Map<string, ProximityMatch[]>();

  for (const fac of allFacilities) {
    for (const primo of PRIMO_SITES) {
      const dist = haversineDistanceMiles(fac.lat, fac.lng, primo.lat, primo.lng);
      if (dist <= PROXIMITY_RADIUS_MILES) {
        if (!matchesByAccount.has(fac.accountSlug)) {
          matchesByAccount.set(fac.accountSlug, []);
        }
        matchesByAccount.get(fac.accountSlug)!.push({
          facility: fac,
          primoSite: primo,
          distanceMiles: Math.round(dist * 10) / 10,
        });
      }
    }
  }

  // Build account proximity profiles
  const accountProximities: AccountProximity[] = [];

  for (const [slug, matches] of matchesByAccount) {
    // Deduplicate: keep only closest Primo site per facility
    const bestMatchPerFacility = new Map<number, ProximityMatch>();
    for (const m of matches) {
      const existing = bestMatchPerFacility.get(m.facility.idx);
      if (!existing || m.distanceMiles < existing.distanceMiles) {
        bestMatchPerFacility.set(m.facility.idx, m);
      }
    }

    const uniqueMatches = Array.from(bestMatchPerFacility.values());
    const uniquePrimoSites = [...new Set(matches.map(m => m.primoSite.name))];
    const uniqueRegions = [...new Set(matches.map(m => `${m.primoSite.city}, ${m.primoSite.state}`))];
    const solutionsNearby = [...new Set(matches.flatMap(m => m.primoSite.solutions))];
    const closestDistance = Math.min(...uniqueMatches.map(m => m.distanceMiles));

    const rosterPath = path.join(auditDir, slug, 'roster.json');
    const totalFacilities = JSON.parse(fs.readFileSync(rosterPath, 'utf-8')).facilities.length;

    // Tier logic
    let tier: 1 | 2 | 3;
    if (uniqueMatches.length >= 3 || (uniqueMatches.length >= 2 && closestDistance < 10)) {
      tier = 1;
    } else if (closestDistance < 15 || uniqueMatches.length >= 2) {
      tier = 2;
    } else {
      tier = 3;
    }

    accountProximities.push({
      slug,
      account: uniqueMatches[0].facility.account,
      totalFacilities,
      nearbyFacilities: uniqueMatches.sort((a, b) => a.distanceMiles - b.distanceMiles),
      closestDistance,
      uniquePrimoSites,
      uniqueRegions,
      solutionsNearby,
      tier,
    });
  }

  // Sort by tier, then by closest distance
  accountProximities.sort((a, b) => a.tier - b.tier || a.closestDistance - b.closestDistance);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PRIMO BRANDS PROXIMITY GTM — ${accountProximities.length} accounts within ${PROXIMITY_RADIUS_MILES} mi`);
  console.log(`${'='.repeat(80)}\n`);

  for (const ap of accountProximities) {
    console.log(`\n[${'★'.repeat(4 - ap.tier)}${'☆'.repeat(ap.tier - 1)}] TIER ${ap.tier} — ${ap.account} (${ap.slug})`);
    console.log(`  ${ap.nearbyFacilities.length} of ${ap.totalFacilities} facilities near Primo sites`);
    console.log(`  Closest: ${ap.closestDistance} mi`);
    console.log(`  Primo neighbors: ${ap.uniqueRegions.join('; ')}`);
    console.log(`  Solutions nearby: ${ap.solutionsNearby.join(', ')}`);
    for (const m of ap.nearbyFacilities.slice(0, 5)) {
      console.log(`    → ${m.facility.name} ↔ ${m.primoSite.name} (${m.distanceMiles} mi)`);
    }
    if (ap.nearbyFacilities.length > 5) {
      console.log(`    ... and ${ap.nearbyFacilities.length - 5} more`);
    }
  }

  // ── Build Excel workbook ───────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FreightRoll GTM Engine';

  // Tab 1: Campaign Overview
  const overviewSheet = wb.addWorksheet('Campaign Overview');
  overviewSheet.columns = [
    { header: 'Tier', key: 'tier', width: 6 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Total Facilities', key: 'totalFacilities', width: 14 },
    { header: 'Near Primo', key: 'nearPrimo', width: 11 },
    { header: 'Closest (mi)', key: 'closestMi', width: 12 },
    { header: 'Primo Regions', key: 'primoRegions', width: 40 },
    { header: 'Solutions Nearby', key: 'solutions', width: 35 },
    { header: 'Email Hook', key: 'hook', width: 60 },
  ];

  // Style header
  overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  overviewSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

  for (const ap of accountProximities) {
    const closestMatch = ap.nearbyFacilities[0];
    const hook = buildEmailHook(ap, closestMatch);
    const row = overviewSheet.addRow({
      tier: ap.tier,
      account: ap.account,
      totalFacilities: ap.totalFacilities,
      nearPrimo: ap.nearbyFacilities.length,
      closestMi: ap.closestDistance,
      primoRegions: ap.uniqueRegions.join('; '),
      solutions: ap.solutionsNearby.join(', '),
      hook,
    });

    // Color-code tiers
    const tierColors: Record<number, string> = { 1: 'FF27ae60', 2: 'FFf39c12', 3: 'FFe74c3c' };
    row.getCell('tier').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tierColors[ap.tier] } };
    row.getCell('tier').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  }

  // Tab 2: All Proximity Matches (detail)
  const detailSheet = wb.addWorksheet('Proximity Matches');
  detailSheet.columns = [
    { header: 'Tier', key: 'tier', width: 6 },
    { header: 'Account', key: 'account', width: 28 },
    { header: 'Your Facility', key: 'facility', width: 45 },
    { header: 'City', key: 'city', width: 18 },
    { header: 'State', key: 'state', width: 6 },
    { header: 'Primo Site', key: 'primoSite', width: 35 },
    { header: 'Primo City', key: 'primoCity', width: 18 },
    { header: 'Distance (mi)', key: 'distance', width: 13 },
    { header: 'Primo Solutions', key: 'solutions', width: 35 },
    { header: 'Lat', key: 'lat', width: 10 },
    { header: 'Lng', key: 'lng', width: 10 },
  ];

  detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

  for (const ap of accountProximities) {
    for (const m of ap.nearbyFacilities) {
      detailSheet.addRow({
        tier: ap.tier,
        account: ap.account,
        facility: m.facility.name,
        city: m.facility.city,
        state: m.facility.state,
        primoSite: m.primoSite.name,
        primoCity: `${m.primoSite.city}, ${m.primoSite.state}`,
        distance: m.distanceMiles,
        solutions: m.primoSite.solutions.join(', '),
        lat: m.facility.lat,
        lng: m.facility.lng,
      });
    }
  }

  // Tab 3: Primo Sites Reference
  const primoSheet = wb.addWorksheet('Primo Sites');
  primoSheet.columns = [
    { header: 'Site Name', key: 'name', width: 35 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'State', key: 'state', width: 6 },
    { header: 'Driver Journey', key: 'dj', width: 14 },
    { header: 'YMS', key: 'yms', width: 6 },
    { header: 'RTLS', key: 'rtls', width: 6 },
    { header: 'Machine Vision Gate', key: 'mvg', width: 18 },
    { header: 'Neighbor Count', key: 'neighbors', width: 14 },
    { header: 'Lat', key: 'lat', width: 10 },
    { header: 'Lng', key: 'lng', width: 10 },
  ];

  primoSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  primoSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

  for (const ps of PRIMO_SITES) {
    const neighborCount = allFacilities.filter(f =>
      haversineDistanceMiles(f.lat, f.lng, ps.lat, ps.lng) <= PROXIMITY_RADIUS_MILES
    ).length;

    primoSheet.addRow({
      name: ps.name,
      city: ps.city,
      state: ps.state,
      dj: ps.solutions.includes('Driver Journey') ? '✓' : '',
      yms: ps.solutions.includes('YMS') ? '✓' : '',
      rtls: ps.solutions.includes('RTLS') ? '✓' : '',
      mvg: ps.solutions.includes('Machine Vision Gate') ? '✓' : '',
      neighbors: neighborCount,
      lat: ps.lat,
      lng: ps.lng,
    });
  }

  // Tab 4: Outreach Playbook
  const playbookSheet = wb.addWorksheet('Outreach Playbook');
  playbookSheet.columns = [
    { header: 'Tier', key: 'tier', width: 6 },
    { header: 'Account', key: 'account', width: 28 },
    { header: 'Subject Line', key: 'subject', width: 50 },
    { header: 'Opening Hook', key: 'hook', width: 80 },
    { header: 'Proof Point', key: 'proof', width: 70 },
    { header: 'CTA', key: 'cta', width: 50 },
    { header: 'PS Line', key: 'ps', width: 70 },
  ];

  playbookSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  playbookSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

  for (const ap of accountProximities) {
    const closest = ap.nearbyFacilities[0];
    playbookSheet.addRow({
      tier: ap.tier,
      account: ap.account,
      subject: buildSubjectLine(ap, closest),
      hook: buildEmailHook(ap, closest),
      proof: "Primo is ripping out PINC and rolling FreightRoll out to all 260 sites — sites with our solutions ship significantly more product.",
      cta: ap.tier === 1
        ? `Our CTO will be onsite at the ${closest.primoSite.city} Primo plant in a couple weeks. Happy to send him with extra cameras for a pilot at your ${closest.facility.city} site.`
        : `Quick call to show you what we're doing next door at the Primo plant in ${closest.primoSite.city}?`,
      ps: `P.S. ${buildPSLine(ap)}`,
    });
  }

  // Tab 5: Campaign Waves
  const wavesSheet = wb.addWorksheet('Campaign Waves');
  wavesSheet.columns = [
    { header: 'Wave', key: 'wave', width: 8 },
    { header: 'Tier', key: 'tier', width: 6 },
    { header: 'Account', key: 'account', width: 28 },
    { header: 'Channel', key: 'channel', width: 12 },
    { header: 'Persona Target', key: 'persona', width: 30 },
    { header: 'Send Window', key: 'window', width: 18 },
    { header: 'Follow-up 1', key: 'fu1', width: 14 },
    { header: 'Follow-up 2', key: 'fu2', width: 14 },
    { header: 'Escalation', key: 'escalation', width: 30 },
  ];

  wavesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wavesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

  let waveNum = 1;
  for (const ap of accountProximities) {
    wavesSheet.addRow({
      wave: waveNum,
      tier: ap.tier,
      account: ap.account,
      channel: 'Email',
      persona: 'VP/Dir Supply Chain + Dir Operations',
      window: ap.tier === 1 ? 'Week 1' : ap.tier === 2 ? 'Week 2' : 'Week 3',
      fu1: '+3 days',
      fu2: '+7 days',
      escalation: ap.tier === 1 ? 'LinkedIn DM + phone if no reply by day 5' : 'LinkedIn DM if no reply by day 7',
    });
    if (ap.tier === 1) {
      wavesSheet.addRow({
        wave: waveNum,
        tier: ap.tier,
        account: ap.account,
        channel: 'LinkedIn',
        persona: 'Site Ops Manager at nearest facility',
        window: 'Week 1 + 1 day',
        fu1: '+5 days',
        fu2: '',
        escalation: 'Reference email sent to their VP',
      });
    }
    waveNum++;
  }

  const outPath = path.resolve(__dirname, '../output/Primo-Proximity-GTM-Campaign.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`\nWorkbook saved: ${outPath}`);

  // Also save JSON for downstream use
  const jsonPath = path.resolve(__dirname, '../output/primo-proximity-matches.json');
  fs.writeFileSync(jsonPath, JSON.stringify(accountProximities, null, 2));
  console.log(`JSON saved: ${jsonPath}`);
}

function buildSubjectLine(ap: AccountProximity, match: ProximityMatch): string {
  if (match.distanceMiles < 5) {
    return `Your ${match.facility.city} neighbor is shipping more`;
  }
  if (ap.tier === 1) {
    return `${ap.nearbyFacilities.length} of your sites neighbor Primo's`;
  }
  return `What your ${match.primoSite.city} neighbor just rolled out`;
}

function buildEmailHook(ap: AccountProximity, match: ProximityMatch): string {
  const dist = match.distanceMiles < 5 ? 'next door to' : `${match.distanceMiles} miles from`;
  const solutionStr = match.primoSite.solutions.length > 1
    ? match.primoSite.solutions.slice(0, -1).join(', ') + ' and ' + match.primoSite.solutions.at(-1)
    : match.primoSite.solutions[0];
  return `Just found out we have ${solutionStr} running at the Primo Brands plant ${dist} your ${match.facility.name.split(' - ')[0]} in ${match.facility.city}.`;
}

function buildPSLine(ap: AccountProximity): string {
  if (ap.solutionsNearby.includes('Machine Vision Gate')) {
    return "Primo's machine-vision gate check-in cut their avg check-in from 12 min to under 90 seconds. Sites with FreightRoll ship significantly more product than those without.";
  }
  if (ap.solutionsNearby.includes('YMS')) {
    return "Primo is ripping out PINC and rolling us out to all 260 sites because the ones with our YMS ship significantly more water than the ones without.";
  }
  return "Primo is rolling FreightRoll out to 260 sites — the ones with our solutions ship significantly more product than the ones without.";
}

main().catch(console.error);

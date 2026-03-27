import { PrismaClient } from '@prisma/client';
import accountsData from '../src/lib/data/accounts.json';
import personasData from '../src/lib/data/personas.json';
import outreachWavesData from '../src/lib/data/outreach-waves.json';
import meetingBriefsData from '../src/lib/data/meeting-briefs.json';
import auditRoutesData from '../src/lib/data/audit-routes.json';
import qrAssetsData from '../src/lib/data/qr-assets.json';
import activitiesData from '../src/lib/data/activities.json';
import meetingsData from '../src/lib/data/meetings.json';
import mobileCapturesData from '../src/lib/data/mobile-captures.json';
import actionableIntelData from '../src/lib/data/actionable-intel.json';
import searchStringsData from '../src/lib/data/search-strings.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Accounts
  for (const a of accountsData) {
    await prisma.account.upsert({
      where: { name: a.name },
      update: {},
      create: {
        name: a.name,
        parent_brand: a.parent_brand,
        vertical: a.vertical,
        signal_type: a.signal_type,
        why_now: a.why_now,
        primo_angle: a.primo_angle,
        best_intro_path: a.best_intro_path,
        source: a.source,
        source_url_1: a.source_url_1 ?? null,
        source_url_2: a.source_url_2 ?? null,
        icp_fit: a.icp_fit,
        modex_signal: a.modex_signal,
        primo_story_fit: a.primo_story_fit,
        warm_intro: a.warm_intro,
        strategic_value: a.strategic_value,
        meeting_ease: a.meeting_ease,
        priority_score: a.priority_score,
        priority_band: a.priority_band,
        tier: a.tier,
        rank: a.rank,
        owner: a.owner,
        research_status: a.research_status,
        outreach_status: a.outreach_status,
        meeting_status: a.meeting_status,
        current_motion: a.current_motion,
        next_action: a.next_action,
        due_date: a.due_date ?? null,
        notes: a.notes ?? null,
      },
    });
  }
  console.log(`  ✓ ${accountsData.length} accounts`);

  // Personas
  for (const p of personasData) {
    await prisma.persona.upsert({
      where: { persona_id: p.persona_id },
      update: {},
      create: {
        persona_id: p.persona_id,
        account_name: p.account,
        name: p.name,
        title: p.title,
        priority: p.priority,
        persona_lane: p.persona_lane,
        role_in_deal: p.role_in_deal,
        intro_route: p.intro_route,
        function: p.function,
        seniority: p.seniority,
        why_this_persona: p.why_this_persona,
        linkedin_url: p.linkedin_url ?? null,
        attendance_signal: p.attendance_signal,
        intro_path: p.intro_path,
        persona_status: p.persona_status,
        next_step: p.next_step ?? null,
        notes: p.notes ?? null,
        account_score: p.account_score,
        email: (p as Record<string, unknown>).email as string ?? null,
        phone: (p as Record<string, unknown>).phone as string ?? null,
      },
    });
  }
  console.log(`  ✓ ${personasData.length} personas`);

  // Outreach Waves
  for (const w of outreachWavesData) {
    await prisma.outreachWave.create({
      data: {
        wave: w.wave,
        wave_order: w.wave_order,
        account_name: w.account,
        rank: w.rank,
        tier: w.tier,
        priority_score: w.priority_score,
        channel_mix: w.channel_mix,
        primary_objective: w.primary_objective,
        use_warm_intro: w.use_warm_intro,
        use_primo_asset: w.use_primo_asset,
        primary_persona_lane: w.primary_persona_lane,
        secondary_persona_lane: w.secondary_persona_lane,
        start_date: w.start_date ? new Date(w.start_date) : null,
        followup_1: w.follow_up_1 ? new Date(w.follow_up_1) : null,
        followup_2: w.follow_up_2 ? new Date(w.follow_up_2) : null,
        escalation_trigger: w.escalation_trigger,
        meeting_goal: w.meeting_goal,
        owner: w.owner,
        status: w.status,
        notes: w.notes ?? null,
      },
    });
  }
  console.log(`  ✓ ${outreachWavesData.length} outreach waves`);

  // Meeting Briefs
  for (const b of meetingBriefsData) {
    await prisma.meetingBrief.upsert({
      where: { account_name: b.account },
      update: {},
      create: {
        account_name: b.account,
        vertical: b.vertical,
        modex_signal: b.public_modex_signal,
        why_this_account: b.why_this_account,
        why_now: b.why_now,
        likely_pain: b.likely_pain_points,
        primo_relevance: b.primo_relevance,
        best_outcome: b.best_first_meeting_outcome,
        suggested_attendees: b.suggested_attendees,
        prep_assets: b.prep_assets_needed,
        open_questions: b.open_questions,
        source_url_1: b.source_url_1 ?? null,
        source_url_2: b.source_url_2 ?? null,
      },
    });
  }
  console.log(`  ✓ ${meetingBriefsData.length} meeting briefs`);

  // Audit Routes
  let auditCount = 0;
  for (const r of auditRoutesData) {
    try {
      await prisma.auditRoute.upsert({
        where: { account_name: r.account },
        update: {},
        create: {
          rank: r.rank,
          account_name: r.account,
          audit_url: r.audit_url,
          suggested_ask: r.suggested_message,
          fast_ask: r.fast_ask,
          proof_asset: r.proof_asset,
          warm_route: r.warm_route ?? null,
          graphic_file: r.graphic_file ?? null,
          owner: r.owner,
          status: r.status,
          last_touch: r.last_touch ?? null,
        },
      });
      auditCount++;
    } catch { /* skip FK mismatch */ }
  }
  console.log(`  ✓ ${auditCount}/${auditRoutesData.length} audit routes`);

  // QR Assets
  let qrCount = 0;
  for (const q of qrAssetsData) {
    try {
      await prisma.qrAsset.upsert({
        where: { account_name: q.account },
        update: {},
        create: {
          account_name: q.account,
          audit_url: q.audit_url,
          suggested_use: q.suggested_use,
          proof_asset: q.proof_asset,
          graphic_file: q.graphic_file ?? null,
          notes: q.notes ?? null,
        },
      });
      qrCount++;
    } catch { /* skip FK mismatch */ }
  }
  console.log(`  ✓ ${qrCount}/${qrAssetsData.length} QR assets`);

  // Activities
  let actCount = 0;
  for (const a of activitiesData) {
    try {
      await prisma.activity.create({
        data: {
          activity_date: a.activity_date ? new Date(a.activity_date) : null,
          account_name: a.account,
          persona: a.persona ?? null,
          activity_type: a.activity_type,
          owner: a.owner,
          outcome: a.outcome ?? null,
          next_step: a.next_step ?? null,
          next_step_due: a.next_step_due ? new Date(a.next_step_due) : null,
          notes: a.notes ?? null,
        },
      });
      actCount++;
    } catch { /* skip FK or date issues */ }
  }
  console.log(`  ✓ ${actCount}/${activitiesData.length} activities`);

  // Actionable Intel
  let intelCount = 0;
  for (const item of actionableIntelData) {
    try {
      await prisma.actionableIntel.create({
        data: {
          account: item.account,
          intel_type: item.intel_type,
          why_it_matters: item.why_it_matters,
          how_to_find: item.how_to_find_it,
          owner: item.owner,
          status: item.status,
          field_to_update: item.field_to_update,
        },
      });
      intelCount++;
    } catch { /* skip */ }
  }
  console.log(`  ✓ ${intelCount}/${actionableIntelData.length} actionable intel items`);

  // Search Strings
  let searchCount = 0;
  for (const s of searchStringsData) {
    try {
      await prisma.searchString.create({
        data: {
          account: s.account,
          wave: s.wave,
          priority: s.priority,
          function: s.function,
          target_title: s.target_title,
          named_seed: s.named_seed ?? null,
          sales_nav_query: s.sales_nav_query,
          linkedin_query: s.linkedin_query,
          google_xray_query: s.google_xray_query,
          keywords: s.keywords ?? null,
          source_signal: s.source_signal ?? null,
          owner: s.owner,
          status: s.status,
        },
      });
      searchCount++;
    } catch { /* skip */ }
  }
  console.log(`  ✓ ${searchCount}/${searchStringsData.length} search strings`);

  // Meetings
  let meetingCount = 0;
  for (const m of meetingsData as Array<Record<string, unknown>>) {
    try {
      await prisma.meeting.create({
        data: {
          account_name: m.account as string,
          persona: (m.attendees as string) ?? null,
          meeting_status: (m.status as string) ?? 'No meeting',
          meeting_date: m.date ? new Date(m.date as string) : null,
          notes: (m.notes as string) ?? null,
          owner: 'Jake',
        },
      });
      meetingCount++;
    } catch { /* skip FK or date issues */ }
  }
  console.log(`  ✓ ${meetingCount}/${meetingsData.length} meetings`);

  // Mobile Captures
  let captureCount = 0;
  for (const c of mobileCapturesData as Array<Record<string, unknown>>) {
    try {
      await prisma.mobileCapture.create({
        data: {
          account_name: c.account as string,
          persona_name: (c.contact as string) ?? null,
          notes: (c.notes as string) ?? null,
          interest: (c.interest as number) ?? 0,
          urgency: (c.urgency as number) ?? 0,
          influence: (c.influence as number) ?? 0,
          fit: (c.fit as number) ?? 0,
          heat_score: (c.heat_score as number) ?? 0,
          due_date: c.due_date ? new Date(c.due_date as string) : null,
          followup_status: (c.status as string) ?? 'Open',
        },
      });
      captureCount++;
    } catch { /* skip FK or date issues */ }
  }
  console.log(`  ✓ ${captureCount}/${mobileCapturesData.length} mobile captures`);

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

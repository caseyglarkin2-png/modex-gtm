import { PrismaClient } from '@prisma/client';
import accountsData from '../src/lib/data/accounts.json';
import personasData from '../src/lib/data/personas.json';
import outreachWavesData from '../src/lib/data/outreach-waves.json';
import meetingBriefsData from '../src/lib/data/meeting-briefs.json';
import auditRoutesData from '../src/lib/data/audit-routes.json';
import qrAssetsData from '../src/lib/data/qr-assets.json';
import activitiesData from '../src/lib/data/activities.json';
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
        parentBrand: a.parent_brand,
        vertical: a.vertical,
        signalType: a.signal_type,
        whyNow: a.why_now,
        primoAngle: a.primo_angle,
        bestIntroPath: a.best_intro_path,
        source: a.source,
        sourceUrl1: a.source_url_1 ?? null,
        sourceUrl2: a.source_url_2 ?? null,
        icpFit: a.icp_fit,
        modexSignal: a.modex_signal,
        primoStoryFit: a.primo_story_fit,
        warmIntro: a.warm_intro,
        strategicValue: a.strategic_value,
        meetingEase: a.meeting_ease,
        priorityScore: a.priority_score,
        priorityBand: a.priority_band,
        tier: a.tier,
        rank: a.rank,
        owner: a.owner,
        researchStatus: a.research_status,
        outreachStatus: a.outreach_status,
        meetingStatus: a.meeting_status,
        currentMotion: a.current_motion,
        nextAction: a.next_action,
        dueDate: a.due_date ?? null,
        notes: a.notes ?? null,
      },
    });
  }
  console.log(`  ✓ ${accountsData.length} accounts`);

  // Personas
  for (const p of personasData) {
    await prisma.persona.upsert({
      where: { personaId: p.persona_id },
      update: {},
      create: {
        personaId: p.persona_id,
        account: p.account,
        name: p.name,
        title: p.title,
        priority: p.priority,
        personaLane: p.persona_lane,
        roleInDeal: p.role_in_deal,
        seniority: p.seniority,
        linkedinUrl: p.linkedin_url ?? null,
        email: p.email ?? null,
        phone: p.phone ?? null,
        personaStatus: p.persona_status,
        nextStep: p.next_step ?? null,
        nextStepDue: p.next_step_due ?? null,
        wave: p.wave,
        source: p.source,
        warmPath: p.warm_path ?? null,
        namedSeed: p.named_seed ?? null,
        owner: p.owner,
        notes: p.notes ?? null,
      },
    });
  }
  console.log(`  ✓ ${personasData.length} personas`);

  // Outreach Waves
  for (const w of outreachWavesData) {
    await prisma.outreachWave.create({
      data: {
        wave: w.wave,
        waveOrder: w.wave_order,
        account: w.account,
        rank: w.rank,
        tier: w.tier,
        priorityScore: w.priority_score,
        channelMix: w.channel_mix,
        primaryObjective: w.primary_objective,
        useWarmIntro: w.use_warm_intro,
        usePrimoAsset: w.use_primo_asset,
        primaryPersonaLane: w.primary_persona_lane,
        secondaryPersonaLane: w.secondary_persona_lane,
        startDate: w.start_date,
        followUp1: w.follow_up_1,
        followUp2: w.follow_up_2,
        escalationTrigger: w.escalation_trigger,
        meetingGoal: w.meeting_goal,
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
      where: { account: b.account },
      update: {},
      create: {
        account: b.account,
        vertical: b.vertical,
        publicModexSignal: b.public_modex_signal,
        whyThisAccount: b.why_this_account,
        whyNow: b.why_now,
        likelyPain: b.likely_pain_points,
        primoRelevance: b.primo_relevance,
        bestOutcome: b.best_first_meeting_outcome,
        suggestedAttendees: b.suggested_attendees,
        prepAssets: b.prep_assets_needed,
        openQuestions: b.open_questions,
        sourceUrl1: b.source_url_1 ?? null,
        sourceUrl2: b.source_url_2 ?? null,
      },
    });
  }
  console.log(`  ✓ ${meetingBriefsData.length} meeting briefs`);

  // Audit Routes
  for (const r of auditRoutesData) {
    await prisma.auditRoute.create({
      data: {
        rank: r.rank,
        account: r.account,
        auditUrl: r.audit_url,
        suggestedMessage: r.suggested_message,
        fastAsk: r.fast_ask,
        proofAsset: r.proof_asset,
        warmRoute: r.warm_route ?? null,
        graphicFile: r.graphic_file ?? null,
        owner: r.owner,
        status: r.status,
        lastTouch: r.last_touch ?? null,
      },
    });
  }
  console.log(`  ✓ ${auditRoutesData.length} audit routes`);

  // QR Assets
  for (const q of qrAssetsData) {
    await prisma.qrAsset.create({
      data: {
        account: q.account,
        auditUrl: q.audit_url,
        suggestedUse: q.suggested_use,
        proofAsset: q.proof_asset,
        graphicFile: q.graphic_file ?? null,
        notes: q.notes ?? null,
      },
    });
  }
  console.log(`  ✓ ${qrAssetsData.length} QR assets`);

  // Activities
  for (const a of activitiesData) {
    await prisma.activity.create({
      data: {
        activityDate: a.activity_date,
        account: a.account,
        persona: a.persona ?? null,
        activityType: a.activity_type,
        owner: a.owner,
        outcome: a.outcome ?? null,
        nextStep: a.next_step ?? null,
        nextStepDue: a.next_step_due ?? null,
        notes: a.notes ?? null,
      },
    });
  }
  console.log(`  ✓ ${activitiesData.length} activities`);

  // Actionable Intel
  for (const item of actionableIntelData) {
    await prisma.actionableIntel.create({
      data: {
        account: item.account,
        intelType: item.intel_type,
        whyItMatters: item.why_it_matters,
        howToFindIt: item.how_to_find_it,
        owner: item.owner,
        status: item.status,
        fieldToUpdate: item.field_to_update,
      },
    });
  }
  console.log(`  ✓ ${actionableIntelData.length} actionable intel items`);

  // Search Strings
  for (const s of searchStringsData) {
    await prisma.searchString.create({
      data: {
        account: s.account,
        wave: s.wave,
        priority: s.priority,
        functionArea: s.function,
        targetTitle: s.target_title,
        namedSeed: s.named_seed ?? null,
        salesNavQuery: s.sales_nav_query,
        linkedinQuery: s.linkedin_query,
        googleXrayQuery: s.google_xray_query,
        keywords: s.keywords ?? null,
        sourceSignal: s.source_signal ?? null,
        owner: s.owner,
        status: s.status,
      },
    });
  }
  console.log(`  ✓ ${searchStringsData.length} search strings`);

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

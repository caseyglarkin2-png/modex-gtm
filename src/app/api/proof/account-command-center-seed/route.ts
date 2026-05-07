import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ACCOUNT_PAGE_SEND_ACCOUNTS,
  buildAccountPageSendFixture,
  buildSeededAccountContentContext,
} from '@/lib/proof/account-command-center-fixture';

export const dynamic = 'force-dynamic';

const DEFAULT_SECRET = 'local-e2e-seed';

function readTrimmedEnv(name: string) {
  return process.env[name]?.trim();
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function ensureSeedAccess(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && readTrimmedEnv('ALLOW_PROOF_SEED_IN_PRODUCTION') !== '1') return false;
  const expected = readTrimmedEnv('E2E_SEED_SECRET') ?? DEFAULT_SECRET;
  const header = req.headers.get('x-e2e-seed-secret')?.trim();
  return header === expected;
}

function onePagerContent(accountName: string) {
  return JSON.stringify({
    headline: `Deterministic send proof for ${accountName}`,
    subheadline: `Seeded account-page outreach proof content for ${accountName}`,
    painPoints: [
      'Duplicate local account names split operators from contacts.',
      'Malformed contacts should not block the full send.',
    ],
    solutionSteps: [
      { step: 1, title: 'Canonical scope', description: 'Resolve the account across local aliases before loading contacts or content.' },
      { step: 2, title: 'Recipient filtering', description: 'Skip malformed or suppressed recipients instead of failing the whole request.' },
      { step: 3, title: 'Operator visibility', description: 'Show actionable skip reasons directly in the send UI.' },
    ],
    outcomes: [
      'Valid recipients still receive the asset.',
      'Bad records are visible and recoverable.',
    ],
    proofStats: [
      { value: '1 valid', label: 'Sendable recipient' },
      { value: '1 skipped', label: 'Malformed email' },
      { value: '1 skipped', label: 'Unsubscribed' },
      { value: 'A0', label: 'Sprint proof' },
      { value: '1 page', label: 'Account workflow' },
    ],
    customerQuote: 'Proof-mode account page send remains deterministic and operator-visible.',
    bestFit: 'Outbound operations validation',
    publicContext: 'Seeded by deterministic account command center proof route.',
    suggestedNextStep: 'Send to the valid contact, skip the broken records, and fix contact quality inline.',
  });
}

export async function POST(req: NextRequest) {
  if (!ensureSeedAccess(req)) return unauthorized();

  const fixture = buildAccountPageSendFixture();
  const now = new Date();
  const seededContext = buildSeededAccountContentContext(now);

  await prisma.$transaction(async (tx) => {
    await tx.systemConfig.deleteMany({
      where: {
        key: {
          in: [fixture.cacheKey],
        },
      },
    });
    await tx.unsubscribedEmail.deleteMany({
      where: {
        email: {
          in: [fixture.unsubscribedRecipient.email],
        },
      },
    });
    await tx.sendJob.deleteMany({
      where: {
        recipients: {
          some: {
            account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] },
          },
        },
      },
    });
    await tx.sendJobRecipient.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.operatorOutcome.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.messageEvolutionRegistry.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.evidenceRecord.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.researchRun.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.signalContentLink.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.accountContactCandidate.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.meeting.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.mobileCapture.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.activity.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.canonicalConflict.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.canonicalContact.deleteMany({
      where: {
        persona: {
          account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] },
        },
      },
    });
    await tx.canonicalAccountLink.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.emailLog.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.generatedContent.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.generationJob.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.persona.deleteMany({
      where: { account_name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });
    await tx.account.deleteMany({
      where: { name: { in: [...ACCOUNT_PAGE_SEND_ACCOUNTS] } },
    });

    await tx.account.createMany({
      data: [
        {
          rank: 991,
          name: fixture.primaryAccountName,
          parent_brand: fixture.primaryAccountName,
          vertical: 'Beverage',
          signal_type: 'E2E',
          why_now: 'Deterministic account-page send proof primary record.',
          primo_angle: 'Fix duplicate-account send workflow and payload handling.',
          best_intro_path: 'Supply chain + transportation',
          icp_fit: 5,
          modex_signal: 4,
          primo_story_fit: 4,
          warm_intro: 2,
          strategic_value: 4,
          meeting_ease: 3,
          priority_score: 84,
          priority_band: 'A',
          tier: 'Tier 1',
          owner: 'Casey',
        },
        {
          rank: 992,
          name: fixture.aliasAccountName,
          parent_brand: fixture.primaryAccountName,
          vertical: 'Beverage',
          signal_type: 'E2E',
          why_now: 'Deterministic account-page send proof alias record.',
          primo_angle: 'Alias record contains the contacts.',
          best_intro_path: 'Transportation sourcing',
          icp_fit: 5,
          modex_signal: 4,
          primo_story_fit: 4,
          warm_intro: 2,
          strategic_value: 4,
          meeting_ease: 3,
          priority_score: 82,
          priority_band: 'A',
          tier: 'Tier 1',
          owner: 'Casey',
        },
      ],
    });

    await tx.persona.createMany({
      data: [
        {
          persona_id: fixture.validRecipient.personaId,
          account_name: fixture.aliasAccountName,
          priority: 'P1',
          name: fixture.validRecipient.name,
          title: 'VP Transportation',
          email: fixture.validRecipient.email,
          email_valid: true,
          email_confidence: 95,
          quality_score: 95,
          company_domain: 'e2ebostonbeer.com',
          persona_status: 'Ready',
          do_not_contact: false,
          last_enriched_at: now,
        },
        {
          persona_id: fixture.malformedRecipient.personaId,
          account_name: fixture.aliasAccountName,
          priority: 'P2',
          name: fixture.malformedRecipient.name,
          title: 'Manager Transportation Sourcing',
          email: fixture.malformedRecipient.email,
          email_valid: false,
          email_confidence: 15,
          quality_score: 45,
          company_domain: 'e2ebostonbeer.com',
          persona_status: 'Needs review',
          do_not_contact: false,
          last_enriched_at: now,
        },
        {
          persona_id: fixture.unsubscribedRecipient.personaId,
          account_name: fixture.aliasAccountName,
          priority: 'P1',
          name: fixture.unsubscribedRecipient.name,
          title: 'Chief Supply Chain Officer',
          email: fixture.unsubscribedRecipient.email,
          email_valid: true,
          email_confidence: 90,
          quality_score: 90,
          company_domain: 'e2ebostonbeer.com',
          persona_status: 'Suppressed',
          do_not_contact: false,
          last_enriched_at: now,
        },
      ],
    });

    const generatedAsset = await tx.generatedContent.create({
      data: {
        account_name: fixture.primaryAccountName,
        content_type: 'one_pager',
        tone: 'professional',
        provider_used: 'ai_gateway',
        version: 1,
        is_published: true,
        published_at: now,
        content: onePagerContent(fixture.primaryAccountName),
        version_metadata: {
          prompt_policy_version: 'proof-v1',
          provenance: {
            scoped_account_names: [...ACCOUNT_PAGE_SEND_ACCOUNTS],
            used_live_intel: true,
          },
          generation_input_contract: {
            signals: [{ title: 'Canonical identity proof' }, { title: 'Recipient filtering proof' }],
            recommended_contacts: [{ name: fixture.validRecipient.name }, { name: fixture.stagedCandidate.fullName }],
            committee_gaps: ['transformation'],
            freshness: { status: 'fresh', stale: false },
          },
        },
      },
    });
    await tx.messageEvolutionRegistry.create({
      data: {
        account_name: fixture.primaryAccountName,
        generated_content_id: generatedAsset.id,
        status: 'approved',
        owner: 'Casey',
        reviewed_by: 'Casey',
        reviewed_at: now,
        rationale: 'Deterministic proof seed marks generated asset as approved for send.',
        evidence_snapshot: {
          source: 'proof_seed',
          generated_content_id: generatedAsset.id,
          status: 'approved',
        },
      },
    });

    const seededEmail = await tx.emailLog.create({
      data: {
        account_name: fixture.primaryAccountName,
        persona_name: fixture.validRecipient.name,
        to_email: fixture.validRecipient.email,
        subject: 'yard network scorecard for E2E Boston Beer Company',
        body_html: '<p>Proof send email</p>',
        status: 'opened',
        generated_content_id: generatedAsset.id,
        reply_count: 1,
        open_count: 1,
        delivered_at: now,
        opened_at: now,
        sent_at: now,
      },
    });

    const successfulRun = await tx.researchRun.create({
      data: {
        account_name: fixture.primaryAccountName,
        status: 'succeeded',
        run_key: `${fixture.cacheKey}:success`,
        provider_status: {
          clawd: 'healthy',
          sales_agent: 'healthy',
        },
        started_at: new Date(now.getTime() - 2 * 60 * 1000),
        completed_at: new Date(now.getTime() - 30 * 1000),
      },
      select: { id: true },
    });

    await tx.researchRun.create({
      data: {
        account_name: fixture.primaryAccountName,
        status: 'failed',
        run_key: `${fixture.cacheKey}:failed`,
        provider_status: {
          clawd: 'healthy',
          sales_agent: 'unavailable',
        },
        error_map: {
          sales_agent: 'timeout contacting provider',
        },
        started_at: new Date(now.getTime() - 18 * 60 * 1000),
        completed_at: new Date(now.getTime() - 17 * 60 * 1000),
      },
    });

    await tx.evidenceRecord.createMany({
      data: [
        {
          research_run_id: successfulRun.id,
          account_name: fixture.primaryAccountName,
          claim: 'Primary account and alias are now linked in canonical scope.',
          claim_hash: 'proof-claim-canonical-link',
          source_url: 'https://yardflow.local/proof/canonical-link',
          source_title: 'Canonical scope proof',
          source_type: 'local',
          provider: 'proof_seed',
          observed_at: new Date(now.getTime() - 20 * 60 * 1000),
          freshness_status: 'fresh',
          fresh_until: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          deterministic_key: `${fixture.cacheKey}:canonical-link`,
          version: 1,
          metadata: {
            ticket: 'S0-T5',
          },
        },
        {
          research_run_id: successfulRun.id,
          account_name: fixture.primaryAccountName,
          claim: 'Malformed recipient remains blocked while valid recipient stays sendable.',
          claim_hash: 'proof-claim-recipient-gating',
          source_url: 'https://yardflow.local/proof/recipient-gating',
          source_title: 'Recipient guard proof',
          source_type: 'local',
          provider: 'proof_seed',
          observed_at: new Date(now.getTime() - 90 * 60 * 1000),
          freshness_status: 'aging',
          fresh_until: new Date(now.getTime() - 30 * 60 * 1000),
          deterministic_key: `${fixture.cacheKey}:recipient-gating`,
          version: 1,
          metadata: {
            ticket: 'S0-T5',
          },
        },
      ],
    });

    await tx.accountContactCandidate.create({
      data: {
        account_name: fixture.primaryAccountName,
        candidate_key: fixture.stagedCandidate.candidateKey,
        full_name: fixture.stagedCandidate.fullName,
        normalized_name: 'jamie yardley',
        title: 'Director Logistics',
        email: fixture.stagedCandidate.email,
        email_valid: true,
        email_confidence: 92,
        company_domain: 'e2ebostonbeer.com',
        source: 'company_contacts',
        source_action: 'company_contacts',
        source_provider: 'sales_agent',
        confidence_score: 92,
        quality_score: 93,
        readiness_score: 89,
        readiness_tier: 'high',
        readiness_details: {
          reasons: ['Fresh enrichment', 'Lane-aligned logistics title'],
          freshness_days: 1,
        },
        recommended: true,
        recommendation_reason: 'Strong logistics follow-on contact surfaced by proof discovery.',
        state: 'staged',
      },
    });

    await tx.activity.createMany({
      data: [
        {
          account_name: fixture.primaryAccountName,
          activity_type: 'Infographic Journey',
          owner: 'Casey',
          outcome: 'cold -> engaged',
          next_step: 'Send proof snapshot to promoted contact',
          notes: 'proof-seed:journey',
          activity_date: now,
        },
        {
          account_name: fixture.primaryAccountName,
          activity_type: 'Outcome',
          owner: 'Casey',
          outcome: 'Operator outcome logged: positive',
          next_step: 'Advance to meeting request',
          notes: 'proof-seed:outcome',
          activity_date: now,
        },
      ],
    });

    await tx.meeting.create({
      data: {
        account_name: fixture.primaryAccountName,
        persona: fixture.validRecipient.name,
        meeting_status: 'draft',
        objective: 'Turn positive reply into a discovery call',
      },
    });

    await tx.mobileCapture.create({
      data: {
        account_name: fixture.primaryAccountName,
        title: 'Proof capture',
        intent: 'Validate account-page outbound loop',
        next_step: 'Run seeded proof from account page',
        owner: 'Casey',
        heat_score: 14,
        captured_at: now,
      },
    });

    const sendJob = await tx.sendJob.create({
      data: {
        status: 'partial',
        requested_by: 'Casey',
        total_recipients: 3,
        sent_count: 1,
        failed_count: 1,
        skipped_count: 1,
        started_at: now,
        completed_at: now,
      },
    });

    await tx.sendJobRecipient.createMany({
      data: [
        {
          send_job_id: sendJob.id,
          generated_content_id: generatedAsset.id,
          account_name: fixture.primaryAccountName,
          persona_name: fixture.validRecipient.name,
          to_email: fixture.validRecipient.email,
          subject: 'yard network scorecard for E2E Boston Beer Company',
          body_html: '<p>Proof send email</p>',
          status: 'sent',
          email_log_id: seededEmail.id,
          sent_at: now,
          attempted_at: now,
          idempotency_key: `${fixture.sendJob.requestId}-valid`,
        },
        {
          send_job_id: sendJob.id,
          generated_content_id: generatedAsset.id,
          account_name: fixture.primaryAccountName,
          persona_name: fixture.malformedRecipient.name,
          to_email: fixture.malformedRecipient.email,
          subject: 'yard network scorecard for E2E Boston Beer Company',
          body_html: '<p>Proof send email</p>',
          status: 'failed',
          error_message: 'Invalid recipient email address',
          attempted_at: now,
          idempotency_key: `${fixture.sendJob.requestId}-invalid`,
        },
        {
          send_job_id: sendJob.id,
          generated_content_id: generatedAsset.id,
          account_name: fixture.primaryAccountName,
          persona_name: fixture.unsubscribedRecipient.name,
          to_email: fixture.unsubscribedRecipient.email,
          subject: 'yard network scorecard for E2E Boston Beer Company',
          body_html: '<p>Proof send email</p>',
          status: 'skipped',
          error_message: 'Recipient explicitly unsubscribed',
          attempted_at: now,
          idempotency_key: `${fixture.sendJob.requestId}-suppressed`,
        },
      ],
    });

    await tx.operatorOutcome.create({
      data: {
        account_name: fixture.primaryAccountName,
        generated_content_id: generatedAsset.id,
        outcome_label: 'positive',
        source_kind: 'email-log',
        source_id: String(seededEmail.id),
        notes: 'Positive reply requesting rollout detail and next steps.',
        created_by: 'Casey',
      },
    });

    await tx.systemConfig.upsert({
      where: { key: fixture.cacheKey },
      update: {
        value: JSON.stringify({
          savedAt: now.toISOString(),
          result: seededContext,
        }),
      },
      create: {
        key: fixture.cacheKey,
        value: JSON.stringify({
          savedAt: now.toISOString(),
          result: seededContext,
        }),
      },
    });

    await tx.unsubscribedEmail.create({
      data: {
        email: fixture.unsubscribedRecipient.email,
        reason: 'Deterministic proof unsubscribed recipient',
      },
    });
  }, {
    maxWait: 10_000,
    timeout: 30_000,
  });

  return NextResponse.json({
    success: true,
    primaryAccountName: fixture.primaryAccountName,
    aliasAccountName: fixture.aliasAccountName,
    cacheKey: fixture.cacheKey,
    validRecipient: fixture.validRecipient.email,
    malformedRecipient: fixture.malformedRecipient.email,
    unsubscribedRecipient: fixture.unsubscribedRecipient.email,
    stagedCandidate: fixture.stagedCandidate.email,
  });
}

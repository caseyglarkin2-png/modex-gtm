'use server';

import { revalidatePath } from 'next/cache';
import { CaptureSchema, ActivitySchema, MeetingSchema, AddAccountSchema, AddPersonaSchema, type CaptureInput, type ActivityInput, type MeetingInput, type AddAccountInput, type AddPersonaInput } from './validations';
import { CONTACT_STANDARD_VERSION, normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from './contact-standard';
import { advancePipelineStage, derivePipelineStage } from './pipeline';
import { ensureLocalMeetingDealLink } from './hubspot/deals';

// ── Capture ───────────────────────────────────────────────────────────────────
export async function createCapture(data: CaptureInput) {
  const parsed = CaptureSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { prisma } = await import('./prisma');
    await prisma.mobileCapture.create({
      data: {
        account_name: parsed.data.account,
        persona_name: parsed.data.contact,
        notes: parsed.data.notes,
        interest: parsed.data.interest,
        urgency: parsed.data.urgency,
        influence: parsed.data.influence,
        fit: parsed.data.fit,
        heat_score: parsed.data.heat_score,
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : null,
        followup_status: parsed.data.status ?? 'Open',
      },
    });
    revalidatePath('/queue');
    return { success: true };
  } catch {
    // DB not available — client should persist to localStorage
    return { success: false, offline: true };
  }
}

// ── Activity ──────────────────────────────────────────────────────────────────
export async function createActivity(data: ActivityInput) {
  const parsed = ActivitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { prisma } = await import('./prisma');
    await prisma.activity.create({
      data: {
        account_name: parsed.data.account,
        persona: parsed.data.persona,
        activity_type: parsed.data.activity_type,
        outcome: parsed.data.outcome,
        next_step: parsed.data.next_step,
        next_step_due: parsed.data.next_step_due ? new Date(parsed.data.next_step_due) : null,
        notes: parsed.data.notes,
        owner: parsed.data.owner ?? 'Casey',
        activity_date: new Date(),
      },
    });
    revalidatePath('/activities');
    revalidatePath(`/accounts`);
    return { success: true };
  } catch {
    return { success: false, offline: true };
  }
}

// ── Meeting ───────────────────────────────────────────────────────────────────
export async function createMeeting(data: MeetingInput) {
  const parsed = MeetingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { prisma } = await import('./prisma');
    await prisma.meeting.create({
      data: {
        account_name: parsed.data.account,
        persona: parsed.data.attendees,
        meeting_date: new Date(parsed.data.date),
        meeting_time: parsed.data.time,
        location: parsed.data.location,
        notes: parsed.data.notes,
        objective: parsed.data.objective,
        owner: parsed.data.owner ?? 'Jake',
        meeting_status: parsed.data.status ?? 'Scheduled',
      },
    });

    const existingAccount = await prisma.account.findUnique({ where: { name: parsed.data.account } });
    const nextStage = advancePipelineStage(
      derivePipelineStage({
        pipeline_stage: existingAccount?.pipeline_stage,
        outreach_status: existingAccount?.outreach_status,
        meeting_status: existingAccount?.meeting_status,
      }),
      'meeting',
    );

    await prisma.account.updateMany({
      where: { name: parsed.data.account },
      data: {
        meeting_status: parsed.data.status ?? 'Scheduled',
        outreach_status: 'Replied',
        pipeline_stage: nextStage,
        current_motion: `Pipeline stage: ${nextStage}`,
      },
    }).catch(() => undefined);

    await ensureLocalMeetingDealLink(parsed.data.account, 'meeting').catch(() => undefined);
    // Auto-create follow-up activity
    try {
      await prisma.activity.create({
        data: {
          account_name: parsed.data.account,
          persona: parsed.data.attendees,
          activity_type: 'Meeting',
          outcome: `Meeting booked: ${parsed.data.meeting_type ?? 'In-Person'} on ${parsed.data.date}`,
          next_step: 'Send pre-meeting prep',
          next_step_due: parsed.data.date ? new Date(parsed.data.date) : null,
          notes: parsed.data.objective ?? '',
          owner: parsed.data.owner ?? 'Jake',
          activity_date: new Date(),
        },
      });
    } catch { /* activity logging is best-effort */ }
    revalidatePath('/meetings');
    revalidatePath('/activities');
    revalidatePath('/pipeline');
    revalidatePath('/analytics');
    revalidatePath('/');
    revalidatePath(`/accounts`);
    return { success: true };
  } catch {
    return { success: false, offline: true };
  }
}

// ── Status Updates ────────────────────────────────────────────────────────────
export async function updateAccountStatus(account: string, field: 'research_status' | 'outreach_status' | 'meeting_status', value: string) {
  try {
    const { prisma } = await import('./prisma');
    const existing = await prisma.account.findUnique({ where: { name: account } });
    const nextOutreach = field === 'outreach_status' ? value : existing?.outreach_status;
    const nextMeeting = field === 'meeting_status' ? value : existing?.meeting_status;
    const pipelineStage = derivePipelineStage({
      pipeline_stage: existing?.pipeline_stage,
      outreach_status: nextOutreach,
      meeting_status: nextMeeting,
    });

    await prisma.account.update({
      where: { name: account },
      data: { [field]: value, pipeline_stage: pipelineStage, current_motion: `Pipeline stage: ${pipelineStage}` },
    });
    await ensureLocalMeetingDealLink(account, pipelineStage).catch(() => undefined);
    revalidatePath('/accounts');
    revalidatePath('/pipeline');
    revalidatePath('/analytics');
    revalidatePath('/');
    revalidatePath(`/accounts/${account.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    return { success: true };
  } catch {
    return { success: false, offline: true };
  }
}

export async function updatePersonaStatus(personaId: string, status: string) {
  try {
    const { prisma } = await import('./prisma');
    await prisma.persona.update({
      where: { persona_id: personaId },
      data: { persona_status: status },
    });
    revalidatePath('/personas');
    return { success: true };
  } catch {
    return { success: false, offline: true };
  }
}

export async function updateIntelStatus(id: number, status: string) {
  try {
    const { prisma } = await import('./prisma');
    await prisma.actionableIntel.update({
      where: { id },
      data: { status },
    });
    revalidatePath('/intel');
    return { success: true };
  } catch {
    return { success: false, offline: true };
  }
}

// ── Add Account ───────────────────────────────────────────────────────────────
export async function createAccount(data: AddAccountInput) {
  const parsed = AddAccountSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { prisma } = await import('./prisma');
    const { computePriorityScore, computeTier, computePriorityBand } = await import('./scoring');
    const existing = await prisma.account.count();
    const rank = existing + 1;
    const score = computePriorityScore({ icp_fit: 3, event_signal: 3, primo_story_fit: 2, warm_intro: 1, strategic_value: 3, meeting_ease: 2 });
    const tier = parsed.data.tier ?? computeTier(score);
    const band = computePriorityBand(score);

    await prisma.account.create({
      data: {
        rank,
        name: parsed.data.name,
        vertical: parsed.data.vertical,
        parent_brand: parsed.data.parent_brand ?? null,
        why_now: parsed.data.why_now ?? null,
        primo_angle: parsed.data.primo_angle ?? null,
        tier,
        priority_band: band,
        priority_score: score,
        owner: parsed.data.owner ?? 'Casey',
        pipeline_stage: 'targeted',
        notes: parsed.data.notes ?? null,
        icp_fit: 3,
        event_signal: 3,
        primo_story_fit: 2,
        warm_intro: 1,
        strategic_value: 3,
        meeting_ease: 2,
      },
    });
    revalidatePath('/accounts');
    revalidatePath('/analytics');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    if (msg.includes('Unique constraint')) {
      return { success: false, error: { name: ['Account already exists'] } };
    }
    return { success: false, offline: true };
  }
}

// ── Add Persona ───────────────────────────────────────────────────────────────
export async function createPersona(data: AddPersonaInput) {
  const parsed = AddPersonaSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { prisma } = await import('./prisma');
    const count = await prisma.persona.count();
    const personaId = `P-${String(count + 1).padStart(3, '0')}`;
    const split = splitName(parsed.data.name);
    const companyDomain = parseDomainFromEmail(parsed.data.email || null);
    const quality = scoreContactQuality({
      name: parsed.data.name,
      title: parsed.data.title,
      accountName: parsed.data.account_name,
      email: parsed.data.email || null,
      companyDomain,
      linkedinUrl: parsed.data.linkedin_url || null,
      sourceEvidenceCount: 0,
    });

    await prisma.persona.create({
      data: {
        persona_id: personaId,
        account_name: parsed.data.account_name,
        name: parsed.data.name,
        first_name: split.firstName || null,
        last_name: split.lastName || null,
        normalized_name: normalizeName(parsed.data.name),
        title: parsed.data.title ?? null,
        normalized_title: normalizeTitle(parsed.data.title),
        email: parsed.data.email || null,
        email_status: parsed.data.email ? 'guessed' : 'unverified',
        email_confidence: quality.emailConfidence,
        company_domain: companyDomain,
        priority: parsed.data.priority,
        persona_lane: parsed.data.persona_lane ?? null,
        role_in_deal: parsed.data.role_in_deal ?? null,
        linkedin_url: parsed.data.linkedin_url || null,
        linkedin_confidence: parsed.data.linkedin_url ? quality.linkedinConfidence : 0,
        why_this_persona: parsed.data.why_this_persona ?? null,
        notes: parsed.data.notes ?? null,
        source_type: 'manual',
        quality_score: quality.score,
        quality_band: quality.band,
        is_contact_ready: quality.isReady,
        contact_standard_version: CONTACT_STANDARD_VERSION,
        last_enriched_at: new Date(),
        persona_status: 'To find',
      },
    });
    revalidatePath('/personas');
    revalidatePath('/accounts');
    revalidatePath('/analytics');
    return { success: true };
  } catch {
    return { success: false, offline: true };
  }
}

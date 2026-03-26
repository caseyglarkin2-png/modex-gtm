'use server';

import { revalidatePath } from 'next/cache';
import { CaptureSchema, ActivitySchema, MeetingSchema, type CaptureInput, type ActivityInput, type MeetingInput } from './validations';

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
    revalidatePath('/meetings');
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
    await prisma.account.update({
      where: { name: account },
      data: { [field]: value },
    });
    revalidatePath('/accounts');
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

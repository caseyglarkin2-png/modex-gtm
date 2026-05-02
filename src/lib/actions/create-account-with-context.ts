'use server';

import { prisma } from '@/lib/prisma';
import { getVerticalTemplate } from '@/lib/templates/account-templates';
import { revalidatePath } from 'next/cache';

export interface CreateAccountWithContextInput {
  name: string;
  vertical: string;
  why_now: string;
  primo_angle: string;
  parent_brand?: string;
  best_intro_path?: string;
}

export interface CreateAccountWithContextResult {
  success: boolean;
  account?: {
    id: number;
    name: string;
    priority_band: string;
    priority_score: number;
  };
  generation_job_id?: number;
  error?: string;
}

export async function createAccountWithContext(
  input: CreateAccountWithContextInput,
): Promise<CreateAccountWithContextResult> {
  try {
    // Validate account doesn't exist
    const existing = await prisma.account.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      return { success: false, error: 'Account already exists' };
    }

    // Get template for vertical
    const template = getVerticalTemplate(input.vertical);
    if (!template) {
      return { success: false, error: 'Invalid vertical selected' };
    }

    // Compute priority score based on template rules
    const priority_score =
      (template.defaultScoringRules.icp_fit +
        template.defaultScoringRules.modex_signal +
        template.defaultScoringRules.primo_story_fit +
        template.defaultScoringRules.strategic_value) *
      10;

    // Determine priority band
    let priority_band = 'D';
    if (priority_score >= 90) priority_band = 'A';
    else if (priority_score >= 80) priority_band = 'B';
    else if (priority_score >= 70) priority_band = 'C';

    // Create account
    const account = await prisma.account.create({
      data: {
        rank: 999,
        name: input.name,
        parent_brand: input.parent_brand || input.name,
        vertical: input.vertical,
        why_now: input.why_now,
        primo_angle: input.primo_angle,
        best_intro_path: input.best_intro_path || '',
        icp_fit: template.defaultScoringRules.icp_fit * 20,
        modex_signal: template.defaultScoringRules.modex_signal * 20,
        primo_story_fit: template.defaultScoringRules.primo_story_fit * 20,
        strategic_value: template.defaultScoringRules.strategic_value * 20,
        priority_score,
        priority_band,
        tier: priority_band === 'A' ? 'Tier 1' : priority_band === 'B' ? 'Tier 2' : 'Tier 3',
        owner: 'Casey',
        research_status: 'In progress',
        outreach_status: 'Not started',
        meeting_status: 'No meeting',
        pipeline_stage: 'targeted',
      },
      select: {
        id: true,
        name: true,
        priority_band: true,
        priority_score: true,
      },
    });

    // Queue generation job for one-pager
    const job = await prisma.generationJob.create({
      data: {
        account_name: account.name,
        content_type: 'one_pager',
        status: 'pending',
      },
      select: {
        id: true,
      },
    });

    // Revalidate accounts page
    revalidatePath('/accounts');

    return {
      success: true,
      account,
      generation_job_id: job.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

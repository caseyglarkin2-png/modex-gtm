import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { markCronFailure, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { generateTextWithMetadata } from '@/lib/ai/client';
import { buildOnePagerPrompt } from '@/lib/ai/prompts';
import { getAccountContext } from '@/lib/db';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  secret: z.string().min(1),
});

const CRON_NAME = 'process-generation-jobs';
const CRON_PATH = '/api/cron/process-generation-jobs';
const CRON_SCHEDULE = '*/5 * * * *';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ secret: searchParams.get('secret') ?? '' });
  if (!parsed.success || parsed.data.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  try {
    const jobs = await prisma.generationJob.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'asc' },
      take: 3,
    });

    const processed: Array<{ id: number; status: string }> = [];

    for (const job of jobs) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: 'processing', started_at: new Date() },
      });

      if (job.content_type !== 'one_pager') {
        await prisma.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error_message: `Unsupported content type: ${job.content_type}`,
            completed_at: new Date(),
            retry_count: { increment: 1 },
          },
        });
        processed.push({ id: job.id, status: 'failed' });
        continue;
      }

      const { account, meetingBrief } = await getAccountContext(job.account_name);
      if (!account) {
        await prisma.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error_message: 'Account not found',
            completed_at: new Date(),
            retry_count: { increment: 1 },
          },
        });
        processed.push({ id: job.id, status: 'failed' });
        continue;
      }

      const ctx = {
        accountName: account.name,
        parentBrand: account.parent_brand ?? account.name,
        vertical: account.vertical,
        whyNow: account.why_now ?? 'MODEX 2026 attendance signal',
        primoAngle: account.primo_angle ?? '',
        bestIntroPath: account.best_intro_path ?? '',
        likelyPainPoints:
          meetingBrief?.likely_pain ??
          account.why_now ??
          account.primo_angle ??
          'Trailer queue variability, gate/dock congestion, inconsistent driver journey',
        primoRelevance: meetingBrief?.primo_relevance ?? account.primo_angle ?? '',
        suggestedAttendees: meetingBrief?.suggested_attendees ?? '',
        score: account.priority_score,
        tier: account.tier,
        band: account.priority_band,
      };

      const prompt = buildOnePagerPrompt(ctx);

      try {
        const result = await generateTextWithMetadata(prompt, 1200);
        const raw = result.text;

        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const content = JSON.parse(jsonStr);
        const latestVersion = await prisma.generatedContent.findFirst({
          where: {
            account_name: account.name,
            content_type: 'one_pager',
            campaign_id: job.campaign_id ?? null,
          },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        await prisma.generatedContent.create({
          data: {
            account_name: account.name,
            campaign_id: job.campaign_id,
            persona_name: job.persona_name,
            content_type: 'one_pager',
            tone: 'professional',
            provider_used: result.provider,
            version: (latestVersion?.version ?? 0) + 1,
            content: JSON.stringify(content),
          },
        });

        await prisma.generationJob.update({
          where: { id: job.id },
          data: { status: 'completed', provider_used: result.provider, completed_at: new Date() },
        });
        processed.push({ id: job.id, status: 'completed' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown generation error';
        await prisma.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error_message: message,
            completed_at: new Date(),
            retry_count: { increment: 1 },
          },
        });
        processed.push({ id: job.id, status: 'failed' });
      }
    }

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Processed ${processed.length} generation jobs`,
      stats: { processed },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    Sentry.captureException(error);
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { assertColdOutreachAllowed } from '@/lib/studio/guardrails';

const HandoffSchema = z.object({
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  owner: z.string().default('Casey'),
  nextStepDue: z.string().datetime().optional(),
  assets: z.record(z.string(), z.object({
    content: z.string().min(1),
    quality: z.object({
      score: z.number().optional(),
      flags: z.array(z.string()).optional(),
    }).optional(),
  })).refine((value) => Object.keys(value).length > 0, 'At least one asset is required'),
});

const ACTIVITY_MAP: Record<string, 'Email' | 'LinkedIn DM' | 'Phone Call' | 'Note'> = {
  email: 'Email',
  follow_up: 'Email',
  dm: 'LinkedIn DM',
  call_script: 'Phone Call',
  meeting_prep: 'Note',
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`studio:handoff:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = HandoffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { accountName, personaName, owner, nextStepDue, assets } = parsed.data;

  try {
    assertColdOutreachAllowed(accountName);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Outreach blocked' }, { status: 403 });
  }

  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const dueDate = nextStepDue ? new Date(nextStepDue) : null;
  const createdActivities = [] as Array<{ id: number; assetType: string }>;

  for (const [assetType, payload] of Object.entries(assets)) {
    const snippet = payload.content.slice(0, 500);
    const qualityScore = payload.quality?.score ?? null;
    const qualityFlags = payload.quality?.flags?.join(' | ') ?? 'None';

    const activity = await prisma.activity.create({
      data: {
        account_name: accountName,
        persona: personaName ?? null,
        activity_type: ACTIVITY_MAP[assetType] ?? 'Note',
        owner,
        outcome: 'Ready for execution',
        next_step: `Execute ${assetType} asset from Creative Studio`,
        next_step_due: dueDate,
        notes: `Source: Creative Studio handoff\nAsset Type: ${assetType}\nQuality Score: ${qualityScore ?? 'n/a'}\nQuality Flags: ${qualityFlags}\n---\n${snippet}`,
      },
    });

    createdActivities.push({ id: activity.id, assetType });
  }

  await prisma.generatedContent.create({
    data: {
      account_name: accountName,
      persona_name: personaName ?? null,
      content_type: 'studio_handoff_bundle',
      tone: 'operational',
      length: 'medium',
      content: JSON.stringify({ assets, owner, nextStepDue, createdAt: new Date().toISOString() }),
    },
  });

  return NextResponse.json({
    ok: true,
    accountName,
    createdActivities,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { buildPlaybookTags, rankPlaybookBlocks } from '@/lib/revops/playbook-library';

const CreatePlaybookBlockSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(20),
  blockType: z.string().min(1).default('story'),
  accountName: z.string().optional().nullable(),
  campaignId: z.number().int().positive().optional().nullable(),
  generatedContentId: z.number().int().positive().optional().nullable(),
  industry: z.string().optional().nullable(),
  persona: z.string().optional().nullable(),
  stage: z.string().optional().nullable(),
  motion: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountName = searchParams.get('accountName')?.trim();
  const persona = searchParams.get('persona')?.trim();
  const industry = searchParams.get('industry')?.trim();
  const stage = searchParams.get('stage')?.trim();
  const blocks = await rankPlaybookBlocks(prisma, 40);

  const filtered = blocks.filter((block) => {
    if (accountName && block.account_name && block.account_name !== accountName) return false;
    if (persona && block.persona && block.persona.toLowerCase() !== persona.toLowerCase()) return false;
    if (industry && block.industry && block.industry.toLowerCase() !== industry.toLowerCase()) return false;
    if (stage && block.stage && block.stage.toLowerCase() !== stage.toLowerCase()) return false;
    return true;
  });

  return NextResponse.json({
    success: true,
    blocks: filtered.map((block) => ({
      id: block.id,
      title: block.title,
      body: block.body,
      blockType: block.block_type,
      tags: block.tags,
      industry: block.industry,
      persona: block.persona,
      stage: block.stage,
      motion: block.motion,
      performance: block.performance,
      createdAt: block.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreatePlaybookBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;
  const tags = buildPlaybookTags({
    industry: payload.industry,
    persona: payload.persona,
    stage: payload.stage,
    motion: payload.motion,
  });

  const block = await prisma.playbookBlock.create({
    data: {
      title: payload.title.trim(),
      body: payload.body.trim(),
      block_type: payload.blockType,
      account_name: payload.accountName?.trim() || null,
      campaign_id: payload.campaignId ?? null,
      generated_content_id: payload.generatedContentId ?? null,
      industry: payload.industry?.trim() || null,
      persona: payload.persona?.trim() || null,
      stage: payload.stage?.trim() || null,
      motion: payload.motion?.trim() || null,
      tags,
      created_by: payload.createdBy ?? 'Casey',
    },
    select: {
      id: true,
      title: true,
      block_type: true,
      tags: true,
      created_at: true,
    },
  });

  return NextResponse.json({ success: true, block }, { status: 201 });
}

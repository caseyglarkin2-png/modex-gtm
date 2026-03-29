import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const PromptVersionSchema = z.object({
  template: z.string().min(2).max(80),
  prompt: z.string().min(20).max(12_000),
  notes: z.string().max(500).optional(),
});

const PREFIX = 'studio_prompt';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const templateFilter = url.searchParams.get('template')?.trim().toLowerCase();
  const limit = Number(url.searchParams.get('limit') ?? 40);

  const rows = await prisma.listsConfig.findMany({
    where: {
      key: {
        startsWith: `${PREFIX}:`,
      },
    },
    orderBy: { id: 'desc' },
    take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 40,
  });

  const versions = rows
    .map((row) => {
      try {
        const payload = JSON.parse(row.value) as {
          prompt: string;
          notes?: string;
          createdAt: string;
        };
        const keyParts = row.key.split(':');
        const template = keyParts[1] ?? 'unknown';
        const version = keyParts.slice(2).join(':');
        return {
          id: row.id,
          template,
          version,
          prompt: payload.prompt,
          notes: payload.notes ?? null,
          createdAt: payload.createdAt,
        };
      } catch {
        return null;
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .filter((row) => !templateFilter || row.template.toLowerCase() === templateFilter);

  return NextResponse.json({ versions });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`studio:prompts:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PromptVersionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const version = new Date().toISOString().replace(/[:.]/g, '-');
  const template = parsed.data.template.trim().toLowerCase().replace(/\s+/g, '_');
  const key = `${PREFIX}:${template}:${version}`;

  const row = await prisma.listsConfig.create({
    data: {
      key,
      value: JSON.stringify({
        prompt: parsed.data.prompt,
        notes: parsed.data.notes ?? null,
        createdAt: new Date().toISOString(),
      }),
    },
  });

  return NextResponse.json({
    id: row.id,
    key,
    template,
    version,
  });
}

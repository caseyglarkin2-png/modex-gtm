import { NextRequest, NextResponse } from 'next/server';
import { AgentActionRequestSchema } from '@/lib/agent-actions/types';
import { runAgentAction } from '@/lib/agent-actions/broker';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AgentActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await runAgentAction(parsed.data);
  const status = result.status === 'error' ? 502 : 200;
  return NextResponse.json(result, { status });
}


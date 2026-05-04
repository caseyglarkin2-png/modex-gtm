import { NextResponse } from 'next/server';
import { listAgentActionCapabilities } from '@/lib/agent-actions/broker';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    capabilities: listAgentActionCapabilities(),
    configured: {
      clawd: Boolean(process.env.CLAWD_CONTROL_PLANE_URL),
      salesAgent: Boolean(process.env.SALES_AGENT_BASE_URL),
    },
  });
}

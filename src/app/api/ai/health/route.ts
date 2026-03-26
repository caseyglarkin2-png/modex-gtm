import { NextResponse } from 'next/server';
import { checkModelHealth } from '@/lib/ai/client';

export async function GET() {
  try {
    const result = await checkModelHealth();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

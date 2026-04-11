import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { validateToken } from '@/lib/email/unsubscribe-token';
import { upsertContact } from '@/lib/hubspot/contacts';

const UnsubscribeSchema = z.object({
  email: z.string().email('Valid email required'),
  token: z.string().optional(),
  emailLogId: z.number().int().positive().optional(),
  reason: z.string().optional(),
});

// Backward-compat cutoff: unsigned links accepted until this date (60 days from deploy)
const UNSIGNED_CUTOFF = new Date('2026-07-01T00:00:00Z');

export async function POST(req: NextRequest) {
  try {
    // CSRF check: reject requests without a same-origin Origin or Referer header
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
    const isSameOrigin =
      (origin && appUrl.startsWith(origin)) ||
      (referer && referer.startsWith(appUrl));

    // Allow List-Unsubscribe-Post (RFC 8058) — comes without Origin header
    const isOneClick = req.headers.get('content-type')?.includes('application/x-www-form-urlencoded');

    if (!isSameOrigin && !isOneClick) {
      return NextResponse.json(
        { error: 'Forbidden: cross-origin request' },
        { status: 403 }
      );
    }

    const body = isOneClick
      ? Object.fromEntries(new URLSearchParams(await req.text()))
      : await req.json();
    const parsed = UnsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, token, emailLogId, reason } = parsed.data;

    // HMAC validation with backward-compat window for old unsigned links
    if (token) {
      if (!validateToken(email, token)) {
        return NextResponse.json(
          { error: 'Invalid unsubscribe token' },
          { status: 403 }
        );
      }
    } else if (new Date() > UNSIGNED_CUTOFF) {
      return NextResponse.json(
        { error: 'Unsubscribe token required' },
        { status: 403 }
      );
    }
    // else: no token but within backward-compat window — allow

    // Check if already unsubscribed
    const existing = await prisma.unsubscribedEmail.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Email already unsubscribed',
      });
    }

    // Add to unsubscribed list
    await prisma.unsubscribedEmail.create({
      data: {
        email,
        email_log_id: emailLogId,
        reason,
      },
    });

    // Also mark persona as do_not_contact
    await prisma.persona.updateMany({
      where: { email },
      data: { do_not_contact: true },
    });

    // Sync opt-out to HubSpot (non-blocking, non-fatal)
    try {
      const persona = await prisma.persona.findFirst({ where: { email } });
      if (persona?.hubspot_contact_id) {
        await upsertContact({ email, hs_email_optout: 'true' });
      }
    } catch {
      // HubSpot sync failure must not block unsubscribe
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unsubscribe failed' },
      { status: 500 }
    );
  }
}

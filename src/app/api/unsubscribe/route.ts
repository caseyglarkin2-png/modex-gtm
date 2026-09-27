import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { validateToken } from '@/lib/email/unsubscribe-token';
import { recordUnsubscribe } from '@/lib/email/unsubscribe';

const UnsubscribeSchema = z.object({
  email: z.string().email('Valid email required'),
  token: z.string().optional(),
  emailLogId: z.number().int().positive().optional(),
  reason: z.string().optional(),
});

// Backward-compat cutoff: unsigned links accepted until this date (60 days from deploy)
const UNSIGNED_CUTOFF = new Date('2026-07-01T00:00:00Z');

/**
 * RFC 8058 one-click (red team T5). A mailbox provider POSTs to the exact
 * List-Unsubscribe URL, whose query carries the signed identity
 * (`email` + `token`), with a form body of ONLY `List-Unsubscribe=One-Click`
 * and no Origin. Identity never comes from the body: a body that carries
 * anything else is refused, so a crafted request cannot swap the address.
 */
function oneClickBody(req: NextRequest, form: URLSearchParams): Record<string, string> | { error: string } {
  const keys = [...new Set(form.keys())];
  if (form.get('List-Unsubscribe') !== 'One-Click' || keys.length !== 1) {
    return { error: 'One-click body must be exactly List-Unsubscribe=One-Click' };
  }
  const q = req.nextUrl.searchParams;
  const body: Record<string, string> = {};
  for (const k of ['email', 'token']) {
    const v = q.get(k);
    if (v) body[k] = v;
  }
  return body;
}

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

    let body: unknown;
    if (isOneClick) {
      const oc = oneClickBody(req, new URLSearchParams(await req.text()));
      if ('error' in oc) return NextResponse.json({ error: oc.error }, { status: 400 });
      // One-click carries no human to re-confirm, so it is signed or nothing.
      if (!oc.token) return NextResponse.json({ error: 'Unsubscribe token required' }, { status: 403 });
      body = oc;
    } else {
      body = await req.json();
    }
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

    // The consent write path (UnsubscribedEmail + Persona.do_not_contact +
    // the HubSpot hs_email_optout mirror) lives in recordUnsubscribe so the
    // GAP do_not_contact disposition takes the identical path. Same call
    // order and response bodies as before the extraction (S4-T1).
    const result = await recordUnsubscribe(prisma, {
      email,
      source: 'unsubscribe_link',
      emailLogId,
      reason,
    });

    if (!result.created) {
      return NextResponse.json({
        success: true,
        message: 'Email already unsubscribed',
      });
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

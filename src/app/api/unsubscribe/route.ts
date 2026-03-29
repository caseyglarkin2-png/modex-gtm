import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UnsubscribeSchema = z.object({
  email: z.string().email('Valid email required'),
  emailLogId: z.number().int().positive().optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UnsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, emailLogId, reason } = parsed.data;

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

/**
 * Send preview emails to Casey for asset quality review.
 * Usage: npx tsx scripts/send-preview-emails.ts
 *
 * Sends one of each asset type to caseyglarkin2@gmail.com for inbox review.
 */

import { prisma } from '../src/lib/prisma';
import { sendEmail } from '../src/lib/email/client';
import { wrapHtml } from '../src/lib/email/templates';
import { generateText } from '../src/lib/ai/client';
import { buildEmailPrompt, buildOnePagerPrompt } from '../src/lib/ai/prompts';
import type { OnePagerContext, PromptContext } from '../src/lib/ai/prompts';

const PREVIEW_EMAIL = 'caseyglarkin2@gmail.com';
const TEST_ACCOUNT = 'General Mills';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOnePagerPreview() {
  console.log('1/3: Generating and sending one-pager for General Mills...');

  // Get existing one-pager from DB
  const record = await prisma.generatedContent.findFirst({
    where: { account_name: TEST_ACCOUNT, content_type: 'one_pager' },
    orderBy: { created_at: 'desc' },
  });

  if (!record?.content) {
    console.log('  No cached one-pager found. Generating fresh...');
    const account = await prisma.account.findUnique({ where: { name: TEST_ACCOUNT } });
    const meetingBrief = await prisma.meetingBrief.findFirst({ where: { account_name: TEST_ACCOUNT } });
    if (!account) throw new Error('Account not found');

    const ctx: OnePagerContext = {
      accountName: account.name,
      parentBrand: account.parent_brand ?? account.name,
      vertical: account.vertical,
      whyNow: account.why_now ?? 'MODEX 2026',
      primoAngle: account.primo_angle ?? '',
      bestIntroPath: account.best_intro_path ?? '',
      likelyPainPoints: meetingBrief?.likely_pain ?? 'dock congestion, trailer variability',
      primoRelevance: meetingBrief?.primo_relevance ?? '',
      suggestedAttendees: meetingBrief?.suggested_attendees ?? '',
      score: account.priority_score,
      tier: account.tier,
      band: account.priority_band,
    };

    const raw = await generateText(buildOnePagerPrompt(ctx), 1200);
    const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(jsonStr);

    // Import onePagerToHtml dynamically
    const { onePagerToHtml } = await import('../src/components/ai/one-pager-preview');
    const html = onePagerToHtml(data, TEST_ACCOUNT);

    const result = await sendEmail({
      to: PREVIEW_EMAIL,
      subject: `[PREVIEW] YardFlow One-Pager - Built for ${TEST_ACCOUNT}`,
      html,
    });
    console.log(`  Sent via ${result.provider}. Check inbox.`);
  } else {
    const data = JSON.parse(record.content);
    const { onePagerToHtml } = await import('../src/components/ai/one-pager-preview');
    const html = onePagerToHtml(data, TEST_ACCOUNT);

    const result = await sendEmail({
      to: PREVIEW_EMAIL,
      subject: `[PREVIEW] YardFlow One-Pager - Built for ${TEST_ACCOUNT}`,
      html,
    });
    console.log(`  Sent via ${result.provider}. Check inbox.`);
  }
}

async function sendColdEmailPreview() {
  console.log('\n2/3: Generating and sending cold email for General Mills...');

  const ctx: PromptContext = {
    accountName: TEST_ACCOUNT,
    personaName: 'VP Supply Chain',
    vertical: 'Food & Beverage',
    parentBrand: 'General Mills',
    tone: 'conversational',
    length: 'medium',
  };

  const raw = await generateText(buildEmailPrompt(ctx), 600);

  // Extract subject line if present
  const lines = raw.trim().split('\n').filter(Boolean);
  let subject = `[PREVIEW] Cold Email - ${TEST_ACCOUNT}`;
  let body = raw.trim();
  if (lines[0]?.toLowerCase().startsWith('subject:')) {
    subject = `[PREVIEW] ${lines[0].replace(/^Subject:\s*/i, '').trim()}`;
    body = lines.slice(1).join('\n').trim();
  }

  const html = wrapHtml(body, TEST_ACCOUNT, PREVIEW_EMAIL);
  const result = await sendEmail({
    to: PREVIEW_EMAIL,
    subject,
    html,
  });
  console.log(`  Sent via ${result.provider}. Check inbox.`);
}

async function sendFollowUpPreview() {
  console.log('\n3/3: Generating and sending follow-up email for General Mills...');

  const account = await prisma.account.findUnique({ where: { name: TEST_ACCOUNT } });
  if (!account) throw new Error('Account not found');

  const prompt = `Write a follow-up email (touch 2, day 3 after initial cold email) for ${TEST_ACCOUNT}.
This is for a VP of Supply Chain at a ${account.vertical} company.

Context: We sent a cold email 3 days ago about YardFlow's yard network system. No reply yet.
The initial email introduced the concept that the yard is where throughput dies and how YardFlow standardizes the driver journey.

Keep it short (4-6 sentences). Reference the first email without being pushy.
Do not use em dashes. Use contractions. Sound human.
Sign off as Casey Larkin, GTM Lead, YardFlow by FreightRoll.

Respond with:
Subject: [subject line]
[body]`;

  const raw = await generateText(prompt, 400);
  const lines = raw.trim().split('\n').filter(Boolean);
  let subject = `[PREVIEW] Follow-up - ${TEST_ACCOUNT}`;
  let body = raw.trim();
  if (lines[0]?.toLowerCase().startsWith('subject:')) {
    subject = `[PREVIEW] ${lines[0].replace(/^Subject:\s*/i, '').trim()}`;
    body = lines.slice(1).join('\n').trim();
  }

  const html = wrapHtml(body, TEST_ACCOUNT, PREVIEW_EMAIL);
  const result = await sendEmail({
    to: PREVIEW_EMAIL,
    subject,
    html,
  });
  console.log(`  Sent via ${result.provider}. Check inbox.`);
}

async function main() {
  console.log(`=== PREVIEW EMAIL BATCH ===`);
  console.log(`Sending to: ${PREVIEW_EMAIL}`);
  console.log(`Test account: ${TEST_ACCOUNT}\n`);

  try {
    await sendOnePagerPreview();
    await sleep(2000);
    await sendColdEmailPreview();
    await sleep(2000);
    await sendFollowUpPreview();

    console.log('\n=== ALL PREVIEWS SENT ===');
    console.log('Check caseyglarkin2@gmail.com inbox for 3 preview emails.');
    console.log('Look for: [PREVIEW] prefix in subject lines.');
  } catch (err) {
    console.error('Preview send failed:', err);
  }

  await prisma.$disconnect();
}

main();

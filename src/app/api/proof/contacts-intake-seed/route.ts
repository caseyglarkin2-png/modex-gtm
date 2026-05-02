import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SECRET = 'local-e2e-seed';
const ACCOUNT_EXISTING = 'E2E Intake Existing';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function ensureSeedAccess(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return false;
  const expected = process.env.E2E_SEED_SECRET ?? DEFAULT_SECRET;
  const header = req.headers.get('x-e2e-seed-secret');
  return header === expected;
}

const contacts = [
  {
    id: 'e2e-hs-1',
    email: 'new.ops@intakeco.com',
    firstname: 'New',
    lastname: 'Ops',
    company: 'Intake Co',
    jobtitle: 'Director Operations',
    phone: '',
    hs_lead_status: 'NEW',
    lifecyclestage: 'lead',
    hs_email_optout: false,
  },
  {
    id: 'e2e-hs-2',
    email: 'existing.ops@existingco.com',
    firstname: 'Existing',
    lastname: 'Ops',
    company: ACCOUNT_EXISTING,
    jobtitle: 'VP Logistics',
    phone: '',
    hs_lead_status: 'OPEN',
    lifecyclestage: 'opportunity',
    hs_email_optout: false,
  },
  {
    id: 'e2e-hs-3',
    email: 'opted.out@intakeco.com',
    firstname: 'Opted',
    lastname: 'Out',
    company: 'Intake Co',
    jobtitle: 'Manager',
    phone: '',
    hs_lead_status: 'NEW',
    lifecyclestage: 'lead',
    hs_email_optout: true,
  },
];

export async function POST(req: NextRequest) {
  if (!ensureSeedAccess(req)) return unauthorized();

  await prisma.$transaction(async (tx) => {
    await tx.contactEnrichmentField.deleteMany({
      where: {
        contact_enrichment: {
          persona: {
            OR: [
              { email: { startsWith: 'new.ops@' } },
              { email: { startsWith: 'existing.ops@' } },
            ],
          },
        },
      },
    });
    await tx.contactEnrichment.deleteMany({
      where: {
        persona: {
          OR: [
            { email: { startsWith: 'new.ops@' } },
            { email: { startsWith: 'existing.ops@' } },
          ],
        },
      },
    });
    await tx.persona.deleteMany({
      where: {
        OR: [
          { email: 'new.ops@intakeco.com' },
          { email: 'existing.ops@existingco.com' },
        ],
      },
    });
    await tx.account.deleteMany({
      where: { name: { in: ['Intake Co', ACCOUNT_EXISTING] } },
    });

    await tx.account.create({
      data: {
        name: ACCOUNT_EXISTING,
        rank: 900,
        vertical: 'Logistics',
        owner: 'Casey',
        priority_band: 'A',
      },
    });

    const persona = await tx.persona.create({
      data: {
        persona_id: 'e2e-existing-ops',
        account_name: ACCOUNT_EXISTING,
        priority: 'P1',
        name: 'Existing Ops',
        title: 'VP Logistics',
        email: 'existing.ops@existingco.com',
        hubspot_contact_id: 'e2e-hs-2',
        persona_status: 'Not started',
        do_not_contact: false,
      },
      select: { id: true },
    });

    await tx.contactEnrichment.create({
      data: {
        persona_id: persona.id,
        apollo_person_id: 'apollo-existing-ops',
        enrichment_confidence: 0.92,
        last_enriched_at: new Date(),
      },
    });

    await tx.systemConfig.upsert({
      where: { key: 'e2e:contacts_intake_fixture' },
      create: { key: 'e2e:contacts_intake_fixture', value: JSON.stringify({ contacts }) },
      update: { value: JSON.stringify({ contacts }) },
    });
  });

  return NextResponse.json({ success: true, contacts: contacts.length });
}

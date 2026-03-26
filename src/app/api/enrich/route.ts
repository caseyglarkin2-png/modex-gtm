import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/client';

const EnrichRequestSchema = z.object({
  personas: z.array(z.object({
    persona_id: z.string(),
    name: z.string(),
    title: z.string(),
    account: z.string(),
    linkedin_url: z.string().optional(),
  })).min(1).max(20),
});

// Common corporate email domain patterns (public knowledge)
const KNOWN_DOMAINS: Record<string, string> = {
  'Dannon': 'danone.com',
  'General Mills': 'genmills.com',
  'Frito-Lay': 'pepsico.com',
  'Diageo': 'diageo.com',
  'Hormel Foods': 'hormel.com',
  'JM Smucker': 'jmsmucker.com',
  'The Home Depot': 'homedepot.com',
  'Georgia Pacific': 'gapac.com',
  'H-E-B': 'heb.com',
  'Hyundai Motor America': 'hmna.com',
  'Honda': 'honda.com',
  'John Deere': 'johndeere.com',
  'Kenco Logistics Services': 'kencogroup.com',
  'Barnes & Noble': 'bn.com',
  'FedEx': 'fedex.com',
  'Dawn Foods': 'dawnfoods.com',
  'Del Monte Foods': 'delmonte.com',
  'Dollar General': 'dollargeneral.com',
  'Dollar Tree': 'dollartree.com',
  'IKEA': 'ikea.com',
};

function generateEmailGuesses(name: string, domain: string): string[] {
  const parts = name.toLowerCase().replace(/[^a-z\s-]/g, '').split(/\s+/);
  if (parts.length < 2) return [];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const fi = first[0];
  return [
    `${first}.${last}@${domain}`,
    `${fi}${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first}_${last}@${domain}`,
    `${last}.${first}@${domain}`,
  ];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = EnrichRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { personas } = parsed.data;

  // Build enrichment using known domain patterns + AI reasoning
  const prompt = `You are a B2B sales intelligence tool. Given the following personas, provide the most likely business email address and any publicly available phone number.

Rules:
- Use standard corporate email formats: first.last@domain, flast@domain, firstlast@domain
- Use these known corporate domains: ${JSON.stringify(KNOWN_DOMAINS)}
- For phone numbers, only include if commonly listed on public directories or company pages. Otherwise say "Not publicly available"
- Output ONLY valid JSON array, no markdown fences

Personas:
${personas.map(p => `- ${p.name}, ${p.title} at ${p.account} (LinkedIn: ${p.linkedin_url || 'N/A'})`).join('\n')}

Output format:
[{"persona_id":"P-001","email":"best.guess@domain.com","email_confidence":"high|medium|low","phone":"555-123-4567 or Not publicly available","phone_source":"company directory|public listing|not available","email_variants":["alt1@domain.com","alt2@domain.com"]}]`;

  try {
    const raw = await generateText(prompt, 2000);
    const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const enriched = JSON.parse(jsonStr);

    // Merge known domain info
    const results = personas.map(p => {
      const aiResult = enriched.find((e: { persona_id: string }) => e.persona_id === p.persona_id) || {};
      const domain = KNOWN_DOMAINS[p.account];
      const emailGuesses = domain ? generateEmailGuesses(p.name, domain) : [];

      return {
        persona_id: p.persona_id,
        name: p.name,
        account: p.account,
        email: aiResult.email || emailGuesses[0] || null,
        email_confidence: aiResult.email_confidence || (domain ? 'medium' : 'low'),
        email_variants: [...new Set([...(aiResult.email_variants || []), ...emailGuesses])].slice(0, 5),
        phone: aiResult.phone === 'Not publicly available' ? null : (aiResult.phone || null),
        phone_source: aiResult.phone_source || 'not available',
      };
    });

    return NextResponse.json({ enriched: results });
  } catch (err) {
    // Fallback: just use domain patterns without AI
    const results = personas.map(p => {
      const domain = KNOWN_DOMAINS[p.account];
      const emailGuesses = domain ? generateEmailGuesses(p.name, domain) : [];
      return {
        persona_id: p.persona_id,
        name: p.name,
        account: p.account,
        email: emailGuesses[0] || null,
        email_confidence: domain ? 'medium' : 'low',
        email_variants: emailGuesses.slice(0, 5),
        phone: null,
        phone_source: 'not available',
      };
    });

    return NextResponse.json({
      enriched: results,
      warning: `AI enrichment failed, using domain patterns only: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

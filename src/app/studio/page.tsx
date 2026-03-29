import { Breadcrumb } from '@/components/breadcrumb';
import { StudioClient } from './studio-client';
import { dbGetAccounts, dbGetPersonas } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Creative Studio — ElevenLabs' };

export default async function StudioPage() {
  const [accounts, personas] = await Promise.all([dbGetAccounts(), dbGetPersonas()]);

  const personasByAccount = personas.reduce<Record<string, Array<{ name: string; title: string | null }>>>((acc, persona) => {
    if (!acc[persona.account_name]) acc[persona.account_name] = [];
    acc[persona.account_name].push({ name: persona.name, title: persona.title ?? null });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Creative Studio' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creative Studio</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Prompt Lab, Asset Packs, Rehearsal Scoring, Mission Handoff, plus ElevenLabs voice tools.
        </p>
      </div>
      <StudioClient
        accounts={accounts.map((account) => ({
          name: account.name,
          vertical: account.vertical,
          priority_band: account.priority_band,
        }))}
        personasByAccount={personasByAccount}
      />
    </div>
  );
}

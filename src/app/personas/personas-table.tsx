'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { EditablePersonaStatus } from '@/components/editable-persona-status';
import { ExternalLink } from 'lucide-react';
import { GeneratorDialog } from '@/components/ai/generator-dialog';
import { EmailComposer } from '@/components/email/composer';
import { VoiceScriptButton } from '@/components/voice-script-button';
import { toast } from 'sonner';

export interface PersonaRow {
  persona_id: string;
  account: string;
  name: string;
  title: string | null;
  priority: string | null;
  persona_lane: string | null;
  email: string | null;
  linkedin_url: string | null;
  persona_status: string | null;
  next_step: string | null;
  slug: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const columns: Column<PersonaRow>[] = [
  { key: 'persona_id', label: 'ID', sortable: true, className: 'font-mono text-xs w-16 hidden sm:table-cell' },
  { key: 'account', label: 'Account', sortable: true, render: (p) => <span className="font-medium">{p.account}</span> },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (p) => p.linkedin_url ? (
      <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {p.name} <ExternalLink className="h-3 w-3" />
      </a>
    ) : <span className="font-medium">{p.name}</span>,
  },
  { key: 'title', label: 'Title', sortable: true, className: 'max-w-48 truncate hidden lg:table-cell' },
  {
    key: 'priority', label: 'Priority', sortable: true,
    render: (p) => <Badge variant={p.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">{p.priority}</Badge>,
  },
  { key: 'persona_lane', label: 'Lane', sortable: true, className: 'hidden md:table-cell' },
  {
    key: 'email' as keyof PersonaRow, label: 'Email', sortable: true, className: 'hidden lg:table-cell',
    render: (p) => p.email ? (
      <button
        className="text-xs text-[var(--primary)] hover:underline truncate max-w-40 inline-block"
        title={`Click to copy: ${p.email}`}
        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.email!); toast.success(`Copied ${p.email}`); }}
      >
        {p.email}
      </button>
    ) : <span className="text-xs text-[var(--muted-foreground)]">—</span>,
  },
  { key: 'persona_status', label: 'Status', sortable: true, render: (p) => <span onClick={(e) => e.stopPropagation()}><EditablePersonaStatus personaId={p.persona_id} currentValue={p.persona_status ?? 'Not started'} /></span> },
  { key: 'next_step', label: 'Next Step', className: 'max-w-48 truncate text-xs hidden xl:table-cell' },
  {
    key: 'persona_id' as keyof PersonaRow,
    label: 'Actions',
    className: 'w-40',
    render: (p) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <GeneratorDialog accountName={p.account} personaName={p.name} defaultType="email" />
        <EmailComposer accountName={p.account} personaName={p.name} personaEmail={p.email ?? undefined} />
        <VoiceScriptButton accountName={p.account} personaName={p.name} />
      </div>
    ),
  },
];

export function PersonasTable({ personas }: { personas: PersonaRow[] }) {
  const router = useRouter();
  return (
    <DataTable
      columns={columns}
      data={personas}
      searchKey="name"
      searchPlaceholder="Search personas..."
      onRowClick={(item) => router.push(`/accounts/${item.slug}`)}
    />
  );
}

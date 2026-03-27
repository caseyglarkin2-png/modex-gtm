import { Breadcrumb } from '@/components/breadcrumb';
import { StudioClient } from './studio-client';

export const metadata = { title: 'Creative Studio — ElevenLabs' };

export default function StudioPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Creative Studio' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creative Studio</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Text-to-Speech, Sound Effects, Voice Clone — powered by ElevenLabs.
        </p>
      </div>
      <StudioClient />
    </div>
  );
}

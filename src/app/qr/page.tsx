import { getQrAssets } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { QrCode, ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata = { title: 'QR Assets' };

export default function QrPage() {
  const assets = getQrAssets();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'QR Assets' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Assets ({assets.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          QR codes for trade shows, leave-behinds, and booth materials. Copy URLs with one click.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((qr) => (
          <Card key={qr.account}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{qr.account}</h3>
                <div className="rounded-md bg-[var(--accent)] p-2">
                  <QrCode className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
              </div>
              <div className="rounded-lg bg-[var(--muted)] p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Audit URL</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <a href={qr.audit_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--primary)] hover:underline break-all flex-1 inline-flex items-center gap-1">
                    {qr.audit_url} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <CopyButton text={qr.audit_url} />
                </div>
              </div>
              <div className="text-xs space-y-1">
                <p><span className="text-[var(--muted-foreground)]">Suggested Use:</span> {qr.suggested_use}</p>
                <p><span className="text-[var(--muted-foreground)]">Proof Asset:</span> {qr.proof_asset}</p>
                <p><span className="text-[var(--muted-foreground)]">Graphic:</span> {qr.graphic_file}</p>
              </div>
              {qr.notes && <p className="text-xs text-[var(--muted-foreground)]">{qr.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

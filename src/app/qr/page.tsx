import { getQrAssets } from '@/lib/data';

export default function QrPage() {
  const assets = getQrAssets();

  return (
    <>
      <h1 className="text-2xl font-bold">QR Assets ({assets.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        QR codes for each account. Use at trade shows, leave-behinds, and event booth materials.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((qr) => (
          <div key={qr.account} className="rounded-lg border border-[var(--border)] p-5">
            <h3 className="font-semibold">{qr.account}</h3>
            <div className="mt-3 rounded bg-[var(--muted)] p-3">
              <p className="text-xs text-[var(--muted-foreground)]">Audit URL</p>
              <a
                href={qr.audit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block text-sm text-[var(--primary)] hover:underline break-all"
              >
                {qr.audit_url}
              </a>
            </div>
            <div className="mt-3 text-xs">
              <p><span className="text-[var(--muted-foreground)]">Suggested Use:</span> {qr.suggested_use}</p>
              <p className="mt-1"><span className="text-[var(--muted-foreground)]">Proof Asset:</span> {qr.proof_asset}</p>
              <p className="mt-1"><span className="text-[var(--muted-foreground)]">Graphic File:</span> {qr.graphic_file}</p>
            </div>
            {qr.notes && <p className="mt-2 text-xs text-[var(--muted-foreground)]">{qr.notes}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

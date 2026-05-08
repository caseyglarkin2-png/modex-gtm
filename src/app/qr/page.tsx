import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { getAuditRoutes, getListsConfig, getQrAssets, slugify } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/copy-button';
import { QrCode, ExternalLink, ArrowRight, ScanSearch } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

async function buildQrDataUrl(value: string, width: number) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width,
    color: {
      dark: '#111827',
      light: '#FFFFFF',
    },
  });
}

export const metadata = { title: 'QR Assets' };

export default async function QrPage() {
  const assets = getQrAssets();
  const listsConfig = getListsConfig();
  const routesByAccount = new Map(getAuditRoutes().map((route) => [route.account, route]));
  const readyToScanCount = assets.length;
  const waveOneCount = assets.filter((asset) => (routesByAccount.get(asset.account)?.rank ?? Number.MAX_SAFE_INTEGER) <= 11).length;
  const warmRouteCount = assets.filter((asset) => {
    const warmRoute = routesByAccount.get(asset.account)?.warm_route ?? '';
    return warmRoute && !/no warm intro/i.test(warmRoute);
  }).length;

  const sprintAssets = [...assets]
    .sort(
      (left, right) =>
        (routesByAccount.get(left.account)?.rank ?? Number.MAX_SAFE_INTEGER) -
        (routesByAccount.get(right.account)?.rank ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 6);

  const topPrintFiles = sprintAssets.slice(0, 4);
  const fallbackQrUrl = listsConfig.qr_journey.master_url;

  const fallbackQrPreview = await buildQrDataUrl(fallbackQrUrl, 220);
  const fallbackQrPrint = await buildQrDataUrl(fallbackQrUrl, 1200);

  const qrPreviews = new Map<string, string>();
  const qrPrints = new Map<string, string>();

  await Promise.all(
    assets.map(async (qr) => {
      const [preview, print] = await Promise.all([
        buildQrDataUrl(qr.audit_url, 220),
        buildQrDataUrl(qr.audit_url, 1200),
      ]);
      qrPreviews.set(qr.account, preview);
      qrPrints.set(qr.account, print);
    }),
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'QR Assets' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Assets ({assets.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          QR codes for trade shows, leave-behinds, and booth materials. Copy URLs with one click.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Ready to scan" value={readyToScanCount} tone="text-emerald-600" />
        <MetricCard label="Wave 1 priority" value={waveOneCount} tone={waveOneCount > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
        <MetricCard label="Warm routes" value={warmRouteCount} tone={warmRouteCount > 0 ? 'text-amber-600' : 'text-[var(--foreground)]'} />
        <MetricCard label="Print assets" value={assets.length} tone="text-[var(--foreground)]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">QR Ready Board</CardTitle>
              <Link href="/audit-routes">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open routes <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sprintAssets.map((qr) => {
                const route = routesByAccount.get(qr.account);
                return (
                  <div key={qr.account} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/accounts/${slugify(qr.account)}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                          {qr.account}
                        </Link>
                        {route?.rank ? <Badge variant="outline" className="text-xs">#{route.rank}</Badge> : null}
                        <Badge variant="secondary" className="text-xs">Booth-ready</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{qr.suggested_use}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Warm route: {route?.warm_route || 'No route noted'} · Graphic: {qr.graphic_file}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Image
                        src={qrPreviews.get(qr.account) ?? ''}
                        alt={`QR code for ${qr.account}`}
                        width={80}
                        height={80}
                        unoptimized
                        className="h-20 w-20 rounded-md border border-[var(--border)] bg-white p-1"
                      />
                      <div className="flex flex-col gap-2">
                        <a href={qr.audit_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm">Open</Button>
                        </a>
                        <CopyButton text={qr.audit_url} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Booth Kit Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-2 text-[var(--foreground)]">
                <ScanSearch className="h-4 w-4" /> Keep the QR large, high-contrast, and paired with the 30-minute audit CTA.
              </span>
            </div>

            <div className="space-y-2">
              {topPrintFiles.map((qr) => (
                <div key={qr.account} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="text-[var(--foreground)]">{qr.account}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{qr.graphic_file}</Badge>
                    <a href={qrPrints.get(qr.account)} target="_blank" rel="noopener noreferrer" download={`${slugify(qr.account)}-qr.png`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Download PNG</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--muted-foreground)]">
              Print target: minimum 2.5 in square, high contrast, and test scan at 3-6 ft before show open.
            </div>

            <div className="rounded-lg border border-[var(--border)] p-3 text-xs">
              <p className="font-medium text-[var(--foreground)]">Fallback master QR</p>
              <p className="mt-1 text-[var(--muted-foreground)]">Use this when account-specific printouts are unavailable at the booth.</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <a href={fallbackQrPrint} target="_blank" rel="noopener noreferrer" download="modex-master-qr.png">
                  <Button variant="outline" size="sm" className="text-xs">Download fallback PNG</Button>
                </a>
                <CopyButton text={fallbackQrUrl} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Master QR Fallback</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="flex justify-center rounded-lg border border-[var(--border)] bg-white p-3">
            <Image
              src={fallbackQrPreview}
              alt="Master fallback QR code"
              width={176}
              height={176}
              unoptimized
              className="h-44 w-44"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted-foreground)]">Fallback path for fast booth traffic if account-specific assets are not available in hand.</p>
            <div className="rounded-lg bg-[var(--muted)] p-3">
              <p className="text-xs text-[var(--muted-foreground)]">Fallback URL</p>
              <div className="mt-1 flex items-center gap-2">
                <a href={fallbackQrUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center gap-1 break-all text-sm text-[var(--primary)] hover:underline">
                  {fallbackQrUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <CopyButton text={fallbackQrUrl} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={fallbackQrPrint} target="_blank" rel="noopener noreferrer" download="modex-master-qr.png">
                <Button variant="outline" size="sm">Download print PNG</Button>
              </a>
              <a href={fallbackQrUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm">Open fallback destination</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">QR Asset Library</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Every account-specific QR below is scannable directly from this page.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((qr) => (
            <Card key={qr.account}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{qr.account}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{routesByAccount.get(qr.account)?.warm_route || 'No warm route noted'}</p>
                  </div>
                  <div className="rounded-md bg-[var(--accent)] p-2">
                    <QrCode className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>
                </div>

                <div className="flex justify-center rounded-lg border border-[var(--border)] bg-white p-3">
                  <Image
                    src={qrPreviews.get(qr.account) ?? ''}
                    alt={`QR code for ${qr.account}`}
                    width={160}
                    height={160}
                    unoptimized
                    className="h-40 w-40"
                  />
                </div>

                <div className="rounded-lg bg-[var(--muted)] p-3">
                  <p className="text-xs text-[var(--muted-foreground)]">Audit URL</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <a href={qr.audit_url} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center gap-1 break-all text-sm text-[var(--primary)] hover:underline">
                      {qr.audit_url} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <CopyButton text={qr.audit_url} />
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="text-[var(--muted-foreground)]">Suggested Use:</span> {qr.suggested_use}</p>
                  <p><span className="text-[var(--muted-foreground)]">Proof Asset:</span> {qr.proof_asset}</p>
                  <p><span className="text-[var(--muted-foreground)]">Graphic:</span> {qr.graphic_file}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <a href={qrPrints.get(qr.account)} target="_blank" rel="noopener noreferrer" download={`${slugify(qr.account)}-qr.png`}>
                    <Button variant="outline" size="sm" className="text-xs">Download print PNG</Button>
                  </a>
                  <a href={qr.audit_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="text-xs">Scan destination</Button>
                  </a>
                </div>
                {qr.notes && <p className="text-xs text-[var(--muted-foreground)]">{qr.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


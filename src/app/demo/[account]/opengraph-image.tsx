import { ImageResponse } from 'next/og';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';

/**
 * D2.6 — Social card for /demo/[account]. Memo aesthetic matching the
 * existing microsite OG cards: cream background, narrow eyebrow, big
 * display name, stats row. No fancy gradients — the network composition
 * is the story, not the theatre.
 */

// nodejs (not edge) — we read the pack JSON directly from the deploy
// filesystem via node:fs. Edge can't.
export const runtime = 'nodejs';
export const alt = 'YardFlow YNS network audit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadPack(slug: string): Promise<DemoPack | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    return DemoPackSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ account: string }> }) {
  const { account } = await params;
  const pack = await loadPack(account);

  if (!pack) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f1e8',
            color: '#1a1a1a',
            fontFamily: 'system-ui',
            fontSize: 36,
            letterSpacing: '0.02em',
          }}
        >
          YardFlow YNS
        </div>
      ),
      size,
    );
  }

  const { displayName, siteCount } = pack.account;
  const { dockDoors, trailerCapacity, railServed } = pack.network.totals;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          background: '#f5f1e8',
          color: '#1a1a1a',
          fontFamily: 'system-ui',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            color: '#8a847b',
            fontSize: 16,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          <span>YardFlow · YNS network audit</span>
          <span>{pack.builtAt.slice(0, 10)}</span>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#8a847b',
            }}
          >
            Yard network for
          </div>
          <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1 }}>
            {displayName}
          </div>
          <div style={{ marginTop: 16, fontSize: 28, color: '#3f3a32', fontWeight: 400 }}>
            {siteCount} facilities · public-record satellite + Street View · geofences modeled
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 64 }}>
          {[
            { value: siteCount.toLocaleString(), label: 'Facilities' },
            { value: dockDoors.toLocaleString(), label: 'Dock doors' },
            { value: trailerCapacity.toLocaleString(), label: 'Trailer spots' },
            { value: railServed.toLocaleString(), label: 'Rail-served' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 48, fontWeight: 600, color: '#1a1a1a', fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#8a847b',
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

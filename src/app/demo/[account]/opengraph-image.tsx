import { ImageResponse } from 'next/og';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';

/**
 * E.T6 — Dynamic social card for /demo/[account] microsites.
 *
 * Dark/neon brand-parity card (matches the gallery + microsite voice):
 * the audited satellite image full-bleed behind a void gradient, the
 * brand name large, an "N facilities audited" caption, a YardFlow
 * wordmark, and a neon accent border. When the account has no satellite
 * thumb yet (the ~32 non-anchor packs), it falls back to the void grid.
 *
 * 1200x630, image/png. runtime=nodejs so we can read the pack JSON and
 * the thumb PNG directly off the deploy filesystem.
 */

export const runtime = 'nodejs';
export const alt = 'YardFlow YNS network audit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NEON = '#00B4FF';
const VOID = '#050505';

async function loadPack(slug: string): Promise<DemoPack | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    return DemoPackSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Read the gallery satellite thumb as a data URI, or null if absent. */
async function loadThumbDataUri(slug: string): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'gallery-thumbs', `${slug}.png`);
    const buf = await fs.readFile(file);
    return `data:image/png;base64,${buf.toString('base64')}`;
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
            background: VOID,
            color: '#fff',
            fontFamily: 'system-ui',
            fontSize: 40,
            letterSpacing: '0.04em',
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
  const thumb = await loadThumbDataUri(account);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: VOID,
          color: '#fff',
          fontFamily: 'system-ui',
          position: 'relative',
          borderBottom: `8px solid ${NEON}`,
        }}
      >
        {/* Satellite backdrop (anchors only), dimmed by a void gradient. */}
        {thumb ? (
          <img
            src={thumb}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.45,
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background:
              'linear-gradient(90deg, rgba(5,5,5,0.95) 35%, rgba(5,5,5,0.55) 100%)',
          }}
        />

        {/* Top row: eyebrow + wordmark */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 17,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
          }}
        >
          <span>Audited network · YardFlow YNS</span>
          <span style={{ color: NEON }}>YardFlow</span>
        </div>

        {/* Title block */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: NEON,
            }}
          >
            Yard network for
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.02, maxWidth: 900 }}>
            {displayName}
          </div>
          <div style={{ marginTop: 8, fontSize: 26, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
            {siteCount.toLocaleString()} facilities audited · public satellite imagery · modeled geofences
          </div>
        </div>

        {/* Stats row */}
        <div style={{ position: 'relative', display: 'flex', gap: 56 }}>
          {[
            { value: siteCount.toLocaleString(), label: 'Facilities' },
            { value: dockDoors.toLocaleString(), label: 'Dock doors' },
            { value: trailerCapacity.toLocaleString(), label: 'Trailer spots' },
            { value: railServed.toLocaleString(), label: 'Rail-served' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 46, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 4,
                  fontWeight: 600,
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

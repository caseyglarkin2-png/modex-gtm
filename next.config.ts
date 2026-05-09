import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // yardflow.ai (flow-state-site) rewrites /for/* and /proposal/* to this app,
  // but does NOT rewrite /_next/* — so without an absolute assetPrefix the
  // browser would request CSS/JS/fonts from yardflow.ai and 404. Pinning
  // assets to the canonical modex-gtm.vercel.app origin lets the browser fetch
  // them directly. CORS is open on Vercel static assets; the corresponding
  // CSP allowance lives in flow-state-site's next.config.js.
  assetPrefix:
    process.env.VERCEL_ENV === 'production'
      ? 'https://modex-gtm.vercel.app'
      : undefined,
  async redirects() {
    return [
      // IA consolidation Sprint B: satellite pages absorbed into Content Studio tabs.
      // /for/ index intentionally NOT redirected here — middleware allowlists /for on
      // yardflow.ai, where /for/page.tsx serves the public landing. The internal
      // domain redirect for /for is handled inside /for/page.tsx.
      { source: '/briefs', destination: '/studio?tab=briefs', permanent: true },
      { source: '/search', destination: '/studio?tab=search-strings', permanent: true },
      { source: '/intel', destination: '/studio?tab=intel', permanent: true },
      { source: '/audit-routes', destination: '/studio?tab=audit-routes', permanent: true },
      { source: '/qr', destination: '/studio?tab=qr-assets', permanent: true },
      { source: '/generated-content', destination: '/studio?tab=generated-content', permanent: true },

      // IA consolidation Sprint D: legacy redirect stubs folded into the routing layer.
      { source: '/activities', destination: '/pipeline?tab=activities', permanent: true },
      { source: '/meetings', destination: '/pipeline?tab=meetings', permanent: true },
      { source: '/personas', destination: '/contacts', permanent: true },
      { source: '/waves', destination: '/campaigns', permanent: true },
      { source: '/waves/campaign', destination: '/campaigns', permanent: true },

      // IA consolidation Sprint D: standalone sub-routes that duplicate canonical tabs.
      { source: '/analytics/emails', destination: '/analytics?tab=email-engagement', permanent: true },
      { source: '/analytics/quarterly', destination: '/analytics?tab=quarterly', permanent: true },
      { source: '/admin/crons', destination: '/ops?tab=cron-health', permanent: true },
      { source: '/admin/generation-metrics', destination: '/ops?tab=generation-metrics', permanent: true },

      // /for index: redirect to Studio Microsites tab on the internal domain.
      // The yardflow.ai branch is excluded via the `missing` host check so the
      // public landing page in src/app/for/page.tsx still renders there.
      // Doing this at the routing layer (instead of inside the page handler's
      // redirect()) avoids a Suspense/streaming race where the layout shell
      // ships first and the in-page redirect() throw never reaches the client.
      {
        source: '/for',
        missing: [{ type: 'host', value: 'yardflow\\.ai' }],
        destination: '/studio?tab=microsites',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps when SENTRY_DSN is set
  disableServerWebpackPlugin: !process.env.SENTRY_DSN,
  disableClientWebpackPlugin: !process.env.SENTRY_DSN,
});

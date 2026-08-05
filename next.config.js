import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const normalizeURL = (value) => {
  if (!value) return undefined
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
}

const NEXT_PUBLIC_SERVER_URL =
  normalizeURL(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  normalizeURL(process.env.__NEXT_PRIVATE_ORIGIN) ||
  'http://localhost:3000'

// Media URLs are built by getMediaUrl()/getClientSideURL() from NEXT_PUBLIC_SERVER_URL
// (and PAYLOAD_PUBLIC_SERVER_URL as a fallback), which can differ from
// VERCEL_PROJECT_PRODUCTION_URL (e.g. localhost in dev while Vercel env vars are also present).
// In production the CMS/media backend is a separate domain (see getCMSURL() in
// src/utilities/getURL.ts and the hardcoded OG image fallbacks) — allowlist every
// candidate host so next/image never rejects a valid media URL.
const IMAGE_HOST_CANDIDATES = [
  NEXT_PUBLIC_SERVER_URL,
  process.env.NEXT_PUBLIC_SERVER_URL,
  process.env.PAYLOAD_PUBLIC_SERVER_URL,
  process.env.PAYLOAD_LOCAL_SERVER_URL,
  'https://admin.rentalmobis.com',
]

// Known production hostnames (also referenced in src/utilities/getURL.ts /
// IMAGE_HOST_CANDIDATES above). admin.rentalmobis.com hosts the Payload admin
// panel, which live-previews frontend pages in an iframe — so it needs to
// stay in frame-ancestors even though it's a different origin from the
// public site.
const FRONTEND_HOST = 'https://rentalmobis.com'
const ADMIN_HOST = 'https://admin.rentalmobis.com'

// Applies to public/frontend routes only (excludes /admin and /api) so the
// Payload admin UI — which needs inline styles/scripts for its own editor
// chrome — is never at risk of being broken by this CSP.
const FRONTEND_CSP = [
  `default-src 'self'`,
  `script-src 'self' https://connect.facebook.net`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${ADMIN_HOST} https://www.facebook.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://www.facebook.com`,
  `frame-src 'none'`,
  `frame-ancestors 'self' ${FRONTEND_HOST} ${ADMIN_HOST}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ')

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Required for the Docker image build — the Dockerfile copies
  // .next/standalone as its runtime server (see Dockerfile's "runner" stage).
  output: 'standalone',
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // Every route: safe headers that don't depend on CSP script/style
        // allowances, so they're fine on /admin and /api too.
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // Frontend-only: CSP and framing rules, kept off /admin and /api so
        // the Payload admin panel (and live preview) are never at risk.
        source: '/((?!admin|api).*)',
        headers: [
          { key: 'Content-Security-Policy', value: FRONTEND_CSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
  // ✅ ADD THIS
  sassOptions: {
    includePaths: [
      'node_modules/@payloadcms/ui/dist/scss',
      'node_modules/@payloadcms/ui/scss',
      'node_modules/bootstrap/scss',
      'node_modules',
    ],
  },
  images: {
    qualities: [75, 82],
    // Next's SSRF guard blocks the image optimizer from fetching hosts that resolve to
    // private/loopback IPs. In production, rentalmobis.com/admin.rentalmobis.com are both
    // routed to this same container via the reverse proxy (see docker-compose VIRTUAL_HOST),
    // so the image optimizer ends up calling itself through a hairpin route that can resolve
    // to an internal IP. remotePatterns above already restricts fetches to these specific,
    // trusted hostnames, so relaxing this check here doesn't open up arbitrary SSRF.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [...new Set(IMAGE_HOST_CANDIDATES.filter(Boolean))]
      .map((item) => {
        try {
          const url = new URL(normalizeURL(item))

          return {
            hostname: url.hostname,
            protocol: url.protocol.replace(':', ''),
          }
        } catch {
          return null
        }
      })
      .filter(Boolean),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

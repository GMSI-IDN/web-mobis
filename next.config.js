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
// Allowlist every candidate host so next/image never rejects a valid media URL.
const IMAGE_HOST_CANDIDATES = [
  NEXT_PUBLIC_SERVER_URL,
  process.env.NEXT_PUBLIC_SERVER_URL,
  process.env.PAYLOAD_PUBLIC_SERVER_URL,
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  productionBrowserSourceMaps: false,
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
    // Local dev serves media from the same localhost origin; Next's SSRF guard blocks
    // the image optimizer from fetching private/loopback IPs by default. Production media
    // hosts are always public domains, so this only relaxes the check in development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
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

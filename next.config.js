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

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  productionBrowserSourceMaps: false,
  // ✅ ADD THIS
  sassOptions: {
    includePaths: [
      'node_modules/@payloadcms/ui/dist/scss',
      'node_modules/@payloadcms/ui/scss',
      'node_modules',
    ],
  },
  images: {
    remotePatterns: [NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */]
      .map((item) => {
        try {
          const url = new URL(item)

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

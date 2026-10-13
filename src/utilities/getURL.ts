import canUseDOM from './canUseDOM'

const trim = (url?: string): string | undefined => {
  if (!url) return undefined
  return url.replace(/\/+$/, '')
}

const HAS_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//
const LOCAL_ADDRESS_REGEX = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(:\d+)?$/i

const normalizeAbsoluteURL = (raw?: string): string | undefined => {
  const value = trim(raw)
  if (!value) return undefined

  const protocol = LOCAL_ADDRESS_REGEX.test(value) ? 'http' : 'https'
  const withProtocol = HAS_PROTOCOL_REGEX.test(value) ? value : `${protocol}://${value}`

  try {
    return new URL(withProtocol).toString().replace(/\/+$/, '')
  } catch {
    return undefined
  }
}

/**
 * Detects whether the current environment is staging or test,
 * or explicitly flagged to block search engine indexing.
 *
 * Evaluates to true if:
 * 1. NEXT_PUBLIC_NO_INDEX === 'true' or NO_INDEX === 'true'
 * 2. NEXT_PUBLIC_IS_STAGING === 'true' or IS_STAGING === 'true'
 * 3. APP_ENV === 'staging' or NEXT_PUBLIC_APP_ENV === 'staging' or NODE_ENV === 'staging'
 * 4. Running in browser on a staging hostname (e.g., stg.rentalmobis.com)
 * 5. Configured URLs (NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SERVER_URL, etc.) contain stg., staging., dev., or test.
 *
 * Evaluates to false on production (rentalmobis.com).
 */
export const isStagingEnvironment = (): boolean => {
  // 1. Explicit anti-indexing / staging environment variables
  if (
    process.env.NEXT_PUBLIC_NO_INDEX === 'true' ||
    process.env.NO_INDEX === 'true' ||
    process.env.NEXT_PUBLIC_IS_STAGING === 'true' ||
    process.env.IS_STAGING === 'true'
  ) {
    return true
  }

  // 2. Explicit environment name flag
  if (
    process.env.APP_ENV === 'staging' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
    process.env.NODE_ENV === 'staging'
  ) {
    return true
  }

  // 3. Client-side hostname check (when running in browser)
  if (canUseDOM && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname.toLowerCase()
    if (
      hostname.startsWith('stg.') ||
      hostname.includes('staging') ||
      hostname.includes('test.') ||
      hostname.includes('dev.')
    ) {
      return true
    }
  }

  // 4. Server-side configured domain inspection
  const candidateUrls = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]

  return candidateUrls.some((url) => {
    if (!url) return false
    return (
      /(^|\/\/)(stg\.|staging\.|dev\.|test\.)/i.test(url) ||
      url.toLowerCase().includes('stg.rentalmobis.com')
    )
  })
}

/**
 * SERVER SIDE URL (dipakai oleh Payload)
 * Prioritas:
 * 1. PAYLOAD_PUBLIC_SERVER_URL (production CMS)
 * 2. NEXT_PUBLIC_SERVER_URL (fallback)
 * 3. Vercel URL
 * 4. localhost
 */
export const getServerSideURL = (): string => {
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    return (
      normalizeAbsoluteURL(process.env.PAYLOAD_PUBLIC_SERVER_URL) ||
      normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SERVER_URL) ||
      normalizeAbsoluteURL(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
      'http://localhost:3000'
    )
  }

  return (
    normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SERVER_URL) ||
    normalizeAbsoluteURL(process.env.PAYLOAD_LOCAL_SERVER_URL) ||
    'http://localhost:3000'
  )
}

/**
 * CLIENT SIDE URL (browser)
 * Ambil langsung dari window kalau ada
 */
export const getClientSideURL = (): string => {
  if (canUseDOM) {
    const { protocol, hostname, port } = globalThis.location
    const portSuffix = port ? `:${port}` : ''
    return `${protocol}//${hostname}${portSuffix}`
  }

  return (
    normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SERVER_URL) ||
    normalizeAbsoluteURL(process.env.PAYLOAD_PUBLIC_SERVER_URL) ||
    normalizeAbsoluteURL(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    ''
  )
}

/**
 * PUBLIC SITE URL (frontend)
 */
export const getPublicURL = (): string => {
  return (
    normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SERVER_URL) ||
    normalizeAbsoluteURL(process.env.PAYLOAD_PUBLIC_SERVER_URL) ||
    (process.env.NODE_ENV === 'production' ? 'https://rentalmobis.com' : 'http://localhost:3000')
  )
}

/**
 * CMS URL (admin dashboard)
 */
export const getCMSURL = (): string => {
  return (
    normalizeAbsoluteURL(process.env.PAYLOAD_PUBLIC_SERVER_URL) ||
    normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SERVER_URL) ||
    (process.env.NODE_ENV === 'production' ? 'https://admin.rentalmobis.com' : 'http://localhost:3000')
  )
}

/**
 * Allowed origins untuk CORS Payload
 */
export const getAllowedOrigins = (): string[] => {
  const origins = [
    'https://rentalmobis.com',
    'https://www.rentalmobis.com',
    'https://admin.rentalmobis.com',
    'http://localhost:3000',
    process.env.PAYLOAD_LOCAL_SERVER_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .map(normalizeAbsoluteURL)
    .filter(Boolean) as string[]

  // remove duplicate
  return [...new Set(origins)]
}

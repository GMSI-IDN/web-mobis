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

  const withProtocol = HAS_PROTOCOL_REGEX.test(value)
    ? value
    : `${LOCAL_ADDRESS_REGEX.test(value) ? 'http' : 'https'}://${value}`

  try {
    return new URL(withProtocol).toString().replace(/\/+$/, '')
  } catch {
    return undefined
  }
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
    normalizeAbsoluteURL(process.env.PAYLOAD_LOCAL_SERVER_URL) ||
    normalizeAbsoluteURL(process.env.NEXT_PUBLIC_SERVER_URL) ||
    'http://localhost:3000'
  )
}

/**
 * CLIENT SIDE URL (browser)
 * Ambil langsung dari window kalau ada
 */
export const getClientSideURL = (): string => {
  if (canUseDOM) {
    const { protocol, hostname, port } = window.location
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
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

// import canUseDOM from './canUseDOM'
// export const getServerSideURL = () => {
//   return (
//     process.env.NEXT_PUBLIC_SERVER_URL ||
//     (process.env.VERCEL_PROJECT_PRODUCTION_URL
//       ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
//       : 'http://localhost:3000')
//   )
// }
// export const getClientSideURL = () => {
//   if (canUseDOM) {
//     const protocol = window.location.protocol
//     const domain = window.location.hostname
//     const port = window.location.port
//     return `${protocol}//${domain}${port ? `:${port}` : ''}`
//   }
//   if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
//     return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
//   }
//   return process.env.NEXT_PUBLIC_SERVER_URL || ''
// }

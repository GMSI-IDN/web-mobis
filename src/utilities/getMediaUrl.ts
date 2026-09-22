/**
 * Processes media resource URL to ensure proper formatting.
 * Sanitizes any dev/staging localhost URLs and ensures relative/production URLs work properly across domains.
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  let cleanUrl = url.trim()

  // Strip localhost or 127.0.0.1 domain from URL if present (e.g. from local DB seed/import)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(cleanUrl)) {
    cleanUrl = cleanUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')
  }

  // If URL already has an external http/https protocol (e.g. https://admin.rentalmobis.com/...), preserve it
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    if (cacheTag && cacheTag !== '') {
      return `${cleanUrl}?${encodeURIComponent(cacheTag)}`
    }
    return cleanUrl
  }

  // Ensure relative path starts with a single slash
  const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`

  if (cacheTag && cacheTag !== '') {
    return `${path}?${encodeURIComponent(cacheTag)}`
  }

  return path
}


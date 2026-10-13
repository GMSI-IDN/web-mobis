const normalizeSiteUrl = (value) => {
  if (!value) return undefined
  const trimmed = value.replace(/\/+$/, '')
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

const SITE_URL =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SERVER_URL) ||
  normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  'https://rentalmobis.com'

const isStaging =
  process.env.NEXT_PUBLIC_NO_INDEX === 'true' ||
  process.env.NO_INDEX === 'true' ||
  process.env.NEXT_PUBLIC_IS_STAGING === 'true' ||
  process.env.IS_STAGING === 'true' ||
  process.env.APP_ENV === 'staging' ||
  process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
  process.env.NODE_ENV === 'staging' ||
  [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ].some(
    (url) =>
      url &&
      (/(^|\/\/)(stg\.|staging\.|dev\.|test\.)/i.test(url) ||
        url.toLowerCase().includes('stg.rentalmobis.com')),
  )

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: isStaging ? ['*'] : ['/posts-sitemap.xml', '/pages-sitemap.xml', '/*', '/posts/*'],
  robotsTxtOptions: {
    policies: isStaging
      ? [
          {
            userAgent: '*',
            disallow: '/',
          },
        ]
      : [
          {
            userAgent: '*',
            disallow: ['/admin', '/admin/*', '/api/*', '/next/preview/*', '/next/exit-preview/*'],
          },
        ],
    additionalSitemaps: isStaging
      ? []
      : [`${SITE_URL}/pages-sitemap.xml`, `${SITE_URL}/posts-sitemap.xml`],
  },
}

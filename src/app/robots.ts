import type { MetadataRoute } from 'next'

import { getPublicURL } from '@/utilities/getURL'

export default function robots(): MetadataRoute.Robots {
  const siteURL = getPublicURL()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*', '/next/preview/*', '/next/exit-preview/*'],
      },
    ],
    sitemap: [`${siteURL}/pages-sitemap.xml`, `${siteURL}/posts-sitemap.xml`],
    host: siteURL,
  }
}

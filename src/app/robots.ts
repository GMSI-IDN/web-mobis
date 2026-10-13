import type { MetadataRoute } from 'next'

import { getPublicURL, isStagingEnvironment } from '@/utilities/getURL'

export default function robots(): MetadataRoute.Robots {
  const siteURL = getPublicURL()
  const isStaging = isStagingEnvironment()

  if (isStaging) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    }
  }

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

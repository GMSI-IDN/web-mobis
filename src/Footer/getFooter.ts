import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const getFooterCached = cache(async () => {
  const payload = await getPayload({ config })

  const footer = await payload.findGlobal({
    slug: 'footer',
    depth: 2, // ✅ penting agar logo relation punya .url
  })

  return footer
})

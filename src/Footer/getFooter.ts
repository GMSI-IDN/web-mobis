import config from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export const getFooterCached = unstable_cache(
  async () => {
    const payload = await getPayload({ config })

    const footer = await payload.findGlobal({
      slug: 'footer',
      depth: 2, // ✅ penting agar logo relation punya .url
    })

    return footer
  },
  ['global_footer'], // cache key
  {
    tags: ['global_footer'], // ✅ tag untuk revalidateTag
  },
)

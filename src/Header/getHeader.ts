import config from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Header as HeaderType } from '@/payload-types'

export const getHeaderCached = unstable_cache(
  async (): Promise<HeaderType> => {
    const payload = await getPayload({ config })

    const header = await payload.findGlobal({
      slug: 'header', // ✅ pastikan slug global kamu benar
    })

    return header as HeaderType
  },
  ['global_header'], // cache key
  {
    tags: ['global_header'], // ✅ tag untuk revalidateTag
  },
)

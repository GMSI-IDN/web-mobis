import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Header as HeaderType } from '@/payload-types'

export const getHeaderCached = cache(async (): Promise<HeaderType> => {
  const payload = await getPayload({ config })

  const header = await payload.findGlobal({
    slug: 'header', // ✅ pastikan slug global kamu benar
  })

  return header as HeaderType
})

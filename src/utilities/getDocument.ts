import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { isKnownOptionalRelationError } from './isMissingRelationError'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  try {
    const page = await payload.find({
      collection,
      depth,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return page.docs[0]
  } catch (error) {
    if (isKnownOptionalRelationError(error)) {
      return null
    }

    throw error
  }
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = (collection: Collection, slug: string) =>
  unstable_cache(async () => getDocument(collection, slug), [collection, slug], {
    tags: [`${collection}_${slug}`],
  })

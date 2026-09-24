import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { isKnownOptionalRelationError } from '@/utilities/isMissingRelationError'
import { buildFaqStructuredData } from '@/utilities/buildFaqStructuredData'
import { buildLocalBusinessStructuredData } from '@/utilities/buildLocalBusinessStructuredData'
import { getPublicURL } from '@/utilities/getURL'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

type LcpBannerPreload = {
  href: string
  imageSrcSet?: string
  imageSizes?: string
}

/**
 * Extract the first active banner image from page layout blocks.
 * Used to inject a `<link rel="preload">` hint with responsive imageSrcSet
 * so the browser starts downloading the right-sized image immediately on mobile/desktop.
 */
function getLcpBannerPreload(layout: any[] | null | undefined): LcpBannerPreload | null {
  if (!Array.isArray(layout)) return null

  for (const block of layout) {
    if (block?.blockType !== 'bannerCarousel') continue
    const slides = block?.slides
    if (!Array.isArray(slides)) continue

    for (const slide of slides) {
      if (slide?.isActive === false) continue
      const bg = slide?.backgroundImage
      if (!bg?.url) continue

      const fallbackSrc = getMediaUrl(bg.url)
      const srcSetEntries: string[] = []
      const payloadSizes = bg?.sizes
      if (payloadSizes) {
        const sizeDefs = [
          { name: 'small', defaultW: 600 },
          { name: 'medium', defaultW: 900 },
          { name: 'large', defaultW: 1400 },
          { name: 'xlarge', defaultW: 1920 },
        ] as const

        for (const { name, defaultW } of sizeDefs) {
          const s = payloadSizes[name]
          if (s?.url) {
            srcSetEntries.push(`${getMediaUrl(s.url)} ${s.width || defaultW}w`)
          }
        }
      }
      if (bg.width) {
        srcSetEntries.push(`${fallbackSrc} ${bg.width}w`)
      }

      return {
        href: fallbackSrc,
        imageSrcSet: srcSetEntries.length > 1 ? srcSetEntries.join(', ') : undefined,
        imageSizes: srcSetEntries.length > 1 ? '100vw' : undefined,
      }
    }
  }

  return null
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
  })

  // Dev-only fallback to avoid empty home during local bootstrap
  if (!page && slug === 'home' && process.env.NODE_ENV !== 'production') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page
  const faqStructuredData = buildFaqStructuredData(layout)
  const localBusinessSchemas = buildLocalBusinessStructuredData(layout, getPublicURL())

  // Preload the LCP banner image so the browser fetches it before CSS/JS parsing
  const lcpBanner = getLcpBannerPreload(layout)

  return (
    <article className="pb-24">
      {lcpBanner && (
        <link
          rel="preload"
          as="image"
          href={lcpBanner.href}
          {...(lcpBanner.imageSrcSet
            ? { imageSrcSet: lcpBanner.imageSrcSet, imageSizes: lcpBanner.imageSizes }
            : {})}
          fetchPriority="high"
        />
      )}
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
      {faqStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      ) : null}
      {localBusinessSchemas.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchemas) }}
        />
      ) : null}
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
  })

  return generateMeta({
    doc: page,
    pathname: decodedSlug === 'home' ? '/' : `/${decodedSlug}`,
  })
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  if (draft) {
    return fetchPageBySlug({ slug, draft: true, overrideAccess: true })
  }

  return getCachedPageBySlug(slug)
})

const getCachedPageBySlug = (slug: string) =>
  unstable_cache(
    () => fetchPageBySlug({ slug, draft: false, overrideAccess: false }),
    [`page_${slug}`],
    { tags: [`page_${slug}`] },
  )()

async function fetchPageBySlug({
  slug,
  draft,
  overrideAccess,
}: {
  slug: string
  draft: boolean
  overrideAccess: boolean
}) {
  const payload = await getPayload({ config: configPromise })
  try {
    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  } catch (error) {
    if (isKnownOptionalRelationError(error) && process.env.NODE_ENV !== 'production') {
      return null
    }

    throw error
  }
}

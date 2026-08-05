import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import PageClient from './page.client'

// Doesn't call draftMode()/cookies()/headers(), so ISR works normally here
// (force-dynamic was neutering the revalidate window below — removed).
export const revalidate = 600
const POSTS_PER_PAGE = 12

const parsePageNumber = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null

  const pageNumber = Number(value)

  if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) return null

  return pageNumber
}

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const sanitizedPageNumber = parsePageNumber(pageNumber)

  if (!sanitizedPageNumber) notFound()

  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: POSTS_PER_PAGE,
    page: sanitizedPageNumber,
    overrideAccess: false,
  })

  if (posts.totalDocs === 0) notFound()
  if (posts.totalPages > 0 && sanitizedPageNumber > posts.totalPages) notFound()

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Artikel Mobis</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={POSTS_PER_PAGE}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  const canonical = pageNumber === '1' ? '/posts' : `/posts/page/${pageNumber}`

  return {
    title: `Artikel Mobis Halaman ${pageNumber || ''}`,
    description:
      'Jelajahi artikel dan informasi terbaru dari Mobis untuk driver online dan mitra rental mobil.',
    alternates: {
      canonical,
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

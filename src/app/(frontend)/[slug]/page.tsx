import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { isMissingRelationError } from '@/utilities/isMissingRelationError'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const isHomepage = decodedSlug === 'home'
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article className="pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />

      {isHomepage ? (
        <section className="container py-5" aria-labelledby="seo-driver-rental-title">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <h2 id="seo-driver-rental-title" className="h4 fw-bold mb-3">
                Rental Mobil Untuk Driver Online
              </h2>
              <p className="mb-3">
                MOBIS menyediakan <strong>rental mobil</strong> dan <strong>sewa kendaraan untuk
                online driver</strong> dengan proses pendaftaran cepat, pembayaran mingguan, dan
                dukungan operasional untuk pengemudi taksi online.
              </p>
              <p className="mb-0">
                Layanan ini juga sering dicari dengan kata kunci seperti
                {' '}
                <em>rental mobile driver online</em>, <em>online diver</em>, atau
                {' '}
                <em>sewa kemdaraam supir online</em>. Di halaman ini, Anda bisa langsung cek area,
                program, dan alur pendaftaran sesuai kebutuhan.
              </p>
            </div>
          </div>
        </section>
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

  const payload = await getPayload({ config: configPromise })
  try {
    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  } catch (error) {
    if (isMissingRelationError(error, 'pages_blocks_registration_form_opts_online_app')) {
      return null
    }

    throw error
  }
})

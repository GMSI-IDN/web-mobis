import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getPublicURL } from './getURL'

const HOMEPAGE_TITLE = 'Sewa Mobil & Rental Driver Online'
const HOMEPAGE_DESCRIPTION =
  'Cari rental driver online terpercaya? MOBIS sedia sewa mobil dan kendaraan untuk taksi online dengan proses cepat, bayar mingguan, & program rent to own.'
const DEFAULT_SOCIAL_IMAGE =
  'https://admin.rentalmobis.com/api/media/file/banner-bebas_pilih_aplikasi-1-1200x630.webp'
const HOMEPAGE_KEYWORDS = [
  'rental mobil',
  'rental mobil driver online',
  'online driver',
  'sewa kendaraan untuk online driver',
  'sewa kendaraan supir online',
]

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const publicUrl = getPublicURL()

  let url = DEFAULT_SOCIAL_IMAGE

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? publicUrl + ogUrl : publicUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  pathname?: string
}): Promise<Metadata> => {
  // Tambahkan metadata dinamis per halaman di return object fungsi ini.
  // Cocok untuk title, description, canonical, Open Graph, Twitter, robots, dan metadata page-specific lain.
  const { doc, pathname } = args
  const publicUrl = getPublicURL()
  const normalizedPath =
    pathname ||
    (doc?.slug
      ? `/${Array.isArray(doc.slug) ? doc.slug.join('/') : doc.slug === 'home' ? '' : doc.slug}`
      : '/')
  const canonicalPath = normalizedPath === '' ? '/' : normalizedPath
  const canonicalUrl =
    canonicalPath === '/'
      ? publicUrl
      : `${publicUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
  const isPost = canonicalPath.startsWith('/posts/')
  const isHomepage = canonicalPath === '/'
  const rawTitle = doc?.meta?.title || doc?.title || 'Mobis'
  const rawDescription = doc?.meta?.description
  const title = isHomepage ? HOMEPAGE_TITLE : rawTitle
  const description = isHomepage
    ? HOMEPAGE_DESCRIPTION
    : rawDescription ||
      'Mobis menyediakan layanan rental mobil untuk driver online dan sewa kendaraan supir online dengan proses pendaftaran cepat.'

  const ogImage = getImageURL(doc?.meta?.image)

  return {
    title,
    description,
    keywords: isHomepage ? HOMEPAGE_KEYWORDS : undefined,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: mergeOpenGraph({
      type: isPost ? 'article' : 'website',
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: title,
            },
          ]
        : undefined,
      title,
      url: canonicalUrl,
      ...(isPost && 'publishedAt' in (doc || {}) && doc?.publishedAt
        ? {
            publishedTime: doc.publishedAt,
            modifiedTime: doc.updatedAt || doc.publishedAt,
          }
        : {}),
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

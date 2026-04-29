import type { Metadata } from 'next'
import React from 'react'

import { getPublicURL } from '@/utilities/getURL'

const siteURL = getPublicURL()
const siteName = 'Rental MOBIS'
const socialImagePath =
  'https://admin.rentalmobis.com/api/media/file/banner-bebas_pilih_aplikasi-1-1200x630.webp'
const defaultTitle = 'Sewa Mobil & Rental Driver Online'
const defaultDescription =
  'Cari rental driver online terpercaya? MOBIS sedia sewa mobil dan kendaraan untuk taksi online dengan proses cepat, bayar mingguan, & program rent to own.'
const primaryKeywords = [
  'rental mobil',
  'rental mobil driver online',
  'online driver',
  'sewa kendaraan untuk online driver',
  'sewa kendaraan supir online',
  'rental mobil untuk driver online',
  'sewa mobil driver online',
  'rental mobil jakarta',
  'rental mobil surabaya',
  'rental mobil bali',
]

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  applicationName: siteName,
  // Tambahkan metadata global website di sini jika ingin berlaku untuk seluruh halaman.
  // Contoh yang cocok: verification, app metadata, robots policy global, alternates global.
  title: {
    default: `${defaultTitle} | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: primaryKeywords,
  category: 'Automotive',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/favicon.png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName,
    url: siteURL,
    title: `${defaultTitle} | ${siteName}`,
    description: defaultDescription,
    images: [
      {
        url: socialImagePath,
        width: 1200,
        height: 630,
        alt: defaultTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${defaultTitle} | ${siteName}`,
    description: defaultDescription,
    images: [socialImagePath],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: siteURL,
      logo: `${siteURL}/favicon.png`,
      description:
        'Layanan rental mobil untuk driver online dengan skema sewa mingguan dan opsi kepemilikan bertahap.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteURL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteURL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'AutoRental',
      name: 'Rental MOBIS',
      url: 'https://rentalmobis.com/',
      logo: 'https://rentalmobis.com/mobis/img/favicon.svg',
      description:
        'Program rental mobil dari PT Global Mobility Service (GMS) Indonesia khusus untuk pengemudi taksi online dengan opsi bayar mingguan dan Rent to Own.',
      areaServed: ['Jabodetabek', 'Surabaya', 'Sidoarjo', 'Gresik', 'Bali', 'Bandung'],
      knowsAbout: primaryKeywords,
      keywords: primaryKeywords.join(', '),
      additionalType: 'https://schema.org/Service',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5.0',
        reviewCount: '125',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'IDR',
        price: '120000',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        name: 'Sewa Mobil Calya / Sigra per Hari',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Rental Mobil Driver Online',
      name: 'Sewa Mobil & Rental Driver Online',
      provider: {
        '@type': 'Organization',
        name: siteName,
        url: siteURL,
      },
      areaServed: ['Jabodetabek', 'Surabaya', 'Sidoarjo', 'Gresik', 'Bali', 'Bandung', 'Malang'],
      keywords: primaryKeywords.join(', '),
      description:
        'Layanan sewa kendaraan dan rental driver online dengan unit siap jalan, perawatan berkala, dan skema pembayaran mingguan.',
      url: siteURL,
    },
  ]

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        {/* Tambahkan script/meta global non-standar di area layout/head terkait bila diperlukan. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  )
}

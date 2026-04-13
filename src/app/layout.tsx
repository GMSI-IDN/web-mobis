import type { Metadata } from 'next'
import React from 'react'

import { getPublicURL } from '@/utilities/getURL'

const siteURL = getPublicURL()
const siteName = 'Mobis'
const socialImagePath = '/opengraph-image'
const defaultTitle = 'Sewa Mobil untuk Driver Online'
const defaultDescription =
  'Mobis menyediakan program rental mobil untuk driver online dengan proses pendaftaran yang cepat, informasi program yang jelas, dan dukungan operasional untuk mitra.'

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
  keywords: [
    'rental mobil',
    'sewa mobil',
    'rental mobil driver online',
    'sewa mobil driver online',
    'mobis',
    'rental mobil jakarta',
    'rental mobil surabaya',
    'rental mobil bali',
  ],
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
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
        alt: 'Mobis rental mobil untuk driver online',
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
        'Mobis adalah website penyewaan kendaraan untuk driver online dengan pilihan mobil Calya dan Sigra, promo pendaftaran, dan program kepemilikan.',
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

import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'id_ID',
  description:
    'Solusi punya mobil untuk taksi online tanpa ribet. Gratis servis rutin, bayar mingguan, dan tersedia opsi jadi hak milik.',
  images: [
    {
      url: 'https://rentalmobis.com/assets/img/Banner.webp',
      width: 1200,
      height: 630,
      alt: 'Program Sewa & Kredit Mobil Taksi Online',
    },
  ],
  siteName: 'Rental MOBIS',
  title: 'Program Sewa & Kredit Mobil Taksi Online | Rental MOBIS',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}

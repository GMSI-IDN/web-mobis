import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'id_ID',
  description:
    'Cari rental driver online terpercaya? MOBIS sedia sewa mobil dan kendaraan untuk taksi online dengan proses cepat, bayar mingguan, & program rent to own.',
  images: [
    {
      url: 'https://admin.rentalmobis.com/api/media/file/banner-bebas_pilih_aplikasi-1-1200x630.webp',
      width: 1200,
      height: 630,
      alt: 'Sewa Mobil & Rental Driver Online',
    },
  ],
  siteName: 'Rental MOBIS',
  title: 'Sewa Mobil & Rental Driver Online | Rental MOBIS',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}

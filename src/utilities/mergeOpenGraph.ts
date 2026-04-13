import type { Metadata } from 'next'
import { getPublicURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'id_ID',
  description:
    'Mobis menyediakan program rental mobil untuk driver online dengan proses pendaftaran yang cepat dan informasi program yang jelas.',
  images: [
    {
      url: `${getPublicURL()}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: 'Mobis rental mobil untuk driver online',
    },
  ],
  siteName: 'Mobis',
  title: 'Mobis',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}

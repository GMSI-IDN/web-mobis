import type { Block } from 'payload'

export const AboutSplitConfig: Block = {
  slug: 'aboutSplit',
  interfaceName: 'AboutSplitBlock',
  fields: [
    { name: 'title', type: 'text', defaultValue: 'Tentang Rental MOBIS', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}

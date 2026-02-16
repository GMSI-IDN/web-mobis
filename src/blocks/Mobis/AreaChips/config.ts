import type { Block } from 'payload'

export const AreaChipsBlock: Block = {
  slug: 'areaChips',
  labels: { singular: 'Area Chips', plural: 'Area Chips' },
  fields: [
    { name: 'title', type: 'text', defaultValue: 'KAMI TERSEDIA DI' },
    {
      name: 'areas',
      type: 'array',
      required: true,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', defaultValue: '#', required: false },
        { name: 'PoolImage', type: 'upload', relationTo: 'media', required: false },
      ],
    },
  ],
}

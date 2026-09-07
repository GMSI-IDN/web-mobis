import type { Block } from 'payload'

export const UnitsAvailableConfig: Block = {
  slug: 'unitsAvailable',
  interfaceName: 'UnitsAvailableBlock',
  fields: [
    { name: 'title', type: 'text', defaultValue: 'UNIT YANG TERSEDIA', required: true },
    { name: 'description', type: 'textarea', required: false },
    {
      name: 'units',
      type: 'array',
      required: true,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'image', type: 'upload', relationTo: 'media', required: false },
        {
          name: 'isNew',
          type: 'checkbox',
          label: 'Unit Baru',
          defaultValue: false,
          admin: {
            description: 'Centang jika unit ini adalah unit baru untuk menampilkan badge "UNIT BARU" di pojok kiri atas.',
          },
        },
      ],
    },
  ],
}

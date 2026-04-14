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
        { name: 'label', type: 'text', required: true }, // contoh: Jabodetabek
        { name: 'PoolImage', type: 'upload', relationTo: 'media', required: false },

        // ✅ daftar lokasi untuk modal
        {
          name: 'pools',
          type: 'array',
          required: false,
          fields: [
            { name: 'name', type: 'text', required: true }, // contoh: Kranggan, Kota Bekasi
            {
              name: 'mapUrl',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Tempel link Google Maps (https://maps.google.com/... atau https://goo.gl/maps/...)',
              },
            },
          ],
        },
      ],
    },
  ],
}

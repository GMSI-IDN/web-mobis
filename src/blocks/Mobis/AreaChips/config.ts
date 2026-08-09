import type { Block } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const AreaChipsBlock: Block = {
  slug: 'areaChips',
  labels: { singular: 'Area Chips', plural: 'Area Chips' },
  fields: [
    { name: 'title', type: 'text', defaultValue: 'KAMI TERSEDIA DI' },
    {
      name: 'description',
      type: 'richText',
      required: false,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'areas',
      type: 'array',
      required: true,
      fields: [
        { name: 'label', type: 'text', required: true }, // contoh: Jabodetabek
        {
          name: 'isPartner',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Centang untuk menampilkan label "Partner Mobis" di atas gambar card.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: false,
          admin: {
            description:
              'Deskripsi singkat layanan di kota ini — tampil langsung di halaman dan dibaca Google (maks. 160 karakter disarankan).',
          },
        },
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

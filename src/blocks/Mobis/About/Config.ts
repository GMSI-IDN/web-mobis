import type { Block } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const AboutSplitConfig: Block = {
  slug: 'aboutSplit',
  interfaceName: 'AboutSplitBlock',
  fields: [
    { name: 'title', type: 'text', defaultValue: 'Tentang Rental MOBIS', required: true },

    // ✅ tetap pakai nama "description", tapi tipe field jadi richText (Lexical)
    {
      name: 'description',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}

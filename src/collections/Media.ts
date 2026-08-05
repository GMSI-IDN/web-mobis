import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { optimizeImageUpload } from '@/lib/media/optimizeImageUpload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Every image size below is re-encoded as WebP at upload time — see
// optimizeImageUpload (converts + compresses the original to <=700KB) and
// each imageSize's formatOptions (converts the derived thumbnails too).
const IMAGE_SIZE_FORMAT_OPTIONS = { format: 'webp' as const, options: { quality: 78 } }

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    beforeOperation: [optimizeImageUpload],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
      {
        name: 'small',
        width: 600,
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
      {
        name: 'medium',
        width: 900,
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
      {
        name: 'large',
        width: 1400,
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
      {
        name: 'xlarge',
        width: 1920,
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        formatOptions: IMAGE_SIZE_FORMAT_OPTIONS,
      },
    ],
  },
}

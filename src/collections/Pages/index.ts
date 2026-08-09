import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import {
  ensurePageVersionIntegrity,
  stripReservedPageFields,
} from './hooks/ensurePageVersionIntegrity'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import { BannerCarouselBlock } from '@/blocks/Mobis/BannerCarousel'
import { AreaChipsBlock } from '@/blocks/Mobis/AreaChips'
import { AboutSplitConfig } from '@/blocks/Mobis/About'
import { UnitsAvailableConfig } from '@/blocks/Mobis/UnitsAvailable'
import { ProgramCardConfig } from '@/blocks/Mobis/ProgramCard'
import { RequirementsConfig } from '@/blocks/Mobis/Requirements'
import { RegistrationFlowConfig } from '@/blocks/Mobis/RegistrationFlow'
import { TestimonialsConfig } from '@/blocks/Mobis/Testimonials'
import { RegistrationFormConfig } from '@/blocks/Mobis/RegistrationForm'
import { FooterSimpleConfig } from '@/blocks/Mobis/FooterSimple'
import { ProgramDualConfig } from '@/blocks/Mobis/ProgramDual'
import { FaqAccordionConfig } from '@/blocks/Mobis/FaqAccordion'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                FormBlock,
                BannerCarouselBlock,
                AreaChipsBlock,
                AboutSplitConfig,
                UnitsAvailableConfig,
                ProgramCardConfig,
                RequirementsConfig,
                RegistrationFlowConfig,
                TestimonialsConfig,
                RegistrationFormConfig,
                FooterSimpleConfig,
                ProgramDualConfig,
                FaqAccordionConfig,
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    beforeOperation: [ensurePageVersionIntegrity],
    beforeValidate: [stripReservedPageFields],
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    // Keep above current row count to avoid hitting version-cap edge cases during saves.
    maxPerDoc: 200,
  },
}

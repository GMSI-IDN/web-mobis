import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'socials',
      type: 'array',
      label: 'Social Media',
      admin: {
        components: {
          RowLabel: '@/Footer/RowLabel', // kalau Anda sudah pakai RowLabel.tsx
        },
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}

// import type { GlobalConfig } from 'payload'

// import { link } from '@/fields/link'
// import { revalidateFooter } from './hooks/revalidateFooter'

// export const Footer: GlobalConfig = {
//   slug: 'footer',
//   access: {
//     read: () => true,
//   },
//   fields: [
//     {
//       name: 'navItems',
//       type: 'array',
//       fields: [
//         link({
//           appearances: false,
//         }),
//       ],
//       maxRows: 6,
//       admin: {
//         initCollapsed: true,
//         components: {
//           RowLabel: '@/Footer/RowLabel#RowLabel',
//         },
//       },
//     },
//   ],
//   hooks: {
//     afterChange: [revalidateFooter],
//   },
// }

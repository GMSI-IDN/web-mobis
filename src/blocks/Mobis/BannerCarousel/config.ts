import type { Block } from 'payload'

export const BannerCarouselBlock: Block = {
  slug: 'bannerCarousel',
  labels: { singular: 'Banner Carousel', plural: 'Banner Carousels' },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slides (Unlimited)',
      required: true,
      minRows: 1,
      fields: [
        { name: 'isActive', type: 'checkbox', defaultValue: true, label: 'Active' },

        // { name: 'title', type: 'text', required: true, label: 'Title' },
        // { name: 'subtitle', type: 'text', label: 'Subtitle' },

        // { name: 'priceText', type: 'text', label: 'Price Text (contoh: 120K)' },
        // { name: 'priceSubText', type: 'text', label: 'Price Sub Text (contoh: PER HARI)' },

        { name: 'ctaText', type: 'text', defaultValue: 'Daftar Sekarang', label: 'CTA Text' },
        { name: 'ctaLink', type: 'text', defaultValue: '/register', label: 'CTA Link' },

        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Background Image',
        },
        {
          name: 'foregroundImage',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: 'Foreground Image (Mobil)',
        },

        {
          name: 'theme',
          type: 'select',
          defaultValue: 'green',
          options: [
            { label: 'Green', value: 'green' },
            { label: 'Blue', value: 'blue' },
            { label: 'Dark', value: 'dark' },
          ],
          label: 'Overlay Theme',
        },
      ],
    },
  ],
}

import type { Block } from 'payload'

export const TestimonialsConfig: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  fields: [
    { name: 'title', type: 'text', defaultValue: 'Testimoni', required: true },

    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' }, // contoh: Pool Bekasi
        { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5 },
        { name: 'text', type: 'textarea', required: true },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
    },

    // opsional: auto slide
    {
      name: 'intervalMs',
      type: 'number',
      defaultValue: 0,
      admin: { description: '0 = disable auto slide' },
    },
  ],
}

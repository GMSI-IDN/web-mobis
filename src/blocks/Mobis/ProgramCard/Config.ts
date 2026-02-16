import type { Block } from 'payload'

export const ProgramCardConfig: Block = {
  slug: 'programCard',
  interfaceName: 'ProgramCardBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'textarea' },
    {
      name: 'bullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'note',
      type: 'text',
    },
    {
      name: 'style',
      type: 'group',
      fields: [
        { name: 'bgClass', type: 'text', defaultValue: 'bg-success' },
        { name: 'textClass', type: 'text', defaultValue: 'text-white' },
      ],
    },
  ],
}

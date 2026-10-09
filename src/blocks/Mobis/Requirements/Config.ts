import type { Block } from 'payload'

export const RequirementsConfig: Block = {
  slug: 'requirements',
  interfaceName: 'RequirementsBlock',
  fields: [
    { name: 'title', type: 'text', defaultValue: 'Persyaratan', required: true },
    {
      name: 'left',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Persyaratan Umum', required: true },
        {
          name: 'items',
          type: 'array',
          required: true,
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'right',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Persyaratan Dokumen', required: true },
        {
          name: 'items',
          type: 'array',
          required: true,
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}

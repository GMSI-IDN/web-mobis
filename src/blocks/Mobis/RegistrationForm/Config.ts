import type { Block } from 'payload'

const optionFields = [
  { name: 'label', type: 'text', required: true },
  { name: 'value', type: 'text', required: true },
] as const

export const RegistrationFormConfig: Block = {
  slug: 'registrationForm',
  interfaceName: 'RegistrationFormBlock',

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'submitLabel', type: 'text', required: true },
    { name: 'successMessage', type: 'text', required: true },

    // 🔽 rename group lebih pendek
    {
      name: 'opts', // ⬅️ sebelumnya selectOptions
      type: 'group',
      admin: { initCollapsed: true },

      fields: [
        {
          name: 'sim',
          type: 'array',
          dbName: 'rf_opt_sim',
          fields: [...optionFields],
        },
        {
          name: 'dom',
          type: 'array',
          dbName: 'rf_opt_dom',
          fields: [...optionFields],
        },
        {
          name: 'house',
          type: 'array',
          dbName: 'rf_opt_house',
          fields: [...optionFields],
        },
        {
          name: 'emRel',
          type: 'array',
          dbName: 'rf_opt_emrel',
          fields: [...optionFields],
        },
        {
          name: 'drvExp',
          type: 'array',
          dbName: 'rf_opt_drvexp',
          fields: [...optionFields],
        },
        {
          name: 'handover',
          type: 'array',
          dbName: 'rf_opt_hand',
          fields: [...optionFields],
        },
        {
          name: 'source',
          type: 'array',
          dbName: 'rf_opt_src',
          fields: [...optionFields],
        },
      ],
    },
  ],
}

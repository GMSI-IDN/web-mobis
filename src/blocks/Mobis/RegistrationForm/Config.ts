import type { Block, Field } from 'payload'

const optionFields = [
  {
    name: 'label',
    type: 'text',
    required: true,
    admin: {
      placeholder: 'Contoh: SIM A',
    },
  },
  {
    name: 'value',
    type: 'text',
    required: true,
    admin: {
      placeholder: 'Contoh: sim_a',
    },
  },
] satisfies Field[]

const makeOptionArray = (name: string, label: string): Field => ({
  name,
  label,
  type: 'array',

  minRows: 0,
  defaultValue: [],

  admin: {
    initCollapsed: true, // ✅ valid untuk array
  },

  fields: optionFields,
})

export const RegistrationFormConfig: Block = {
  slug: 'registrationForm',
  interfaceName: 'RegistrationFormBlock',

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'submitLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'successMessage',
      type: 'text',
      required: true,
    },

    {
      name: 'opts',
      type: 'group',
      label: 'Select Options',
      // ❌ tidak ada admin.initCollapsed di group
      fields: [
        makeOptionArray('sim', 'SIM Type Options'),
        makeOptionArray('dom', 'Domicile Options'),
        makeOptionArray('house', 'House Ownership Options'),
        makeOptionArray('emRel', 'Emergency Relation Options'),
        makeOptionArray('drvExp', 'Driver Experience Options'),
        makeOptionArray('handover', 'Handover Location Options'),
        // CMS-editable "Aplikasi Driver Online" options. Backing table
        // `pages_blocks_registration_form_opts_online_app` is created by migration
        // 20260427_072500_fix_registration_form_online_app (already applied). Any DB
        // that hasn't run it yet must `pnpm migrate` (idempotent, additive-only).
        makeOptionArray('onlineApp', 'Aplikasi Driver Online Options'),
        makeOptionArray('source', 'Source Info Options'),
      ],
    },
  ],
}

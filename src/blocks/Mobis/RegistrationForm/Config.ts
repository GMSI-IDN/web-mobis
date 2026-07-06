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
        // NOTE: "Aplikasi Driver Online" options are intentionally NOT a CMS-editable
        // array — that would require a new table
        // (pages_blocks_registration_form_opts_online_app) and a DB migration. The
        // options are hardcoded in Component.tsx (`defaults.onlineApp`) instead, so no
        // schema change is needed. To make them CMS-editable later, re-enable the line
        // below and run `pnpm migrate` (idempotent migration already exists in repo):
        // makeOptionArray('onlineApp', 'Aplikasi Driver Online Options'),
        makeOptionArray('source', 'Source Info Options'),
      ],
    },
  ],
}

import type { GlobalConfig } from 'payload'

export const MobisWidgetsGlobal: GlobalConfig = {
  slug: 'mobisWidgets',
  label: 'MOBIS Widgets',
  access: {
    read: () => true, // FE bisa GET tanpa login
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: true },

    {
      name: 'floating',
      type: 'group',
      fields: [
        { name: 'registerAnchorId', type: 'text', defaultValue: 'sectionForm' },
        { name: 'showRegister', type: 'checkbox', defaultValue: true },
        { name: 'showStatus', type: 'checkbox', defaultValue: true },
        { name: 'showAssistant', type: 'checkbox', defaultValue: true },
        { name: 'buttonWidth', type: 'number', defaultValue: 225 },
      ],
    },

    {
      name: 'statusWidget',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Registration Mobis Check' },
        {
          name: 'areas',
          type: 'array',
          fields: [{ name: 'label', type: 'text', required: true }],
          defaultValue: [
            { label: 'Jabodetabek' },
            { label: 'Bali' },
            { label: 'Surabaya' },
            { label: 'Sidoarjo' },
            { label: 'Gresik' },
            { label: 'Bandung' },
          ],
        },
        // Ini route internal Next (proxy)
        { name: 'apiPath', type: 'text', defaultValue: '/api/widget/status-check' },
      ],
    },

    {
      name: 'assistantWidget',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Assistants' },
        { name: 'brandText', type: 'text', defaultValue: 'MOBIS' },
        {
          name: 'greeting',
          type: 'text',
          defaultValue: 'Halo saya Assistant MOBIS, ada yang bisa saya bantu?',
        },
        // Ini route internal Next (proxy)
        { name: 'apiBase', type: 'text', defaultValue: '/api/assistant' },
      ],
    },
  ],
}

import type { Block } from 'payload'

export const ProgramDualConfig: Block = {
  slug: 'programDual',
  interfaceName: 'ProgramDualBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Pilihan Program Rental Driver Online',
      admin: { description: 'Judul umum (opsional).' },
    },

    {
      name: 'left',
      type: 'group',
      label: 'Program Kiri',
      fields: [
        { name: 'title', type: 'text', required: true, defaultValue: 'Program Rental Mingguan' },
        {
          name: 'headerImage',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
        { name: 'subtitle', type: 'textarea' },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'note', type: 'text', defaultValue: '*S&K Berlaku' },
      ],
    },

    {
      name: 'right',
      type: 'group',
      label: 'Program Kanan',
      fields: [
        { name: 'title', type: 'text', required: true, defaultValue: 'Program Rental dengan Opsi' },
        {
          name: 'headerImage',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
        { name: 'subtitle', type: 'textarea' },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'note', type: 'text', defaultValue: '*S&K Berlaku' },
      ],
    },

    {
      name: 'requirements',
      type: 'group',
      label: 'Persyaratan (Kartu Kanan)',
      admin: {
        description:
          'Data persyaratan untuk kartu kanan. Jika diisi, akan tampil di kartu kanan Program.',
      },
      fields: [
        {
          name: 'left',
          type: 'group',
          label: 'Persyaratan Umum',
          fields: [
            { name: 'heading', type: 'text', defaultValue: 'Persyaratan Umum' },
            {
              name: 'items',
              type: 'array',
              label: 'Poin Persyaratan Umum',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          name: 'right',
          type: 'group',
          label: 'Persyaratan Dokumen',
          fields: [
            { name: 'heading', type: 'text', defaultValue: 'Persyaratan Dokumen' },
            {
              name: 'items',
              type: 'array',
              label: 'Poin Persyaratan Dokumen',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        { name: 'note', type: 'text', defaultValue: '*S&K Berlaku' },
      ],
    },

    {
      name: 'style',
      type: 'group',
      fields: [
        { name: 'sectionBgClass', type: 'text', defaultValue: 'bg-white' },
        { name: 'cardBgClass', type: 'text', defaultValue: 'bg-success' },
        { name: 'cardTextClass', type: 'text', defaultValue: 'text-white' },
        { name: 'headerImgMaxWidth', type: 'number', defaultValue: 320 },

        // ✅ KEMBALIKAN supaya kolom lama tetap match (hindari rename guess)
        { name: 'centerCards', type: 'checkbox', defaultValue: true },

        // ✅ Field baru (kolom baru)
        { name: 'headerTop', type: 'number', defaultValue: -26 },
        { name: 'bodyTopPadding', type: 'number', defaultValue: 60 },
      ],
    },
  ],
}

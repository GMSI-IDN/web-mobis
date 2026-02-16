import type { CollectionConfig } from 'payload'

export const Vouchers: CollectionConfig = {
  slug: 'vouchers',
  admin: {
    group: 'VoucherPromo',
    useAsTitle: 'code',
    defaultColumns: [
      'code',
      'category',
      'enabled',
      'quota',
      'used',
      'startAt',
      'endAt',
      'createdAt',
    ],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'voucher_categories',
      required: true,
      index: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Uppercase tanpa spasi. Contoh: MOBIS10' },
    },
    { name: 'description', type: 'textarea' },

    { name: 'enabled', type: 'checkbox', defaultValue: true, index: true },

    {
      name: 'quota',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'used',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description: 'Auto bertambah saat promo berhasil dipakai.',
      },
    },

    {
      name: 'startAt',
      type: 'date',
      admin: { description: 'Kosong = berlaku langsung.' },
    },
    {
      name: 'endAt',
      type: 'date',
      admin: { description: 'Kosong = tidak expired.' },
    },
  ],
  timestamps: true,
}

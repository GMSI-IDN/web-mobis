import type { CollectionConfig } from 'payload'

export const VoucherCategories: CollectionConfig = {
  slug: 'voucher_categories',
  admin: {
    group: 'VoucherPromo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'createdAt'],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Contoh: FACEBOOK / INSTAGRAM / BROCHURE / TIKTOK' },
    },
  ],
  timestamps: true,
}

import type { CollectionConfig } from 'payload'

export const VoucherRedemptions: CollectionConfig = {
  slug: 'voucher_redemptions',
  admin: {
    group: 'VoucherPromo',
    useAsTitle: 'id',
    defaultColumns: ['voucher', 'customer', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => !!req.user,
    // dibuat otomatis oleh API registration (public), jadi allow create:
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'voucher',
      type: 'relationship',
      relationTo: 'vouchers',
      required: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers', // ✅ match slug customers kamu
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'APPLIED',
      options: [
        { label: 'Applied', value: 'APPLIED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
    { name: 'notes', type: 'text' },
  ],
  timestamps: true,
}

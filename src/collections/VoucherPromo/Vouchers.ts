import type { CollectionConfig } from 'payload'
import { containsSuspiciousMarkup } from '@/lib/security/sanitize'

// Runs on every create/update through Payload's collection API (Local API,
// REST, and the admin-panel form all go through this), so it's the backend
// half of the layered validation for these fields — mirrors the checks
// already enforced on the public registration/assistant forms.
function validatePlainText(maxLen: number) {
  return (value: unknown) => {
    if (value === undefined || value === null || value === '') return true
    const str = String(value)
    if (str.length > maxLen) return 'Format teks tidak diterima.'
    if (containsSuspiciousMarkup(str)) return 'Format teks tidak diterima.'
    return true
  }
}

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
      validate: validatePlainText(50),
    },
    { name: 'description', type: 'textarea', validate: validatePlainText(500) },

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

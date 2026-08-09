import type { CollectionConfig } from 'payload'
import { containsSuspiciousMarkup } from '@/lib/security/sanitize'

// Runs on every create/update through Payload's collection API (Local API,
// REST, and the admin-panel form all go through this) — backend half of the
// layered validation, mirroring the public registration/assistant forms.
function validatePlainText(maxLen: number) {
  return (value: unknown) => {
    if (value === undefined || value === null || value === '') return true
    const str = String(value)
    if (str.length > maxLen) return 'Format teks tidak diterima.'
    if (containsSuspiciousMarkup(str)) return 'Format teks tidak diterima.'
    return true
  }
}

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
      validate: validatePlainText(100),
    },
  ],
  timestamps: true,
}

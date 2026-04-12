import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    components: {
      beforeList: ['@/components/Customers/BeforeList'],
    },
    description: 'Data user yang sudah mendaftar melalui form pendaftaran Mobis.',
    listSearchableFields: ['name', 'phone', 'ktpNumber', 'domicile', 'promoCode'],
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'phone',
      'ktpNumber',
      'domicile',
      'promoCode',
      'promoApplied',
      'createdAt',
    ],
  },
  labels: {
    singular: 'Pendaftar',
    plural: 'Pendaftar',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: () => false,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    // ===== Structured fields (sesuai RegistrationPayload) =====
    { name: 'name', type: 'text', required: true },
    { name: 'birthPlace', type: 'text' },
    { name: 'birthDate', type: 'text' },

    { name: 'phone', type: 'text' },
    { name: 'ktpNumber', type: 'text', index: true },

    { name: 'simNumber', type: 'text' },
    { name: 'simType', type: 'text' },
    { name: 'simValidUntil', type: 'text' },

    { name: 'domicile', type: 'text', index: true },
    { name: 'currentAddress', type: 'textarea' },
    { name: 'houseOwnership', type: 'text' },

    { name: 'emergencyName', type: 'text' },
    { name: 'emergencyPhone', type: 'text' },
    { name: 'emergencyRelation', type: 'text' },

    { name: 'driverApps', type: 'text' },
    { name: 'activeAccountSelf', type: 'text' },
    { name: 'driverExperience', type: 'text' },

    { name: 'handoverLocation', type: 'text' },
    { name: 'sourceInfo', type: 'text' },

    { name: 'promoCode', type: 'text', index: true },

    // ===== Promo tracking (auto apply) =====
    { name: 'promoApplied', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    { name: 'promoAppliedAt', type: 'date', admin: { readOnly: true } },
    { name: 'voucher', type: 'relationship', relationTo: 'vouchers', admin: { readOnly: true } },
    { name: 'promoError', type: 'text', admin: { readOnly: true } },

    // ===== ✅ FULL BACKUP: simpan seluruh request & hasil sheets =====
    {
      name: 'rawPayload',
      type: 'json',
      admin: {
        description: 'Backup payload mentah dari client (agar tidak ada field yang hilang).',
      },
    },
    {
      name: 'sheetMeta',
      type: 'json',
      admin: {
        description: 'Metadata hasil append ke Google Sheets (spreadsheetId, sheetName, area).',
      },
    },
  ],
  timestamps: true,
}

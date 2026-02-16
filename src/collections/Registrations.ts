import type { CollectionConfig } from 'payload'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'name', 'phone', 'ktpNumber', 'domicile'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'rental_name', type: 'text', required: true },
    { name: 'rental_umur', type: 'text' },
    { name: 'rental_no_ktp', type: 'text' },
    { name: 'rental_domisili', type: 'text', required: true },
    { name: 'rental_phone', type: 'text', required: true },
    { name: 'rental_alamat', type: 'text' },
    { name: 'rental_aplikasi_driver', type: 'text' },
    { name: 'rental_akun_driver_online_atas_nama_diri_sendiri', type: 'text' },
    { name: 'jangka_waktu_bekerja_sebagai_driver_online', type: 'date' },
    { name: 'rental_mengetahui_informasi_dari', type: 'textarea' },
    { name: 'rental_sumber_informasi', type: 'text' },
    { name: 'rental_surveyor', type: 'text' },
    { name: 'rental_status', type: 'text' },
    { name: 'rental_preferensi', type: 'text' },
    { name: 'rental_promo_code', type: 'text' },

    // { name: 'activeAccountSelf', type: 'text' },
    // { name: 'driverExperience', type: 'text' },
    // { name: 'handoverLocation', type: 'text' },
    // { name: 'sourceInfo', type: 'text' },
    // { name: 'promoCode', type: 'text' },

    // audit
    { name: 'userAgent', type: 'text' },
    { name: 'ip', type: 'text' },

    // status opsional
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
}

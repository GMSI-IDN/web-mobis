import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const ChatbotFaqs: CollectionConfig = {
  slug: 'chatbot-faqs',
  labels: {
    singular: 'FAQ Chatbot',
    plural: 'FAQ Chatbot',
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['uuid', 'question', 'environment', 'channel', 'category', 'status', 'updatedAt'],
    group: 'Chatbot',
    components: {
      views: {
        list: {
          Component: '@/components/FaqChatbot',
        },
      },
    },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'uuid',
      type: 'text',
      label: 'Vector UUID',
      admin: {
        description: 'ID UUID pada tabel n8n_vectors (chatBotMobisLocal)',
      },
    },
    {
      name: 'question',
      type: 'text',
      required: true,
      label: 'Pertanyaan',
      admin: {
        placeholder: 'Contoh: Berapa harga sewa mobil Avanza harian?',
      },
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
      label: 'Jawaban',
      admin: {
        placeholder: 'Tuliskan jawaban lengkap yang diharapkan...',
        rows: 4,
      },
    },
    {
      name: 'environment',
      type: 'select',
      required: true,
      defaultValue: 'staging',
      label: 'Environment Database',
      options: [
        { label: 'Staging (Testing / _stg)', value: 'staging' },
        { label: 'Production (Live)', value: 'production' },
        { label: 'All Environments', value: 'all' },
      ],
      admin: {
        description: 'Tentukan lingkungan database vector (stg atau production).',
      },
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      defaultValue: 'dm',
      label: 'Channel / Tipe Asisten',
      options: [
        { label: 'Direct Message (DM)', value: 'dm' },
        { label: 'Comment (Komentar)', value: 'comment' },
        { label: 'All (DM & Comment)', value: 'all' },
      ],
      admin: {
        description: 'Tentukan tipe asisten (DM atau Komentar).',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'umum',
      label: 'Kategori Topik',
      options: [
        { label: 'Sewa Lepas Kunci', value: 'lepas-kunci' },
        { label: 'Sewa Driver', value: 'driver' },
        { label: 'Tarif & Promo', value: 'tarif-promo' },
        { label: 'Persyaratan & Dokumen', value: 'persyaratan' },
        { label: 'Area & Jadwal', value: 'area-jadwal' },
        { label: 'Umum', value: 'umum' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 10,
      label: 'Urutan Prioritas',
      admin: {
        description: 'Urutan angka lebih kecil akan tampil lebih awal.',
      },
    },
  ],
  timestamps: true,
}

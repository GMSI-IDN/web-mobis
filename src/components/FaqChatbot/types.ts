export type FaqEnvironment = 'staging' | 'production' | 'all'
export type FaqChannel = 'dm' | 'comment' | 'all'

export type FaqCategory =
  | 'lepas-kunci'
  | 'driver'
  | 'tarif-promo'
  | 'persyaratan'
  | 'area-jadwal'
  | 'umum'
  | string

export type FaqStatus = 'active' | 'draft' | 'archived'

export type FaqItem = {
  id: string | number
  uuid?: string
  question: string
  answer: string
  environment: FaqEnvironment
  channel: FaqChannel
  category: FaqCategory
  status: FaqStatus
  order?: number
  createdAt?: string
  updatedAt?: string
}

export const CATEGORY_LABELS: Record<string, string> = {
  'lepas-kunci': 'Sewa Lepas Kunci',
  driver: 'Sewa Driver',
  'tarif-promo': 'Tarif & Promo',
  persyaratan: 'Persyaratan & Dokumen',
  'area-jadwal': 'Area & Jadwal',
  umum: 'Umum',
  ADMIN_LOGISTIK: 'Admin Logistik',
  AKUN_GOCAR: 'Akun GoCar',
  AKUN_MAXIM: 'Akun Maxim',
  TARIF_SEWA: 'Tarif Sewa',
}

export const ENVIRONMENT_LABELS: Record<
  FaqEnvironment,
  { label: string; badgeClass: string; desc: string }
> = {
  staging: {
    label: 'Staging (Testing)',
    badgeClass: 'is-staging',
    desc: 'Knowledge base vektor staging (n8n_vectors_mobis_*_stg) sebelum sinkron ke live.',
  },
  production: {
    label: 'Production (Live)',
    badgeClass: 'is-prod',
    desc: 'Knowledge base vektor live (n8n_vectors_mobis_*) yang aktif di publik.',
  },
  all: {
    label: 'Semua Environment',
    badgeClass: 'is-all',
    desc: 'Menampilkan seluruh kumpulan FAQ dari Staging dan Production.',
  },
}

export const CHANNEL_LABELS: Record<
  FaqChannel,
  { label: string; badgeClass: string; desc: string }
> = {
  dm: {
    label: 'Direct Message (DM)',
    badgeClass: 'is-dm',
    desc: 'FAQ untuk asisten obrolan langsung / direct messages (Instagram, Facebook, TikTok DM).',
  },
  comment: {
    label: 'Comment (Komentar)',
    badgeClass: 'is-comment',
    desc: 'FAQ untuk asisten komentar dan auto-reply postingan media sosial.',
  },
  all: {
    label: 'Semua Channel',
    badgeClass: 'is-all',
    desc: 'Menampilkan seluruh channel DM dan Komentar.',
  },
}

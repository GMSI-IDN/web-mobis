import type { BeforeListServerProps } from 'payload'
import { isExcludedLeadName } from '@/lib/customers/testLeadFilter'

import './index.scss'

type CustomerDoc = {
  createdAt?: null | string
  ktpNumber?: null | string
  name?: null | string
  phone?: null | string
  promoApplied?: boolean | null
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

function startOfJakartaDay(date: Date): Date {
  const j = new Date(date.getTime() + JAKARTA_OFFSET_MS)
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JAKARTA_OFFSET_MS)
}

function normalizePhone(value?: null | string): string {
  let digits = (value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  // Strip international dialing prefix 0062 → 62
  if (digits.startsWith('0062')) digits = digits.slice(2)
  // Normalize country code 62xxx → 0xxx
  if (digits.startsWith('62') && digits.length > 10) digits = '0' + digits.slice(2)
  // Must be valid Indonesian format: starts with 0, 9–14 digits (mobile: 10–12, fixed: 9–11)
  if (!digits.startsWith('0') || digits.length < 9 || digits.length > 14) return ''
  return digits
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

async function fetchAllCustomers(params: {
  payload: BeforeListServerProps['payload']
  user: BeforeListServerProps['user']
}): Promise<CustomerDoc[]> {
  const { payload, user } = params
  const LIMIT = 200
  const MAX_PAGES = 500
  const docs: CustomerDoc[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage && page <= MAX_PAGES) {
    const batch = (await payload.find({
      collection: 'customers',
      depth: 0,
      limit: LIMIT,
      overrideAccess: false,
      page,
      user,
      select: { createdAt: true, ktpNumber: true, name: true, phone: true, promoApplied: true },
    })) as { docs: CustomerDoc[]; hasNextPage: boolean }

    for (const doc of batch.docs ?? []) {
      if (!isExcludedLeadName(doc?.name)) docs.push(doc)
    }

    hasNextPage = Boolean(batch.hasNextPage)
    page += 1
  }

  return docs
}

function buildDupSets(docs: CustomerDoc[]): { dupKtps: Set<string>; dupPhones: Set<string> } {
  const ktpCount = new Map<string, number>()
  const phoneCount = new Map<string, number>()
  for (const doc of docs) {
    const ktp = doc.ktpNumber?.trim() ?? ''
    if (ktp) ktpCount.set(ktp, (ktpCount.get(ktp) ?? 0) + 1)
    const phone = normalizePhone(doc.phone)
    if (phone) phoneCount.set(phone, (phoneCount.get(phone) ?? 0) + 1)
  }
  const dupKtps = new Set<string>([...ktpCount.entries()].filter(([, c]) => c > 1).map(([k]) => k))
  const dupPhones = new Set<string>([...phoneCount.entries()].filter(([, c]) => c > 1).map(([k]) => k))
  return { dupKtps, dupPhones }
}

function isRepeatDoc(doc: CustomerDoc, dupKtps: Set<string>, dupPhones: Set<string>): boolean {
  const ktp = doc.ktpNumber?.trim() ?? ''
  const phone = normalizePhone(doc.phone)
  return (ktp !== '' && dupKtps.has(ktp)) || (phone !== '' && dupPhones.has(phone))
}

function computeStats(docs: CustomerDoc[], todayStart: Date) {
  const { dupKtps, dupPhones } = buildDupSets(docs)
  const todayStartMs = todayStart.getTime()
  let todayCount = 0
  let promoCount = 0
  let repeatCount = 0

  for (const doc of docs) {
    if (doc.promoApplied) promoCount++
    if (doc.createdAt) {
      const t = new Date(doc.createdAt).getTime()
      if (!Number.isNaN(t) && t >= todayStartMs) todayCount++
    }
    if (isRepeatDoc(doc, dupKtps, dupPhones)) repeatCount++
  }

  return { todayCount, promoCount, repeatCount }
}

export default async function CustomersBeforeList({ payload, user }: BeforeListServerProps) {
  const now = new Date()
  const todayStart = startOfJakartaDay(now)

  const allDocs = await fetchAllCustomers({ payload, user })
  const { todayCount, promoCount, repeatCount } = computeStats(allDocs, todayStart)

  return (
    <section className="customers-list-summary">
      <div className="customers-list-summary__intro">
        <div>
          <p className="customers-list-summary__eyebrow">Menu Pendaftar</p>
          <h3 className="customers-list-summary__title">Daftar User Yang Sudah Mendaftar</h3>
          <p className="customers-list-summary__description">
            Halaman ini dipakai untuk memonitor user yang masuk dari form pendaftaran Mobis.
            Pembuatan data baru dilakukan dari website, jadi list ini difokuskan untuk review dan
            tindak lanjut.
          </p>
        </div>

        <a className="customers-list-summary__action" href="/admin">
          Kembali ke Dashboard
        </a>
      </div>

      <div className="customers-list-summary__stats">
        <div className="customers-list-summary__stat">
          <span>Total Pendaftar</span>
          <strong>{formatNumber(allDocs.length)}</strong>
        </div>
        <div className="customers-list-summary__stat">
          <span>Pendaftar Hari Ini</span>
          <strong>{formatNumber(todayCount)}</strong>
        </div>
        <div className="customers-list-summary__stat">
          <span>Pakai Promo</span>
          <strong>{formatNumber(promoCount)}</strong>
        </div>
        <div className="customers-list-summary__stat customers-list-summary__stat--repeat">
          <span>Pendaftar Berulang</span>
          <strong>{formatNumber(repeatCount)}</strong>
          <em>
            {allDocs.length > 0
              ? ((repeatCount / allDocs.length) * 100).toFixed(1) + '% dari total'
              : '0%'}
          </em>
        </div>
      </div>

      <div className="customers-list-summary__note">
        <span className="customers-list-summary__note-label">Pencarian cepat</span>
        <strong className="customers-list-summary__note-value">
          Gunakan nama, telepon, KTP, domisili, atau promo code untuk menelusuri pendaftar dengan
          lebih cepat.
        </strong>
      </div>
    </section>
  )
}

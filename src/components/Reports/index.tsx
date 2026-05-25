import type { AdminViewServerProps, Where } from 'payload'
import ReportsTabsClient from './ReportsTabsClient'
import { isExcludedLeadName } from '@/lib/customers/testLeadFilter'

import './index.scss'

type Bucket = {
  count: number
  label: string
  shortLabel: string
  start: Date
  end: Date
}

type CustomerDoc = {
  createdAt?: null | string
  domicile?: null | string
  handoverLocation?: null | string
  ktpNumber?: null | string
  name?: null | string
  phone?: null | string
  promoApplied?: boolean | null
}

type RepeatGroup = {
  count: number
  key: string
  latestName: string
  type: 'ktp' | 'phone'
}

type RepeatStats = {
  newCount: number
  repeatCount: number
  unknownCount: number
  topGroups: RepeatGroup[]
}

type CustomerHistoryItem = {
  createdAt?: null | string
  domicile?: null | string
  id: number | string
  name?: null | string
  phone?: null | string
  promoApplied?: boolean | null
  promoCode?: null | string
}

type RegionStat = {
  count: number
  label: string
  percentage: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

const dayLabelFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Jakarta',
})

const monthLabelFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const yearLabelFormatter = new Intl.DateTimeFormat('id-ID', {
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function normalizeRegionValue(value?: null | string): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function resolveRegionLabel(doc: CustomerDoc): string {
  const handover = normalizeRegionValue(doc.handoverLocation)
  if (handover) return handover

  const domicile = normalizeRegionValue(doc.domicile)
  if (domicile) return domicile

  return 'Wilayah tidak diisi'
}

function toJakartaDate(date: Date) {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

function fromJakartaDate(date: Date) {
  return new Date(date.getTime() - JAKARTA_OFFSET_MS)
}

function startOfJakartaDay(date: Date) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(
    new Date(Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth(), jakarta.getUTCDate(), 0, 0, 0, 0)),
  )
}

function addJakartaDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS)
}

function startOfJakartaWeek(date: Date) {
  const startDay = startOfJakartaDay(date)
  const dayOfWeek = toJakartaDate(startDay).getUTCDay()
  const shift = (dayOfWeek + 6) % 7
  return addJakartaDays(startDay, -shift)
}

function startOfJakartaMonth(date: Date) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(
    new Date(Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth(), 1, 0, 0, 0, 0)),
  )
}

function addJakartaMonths(date: Date, months: number) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(
    new Date(Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth() + months, 1, 0, 0, 0, 0)),
  )
}

function startOfJakartaYear(date: Date) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(new Date(Date.UTC(jakarta.getUTCFullYear(), 0, 1, 0, 0, 0, 0)))
}

function addJakartaYears(date: Date, years: number) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(new Date(Date.UTC(jakarta.getUTCFullYear() + years, 0, 1, 0, 0, 0, 0)))
}

function buildDailyBuckets(now: Date): Bucket[] {
  const todayStart = startOfJakartaDay(now)
  return Array.from({ length: 7 }, (_, idx) => {
    const back = 6 - idx
    const start = addJakartaDays(todayStart, -back)
    const end = addJakartaDays(start, 1)
    return { count: 0, label: dayLabelFormatter.format(start), shortLabel: dayLabelFormatter.format(start), start, end }
  })
}

function buildWeeklyBuckets(now: Date): Bucket[] {
  const thisWeek = startOfJakartaWeek(now)
  return Array.from({ length: 8 }, (_, idx) => {
    const back = 7 - idx
    const start = addJakartaDays(thisWeek, -back * 7)
    const end = addJakartaDays(start, 7)
    const startLabel = dayLabelFormatter.format(start)
    const endLabel = dayLabelFormatter.format(addJakartaDays(end, -1))
    return { count: 0, label: `${startLabel} - ${endLabel}`, shortLabel: `W${idx + 1}`, start, end }
  })
}

function buildMonthlyBuckets(now: Date): Bucket[] {
  const thisMonth = startOfJakartaMonth(now)
  return Array.from({ length: 12 }, (_, idx) => {
    const back = 11 - idx
    const start = addJakartaMonths(thisMonth, -back)
    const end = addJakartaMonths(start, 1)
    return { count: 0, label: monthLabelFormatter.format(start), shortLabel: monthLabelFormatter.format(start), start, end }
  })
}

function buildYearlyBuckets(now: Date): Bucket[] {
  const thisYear = startOfJakartaYear(now)
  return Array.from({ length: 5 }, (_, idx) => {
    const back = 4 - idx
    const start = addJakartaYears(thisYear, -back)
    const end = addJakartaYears(start, 1)
    return { count: 0, label: yearLabelFormatter.format(start), shortLabel: yearLabelFormatter.format(start), start, end }
  })
}

function buildHourlyBucketsForToday(now: Date): Bucket[] {
  const dayStart = startOfJakartaDay(now)
  return Array.from({ length: 24 }, (_, hour) => {
    const start = new Date(dayStart.getTime() + hour * HOUR_MS)
    const end = new Date(start.getTime() + HOUR_MS)
    const jakartaHour = toJakartaDate(start).getUTCHours()
    return {
      count: 0,
      label: `${pad2(jakartaHour)}:00 - ${pad2(jakartaHour)}:59 WIB`,
      shortLabel: `${pad2(jakartaHour)}`,
      start,
      end,
    }
  })
}

// Hydrate bucket counts from an in-memory doc list — O(n * m) where m ≤ 24
function hydrateFromDocs(buckets: Bucket[], docs: CustomerDoc[]) {
  const byStart = new Map<number, Bucket>(buckets.map((b) => [b.start.getTime(), b]))

  for (const doc of docs) {
    if (!doc.createdAt) continue
    const t = new Date(doc.createdAt).getTime()
    if (Number.isNaN(t)) continue

    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start.getTime() && t < buckets[i].end.getTime()) {
        buckets[i].count += 1
        break
      }
    }
  }

  return byStart
}

// Single paginated fetch for all customers — replaces the 56-query hydrateCounts pattern
async function fetchAllCustomers(params: {
  payload: AdminViewServerProps['payload']
  req: AdminViewServerProps['initPageResult']['req']
  where?: Where
}): Promise<CustomerDoc[]> {
  const { payload, req, where } = params
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
      req,
      select: { createdAt: true, domicile: true, handoverLocation: true, ktpNumber: true, name: true, phone: true, promoApplied: true },
      ...(where ? { where } : {}),
    })) as { docs: CustomerDoc[]; hasNextPage: boolean }

    for (const doc of batch.docs ?? []) {
      if (!isExcludedLeadName(doc?.name)) docs.push(doc)
    }

    hasNextPage = Boolean(batch.hasNextPage)
    page += 1
  }

  return docs
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

function buildRepeatStats(docs: CustomerDoc[]): RepeatStats {
  // Group by KTP
  const ktpCountMap = new Map<string, number>()
  const ktpNameMap = new Map<string, string>()
  for (const doc of docs) {
    const ktp = doc.ktpNumber?.trim() ?? ''
    if (!ktp) continue
    ktpCountMap.set(ktp, (ktpCountMap.get(ktp) ?? 0) + 1)
    if (doc.name?.trim()) ktpNameMap.set(ktp, doc.name.trim())
  }

  // Group by phone
  const phoneCountMap = new Map<string, number>()
  const phoneNameMap = new Map<string, string>()
  for (const doc of docs) {
    const phone = normalizePhone(doc.phone)
    if (!phone) continue
    phoneCountMap.set(phone, (phoneCountMap.get(phone) ?? 0) + 1)
    if (doc.name?.trim()) phoneNameMap.set(phone, doc.name.trim())
  }

  const dupKtps = new Set<string>(
    [...ktpCountMap.entries()].filter(([, c]) => c > 1).map(([k]) => k),
  )
  const dupPhones = new Set<string>(
    [...phoneCountMap.entries()].filter(([, c]) => c > 1).map(([k]) => k),
  )

  let newCount = 0
  let repeatCount = 0
  let unknownCount = 0
  for (const doc of docs) {
    const ktp = doc.ktpNumber?.trim() ?? ''
    const phone = normalizePhone(doc.phone)
    if ((ktp && dupKtps.has(ktp)) || (phone && dupPhones.has(phone))) {
      repeatCount++
    } else if (!ktp && !phone) {
      unknownCount++
    } else {
      newCount++
    }
  }

  // KTP-based groups
  const topGroups: RepeatGroup[] = []
  for (const [ktp, count] of ktpCountMap) {
    if (count > 1) topGroups.push({ count, key: ktp, latestName: ktpNameMap.get(ktp) ?? '-', type: 'ktp' })
  }

  // Phone-based groups — skip docs already covered by a KTP duplicate
  const filteredPhoneCount = new Map<string, number>()
  const filteredPhoneName = new Map<string, string>()
  for (const doc of docs) {
    const ktp = doc.ktpNumber?.trim() ?? ''
    if (ktp && dupKtps.has(ktp)) continue
    const phone = normalizePhone(doc.phone)
    if (!phone) continue
    filteredPhoneCount.set(phone, (filteredPhoneCount.get(phone) ?? 0) + 1)
    if (doc.name?.trim()) filteredPhoneName.set(phone, doc.name.trim())
  }
  for (const [phone, count] of filteredPhoneCount) {
    if (count > 1) topGroups.push({ count, key: phone, latestName: filteredPhoneName.get(phone) ?? '-', type: 'phone' })
  }

  topGroups.sort((a, b) => b.count - a.count)
  return { newCount, repeatCount, unknownCount, topGroups: topGroups.slice(0, 50) }
}

function buildRegionStatsFromDocs(docs: CustomerDoc[], topLimit: number): RegionStat[] {
  const map = new Map<string, number>()
  let total = 0

  for (const doc of docs) {
    const label = resolveRegionLabel(doc)
    map.set(label, (map.get(label) ?? 0) + 1)
    total += 1
  }

  return Array.from(map.entries())
    .map(([label, count]) => ({
      count,
      label,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topLimit) as RegionStat[]
}

function countInRange(docs: CustomerDoc[], start: Date, end: Date): number {
  return docs.filter((doc) => {
    if (!doc.createdAt) return false
    const t = new Date(doc.createdAt).getTime()
    return !Number.isNaN(t) && t >= start.getTime() && t < end.getTime()
  }).length
}

function formatDelta(current: number, previous: number): { sign: string; text: string; up: boolean } | null {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return { sign: '+', text: `+${current} (baru)`, up: true }
  const diff = current - previous
  const sign = diff >= 0 ? '+' : ''
  return { sign, text: `${sign}${diff} vs periode lalu`, up: diff >= 0 }
}

export default async function ReportsView({
  payload,
  initPageResult,
}: AdminViewServerProps) {
  const req = initPageResult.req
  const now = new Date()

  // Build all time buckets
  const daily = buildDailyBuckets(now)
  const weekly = buildWeeklyBuckets(now)
  const monthly = buildMonthlyBuckets(now)
  const yearly = buildYearlyBuckets(now)
  const hourly = buildHourlyBucketsForToday(now)

  // Time boundaries for delta comparisons
  const todayStart = startOfJakartaDay(now)
  const yesterdayStart = addJakartaDays(todayStart, -1)
  const thisWeekStart = startOfJakartaWeek(now)
  const prevWeekStart = addJakartaDays(thisWeekStart, -7)
  const thisMonthStart = startOfJakartaMonth(now)
  const prevMonthStart = addJakartaMonths(thisMonthStart, -1)
  const thisYearStart = startOfJakartaYear(now)
  const prevYearStart = addJakartaYears(thisYearStart, -1)

  // Fetch all customers once — replaces 56+ separate queries
  const [allDocs, recent] = await Promise.all([
    fetchAllCustomers({ payload, req }),
    payload.find({
      collection: 'customers',
      depth: 0,
      limit: 30,
      overrideAccess: false,
      req,
      sort: '-createdAt',
      select: { createdAt: true, domicile: true, id: true, name: true, phone: true, promoApplied: true, promoCode: true },
    }),
  ])

  // Hydrate all buckets from in-memory docs
  hydrateFromDocs(daily, allDocs)
  hydrateFromDocs(weekly, allDocs)
  hydrateFromDocs(monthly, allDocs)
  hydrateFromDocs(yearly, allDocs)
  hydrateFromDocs(hourly, allDocs)

  // Derive stats from in-memory docs
  const totalDocs = allDocs.length
  const promoDocs = allDocs.filter((doc) => Boolean(doc.promoApplied)).length
  const promoRatePct = totalDocs > 0 ? (promoDocs / totalDocs) * 100 : 0

  const regionStats = buildRegionStatsFromDocs(allDocs, 10)
  const repeatStats = buildRepeatStats(allDocs)

  // Current period counts
  const dayCount = daily.at(-1)?.count ?? 0
  const weekCount = weekly.at(-1)?.count ?? 0
  const monthCount = monthly.at(-1)?.count ?? 0
  const yearCount = yearly.at(-1)?.count ?? 0

  // Previous period counts for delta
  const prevDayCount = countInRange(allDocs, yesterdayStart, todayStart)
  const prevWeekCount = countInRange(allDocs, prevWeekStart, thisWeekStart)
  const prevMonthCount = countInRange(allDocs, prevMonthStart, thisMonthStart)
  const prevYearCount = countInRange(allDocs, prevYearStart, thisYearStart)

  const dayDelta = formatDelta(dayCount, prevDayCount)
  const weekDelta = formatDelta(weekCount, prevWeekCount)
  const monthDelta = formatDelta(monthCount, prevMonthCount)
  const yearDelta = formatDelta(yearCount, prevYearCount)

  const recentDocs = ((recent as { docs: CustomerHistoryItem[] }).docs ?? [])
    .filter((item) => !isExcludedLeadName(item.name))
    .slice(0, 15)

  const fmt = new Intl.NumberFormat('id-ID')

  return (
    <div className="mobis-reports">
      <section className="mobis-reports__hero">
        <div>
          <p className="mobis-reports__eyebrow">Laporan Pendaftar</p>
          <h2 className="mobis-reports__title">Statistik Per Hari, Minggu, Bulan, dan Tahun</h2>
          <p className="mobis-reports__description">
            Data diambil langsung dari koleksi <strong>customers</strong>. Entri test
            (nama mengandung "test"/"punten") sudah dikeluarkan dari semua angka.
          </p>
        </div>

        <div className="mobis-reports__hero-actions">
          <a className="mobis-reports__action mobis-reports__action--secondary" href="/admin">
            Dashboard Utama
          </a>
          <a className="mobis-reports__action" href="/admin/collections/customers">
            Buka Data Pendaftar
          </a>
        </div>
      </section>

      <section className="mobis-reports__stats">
        <article className="mobis-reports__stat-card">
          <span>Hari Ini</span>
          <strong>{fmt.format(dayCount)}</strong>
          {dayDelta ? (
            <em className={dayDelta.up ? 'is-up' : 'is-down'}>{dayDelta.text}</em>
          ) : null}
        </article>

        <article className="mobis-reports__stat-card">
          <span>Minggu Ini</span>
          <strong>{fmt.format(weekCount)}</strong>
          {weekDelta ? (
            <em className={weekDelta.up ? 'is-up' : 'is-down'}>{weekDelta.text}</em>
          ) : null}
        </article>

        <article className="mobis-reports__stat-card">
          <span>Bulan Ini</span>
          <strong>{fmt.format(monthCount)}</strong>
          {monthDelta ? (
            <em className={monthDelta.up ? 'is-up' : 'is-down'}>{monthDelta.text}</em>
          ) : null}
        </article>

        <article className="mobis-reports__stat-card">
          <span>Tahun Ini</span>
          <strong>{fmt.format(yearCount)}</strong>
          {yearDelta ? (
            <em className={yearDelta.up ? 'is-up' : 'is-down'}>{yearDelta.text}</em>
          ) : null}
        </article>

        <article className="mobis-reports__stat-card">
          <span>Total Pendaftar</span>
          <strong>{fmt.format(totalDocs)}</strong>
        </article>

        <article className="mobis-reports__stat-card">
          <span>Pakai Promo</span>
          <strong>{fmt.format(promoDocs)}</strong>
          <em>{promoRatePct.toFixed(1)}% dari total</em>
        </article>

        <article className="mobis-reports__stat-card">
          <span>Pendaftar Baru</span>
          <strong>{fmt.format(repeatStats.newCount)}</strong>
          <em>
            {totalDocs > 0 ? ((repeatStats.newCount / totalDocs) * 100).toFixed(1) + '% dari total' : '0%'}
          </em>
        </article>

        <article className="mobis-reports__stat-card">
          <span>Pendaftar Berulang</span>
          <strong>{fmt.format(repeatStats.repeatCount)}</strong>
          <em>
            {totalDocs > 0 ? ((repeatStats.repeatCount / totalDocs) * 100).toFixed(1) + '% dari total' : '0%'}
          </em>
        </article>
      </section>

      <ReportsTabsClient
        daily={daily.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        hourly={hourly.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        monthly={monthly.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        promoDocs={promoDocs}
        regionStats={regionStats}
        repeatStats={repeatStats}
        recentDocs={recentDocs.map((item) => ({
          createdAt: item.createdAt ?? null,
          domicile: item.domicile ?? null,
          id: item.id,
          name: item.name ?? null,
          phone: item.phone ?? null,
          promoApplied: item.promoApplied ?? null,
          promoCode: item.promoCode ?? null,
        }))}
        recentTotalDocs={totalDocs}
        totalDocs={totalDocs}
        weekly={weekly.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        yearly={yearly.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
      />
    </div>
  )
}

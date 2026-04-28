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

type CustomerHistoryItem = {
  createdAt?: null | string
  domicile?: null | string
  id: number | string
  name?: null | string
  phone?: null | string
  promoApplied?: boolean | null
  promoCode?: null | string
}

type CustomerCountDoc = {
  name?: null | string
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

function toJakartaDate(date: Date) {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

function fromJakartaDate(date: Date) {
  return new Date(date.getTime() - JAKARTA_OFFSET_MS)
}

function startOfJakartaDay(date: Date) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(
    new Date(
      Date.UTC(
        jakarta.getUTCFullYear(),
        jakarta.getUTCMonth(),
        jakarta.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    ),
  )
}

function addJakartaDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS)
}

function startOfJakartaWeek(date: Date) {
  const startDay = startOfJakartaDay(date)
  const dayOfWeek = toJakartaDate(startDay).getUTCDay()
  const shift = (dayOfWeek + 6) % 7 // Monday = 0
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

    return {
      count: 0,
      label: dayLabelFormatter.format(start),
      shortLabel: dayLabelFormatter.format(start),
      start,
      end,
    }
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

    return {
      count: 0,
      label: `${startLabel} - ${endLabel}`,
      shortLabel: `W${idx + 1}`,
      start,
      end,
    }
  })
}

function buildMonthlyBuckets(now: Date): Bucket[] {
  const thisMonth = startOfJakartaMonth(now)

  return Array.from({ length: 12 }, (_, idx) => {
    const back = 11 - idx
    const start = addJakartaMonths(thisMonth, -back)
    const end = addJakartaMonths(start, 1)

    return {
      count: 0,
      label: monthLabelFormatter.format(start),
      shortLabel: monthLabelFormatter.format(start),
      start,
      end,
    }
  })
}

function buildYearlyBuckets(now: Date): Bucket[] {
  const thisYear = startOfJakartaYear(now)

  return Array.from({ length: 5 }, (_, idx) => {
    const back = 4 - idx
    const start = addJakartaYears(thisYear, -back)
    const end = addJakartaYears(start, 1)

    return {
      count: 0,
      label: yearLabelFormatter.format(start),
      shortLabel: yearLabelFormatter.format(start),
      start,
      end,
    }
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

async function hydrateCounts(
  buckets: Bucket[],
  payload: AdminViewServerProps['payload'],
  req: AdminViewServerProps['initPageResult']['req'],
) {
  const counts = await Promise.all(
    buckets.map(async (bucket) => {
      return countNonExcludedCustomers({
        payload,
        req,
        where: {
          and: [
            {
              createdAt: {
                greater_than_equal: bucket.start.toISOString(),
              },
            },
            {
              createdAt: {
                less_than: bucket.end.toISOString(),
              },
            },
          ],
        },
      })
    }),
  )

  return buckets.map((bucket, idx) => ({
    ...bucket,
    count: counts[idx] ?? 0,
  }))
}

async function countNonExcludedCustomers(params: {
  payload: AdminViewServerProps['payload']
  req: AdminViewServerProps['initPageResult']['req']
  where?: Where
}) {
  const { payload, req, where } = params
  const LIMIT = 200
  const MAX_PAGES = 100
  let page = 1
  let hasNextPage = true
  let total = 0

  while (hasNextPage && page <= MAX_PAGES) {
    const batch = (await payload.find({
      collection: 'customers',
      depth: 0,
      limit: LIMIT,
      overrideAccess: false,
      page,
      req,
      where,
      select: {
        name: true,
      },
    })) as {
      docs: CustomerCountDoc[]
      hasNextPage: boolean
    }

    total += (batch.docs || []).reduce((sum, doc) => {
      return sum + (isExcludedLeadName(doc?.name) ? 0 : 1)
    }, 0)

    hasNextPage = Boolean(batch.hasNextPage)
    page += 1
  }

  return total
}

export default async function ReportsView({
  payload,
  initPageResult,
}: AdminViewServerProps) {
  const req = initPageResult.req
  const now = new Date()

  const [daily, weekly, monthly, yearly, hourly, totalDocs, promoDocs, recent] = await Promise.all([
    hydrateCounts(buildDailyBuckets(now), payload, req),
    hydrateCounts(buildWeeklyBuckets(now), payload, req),
    hydrateCounts(buildMonthlyBuckets(now), payload, req),
    hydrateCounts(buildYearlyBuckets(now), payload, req),
    hydrateCounts(buildHourlyBucketsForToday(now), payload, req),
    countNonExcludedCustomers({
      payload,
      req,
    }),
    countNonExcludedCustomers({
      payload,
      req,
      where: {
        promoApplied: {
          equals: true,
        },
      },
    }),
    payload.find({
      collection: 'customers',
      depth: 0,
      limit: 120,
      overrideAccess: false,
      req,
      sort: '-createdAt',
      select: {
        createdAt: true,
        domicile: true,
        id: true,
        name: true,
        phone: true,
        promoApplied: true,
        promoCode: true,
      },
    }),
  ])

  const dayCount = daily[daily.length - 1]?.count ?? 0
  const weekCount = weekly[weekly.length - 1]?.count ?? 0
  const monthCount = monthly[monthly.length - 1]?.count ?? 0
  const yearCount = yearly[yearly.length - 1]?.count ?? 0
  const recentDocs = (recent.docs as CustomerHistoryItem[])
    .filter((item) => !isExcludedLeadName(item.name))
    .slice(0, 15)

  return (
    <div className="mobis-reports">
      <section className="mobis-reports__hero">
        <div>
          <p className="mobis-reports__eyebrow">Laporan Pendaftar</p>
          <h2 className="mobis-reports__title">Statistik Per Hari, Minggu, Bulan, dan Tahun</h2>
          <p className="mobis-reports__description">
            Data diambil langsung dari koleksi <strong>customers</strong> yang sudah ada, tanpa
            membuat tabel baru.
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
          <strong>{new Intl.NumberFormat('id-ID').format(dayCount)}</strong>
        </article>
        <article className="mobis-reports__stat-card">
          <span>Minggu Ini</span>
          <strong>{new Intl.NumberFormat('id-ID').format(weekCount)}</strong>
        </article>
        <article className="mobis-reports__stat-card">
          <span>Bulan Ini</span>
          <strong>{new Intl.NumberFormat('id-ID').format(monthCount)}</strong>
        </article>
        <article className="mobis-reports__stat-card">
          <span>Tahun Ini</span>
          <strong>{new Intl.NumberFormat('id-ID').format(yearCount)}</strong>
        </article>
        <article className="mobis-reports__stat-card">
          <span>Total Pendaftar</span>
          <strong>{new Intl.NumberFormat('id-ID').format(totalDocs)}</strong>
        </article>
        <article className="mobis-reports__stat-card">
          <span>Pakai Promo</span>
          <strong>{new Intl.NumberFormat('id-ID').format(promoDocs)}</strong>
        </article>
      </section>

      <ReportsTabsClient
        daily={daily.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        hourly={hourly.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        monthly={monthly.map(({ count, label, shortLabel }) => ({ count, label, shortLabel }))}
        promoDocs={promoDocs}
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

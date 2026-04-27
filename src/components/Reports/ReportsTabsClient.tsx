'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Bucket = {
  count: number
  label: string
  shortLabel: string
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

type Panel = 'custom' | 'hourly' | 'history' | 'trend'
type CustomAccordionPanel = 'top-hours' | 'trend'
type TrendGranularity = 'day' | 'month' | 'week'

type Props = {
  daily: Bucket[]
  hourly: Bucket[]
  monthly: Bucket[]
  promoDocs: number
  recentDocs: CustomerHistoryItem[]
  recentTotalDocs: number
  totalDocs: number
  weekly: Bucket[]
  yearly: Bucket[]
}

type CustomerRangeDoc = {
  createdAt?: null | string
  promoApplied?: boolean | null
}

type CustomersListResponse = {
  docs: CustomerRangeDoc[]
  hasNextPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

type CustomSummaryState = {
  averagePerDay: number
  customTrends: Record<TrendGranularity, TrendBucket[]>
  endISO: string
  growthVsPrevRangePct: number
  isTruncated: boolean
  promoDocs: number
  promoRatePct: number
  rangeDays: number
  startISO: string
  topHours: Bucket[]
  totalDocs: number
}

type TrendBucket = {
  count: number
  deltaFromPrev: number | null
  label: string
  shortLabel: string
}

type TrendSeedBucket = {
  count: number
  end: Date
  label: string
  shortLabel: string
  start: Date
}

const MIN_TOP_HOURS = 3
const MAX_TOP_HOURS = 10
const DAY_MS = 24 * 60 * 60 * 1000
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

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatDateTime(value?: null | string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return dateTimeFormatter.format(date)
}

function displayText(value?: null | string) {
  return value?.trim() || '-'
}

function toInputDateTimeValue(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

function toJakartaHour(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCHours()
}

function clampTopLimit(value: number) {
  if (Number.isNaN(value)) return MIN_TOP_HOURS
  return Math.min(MAX_TOP_HOURS, Math.max(MIN_TOP_HOURS, value))
}

function toJakartaDate(date: Date) {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

function fromJakartaDate(date: Date) {
  return new Date(date.getTime() - JAKARTA_OFFSET_MS)
}

function addJakartaDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS)
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

function startOfJakartaWeek(date: Date) {
  const dayStart = startOfJakartaDay(date)
  const dayOfWeek = toJakartaDate(dayStart).getUTCDay()
  const shift = (dayOfWeek + 6) % 7
  return addJakartaDays(dayStart, -shift)
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

function getTrendPeriodStart(date: Date, granularity: TrendGranularity) {
  if (granularity === 'day') return startOfJakartaDay(date)
  if (granularity === 'week') return startOfJakartaWeek(date)
  return startOfJakartaMonth(date)
}

function getTrendPeriodEnd(periodStart: Date, granularity: TrendGranularity) {
  if (granularity === 'day') return addJakartaDays(periodStart, 1)
  if (granularity === 'week') return addJakartaDays(periodStart, 7)
  return addJakartaMonths(periodStart, 1)
}

function getTrendLabel(periodStart: Date, periodEnd: Date, granularity: TrendGranularity, index: number) {
  if (granularity === 'day') {
    const label = dayLabelFormatter.format(periodStart)
    return { label, shortLabel: label }
  }

  if (granularity === 'week') {
    const startLabel = dayLabelFormatter.format(periodStart)
    const endLabel = dayLabelFormatter.format(addJakartaDays(periodEnd, -1))
    return { label: `${startLabel} - ${endLabel}`, shortLabel: `W${index + 1}` }
  }

  const label = monthLabelFormatter.format(periodStart)
  return { label, shortLabel: label }
}

function toTrendBuckets(buckets: Pick<Bucket, 'count' | 'label' | 'shortLabel'>[]): TrendBucket[] {
  return buckets.map((bucket, idx) => ({
    count: bucket.count,
    deltaFromPrev: idx > 0 ? bucket.count - buckets[idx - 1].count : null,
    label: bucket.label,
    shortLabel: bucket.shortLabel,
  }))
}

function buildTrendSeed(startDate: Date, endDate: Date, granularity: TrendGranularity): TrendSeedBucket[] {
  const safeStart = new Date(Math.min(startDate.getTime(), endDate.getTime()))
  const safeEnd = new Date(Math.max(startDate.getTime(), endDate.getTime()))
  const initialStart = getTrendPeriodStart(safeStart, granularity)
  const endBoundary = getTrendPeriodEnd(getTrendPeriodStart(safeEnd, granularity), granularity)

  const buckets: TrendSeedBucket[] = []
  let cursor = initialStart
  let index = 0

  while (cursor < endBoundary && index < 1200) {
    const periodStart = cursor
    const periodEnd = getTrendPeriodEnd(periodStart, granularity)
    const { label, shortLabel } = getTrendLabel(periodStart, periodEnd, granularity, index)

    buckets.push({
      count: 0,
      end: periodEnd,
      label,
      shortLabel,
      start: periodStart,
    })

    cursor = periodEnd
    index += 1
  }

  return buckets
}

function buildCustomTrendBuckets(
  docs: CustomerRangeDoc[],
  startDate: Date,
  endDate: Date,
  granularity: TrendGranularity,
): TrendBucket[] {
  const seeds = buildTrendSeed(startDate, endDate, granularity)
  const idxByStart = new Map<number, number>(
    seeds.map((bucket, idx) => [bucket.start.getTime(), idx] as const),
  )

  for (const doc of docs) {
    if (!doc.createdAt) continue
    const date = new Date(doc.createdAt)
    if (Number.isNaN(date.getTime())) continue

    const periodStart = getTrendPeriodStart(date, granularity).getTime()
    const idx = idxByStart.get(periodStart)
    if (idx === undefined) continue

    seeds[idx].count += 1
  }

  return toTrendBuckets(seeds)
}

function formatTrendDelta(deltaFromPrev: number | null) {
  if (deltaFromPrev === null) return 'Periode awal'
  if (deltaFromPrev === 0) return 'Stabil'

  const abs = formatCompactNumber(Math.abs(deltaFromPrev))
  return deltaFromPrev > 0 ? `Naik ${abs}` : `Turun ${abs}`
}

async function api<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || `Request failed: ${response.status}`)

  return data as T
}

function Bars({
  buckets,
  title,
}: {
  buckets: Bucket[]
  title: string
}) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count))

  return (
    <section className="mobis-reports__panel">
      <div className="mobis-reports__panel-head">
        <h5>{title}</h5>
      </div>

      <div className="mobis-reports__bars">
        {buckets.map((bucket) => {
          const ratio = bucket.count / max
          const height = `${Math.max(6, Math.round(ratio * 100))}%`

          return (
            <div className="mobis-reports__bar-wrap" key={`${title}-${bucket.label}`}>
              <div className="mobis-reports__bar-meta">{formatCompactNumber(bucket.count)}</div>
              <div className="mobis-reports__bar-track" title={`${bucket.label}: ${bucket.count}`}>
                <div className="mobis-reports__bar" style={{ height }} />
              </div>
              <div className="mobis-reports__bar-label">{bucket.shortLabel}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function ReportsTabsClient({
  daily,
  hourly,
  monthly,
  promoDocs,
  recentDocs,
  recentTotalDocs,
  totalDocs,
  weekly,
  yearly,
}: Props) {
  const [activePanel, setActivePanel] = useState<Panel>('trend')
  const [customLoading, setCustomLoading] = useState(false)
  const [customError, setCustomError] = useState('')
  const [customStart, setCustomStart] = useState(() => {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    return toInputDateTimeValue(start)
  })
  const [customEnd, setCustomEnd] = useState(() => toInputDateTimeValue(new Date()))
  const [customSummaryState, setCustomSummaryState] = useState<CustomSummaryState | null>(null)
  const [customTopLimit, setCustomTopLimit] = useState(MIN_TOP_HOURS)
  const [customTrendGranularity, setCustomTrendGranularity] = useState<TrendGranularity>('day')
  const [customAccordionPanel, setCustomAccordionPanel] = useState<CustomAccordionPanel>('trend')

  const dayCount = daily[daily.length - 1]?.count ?? 0
  const weekCount = weekly[weekly.length - 1]?.count ?? 0
  const monthCount = monthly[monthly.length - 1]?.count ?? 0
  const yearCount = yearly[yearly.length - 1]?.count ?? 0

  const maxHourly = Math.max(1, ...hourly.map((bucket) => bucket.count))
  const busiestHour = hourly.reduce<Bucket | null>((winner, bucket) => {
    if (!winner) return bucket
    if (bucket.count > winner.count) return bucket
    return winner
  }, null)

  const defaultCustomSummary = useMemo(() => {
    const last7Total = daily.reduce((sum, item) => sum + item.count, 0)
    const avgDaily = last7Total / Math.max(1, daily.length)
    const promoRate = totalDocs > 0 ? (promoDocs / totalDocs) * 100 : 0
    const topHours = [...hourly].sort((a, b) => b.count - a.count)
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      averagePerDay: avgDaily,
      customTrends: {
        day: toTrendBuckets(daily),
        month: toTrendBuckets(monthly),
        week: toTrendBuckets(weekly),
      },
      endISO: now.toISOString(),
      growthVsPrevRangePct: 0,
      isTruncated: false,
      promoDocs,
      promoRatePct: promoRate,
      rangeDays: 30,
      startISO: start.toISOString(),
      topHours,
      totalDocs,
    } satisfies CustomSummaryState
  }, [daily, hourly, monthly, promoDocs, totalDocs, weekly])

  const applyCustomRange = useCallback(
    async (startInput: string, endInput: string) => {
      const startDate = new Date(startInput)
      const endDate = new Date(endInput)

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setCustomError('Rentang waktu tidak valid.')
        return
      }

      if (endDate < startDate) {
        setCustomError('Waktu akhir harus lebih besar dari waktu mulai.')
        return
      }

      setCustomError('')
      setCustomLoading(true)

      const startISO = startDate.toISOString()
      const endISO = endDate.toISOString()

      try {
        const baseParams = new URLSearchParams()
        baseParams.set('depth', '0')
        baseParams.set('limit', '200')
        baseParams.set('page', '1')
        baseParams.set('select[createdAt]', 'true')
        baseParams.set('select[promoApplied]', 'true')
        baseParams.set('sort', '-createdAt')
        baseParams.set('where[and][0][createdAt][greater_than_equal]', startISO)
        baseParams.set('where[and][1][createdAt][less_than_equal]', endISO)

        const firstPage = await api<CustomersListResponse>(`/api/customers?${baseParams.toString()}`)

        const docs: CustomerRangeDoc[] = [...(firstPage.docs || [])]
        let currentPage = firstPage.page ?? 1
        const totalPages = firstPage.totalPages ?? 1
        const maxPages = 30

        while (currentPage < totalPages && currentPage < maxPages) {
          currentPage += 1
          const pageParams = new URLSearchParams(baseParams)
          pageParams.set('page', String(currentPage))
          const pageRes = await api<CustomersListResponse>(`/api/customers?${pageParams.toString()}`)
          docs.push(...(pageRes.docs || []))
        }

        const msDiff = endDate.getTime() - startDate.getTime()
        const rangeDays = Math.max(1, Math.ceil(msDiff / (24 * 60 * 60 * 1000)))

        const promoInRange = docs.filter((doc) => Boolean(doc.promoApplied)).length
        const totalInRange = docs.length
        const promoRatePct = totalInRange > 0 ? (promoInRange / totalInRange) * 100 : 0
        const averagePerDay = totalInRange / rangeDays

        const hourCounter = Array.from({ length: 24 }, (_, hour) => ({
          count: 0,
          label: `${String(hour).padStart(2, '0')}:00 - ${String(hour).padStart(2, '0')}:59 WIB`,
          shortLabel: String(hour).padStart(2, '0'),
        }))

        for (const doc of docs) {
          if (!doc.createdAt) continue
          const hour = toJakartaHour(doc.createdAt)
          if (hour >= 0 && hour < 24) {
            hourCounter[hour].count += 1
          }
        }

        const topHours = [...hourCounter].sort((a, b) => b.count - a.count)
        const customTrends = {
          day: buildCustomTrendBuckets(docs, startDate, endDate, 'day'),
          month: buildCustomTrendBuckets(docs, startDate, endDate, 'month'),
          week: buildCustomTrendBuckets(docs, startDate, endDate, 'week'),
        } satisfies Record<TrendGranularity, TrendBucket[]>

        const prevEndDate = new Date(startDate.getTime() - 1)
        const prevStartDate = new Date(prevEndDate.getTime() - msDiff)
        const prevParams = new URLSearchParams()
        prevParams.set('depth', '0')
        prevParams.set('limit', '1')
        prevParams.set('page', '1')
        prevParams.set('where[and][0][createdAt][greater_than_equal]', prevStartDate.toISOString())
        prevParams.set('where[and][1][createdAt][less_than_equal]', prevEndDate.toISOString())

        const prevRes = await api<CustomersListResponse>(`/api/customers?${prevParams.toString()}`)
        const prevTotal = prevRes.totalDocs ?? 0
        const growthVsPrevRangePct =
          prevTotal > 0 ? ((totalInRange - prevTotal) / prevTotal) * 100 : 0

        setCustomSummaryState({
          averagePerDay,
          customTrends,
          endISO,
          growthVsPrevRangePct,
          isTruncated: totalPages > maxPages,
          promoDocs: promoInRange,
          promoRatePct,
          rangeDays,
          startISO,
          topHours,
          totalDocs: totalInRange,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gagal memuat custom summary.'
        setCustomError(message)
      } finally {
        setCustomLoading(false)
      }
    },
    [],
  )

  const summaryToShow = customSummaryState ?? defaultCustomSummary
  const displayedTopHours = useMemo(
    () => summaryToShow.topHours.slice(0, customTopLimit),
    [summaryToShow.topHours, customTopLimit],
  )
  const trendBucketsToShow = summaryToShow.customTrends[customTrendGranularity]
  const trendMaxCount = Math.max(1, ...trendBucketsToShow.map((bucket) => bucket.count))
  const trendPeakPeriod = useMemo(() => {
    if (trendBucketsToShow.length === 0) return null
    return trendBucketsToShow.reduce((peak, bucket) => {
      if (!peak) return bucket
      return bucket.count > peak.count ? bucket : peak
    }, null as TrendBucket | null)
  }, [trendBucketsToShow])
  const trendLatest = trendBucketsToShow[trendBucketsToShow.length - 1] ?? null

  useEffect(() => {
    void applyCustomRange(customStart, customEnd)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <section className="mobis-reports__panel-tabs" aria-label="Pilihan panel laporan">
        <button
          className={`mobis-reports__panel-tab ${activePanel === 'trend' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('trend')}
          type="button"
        >
          <span>Panel Tren</span>
          <small>Harian sampai tahunan</small>
        </button>
        <button
          className={`mobis-reports__panel-tab ${activePanel === 'hourly' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('hourly')}
          type="button"
        >
          <span>Panel Jam</span>
          <small>Distribusi per jam</small>
        </button>
        <button
          className={`mobis-reports__panel-tab ${activePanel === 'custom' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('custom')}
          type="button"
        >
          <span>Panel Custom Summary</span>
          <small>Ringkasan metrik utama</small>
        </button>
        <button
          className={`mobis-reports__panel-tab ${activePanel === 'history' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('history')}
          type="button"
        >
          <span>Panel Riwayat</span>
          <small>Data pendaftar terbaru</small>
        </button>
      </section>

      <section className="mobis-reports__switch-panel">
        {activePanel === 'trend' ? (
          <section className="mobis-reports__charts">
            <Bars buckets={daily} title="Tren 7 Hari Terakhir" />
            <Bars buckets={weekly} title="Tren 8 Minggu Terakhir" />
            <Bars buckets={monthly} title="Tren 12 Bulan Terakhir" />
            <Bars buckets={yearly} title="Tren 5 Tahun Terakhir" />
          </section>
        ) : null}

        {activePanel === 'hourly' ? (
          <section className="mobis-reports__panel">
            <div className="mobis-reports__panel-head">
              <h5>Distribusi Pendaftaran Per Jam (Hari Ini - WIB)</h5>
              <p>Rentang waktu dan jumlah pendaftar per jam</p>
            </div>

            <div className="mobis-reports__hourly-summary">
              <article className="mobis-reports__hourly-card">
                <span>Total Hari Ini</span>
                <strong>{formatCompactNumber(dayCount)}</strong>
              </article>
              <article className="mobis-reports__hourly-card">
                <span>Jam Tersibuk</span>
                <strong>{busiestHour ? busiestHour.label : '-'}</strong>
              </article>
              <article className="mobis-reports__hourly-card">
                <span>Puncak Per Jam</span>
                <strong>{formatCompactNumber(busiestHour?.count ?? 0)}</strong>
              </article>
            </div>

            <div className="mobis-reports__table-wrap">
              <table className="mobis-reports__table mobis-reports__table--hourly">
                <thead>
                  <tr>
                    <th>Rentang Jam</th>
                    <th>Visual</th>
                    <th className="text-end">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.map((bucket) => {
                    const width = `${Math.max(4, Math.round((bucket.count / maxHourly) * 100))}%`

                    return (
                      <tr key={`hour-${bucket.shortLabel}`}>
                        <td>{bucket.label}</td>
                        <td>
                          <div className="mobis-reports__hour-meter">
                            <div className="mobis-reports__hour-meter-bar" style={{ width }} />
                          </div>
                        </td>
                        <td className="text-end">{formatCompactNumber(bucket.count)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activePanel === 'custom' ? (
          <section className="mobis-reports__panel">
            <div className="mobis-reports__panel-head">
              <h5>Custom Summary</h5>
              <p>Atur sendiri rentang waktu data yang ingin ditampilkan</p>
            </div>

            <div className="mobis-reports__custom-controls">
              <label className="mobis-reports__custom-control">
                <span>Dari</span>
                <input
                  className="mobis-reports__custom-input"
                  onChange={(e) => setCustomStart(e.target.value)}
                  type="datetime-local"
                  value={customStart}
                />
              </label>
              <label className="mobis-reports__custom-control">
                <span>Sampai</span>
                <input
                  className="mobis-reports__custom-input"
                  onChange={(e) => setCustomEnd(e.target.value)}
                  type="datetime-local"
                  value={customEnd}
                />
              </label>
              <label className="mobis-reports__custom-control">
                <span>Top Jam</span>
                <select
                  className="mobis-reports__custom-input"
                  onChange={(e) => setCustomTopLimit(clampTopLimit(Number(e.target.value)))}
                  value={customTopLimit}
                >
                  {Array.from(
                    { length: MAX_TOP_HOURS - MIN_TOP_HOURS + 1 },
                    (_, idx) => MIN_TOP_HOURS + idx,
                  ).map((value) => (
                    <option key={`top-limit-${value}`} value={value}>
                      Top {value}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mobis-reports__custom-actions">
                <button
                  className="mobis-reports__custom-btn"
                  onClick={() => void applyCustomRange(customStart, customEnd)}
                  type="button"
                >
                  {customLoading ? 'Memuat...' : 'Terapkan'}
                </button>
              </div>
            </div>

            {customError ? <div className="mobis-reports__custom-error">{customError}</div> : null}

            <div className="mobis-reports__custom-grid">
              <article className="mobis-reports__custom-card">
                <span>Rentang Terpilih</span>
                <strong>
                  {formatDateTime(summaryToShow.startISO)} - {formatDateTime(summaryToShow.endISO)}
                </strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Total Pendaftar Range</span>
                <strong>{formatCompactNumber(summaryToShow.totalDocs)}</strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Pendaftar Pakai Promo</span>
                <strong>{formatCompactNumber(summaryToShow.promoDocs)}</strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Rasio Promo Range</span>
                <strong>{summaryToShow.promoRatePct.toFixed(1)}%</strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Rata-Rata Per Hari</span>
                <strong>{formatCompactNumber(Number(summaryToShow.averagePerDay.toFixed(1)))}</strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Pertumbuhan vs Periode Sebelumnya</span>
                <strong>{summaryToShow.growthVsPrevRangePct.toFixed(1)}%</strong>
              </article>
            </div>

            {summaryToShow.isTruncated ? (
              <div className="mobis-reports__custom-note">
                Data range sangat besar, ringkasan dihitung dari batch terbatas.
              </div>
            ) : null}

            <section className="mobis-reports__accordion">
              <div className="mobis-reports__accordion-tabs">
                <button
                  aria-expanded={customAccordionPanel === 'trend'}
                  className={`mobis-reports__accordion-tab ${customAccordionPanel === 'trend' ? 'is-active' : ''}`}
                  onClick={() => setCustomAccordionPanel('trend')}
                  type="button"
                >
                  <span>Panel Trend Custom</span>
                  <small>Periode puncak, perubahan, dan visual trend</small>
                </button>
                <button
                  aria-expanded={customAccordionPanel === 'top-hours'}
                  className={`mobis-reports__accordion-tab ${customAccordionPanel === 'top-hours' ? 'is-active' : ''}`}
                  onClick={() => setCustomAccordionPanel('top-hours')}
                  type="button"
                >
                  <span>Panel Top Jam</span>
                  <small>Jam tersibuk pada rentang yang dipilih</small>
                </button>
              </div>

              <div className="mobis-reports__accordion-panel">
                {customAccordionPanel === 'trend' ? (
                  <>
                    <div className="mobis-reports__panel-head mobis-reports__panel-head--sub">
                      <h5>Custom Trend</h5>
                      <p>Mode trend dibuat lebih ringkas agar cepat dibaca</p>
                    </div>

                    <div className="mobis-reports__trend-toolbar">
                      <label className="mobis-reports__custom-control">
                        <span>Mode Trend</span>
                        <select
                          className="mobis-reports__custom-input"
                          onChange={(e) =>
                            setCustomTrendGranularity(e.target.value as TrendGranularity)
                          }
                          value={customTrendGranularity}
                        >
                          <option value="day">Harian</option>
                          <option value="week">Mingguan</option>
                          <option value="month">Bulanan</option>
                        </select>
                      </label>
                    </div>

                    <div className="mobis-reports__trend-summary">
                      <article className="mobis-reports__trend-card">
                        <span>Periode Puncak</span>
                        <strong>{trendPeakPeriod?.label ?? '-'}</strong>
                        <small>{formatCompactNumber(trendPeakPeriod?.count ?? 0)} pendaftar</small>
                      </article>
                      <article className="mobis-reports__trend-card">
                        <span>Periode Terkini</span>
                        <strong>{trendLatest?.label ?? '-'}</strong>
                        <small>{formatCompactNumber(trendLatest?.count ?? 0)} pendaftar</small>
                      </article>
                      <article className="mobis-reports__trend-card">
                        <span>Perubahan Terkini</span>
                        <strong>{formatTrendDelta(trendLatest?.deltaFromPrev ?? null)}</strong>
                        <small>Dibanding periode sebelumnya</small>
                      </article>
                    </div>

                    <div className="mobis-reports__table-wrap">
                      <table className="mobis-reports__table mobis-reports__table--custom-trend">
                        <thead>
                          <tr>
                            <th>Periode</th>
                            <th>Visual</th>
                            <th className="text-end">Jumlah</th>
                            <th>Perubahan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendBucketsToShow.map((bucket) => {
                            const width = `${Math.max(4, Math.round((bucket.count / trendMaxCount) * 100))}%`
                            const deltaClass =
                              bucket.deltaFromPrev === null
                                ? 'is-flat'
                                : bucket.deltaFromPrev > 0
                                  ? 'is-up'
                                  : bucket.deltaFromPrev < 0
                                    ? 'is-down'
                                    : 'is-flat'

                            return (
                              <tr key={`custom-trend-${bucket.shortLabel}-${bucket.label}`}>
                                <td>{bucket.label}</td>
                                <td>
                                  <div className="mobis-reports__hour-meter">
                                    <div className="mobis-reports__hour-meter-bar" style={{ width }} />
                                  </div>
                                </td>
                                <td className="text-end">{formatCompactNumber(bucket.count)}</td>
                                <td>
                                  <span className={`mobis-reports__trend-delta ${deltaClass}`}>
                                    {formatTrendDelta(bucket.deltaFromPrev)}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}

                {customAccordionPanel === 'top-hours' ? (
                  <>
                    <div className="mobis-reports__panel-head mobis-reports__panel-head--sub">
                      <h5>Top {customTopLimit} Jam Tersibuk Pada Rentang Terpilih</h5>
                    </div>
                    <div className="mobis-reports__table-wrap">
                      <table className="mobis-reports__table">
                        <thead>
                          <tr>
                            <th>Peringkat</th>
                            <th>Rentang Jam</th>
                            <th className="text-end">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedTopHours.map((item, idx) => (
                            <tr key={`top-hour-${item.shortLabel}`}>
                              <td>#{idx + 1}</td>
                              <td>{item.label}</td>
                              <td className="text-end">{formatCompactNumber(item.count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          </section>
        ) : null}

        {activePanel === 'history' ? (
          <section className="mobis-reports__panel">
            <div className="mobis-reports__panel-head">
              <h5>Riwayat Pendaftar Terbaru</h5>
              <p>{recentTotalDocs ? `${recentTotalDocs} data ditemukan` : 'Belum ada data'}</p>
            </div>

            <div className="mobis-reports__table-wrap">
              <table className="mobis-reports__table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Telepon</th>
                    <th>Domisili</th>
                    <th>Promo</th>
                    <th>Waktu Daftar</th>
                    <th className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.length === 0 ? (
                    <tr>
                      <td className="mobis-reports__empty" colSpan={6}>
                        Belum ada pendaftar.
                      </td>
                    </tr>
                  ) : (
                    recentDocs.map((item) => (
                      <tr key={String(item.id)}>
                        <td>{displayText(item.name)}</td>
                        <td>{displayText(item.phone)}</td>
                        <td>{displayText(item.domicile)}</td>
                        <td>
                          {item.promoApplied ? (
                            <span className="mobis-reports__badge mobis-reports__badge--success">
                              {displayText(item.promoCode)}
                            </span>
                          ) : (
                            <span className="mobis-reports__badge">Tanpa promo</span>
                          )}
                        </td>
                        <td>{formatDateTime(item.createdAt)}</td>
                        <td className="text-end">
                          <a className="mobis-reports__row-link" href={`/admin/collections/customers/${item.id}`}>
                            Buka
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </section>
    </>
  )
}

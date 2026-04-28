'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { isExcludedLeadName } from '@/lib/customers/testLeadFilter'

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

type RegionStat = {
  count: number
  label: string
  percentage: number
}

type Panel = 'custom' | 'hourly' | 'history' | 'region' | 'trend'
type CustomAccordionPanel = 'top-hours' | 'trend'
type RegionDataPanel = 'line' | 'pie' | 'rank'
type RegionStatPeriod = 'day' | 'month' | 'week' | 'year'
type TrendGranularity = 'day' | 'month' | 'week'

type Props = {
  daily: Bucket[]
  hourly: Bucket[]
  monthly: Bucket[]
  promoDocs: number
  regionStats: RegionStat[]
  recentDocs: CustomerHistoryItem[]
  recentTotalDocs: number
  totalDocs: number
  weekly: Bucket[]
  yearly: Bucket[]
}

type CustomerRangeDoc = {
  createdAt?: null | string
  domicile?: null | string
  handoverLocation?: null | string
  name?: null | string
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

type RegionSummaryState = {
  docs: CustomerRangeDoc[]
  endISO: string
  isTruncated: boolean
  regions: RegionStat[]
  startISO: string
  totalDocs: number
}

type RegionLineSeries = {
  color: string
  label: string
  values: number[]
}

type RegionLineChartData = {
  labels: string[]
  maxCount: number
  series: RegionLineSeries[]
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
const MIN_REGION_TOP = 3
const MAX_REGION_TOP = 12
const DAY_MS = 24 * 60 * 60 * 1000
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const REGION_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#64748b',
]

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

function clampRegionTop(value: number) {
  if (Number.isNaN(value)) return 8
  return Math.min(MAX_REGION_TOP, Math.max(MIN_REGION_TOP, value))
}

function normalizeRegionValue(value?: null | string) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function resolveRegionLabel(doc: CustomerRangeDoc) {
  const domicile = normalizeRegionValue(doc?.domicile)
  if (domicile) return domicile

  const handover = normalizeRegionValue(doc?.handoverLocation)
  if (handover) return handover

  return 'Wilayah tidak diisi'
}

function buildRegionStatsFromDocs(docs: CustomerRangeDoc[], topLimit: number): RegionStat[] {
  const map = new Map<string, number>()
  let total = 0

  for (const doc of docs) {
    const label = resolveRegionLabel(doc)
    map.set(label, (map.get(label) ?? 0) + 1)
    total += 1
  }

  const sorted = Array.from(map.entries())
    .map(([label, count]) => ({
      count,
      label,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const top = sorted.slice(0, topLimit)
  const rest = sorted.slice(topLimit)
  const restCount = rest.reduce((sum, item) => sum + item.count, 0)

  if (restCount > 0) {
    top.push({
      count: restCount,
      label: 'Lainnya',
      percentage: total > 0 ? Number(((restCount / total) * 100).toFixed(1)) : 0,
    })
  }

  return top
}

function buildRegionPieGradient(regions: RegionStat[]) {
  if (regions.length === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)'

  let cursor = 0
  const stops = regions.map((item, idx) => {
    const start = cursor
    const sliceDeg = (item.percentage / 100) * 360
    const end = idx === regions.length - 1 ? 360 : Math.min(360, cursor + sliceDeg)
    cursor = end
    const color = REGION_COLORS[idx % REGION_COLORS.length]
    return `${color} ${start}deg ${end}deg`
  })

  return `conic-gradient(${stops.join(', ')})`
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

function startOfJakartaYear(date: Date) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(new Date(Date.UTC(jakarta.getUTCFullYear(), 0, 1, 0, 0, 0, 0)))
}

function addJakartaMonths(date: Date, months: number) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(
    new Date(Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth() + months, 1, 0, 0, 0, 0)),
  )
}

function getRegionPeriodStart(endDate: Date, period: RegionStatPeriod) {
  if (period === 'day') return startOfJakartaDay(endDate)
  if (period === 'week') return startOfJakartaWeek(endDate)
  if (period === 'year') return startOfJakartaYear(endDate)
  return startOfJakartaMonth(endDate)
}

function getRegionPeriodLabel(period: RegionStatPeriod) {
  if (period === 'day') return 'Harian'
  if (period === 'week') return 'Mingguan'
  if (period === 'year') return 'Tahunan'
  return 'Bulanan'
}

function getRegionLineGranularity(period: RegionStatPeriod): TrendGranularity {
  if (period === 'year') return 'month'
  return 'day'
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

function buildRegionLineChartData(params: {
  docs: CustomerRangeDoc[]
  endISO: string
  granularity: TrendGranularity
  regionLabels: string[]
  startISO: string
}): RegionLineChartData {
  const { docs, endISO, granularity, regionLabels, startISO } = params
  const startDate = new Date(startISO)
  const endDate = new Date(endISO)

  if (
    regionLabels.length === 0 ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return { labels: [], maxCount: 0, series: [] }
  }

  const seeds = buildTrendSeed(startDate, endDate, granularity)
  const indexByStart = new Map<number, number>(seeds.map((bucket, idx) => [bucket.start.getTime(), idx]))
  const valuesByRegion = new Map<string, number[]>(
    regionLabels.map((label) => [label, Array.from({ length: seeds.length }, () => 0)]),
  )

  for (const doc of docs) {
    if (!doc.createdAt) continue
    const createdAt = new Date(doc.createdAt)
    if (Number.isNaN(createdAt.getTime())) continue

    const regionLabel = resolveRegionLabel(doc)
    const series = valuesByRegion.get(regionLabel)
    if (!series) continue

    const periodStart = getTrendPeriodStart(createdAt, granularity).getTime()
    const idx = indexByStart.get(periodStart)
    if (idx === undefined) continue

    series[idx] += 1
  }

  const series = regionLabels.map((label, idx) => ({
    color: REGION_COLORS[idx % REGION_COLORS.length],
    label,
    values: valuesByRegion.get(label) ?? [],
  }))

  const maxCount = Math.max(0, ...series.flatMap((item) => item.values))

  return {
    labels: seeds.map((item) => item.shortLabel),
    maxCount,
    series,
  }
}

function RegionLineChart({
  data,
  title,
}: {
  data: RegionLineChartData
  title: string
}) {
  const width = 760
  const height = 220
  const paddingTop = 16
  const paddingRight = 14
  const paddingBottom = 34
  const paddingLeft = 28
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const pointsCount = data.labels.length
  const maxCount = Math.max(1, data.maxCount)

  return (
    <section className="mobis-reports__panel">
      <div className="mobis-reports__panel-head">
        <h5>{title}</h5>
      </div>
      <div className="mobis-reports__table-wrap">
        {pointsCount === 0 || data.series.length === 0 ? (
          <div className="mobis-reports__empty" style={{ padding: '1rem' }}>
            Belum ada data komparasi.
          </div>
        ) : (
          <div className="mobis-reports__region-linechart-wrap">
            <svg
              className="mobis-reports__region-linechart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`${title} berdasarkan waktu dan jumlah pendaftar`}
            >
              <line
                x1={paddingLeft}
                y1={height - paddingBottom}
                x2={width - paddingRight}
                y2={height - paddingBottom}
                stroke="var(--theme-elevation-180)"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={height - paddingBottom}
                stroke="var(--theme-elevation-180)"
                strokeWidth="1"
              />

              {[0.25, 0.5, 0.75].map((ratio) => {
                const y = paddingTop + chartHeight * ratio
                return (
                  <line
                    key={`grid-${ratio}`}
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="var(--theme-elevation-120)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                )
              })}

              {data.series.map((series) => {
                const points = series.values
                  .map((value, idx) => {
                    const x =
                      pointsCount === 1
                        ? paddingLeft + chartWidth / 2
                        : paddingLeft + (idx / (pointsCount - 1)) * chartWidth
                    const y = paddingTop + chartHeight - (value / maxCount) * chartHeight
                    return `${x},${y}`
                  })
                  .join(' ')

                return (
                  <polyline
                    key={`line-${series.label}`}
                    points={points}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              })}

              {data.labels.map((label, idx) => {
                const x =
                  pointsCount === 1
                    ? paddingLeft + chartWidth / 2
                    : paddingLeft + (idx / (pointsCount - 1)) * chartWidth
                const y = height - paddingBottom + 16

                return (
                  <text
                    key={`label-${label}-${idx}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--theme-text)"
                    opacity="0.72"
                  >
                    {label}
                  </text>
                )
              })}
            </svg>
          </div>
        )}
      </div>
      {data.series.length > 0 ? (
        <div className="mobis-reports__region-mini-legend">
          {data.series.map((series) => (
            <div className="mobis-reports__region-mini-legend-item" key={`mini-legend-${series.label}`}>
              <span style={{ backgroundColor: series.color }} aria-hidden="true" />
              <small>{series.label}</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default function ReportsTabsClient({
  daily,
  hourly,
  monthly,
  promoDocs,
  regionStats,
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
  const [regionLoading, setRegionLoading] = useState(false)
  const [regionError, setRegionError] = useState('')
  const [regionTopLimit, setRegionTopLimit] = useState(8)
  const [regionStart, setRegionStart] = useState(() => {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    return toInputDateTimeValue(start)
  })
  const [regionEnd, setRegionEnd] = useState(() => toInputDateTimeValue(new Date()))
  const [regionSummaryState, setRegionSummaryState] = useState<RegionSummaryState | null>(null)
  const [regionDataPanel, setRegionDataPanel] = useState<RegionDataPanel>('pie')
  const [regionStatPeriod, setRegionStatPeriod] = useState<RegionStatPeriod>('month')

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

  const defaultRegionSummary = useMemo(() => {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      docs: [],
      endISO: end.toISOString(),
      isTruncated: false,
      regions: regionStats,
      startISO: start.toISOString(),
      totalDocs,
    } satisfies RegionSummaryState
  }, [regionStats, totalDocs])

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
        baseParams.set('select[name]', 'true')
        baseParams.set('select[promoApplied]', 'true')
        baseParams.set('sort', '-createdAt')
        baseParams.set('where[and][0][createdAt][greater_than_equal]', startISO)
        baseParams.set('where[and][1][createdAt][less_than_equal]', endISO)

        const firstPage = await api<CustomersListResponse>(`/api/customers?${baseParams.toString()}`)

        const docs: CustomerRangeDoc[] = [
          ...(firstPage.docs || []).filter((doc) => !isExcludedLeadName(doc?.name)),
        ]
        let currentPage = firstPage.page ?? 1
        const totalPages = firstPage.totalPages ?? 1
        const maxPages = 30

        while (currentPage < totalPages && currentPage < maxPages) {
          currentPage += 1
          const pageParams = new URLSearchParams(baseParams)
          pageParams.set('page', String(currentPage))
          const pageRes = await api<CustomersListResponse>(`/api/customers?${pageParams.toString()}`)
          docs.push(...(pageRes.docs || []).filter((doc) => !isExcludedLeadName(doc?.name)))
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
        prevParams.set('limit', '200')
        prevParams.set('page', '1')
        prevParams.set('select[name]', 'true')
        prevParams.set('where[and][0][createdAt][greater_than_equal]', prevStartDate.toISOString())
        prevParams.set('where[and][1][createdAt][less_than_equal]', prevEndDate.toISOString())

        const prevFirstPage = await api<CustomersListResponse>(`/api/customers?${prevParams.toString()}`)
        let prevTotal = (prevFirstPage.docs || []).filter((doc) => !isExcludedLeadName(doc?.name))
          .length
        let prevPage = prevFirstPage.page ?? 1
        const prevTotalPages = prevFirstPage.totalPages ?? 1

        while (prevPage < prevTotalPages && prevPage < maxPages) {
          prevPage += 1
          const prevPageParams = new URLSearchParams(prevParams)
          prevPageParams.set('page', String(prevPage))
          const prevPageRes = await api<CustomersListResponse>(
            `/api/customers?${prevPageParams.toString()}`,
          )
          prevTotal += (prevPageRes.docs || []).filter((doc) => !isExcludedLeadName(doc?.name)).length
        }

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

  const applyRegionRange = useCallback(
    async (startInput: string, endInput: string, topLimitInput: number) => {
      const startDate = new Date(startInput)
      const endDate = new Date(endInput)
      const topLimit = clampRegionTop(topLimitInput)

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setRegionError('Rentang waktu wilayah tidak valid.')
        return
      }

      if (endDate < startDate) {
        setRegionError('Waktu akhir wilayah harus lebih besar dari waktu mulai.')
        return
      }

      setRegionError('')
      setRegionLoading(true)

      const startISO = startDate.toISOString()
      const endISO = endDate.toISOString()

      try {
        const baseParams = new URLSearchParams()
        baseParams.set('depth', '0')
        baseParams.set('limit', '200')
        baseParams.set('page', '1')
        baseParams.set('select[name]', 'true')
        baseParams.set('select[domicile]', 'true')
        baseParams.set('select[handoverLocation]', 'true')
        baseParams.set('sort', '-createdAt')
        baseParams.set('where[and][0][createdAt][greater_than_equal]', startISO)
        baseParams.set('where[and][1][createdAt][less_than_equal]', endISO)

        const firstPage = await api<CustomersListResponse>(`/api/customers?${baseParams.toString()}`)
        const docs: CustomerRangeDoc[] = [
          ...(firstPage.docs || []).filter((doc) => !isExcludedLeadName(doc?.name)),
        ]

        let currentPage = firstPage.page ?? 1
        const totalPages = firstPage.totalPages ?? 1
        const maxPages = 30

        while (currentPage < totalPages && currentPage < maxPages) {
          currentPage += 1
          const pageParams = new URLSearchParams(baseParams)
          pageParams.set('page', String(currentPage))
          const pageRes = await api<CustomersListResponse>(`/api/customers?${pageParams.toString()}`)
          docs.push(...(pageRes.docs || []).filter((doc) => !isExcludedLeadName(doc?.name)))
        }

        setRegionSummaryState({
          docs,
          endISO,
          isTruncated: totalPages > maxPages,
          regions: buildRegionStatsFromDocs(docs, topLimit),
          startISO,
          totalDocs: docs.length,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gagal memuat statistik wilayah.'
        setRegionError(message)
      } finally {
        setRegionLoading(false)
      }
    },
    [],
  )

  const summaryToShow = customSummaryState ?? defaultCustomSummary
  const regionSummaryToShow = regionSummaryState ?? defaultRegionSummary
  const regionPeriodLabel = useMemo(() => getRegionPeriodLabel(regionStatPeriod), [regionStatPeriod])
  const regionPeriodStartISO = useMemo(() => {
    const endDate = new Date(regionSummaryToShow.endISO)
    if (Number.isNaN(endDate.getTime())) return regionSummaryToShow.startISO
    return getRegionPeriodStart(endDate, regionStatPeriod).toISOString()
  }, [regionStatPeriod, regionSummaryToShow.endISO, regionSummaryToShow.startISO])
  const regionPeriodDocs = useMemo(() => {
    const docs = regionSummaryToShow.docs || []
    if (docs.length === 0) return [] as CustomerRangeDoc[]

    const endDate = new Date(regionSummaryToShow.endISO)
    if (Number.isNaN(endDate.getTime())) return docs

    const periodStart = new Date(regionPeriodStartISO).getTime()
    const periodEnd = endDate.getTime()

    return docs.filter((doc) => {
      if (!doc.createdAt) return false
      const createdAt = new Date(doc.createdAt)
      if (Number.isNaN(createdAt.getTime())) return false
      const at = createdAt.getTime()
      return at >= periodStart && at <= periodEnd
    })
  }, [regionPeriodStartISO, regionSummaryToShow.docs, regionSummaryToShow.endISO])
  const regionPeriodStats = useMemo(
    () => buildRegionStatsFromDocs(regionPeriodDocs, regionTopLimit),
    [regionPeriodDocs, regionTopLimit],
  )
  const regionPieGradient = useMemo(
    () => buildRegionPieGradient(regionPeriodStats),
    [regionPeriodStats],
  )
  const regionLegend = useMemo(
    () =>
      regionPeriodStats.map((item, idx) => ({
        ...item,
        color: REGION_COLORS[idx % REGION_COLORS.length],
      })),
    [regionPeriodStats],
  )
  const regionOptions = useMemo(() => {
    const map = new Map<string, number>()

    for (const doc of regionPeriodDocs) {
      const label = resolveRegionLabel(doc)
      map.set(label, (map.get(label) ?? 0) + 1)
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [regionPeriodDocs])
  const regionComparisonLabels = useMemo(
    () => regionOptions.slice(0, regionTopLimit).map((item) => item.label),
    [regionOptions, regionTopLimit],
  )
  const regionLineData = useMemo(
    () =>
      buildRegionLineChartData({
        docs: regionPeriodDocs,
        endISO: regionSummaryToShow.endISO,
        granularity: getRegionLineGranularity(regionStatPeriod),
        regionLabels: regionComparisonLabels,
        startISO: regionPeriodStartISO,
      }),
    [
      regionPeriodDocs,
      regionPeriodStartISO,
      regionStatPeriod,
      regionComparisonLabels,
      regionSummaryToShow.endISO,
    ],
  )
  const regionChartTitle = useMemo(
    () => `Komparasi Wilayah ${regionPeriodLabel}`,
    [regionPeriodLabel],
  )
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
    void applyRegionRange(regionStart, regionEnd, regionTopLimit)
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
        <button
          className={`mobis-reports__panel-tab ${activePanel === 'region' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('region')}
          type="button"
        >
          <span>Panel Wilayah</span>
          <small>Distribusi pendaftar per wilayah</small>
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

        {activePanel === 'region' ? (
          <section className="mobis-reports__panel">
            <div className="mobis-reports__panel-head">
              <h5>Statistik Pendaftar Berdasarkan Wilayah</h5>
              <p>
                {regionLegend.length > 0
                  ? `${regionPeriodLabel}: ${regionLegend.length} wilayah ditampilkan`
                  : 'Belum ada data'}
              </p>
            </div>

            <div className="mobis-reports__custom-controls">
              <label className="mobis-reports__custom-control">
                <span>Dari</span>
                <input
                  className="mobis-reports__custom-input"
                  onChange={(e) => setRegionStart(e.target.value)}
                  type="datetime-local"
                  value={regionStart}
                />
              </label>
              <label className="mobis-reports__custom-control">
                <span>Sampai</span>
                <input
                  className="mobis-reports__custom-input"
                  onChange={(e) => setRegionEnd(e.target.value)}
                  type="datetime-local"
                  value={regionEnd}
                />
              </label>
              <label className="mobis-reports__custom-control">
                <span>Jumlah Wilayah</span>
                <select
                  className="mobis-reports__custom-input"
                  onChange={(e) => setRegionTopLimit(clampRegionTop(Number(e.target.value)))}
                  value={regionTopLimit}
                >
                  {Array.from(
                    { length: MAX_REGION_TOP - MIN_REGION_TOP + 1 },
                    (_, idx) => MIN_REGION_TOP + idx,
                  ).map((value) => (
                    <option key={`region-top-${value}`} value={value}>
                      {value} wilayah
                    </option>
                  ))}
                </select>
              </label>
              <div className="mobis-reports__custom-actions">
                <button
                  className="mobis-reports__custom-btn"
                  onClick={() => void applyRegionRange(regionStart, regionEnd, regionTopLimit)}
                  type="button"
                >
                  {regionLoading ? 'Memuat...' : 'Terapkan'}
                </button>
              </div>
            </div>

            {regionError ? <div className="mobis-reports__custom-error">{regionError}</div> : null}

            <div className="mobis-reports__custom-grid">
              <article className="mobis-reports__custom-card">
                <span>Rentang Terpilih</span>
                <strong>
                  {formatDateTime(regionSummaryToShow.startISO)} -{' '}
                  {formatDateTime(regionSummaryToShow.endISO)}
                </strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Wilayah Pertama di Daftar</span>
                <strong>{regionLegend[0]?.label ?? '-'}</strong>
              </article>
              <article className="mobis-reports__custom-card">
                <span>Total {regionPeriodLabel}</span>
                <strong>{formatCompactNumber(regionPeriodDocs.length)} pendaftar</strong>
              </article>
            </div>

            <div className="mobis-reports__period-tabs" aria-label="Periode pie chart dan rank wilayah">
              <button
                className={`mobis-reports__period-tab ${regionStatPeriod === 'day' ? 'is-active' : ''}`}
                onClick={() => setRegionStatPeriod('day')}
                type="button"
              >
                Harian
              </button>
              <button
                className={`mobis-reports__period-tab ${regionStatPeriod === 'week' ? 'is-active' : ''}`}
                onClick={() => setRegionStatPeriod('week')}
                type="button"
              >
                Mingguan
              </button>
              <button
                className={`mobis-reports__period-tab ${regionStatPeriod === 'month' ? 'is-active' : ''}`}
                onClick={() => setRegionStatPeriod('month')}
                type="button"
              >
                Bulanan
              </button>
              <button
                className={`mobis-reports__period-tab ${regionStatPeriod === 'year' ? 'is-active' : ''}`}
                onClick={() => setRegionStatPeriod('year')}
                type="button"
              >
                Tahunan
              </button>
            </div>

            {regionSummaryToShow.isTruncated ? (
              <div className="mobis-reports__custom-note">
                Data range sangat besar, statistik wilayah dihitung dari batch terbatas.
              </div>
            ) : null}

            <div className="mobis-reports__accordion mobis-reports__region-lines">
              <div className="mobis-reports__accordion-tabs mobis-reports__accordion-tabs--triple">
                <button
                  aria-expanded={regionDataPanel === 'pie'}
                  className={`mobis-reports__accordion-tab ${regionDataPanel === 'pie' ? 'is-active' : ''}`}
                  onClick={() => setRegionDataPanel('pie')}
                  type="button"
                >
                  <span>Diagram Pie</span>
                  <small>Distribusi wilayah {regionPeriodLabel.toLowerCase()}</small>
                </button>
                <button
                  aria-expanded={regionDataPanel === 'line'}
                  className={`mobis-reports__accordion-tab ${regionDataPanel === 'line' ? 'is-active' : ''}`}
                  onClick={() => setRegionDataPanel('line')}
                  type="button"
                >
                  <span>Diagram Garis</span>
                  <small>Komparasi tren wilayah</small>
                </button>
                <button
                  aria-expanded={regionDataPanel === 'rank'}
                  className={`mobis-reports__accordion-tab ${regionDataPanel === 'rank' ? 'is-active' : ''}`}
                  onClick={() => setRegionDataPanel('rank')}
                  type="button"
                >
                  <span>Ranking</span>
                  <small>Urutan wilayah berdasarkan jumlah</small>
                </button>
              </div>

              <div className="mobis-reports__accordion-panel">
                {regionDataPanel === 'pie' ? (
                  <div className="mobis-reports__region-layout">
                    <div className="mobis-reports__region-chart-wrap">
                      <div
                        className="mobis-reports__region-chart"
                        style={{ backgroundImage: regionPieGradient }}
                        role="img"
                        aria-label={`Diagram lingkaran distribusi pendaftar wilayah ${regionPeriodLabel.toLowerCase()}`}
                      >
                        <div className="mobis-reports__region-chart-center">
                          <span>Total {regionPeriodLabel}</span>
                          <strong>{formatCompactNumber(regionPeriodDocs.length)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mobis-reports__region-legend">
                      <div className="mobis-reports__region-legend-head">
                        <strong>Keterangan Wilayah</strong>
                        <small>Jumlah dan kontribusi per wilayah</small>
                      </div>
                      {regionLegend.length === 0 ? (
                        <div className="mobis-reports__empty">Belum ada data wilayah.</div>
                      ) : (
                        regionLegend.map((item, idx) => (
                          <div className="mobis-reports__region-legend-item" key={`legend-${item.label}-${idx}`}>
                            <span
                              className="mobis-reports__region-color"
                              style={{ backgroundColor: item.color }}
                              aria-hidden="true"
                            />
                            <span className="mobis-reports__region-label">{item.label}</span>
                            <strong>
                              {formatCompactNumber(item.count)} • {item.percentage.toFixed(1)}%
                            </strong>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {regionDataPanel === 'line' ? (
                  <RegionLineChart data={regionLineData} title={regionChartTitle} />
                ) : null}

                {regionDataPanel === 'rank' ? (
                  <div className="mobis-reports__table-wrap">
                    <table className="mobis-reports__table">
                      <thead>
                        <tr>
                          <th>Urutan</th>
                          <th>Wilayah</th>
                          <th className="text-end">Jumlah</th>
                          <th className="text-end">Kontribusi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionLegend.length === 0 ? (
                          <tr>
                            <td className="mobis-reports__empty" colSpan={4}>
                              Belum ada data wilayah.
                            </td>
                          </tr>
                        ) : (
                          regionLegend.map((item, idx) => (
                            <tr key={`region-${item.label}-${idx}`}>
                              <td>#{idx + 1}</td>
                              <td>{displayText(item.label)}</td>
                              <td className="text-end">{formatCompactNumber(item.count)}</td>
                              <td className="text-end">{item.percentage.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </>
  )
}

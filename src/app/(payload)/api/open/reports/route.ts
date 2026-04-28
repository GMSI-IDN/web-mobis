import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { isExcludedLeadName } from '@/lib/customers/testLeadFilter'

type TrendGranularity = 'day' | 'month' | 'week'

type CustomerRangeDoc = {
  createdAt?: null | string
  name?: null | string
  promoApplied?: boolean | null
}

type TrendBucket = {
  count: number
  deltaFromPrev: number | null
  endISO: string
  label: string
  startISO: string
}

type TrendSeedBucket = {
  count: number
  end: Date
  label: string
  start: Date
}

type AccessWhitelistItem = {
  domain: string
  tokens: string[]
}

type AccessWhitelistEnvItem = {
  domain?: unknown
  token?: unknown
  tokens?: unknown
}

const DAY_MS = 24 * 60 * 60 * 1000
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const DEFAULT_TOP_LIMIT = 3
const MIN_TOP_LIMIT = 3
const MAX_TOP_LIMIT = 10
const DEFAULT_MAX_PAGES = 30
const DEFAULT_PAGE_SIZE = 200
const HAS_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//
const LOCAL_ADDRESS_REGEX = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(:\d+)?$/i

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

function trim(value?: string | null) {
  return String(value || '').trim()
}

function normalizeDomain(raw?: string | null) {
  const value = trim(raw)
  if (!value) return ''
  if (value === '*') return '*'

  const withProtocol = HAS_PROTOCOL_REGEX.test(value)
    ? value
    : `${LOCAL_ADDRESS_REGEX.test(value) ? 'http' : 'https'}://${value}`

  try {
    return new URL(withProtocol).origin.toLowerCase()
  } catch {
    return ''
  }
}

function parseWhitelistFromArrayEnv() {
  const raw = trim(process.env.REPORTS_OPEN_API_WHITELIST)
  if (!raw) return { error: '', items: [] as AccessWhitelistItem[] }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return {
        error: 'REPORTS_OPEN_API_WHITELIST harus berupa JSON array.',
        items: [] as AccessWhitelistItem[],
      }
    }

    const grouped = new Map<string, Set<string>>()

    for (const row of parsed as AccessWhitelistEnvItem[]) {
      const domain = normalizeDomain(String(row?.domain ?? ''))
      if (!domain) continue

      const tokens: string[] = []

      if (Array.isArray(row?.tokens)) {
        for (const token of row.tokens) {
          const clean = trim(String(token ?? ''))
          if (clean) tokens.push(clean)
        }
      }

      const singleToken = trim(String(row?.token ?? ''))
      if (singleToken) tokens.push(singleToken)

      if (tokens.length === 0) continue

      if (!grouped.has(domain)) grouped.set(domain, new Set<string>())
      const tokenSet = grouped.get(domain)!
      for (const token of tokens) tokenSet.add(token)
    }

    const items = Array.from(grouped.entries()).map(([domain, tokenSet]) => ({
      domain,
      tokens: Array.from(tokenSet),
    }))

    return { error: '', items }
  } catch {
    return {
      error: 'REPORTS_OPEN_API_WHITELIST tidak valid. Pastikan format JSON benar.',
      items: [] as AccessWhitelistItem[],
    }
  }
}

function parseWhitelistFromLegacyEnv() {
  const key = trim(process.env.REPORTS_OPEN_API_KEY)
  if (!key) return []

  const rawOrigins = trim(process.env.REPORTS_OPEN_API_ALLOWED_ORIGINS)
  const origins = (rawOrigins || '*')
    .split(',')
    .map((item) => normalizeDomain(item))
    .filter(Boolean)

  const uniqueOrigins = Array.from(new Set(origins.length > 0 ? origins : ['*']))
  return uniqueOrigins.map((domain) => ({
    domain,
    tokens: [key],
  }))
}

function getAccessWhitelist() {
  const fromArray = parseWhitelistFromArrayEnv()
  if (fromArray.error) return fromArray
  if (fromArray.items.length > 0) return fromArray

  return {
    error: '',
    items: parseWhitelistFromLegacyEnv(),
  }
}

function extractApiKeyFromRequest(req: Request) {
  const xApiKey = trim(req.headers.get('x-api-key'))
  if (xApiKey) return xApiKey

  const auth = trim(req.headers.get('authorization'))
  if (auth.toLowerCase().startsWith('bearer ')) {
    return trim(auth.slice(7))
  }

  return ''
}

function extractRequestedDomain(req: Request) {
  const origin = normalizeDomain(req.headers.get('origin'))
  if (origin) return origin

  const xClientDomain = normalizeDomain(req.headers.get('x-client-domain'))
  if (xClientDomain) return xClientDomain

  return ''
}

function resolveCorsOrigin(req: Request, whitelist: AccessWhitelistItem[]) {
  const requestOrigin = normalizeDomain(req.headers.get('origin'))
  if (!requestOrigin) return '*'
  if (whitelist.some((item) => item.domain === '*')) return requestOrigin
  if (whitelist.some((item) => item.domain === requestOrigin)) return requestOrigin
  return 'null'
}

function withCorsHeaders(req: Request, whitelist: AccessWhitelistItem[], init?: HeadersInit) {
  const headers = new Headers(init)
  headers.set('Access-Control-Allow-Origin', resolveCorsOrigin(req, whitelist))
  headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key, x-api-key, X-Client-Domain, x-client-domain',
  )
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Vary', 'Origin')
  return headers
}

function clampTopLimit(value: number) {
  if (Number.isNaN(value)) return DEFAULT_TOP_LIMIT
  return Math.min(MAX_TOP_LIMIT, Math.max(MIN_TOP_LIMIT, value))
}

function parseGranularity(value: string | null): TrendGranularity {
  if (value === 'day' || value === 'week' || value === 'month') return value
  return 'day'
}

function parseDateOrNull(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
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

function addJakartaMonths(date: Date, months: number) {
  const jakarta = toJakartaDate(date)
  return fromJakartaDate(
    new Date(Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth() + months, 1, 0, 0, 0, 0)),
  )
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

function getTrendLabel(periodStart: Date, periodEnd: Date, granularity: TrendGranularity) {
  if (granularity === 'day') return dayLabelFormatter.format(periodStart)

  if (granularity === 'week') {
    const startLabel = dayLabelFormatter.format(periodStart)
    const endLabel = dayLabelFormatter.format(addJakartaDays(periodEnd, -1))
    return `${startLabel} - ${endLabel}`
  }

  return monthLabelFormatter.format(periodStart)
}

function buildTrendSeed(startDate: Date, endDate: Date, granularity: TrendGranularity): TrendSeedBucket[] {
  const safeStart = new Date(Math.min(startDate.getTime(), endDate.getTime()))
  const safeEnd = new Date(Math.max(startDate.getTime(), endDate.getTime()))
  const initialStart = getTrendPeriodStart(safeStart, granularity)
  const endBoundary = getTrendPeriodEnd(getTrendPeriodStart(safeEnd, granularity), granularity)

  const buckets: TrendSeedBucket[] = []
  let cursor = initialStart
  let safety = 0

  while (cursor < endBoundary && safety < 1200) {
    const periodStart = cursor
    const periodEnd = getTrendPeriodEnd(periodStart, granularity)
    buckets.push({
      count: 0,
      end: periodEnd,
      label: getTrendLabel(periodStart, periodEnd, granularity),
      start: periodStart,
    })

    cursor = periodEnd
    safety += 1
  }

  return buckets
}

function buildTrendBuckets(
  docs: CustomerRangeDoc[],
  startDate: Date,
  endDate: Date,
  granularity: TrendGranularity,
): TrendBucket[] {
  const seeds = buildTrendSeed(startDate, endDate, granularity)
  const mapByStart = new Map<number, number>(
    seeds.map((bucket, idx) => [bucket.start.getTime(), idx] as const),
  )

  for (const doc of docs) {
    if (!doc.createdAt) continue
    const createdAt = new Date(doc.createdAt)
    if (Number.isNaN(createdAt.getTime())) continue

    const periodStart = getTrendPeriodStart(createdAt, granularity).getTime()
    const idx = mapByStart.get(periodStart)
    if (idx === undefined) continue

    seeds[idx].count += 1
  }

  return seeds.map((bucket, idx) => ({
    count: bucket.count,
    deltaFromPrev: idx === 0 ? null : bucket.count - seeds[idx - 1].count,
    endISO: bucket.end.toISOString(),
    label: bucket.label,
    startISO: bucket.start.toISOString(),
  }))
}

function buildTopHours(docs: CustomerRangeDoc[], limit: number) {
  const hourCounter = Array.from({ length: 24 }, (_, hour) => ({
    count: 0,
    hour,
    label: `${String(hour).padStart(2, '0')}:00 - ${String(hour).padStart(2, '0')}:59 WIB`,
  }))

  for (const doc of docs) {
    if (!doc.createdAt) continue
    const createdAt = new Date(doc.createdAt)
    if (Number.isNaN(createdAt.getTime())) continue

    const hour = toJakartaDate(createdAt).getUTCHours()
    if (hour >= 0 && hour < 24) hourCounter[hour].count += 1
  }

  return hourCounter
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item, idx) => ({
      count: item.count,
      hour: item.hour,
      label: item.label,
      rank: idx + 1,
    }))
}

async function fetchCustomerRangeDocs(params: {
  endDate: Date
  maxPages: number
  payload: any
  startDate: Date
}) {
  const { endDate, maxPages, payload, startDate } = params
  const docs: CustomerRangeDoc[] = []
  let page = 1
  let totalPages = 1
  let hasNextPage = true

  while (hasNextPage && page <= maxPages) {
    const batch = (await payload.find({
      collection: 'customers',
      depth: 0,
      limit: DEFAULT_PAGE_SIZE,
      page,
      select: {
        createdAt: true,
        name: true,
        promoApplied: true,
      },
      sort: '-createdAt',
      where: {
        and: [
          {
            createdAt: {
              greater_than_equal: startDate.toISOString(),
            },
          },
          {
            createdAt: {
              less_than_equal: endDate.toISOString(),
            },
          },
        ],
      },
    })) as {
      docs: CustomerRangeDoc[]
      hasNextPage: boolean
      totalPages: number
    }

    docs.push(...(batch.docs || []).filter((doc) => !isExcludedLeadName(doc?.name)))
    hasNextPage = batch.hasNextPage
    totalPages = batch.totalPages || totalPages
    page += 1
  }

  return {
    docs,
    totalPages,
  }
}

export const dynamic = 'force-dynamic'

export async function OPTIONS(req: Request) {
  const { items } = getAccessWhitelist()

  return new NextResponse(null, {
    headers: withCorsHeaders(req, items),
    status: 204,
  })
}

export async function GET(req: Request) {
  const whitelistResult = getAccessWhitelist()
  const headers = withCorsHeaders(req, whitelistResult.items, {
    'Content-Type': 'application/json',
  })

  try {
    if (whitelistResult.error) {
      return NextResponse.json(
        {
          ok: false,
          message: whitelistResult.error,
        },
        {
          headers,
          status: 503,
        },
      )
    }

    if (whitelistResult.items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Open API belum aktif. Set REPORTS_OPEN_API_WHITELIST (array domain + token) di environment.',
        },
        {
          headers,
          status: 503,
        },
      )
    }

    const providedKey = extractApiKeyFromRequest(req)
    const requestedDomain = extractRequestedDomain(req)

    if (!providedKey) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Unauthorized. API key wajib diisi.',
        },
        {
          headers,
          status: 401,
        },
      )
    }

    if (!requestedDomain) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Header origin atau x-client-domain wajib diisi.',
        },
        {
          headers,
          status: 401,
        },
      )
    }

    const matchedCredential = whitelistResult.items.find((item) => {
      const domainMatched = item.domain === '*' || item.domain === requestedDomain
      return domainMatched && item.tokens.includes(providedKey)
    })

    if (!matchedCredential) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Unauthorized. Domain/token tidak ada di whitelist.',
        },
        {
          headers,
          status: 401,
        },
      )
    }

    const url = new URL(req.url)
    const queryStart = parseDateOrNull(url.searchParams.get('start'))
    const queryEnd = parseDateOrNull(url.searchParams.get('end'))
    const now = new Date()
    const defaultStart = new Date(now.getTime() - 30 * DAY_MS)

    const startDate = queryStart || defaultStart
    const endDate = queryEnd || now

    if (endDate < startDate) {
      return NextResponse.json(
        {
          ok: false,
          message: '`end` harus lebih besar atau sama dengan `start`.',
        },
        {
          headers,
          status: 400,
        },
      )
    }

    const topLimit = clampTopLimit(Number(url.searchParams.get('top') || DEFAULT_TOP_LIMIT))
    const trendGranularity = parseGranularity(url.searchParams.get('trend'))
    const maxPages = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get('maxPages') || DEFAULT_MAX_PAGES)),
    )

    const payload = await getPayload({ config })

    const { docs, totalPages } = await fetchCustomerRangeDocs({
      endDate,
      maxPages,
      payload,
      startDate,
    })

    const msDiff = endDate.getTime() - startDate.getTime()
    const rangeDays = Math.max(1, Math.ceil(msDiff / DAY_MS))
    const totalDocs = docs.length
    const promoDocs = docs.filter((doc) => Boolean(doc.promoApplied)).length
    const promoRatePct = totalDocs > 0 ? (promoDocs / totalDocs) * 100 : 0
    const averagePerDay = totalDocs / rangeDays
    const isTruncated = totalPages > maxPages

    const prevEndDate = new Date(startDate.getTime() - 1)
    const prevStartDate = new Date(prevEndDate.getTime() - msDiff)
    const prevDocs = await fetchCustomerRangeDocs({
      endDate: prevEndDate,
      maxPages,
      payload,
      startDate: prevStartDate,
    })

    const growthVsPrevRangePct =
      prevDocs.docs.length > 0
        ? ((totalDocs - prevDocs.docs.length) / prevDocs.docs.length) * 100
        : 0

    const trendBuckets = buildTrendBuckets(docs, startDate, endDate, trendGranularity)
    const topHours = buildTopHours(docs, topLimit)

    return NextResponse.json(
      {
        ok: true,
        credential: {
          header: 'x-api-key',
          matchedDomain: matchedCredential.domain,
          requestedDomain,
          scheme: 'Bearer (optional)',
          whitelistMode: 'domain+token array',
        },
        meta: {
          generatedAt: new Date().toISOString(),
          isTruncated,
          sourceCollection: 'customers',
          timezone: 'Asia/Jakarta',
        },
        query: {
          endISO: endDate.toISOString(),
          rangeDays,
          startISO: startDate.toISOString(),
          top: topLimit,
          trend: trendGranularity,
        },
        summary: {
          averagePerDay: Number(averagePerDay.toFixed(2)),
          growthVsPrevRangePct: Number(growthVsPrevRangePct.toFixed(2)),
          promoDocs,
          promoRatePct: Number(promoRatePct.toFixed(2)),
          totalDocs,
        },
        topHours: {
          buckets: topHours,
          limit: topLimit,
        },
        trend: {
          buckets: trendBuckets,
          granularity: trendGranularity,
        },
      },
      {
        headers,
        status: 200,
      },
    )
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
      {
        headers,
        status: 500,
      },
    )
  }
}

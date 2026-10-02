import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/http/getClientIp'
import { checkRateLimit } from '@/lib/security/rateLimit'

export const runtime = 'nodejs'

// Dual-key rate limit windows and caps:
// 1) Per-IP: 10 requests per 10 minutes (prevents bot enumeration/scraping)
// 2) Per-ID (NIK/Phone): 5 requests per 5 minutes (prevents brute forcing individual records)
const IP_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 }
const ID_RATE_LIMIT = { limit: 5, windowMs: 5 * 60 * 1000 }

// In-Memory Cache (TTL: 60 Detik) for ultra-fast repeated responses (< 5ms)
const CACHE_TTL_MS = 60 * 1000
const statusCache = new Map<string, { timestamp: number; data: Out }>()

type Step = {
  title: string
  status: 'success' | 'in-progress' | 'failed' | 'pending'
  date?: string | null
  detail?: string | null
}

type ClientReq = {
  area?: string
  inputType?: 'nik' | 'phone' | string
  value?: string
  hp_trap?: string
  website_field?: string
  website_trap?: string
}

type Out = {
  success: boolean
  message?: string
  steps?: Step[]
  error?: string
}

function pruneCacheIfDue() {
  if (statusCache.size > 1000) {
    const now = Date.now()
    for (const [key, item] of statusCache) {
      if (now - item.timestamp >= CACHE_TTL_MS) {
        statusCache.delete(key)
      }
    }
  }
}

function normalizeStepStatus(s: unknown): Step['status'] {
  const str = String(s ?? '').toLowerCase().trim()
  if (
    str === 'success' ||
    str === 'done' ||
    str === 'selesai' ||
    str === 'berhasil' ||
    str === 'approved' ||
    str === 'lulus'
  ) {
    return 'success'
  }
  if (
    str === 'in-progress' ||
    str === 'in_progress' ||
    str === 'progress' ||
    str === 'proses' ||
    str === 'sedang diproses' ||
    str === 'berjalan'
  ) {
    return 'in-progress'
  }
  if (
    str === 'failed' ||
    str === 'gagal' ||
    str === 'ditolak' ||
    str === 'rejected' ||
    str === 'tidak lulus'
  ) {
    return 'failed'
  }
  return 'pending'
}

/**
 * Maps raw upstream data into a clean, whitelisted array of Step objects.
 * CRITICAL ZERO-PII RULE:
 * NEVER expose names, raw identity numbers, home addresses, phone numbers,
 * or raw spreadsheet rows. Only whitelisted progress step indicators are returned.
 */
function mapWpToSteps(raw: any): Step[] {
  const arr =
    raw?.steps ||
    raw?.timeline ||
    raw?.data?.steps ||
    raw?.data?.timeline ||
    raw?.result?.steps ||
    raw?.result?.timeline ||
    (Array.isArray(raw?.data) ? raw.data : null)

  if (Array.isArray(arr)) {
    return arr.map((s: any) => ({
      title: String(s?.title ?? s?.nama ?? s?.label ?? s?.step ?? 'Tahapan').trim(),
      status: normalizeStepStatus(s?.status),
      date: s?.date ? String(s.date) : s?.result ? String(s.result) : s?.tanggal ? String(s.tanggal) : null,
      detail: s?.detail ? String(s.detail) : s?.keterangan ? String(s.keterangan) : null,
    }))
  }

  // Fallback: if upstream only returned a status message
  const msg = raw?.message || raw?.data?.message || raw?.error || raw?.data?.error
  if (typeof msg === 'string' && msg.trim()) {
    return [
      {
        title: 'Status Pendaftaran',
        status: raw?.success ? 'success' : 'in-progress',
        date: null,
        detail: msg.trim(),
      },
    ]
  }

  return []
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req) ?? 'unknown'

    // 1. Dual-Key Rate Limit - Key 1: Per-IP Protection
    const ipRate = checkRateLimit(`status-check:ip:${clientIp}`, IP_RATE_LIMIT)
    if (!ipRate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.',
        } satisfies Out,
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(ipRate.retryAfterMs / 1000)) },
        },
      )
    }

    const body = (await req.json().catch(() => null)) as ClientReq | null
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Body request tidak valid.' } satisfies Out,
        { status: 400 },
      )
    }

    // 2. Anti-Bot Honeypot Check
    if (body.hp_trap || body.website_field || body.website_trap) {
      return NextResponse.json(
        { success: false, error: 'Permintaan tidak valid.' } satisfies Out,
        { status: 400 },
      )
    }

    // 3. Normalization & Sanitization (ported from legacy PHP)
    const area = String(body.area ?? '').trim().toUpperCase()
    const inputType = body.inputType === 'phone' ? 'phone' : 'nik'
    const rawValue = String(body.value ?? '').trim()
    const value = rawValue.replace(/\D/g, '')

    // 4. Strict Validation
    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Area wajib dipilih.' } satisfies Out,
        { status: 400 },
      )
    }

    if (inputType === 'nik' && value.length !== 16) {
      return NextResponse.json(
        {
          success: false,
          error: 'NIK harus berjumlah tepat 16 digit angka.',
        } satisfies Out,
        { status: 400 },
      )
    }

    if (inputType === 'phone' && (value.length < 9 || value.length > 15)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nomor handphone harus valid (9 - 15 digit angka).',
        } satisfies Out,
        { status: 400 },
      )
    }

    // 5. Dual-Key Rate Limit - Key 2: Per NIK/Phone Protection
    const idRate = checkRateLimit(`status-check:id:${inputType}:${value}`, ID_RATE_LIMIT)
    if (!idRate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Terlalu banyak permintaan untuk nomor ini. Silakan coba lagi beberapa saat lagi.',
        } satisfies Out,
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(idRate.retryAfterMs / 1000)) },
        },
      )
    }

    // 6. In-Memory Cache Check (< 5ms response for duplicate checks)
    const cacheKey = `${area}:${inputType}:${value}`
    const cached = statusCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }

    // 7. Server Environment Credentials (No NEXT_PUBLIC_ prefix to prevent browser exposure)
    const GAS_URL =
      process.env.MOBIS_GAS_STATUS_CHECK_URL ||
      'https://script.google.com/macros/s/AKfycbwueMEz3gDjWlQMNYGB6zWdt22oVvVKE6fElnnGV9LJdwgs4kkNqQ0wiQPWfjisZhKB/exec'
    const GAS_TOKEN = process.env.MOBIS_GAS_SECRET_TOKEN || 'MOBIS_SECRET_123'

    // 8. Query Parameters (exact match to legacy PHP $query_args expected by Google Apps Script)
    const queryParams = new URLSearchParams({
      token: GAS_TOKEN,
      ca_pref: area,
      ca_preferensi: area,
      input_type: inputType,
      nik: inputType === 'nik' ? value : '',
      nik_raw: inputType === 'nik' ? rawValue : '',
      nik_str: inputType === 'nik' ? `'${value}` : '',
      phone: inputType === 'phone' ? value : '',
      phone_raw: inputType === 'phone' ? rawValue : '',
    })

    // 9. Direct Native Fetch to GAS with 15-second timeout and no-store cache
    const gasRes = await fetch(`${GAS_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })

    const text = await gasRes.text()
    let raw: any = null
    try {
      raw = JSON.parse(text)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Format respon dari server pendaftaran tidak valid.',
        } satisfies Out,
        { status: 502 },
      )
    }

    // 10. Handle GAS ok: false responses gracefully
    if (raw?.ok === false) {
      const notFoundResult: Out = {
        success: false,
        message: raw.error || 'Data pendaftaran tidak ditemukan.',
        steps: [],
      }
      return NextResponse.json(notFoundResult)
    }

    // 11. Zero-PII Whitelisting: ONLY return status, message, and steps. NEVER leak PII to client!
    const steps = mapWpToSteps(raw)
    const success = raw?.success ?? (steps.length > 0)
    const message =
      raw?.message ||
      (success ? 'Status pendaftaran berhasil ditemukan.' : 'Data pendaftaran tidak ditemukan.')

    const result: Out = {
      success: Boolean(success),
      message: String(message),
      steps,
    }

    // Save to Cache & prune old items if needed
    pruneCacheIfDue()
    statusCache.set(cacheKey, { timestamp: Date.now(), data: result })

    return NextResponse.json(result)
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Waktu permintaan habis. Silakan coba kembali.',
        } satisfies Out,
        { status: 504 },
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Layanan verifikasi sedang sibuk. Silakan coba beberapa saat lagi.',
      } satisfies Out,
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}

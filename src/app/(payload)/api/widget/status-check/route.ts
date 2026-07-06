import { NextResponse } from 'next/server'

export const runtime = 'nodejs' // penting: FormData + fetch ke WP stabil di node runtime

type Step = {
  title: string
  status: 'success' | 'in-progress' | 'failed' | 'pending'
  date?: string | null
  detail?: string | null
}

type ClientReq = {
  area: string
  inputType: 'nik' | 'phone'
  value: string
}

type Out = {
  success: boolean
  message?: string
  steps?: Step[]
  error?: string
}

const WP_AJAX_URL = 'https://global-mobility-service.co.id/wp-admin/admin-ajax.php'
const WP_NONCE = process.env.MOBIS_WP_AJAX_NONCE || ''

function clampDigits(s: string) {
  return String(s ?? '').replace(/\D/g, '')
}

function normalizeArea(s: string) {
  return String(s ?? '')
    .trim()
    .toUpperCase()
}

/**
 * Mapper umum:
 * - Jika WP sudah mengembalikan array steps/timeline => pakai
 * - Jika tidak ada => minimal return placeholder step
 */
function mapWpToSteps(raw: any): Step[] {
  // 1) kalau sudah ada field steps/timeline yang berupa array
  const arr =
    raw?.steps ||
    raw?.timeline ||
    raw?.data?.steps ||
    raw?.data?.timeline ||
    raw?.result?.steps ||
    raw?.result?.timeline

  if (Array.isArray(arr)) {
    return arr.map((s: any) => ({
      title: String(s?.title ?? s?.nama ?? s?.label ?? 'Tanpa Judul'),
      status: (String(s?.status ?? 'pending') as any) || 'pending',
      date: s?.date ?? s?.result ?? null,
      detail: s?.detail ?? null,
    }))
  }

  // 2) fallback: kalau WP cuma ngasih message string
  const msg =
    raw?.message || raw?.data?.message || raw?.error || raw?.data?.error || raw?.data || null

  if (msg) {
    return [
      {
        title: 'Status',
        status: 'in-progress',
        date: null,
        detail: String(msg),
      },
    ]
  }

  return []
}

function mapWpMessage(raw: any): { success: boolean; message: string } {
  // WordPress AJAX biasanya: { success: true/false, data: ... } atau { success, message }
  if (raw?.success === true) {
    const message = String(raw?.message ?? raw?.data?.message ?? 'Data pendaftaran ditemukan.')
    return { success: true, message }
  }

  // kalau WP pakai "status":"success"
  if (raw?.status === 'success') {
    const message = String(raw?.message ?? 'Data pendaftaran ditemukan.')
    return { success: true, message }
  }

  // default gagal
  const message = String(
    raw?.message ?? raw?.data?.message ?? raw?.error ?? raw?.data?.error ?? 'Data tidak ditemukan.',
  )
  return { success: false, message }
}

export async function POST(req: Request) {
  try {
    if (!WP_AJAX_URL) {
      const out: Out = { success: false, error: 'MOBIS_WP_AJAX_URL belum diset di .env' }
      return NextResponse.json(out, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as ClientReq | null
    if (!body)
      return NextResponse.json({ success: false, error: 'Body JSON tidak valid.' } satisfies Out, {
        status: 400,
      })

    const area = normalizeArea(body.area)
    const inputType = body.inputType
    const value = clampDigits(body.value)

    if (!area)
      return NextResponse.json({ success: false, error: 'Area wajib diisi.' } satisfies Out, {
        status: 400,
      })
    if (inputType !== 'nik' && inputType !== 'phone') {
      return NextResponse.json(
        { success: false, error: 'inputType harus "nik" atau "phone".' } satisfies Out,
        { status: 400 },
      )
    }
    if (!value) {
      return NextResponse.json(
        {
          success: false,
          error: inputType === 'nik' ? 'NIK wajib diisi.' : 'Nomor HP wajib diisi.',
        } satisfies Out,
        { status: 400 },
      )
    }

    // Bentuk FormData sesuai WP AJAX (persis seperti n8n kamu)
    const fd = new FormData()
    fd.append('action', 'mobis_check_status')
    fd.append('ca_pref', area)
    fd.append('ca_preferensi', area)

    // kirim keduanya biar kompatibel (WP script kamu bisa pilih salah satu)
    fd.append('nik', inputType === 'nik' ? value : '')
    fd.append('phone', inputType === 'phone' ? value : '')

    // OPTIONAL nonce
    if (WP_NONCE) fd.append('_ajax_nonce', WP_NONCE)

    const wpRes = await fetch(WP_AJAX_URL, {
      method: 'POST',
      body: fd,
      cache: 'no-store',
    })

    const text = await wpRes.text()

    // WP kadang balikin JSON, kadang string HTML.
    // Coba parse JSON dulu. Kalau gagal, treat as message.
    let raw: any = null
    try {
      raw = JSON.parse(text)
    } catch {
      raw = { success: wpRes.ok, message: text }
    }

    const m = mapWpMessage(raw)
    const steps = mapWpToSteps(raw)

    const out: Out = {
      success: m.success,
      message: m.message,
      steps,
      // NOTE: raw upstream response intentionally NOT forwarded to the client —
      // it exposes internal WordPress AJAX structure/fields. Kept server-side only.
    }

    // kalau WP response http error, tetap forward sebagai 200 agar UI bisa tampilkan message
    return NextResponse.json(out)
  } catch (e: any) {
    const out: Out = { success: false, error: e?.message || 'Internal error' }
    return NextResponse.json(out, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}

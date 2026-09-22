import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/http/getClientIp'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { sanitizeFreeText, assertNoSuspiciousMarkup } from '@/lib/security/sanitize'
import { signAssistantPayload } from '@/lib/security/assistantSigning'

// Fail-closed: when MOBIS_ASSISTANT_API_BASE is unset we fall back to the local
// STUB below (see `if (!UPSTREAM)`), NOT to a hardcoded staging host. A missing
// env in production must never silently proxy real user chats to staging.
const UPSTREAM = process.env.MOBIS_ASSISTANT_API_BASE || ''

const CHAT_RATE_LIMIT = { limit: 20, windowMs: 60 * 1000 }

function validateChatBody(body: any): {
  query: string
  username?: string
  phoneNumber?: string
  token?: string
} {
  const query = sanitizeFreeText(body?.query, 2000)
  if (!query) {
    const err = new Error('Pesan tidak boleh kosong.')
    ;(err as any).statusCode = 400
    throw err
  }
  assertNoSuspiciousMarkup(query, 'query')

  const username = body?.username ? sanitizeFreeText(body.username, 100) : undefined
  if (username) {
    assertNoSuspiciousMarkup(username, 'username')
  }

  const phoneRaw = body?.phoneNumber ? String(body.phoneNumber) : ''
  const phoneNumber = phoneRaw ? phoneRaw.replace(/\D/g, '').slice(0, 20) : undefined

  const token =
    body?.token && typeof body.token === 'string'
      ? sanitizeFreeText(body.token, 150)
      : undefined
  if (token) {
    assertNoSuspiciousMarkup(token, 'token')
  }

  return { query, username, phoneNumber, ...(token ? { token } : {}) }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req) ?? 'unknown'
    const rate = checkRateLimit(`assistant:${clientIp}`, CHAT_RATE_LIMIT)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak pesan. Silakan coba lagi sebentar lagi.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } },
      )
    }

    const rawBody = await req.json()

    let body: { query: string; username?: string; phoneNumber?: string }
    try {
      body = validateChatBody(rawBody)
    } catch (validationErr: any) {
      return NextResponse.json(
        { error: validationErr?.message || 'Data tidak valid.' },
        { status: 400 },
      )
    }

    // STUB (biar tidak 404 walau env belum diset)
    if (!UPSTREAM) {
      return NextResponse.json({
        answer: `✅ (STUB) Halo ${body.username ?? ''}, kamu bilang: "${body.query}"`,
        token: 'stub-token',
      })
    }

    const auth = req.headers.get('authorization') || ''

    const { rawBody: signedBody, headers: signedHeaders } = signAssistantPayload(body)

    const upstreamRes = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        ...signedHeaders,
        ...(auth ? { Authorization: auth } : {}),
      },
      body: signedBody,
      cache: 'no-store',
    })

    const text = await upstreamRes.text()
    if (!text || text.trim() === '') {
      return NextResponse.json(
        {
          answer:
            'Mohon maaf, asisten sedang sibuk atau mengalami gangguan sementara. Silakan coba beberapa saat lagi atau hubungi kami melalui WhatsApp.',
        },
        { status: 200 },
      )
    }

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed, { status: upstreamRes.status })
    } catch {
      return new NextResponse(text, {
        status: upstreamRes.status,
        headers: { 'Content-Type': upstreamRes.headers.get('content-type') || 'application/json' },
      })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

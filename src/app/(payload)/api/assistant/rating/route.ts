import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/http/getClientIp'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { sanitizeFreeText, assertNoSuspiciousMarkup } from '@/lib/security/sanitize'
import { signAssistantPayload } from '@/lib/security/assistantSigning'

const UPSTREAM = process.env.MOBIS_ASSISTANT_API_BASE || '' // base chats
// rating endpoint biasanya: `${base}/rating`
const UPSTREAM_RATING =
  process.env.MOBIS_ASSISTANT_API_RATING || (UPSTREAM ? `${UPSTREAM}/rating` : '')

const RATING_RATE_LIMIT = { limit: 10, windowMs: 60 * 1000 }

function validateRatingBody(body: any) {
  const rating = Number(body?.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const err = new Error('Rating harus berupa angka 1-5.')
    ;(err as any).statusCode = 400
    throw err
  }

  const review = body?.review ? sanitizeFreeText(body.review, 1000) : undefined
  if (review) {
    assertNoSuspiciousMarkup(review, 'review')
  }

  const username = body?.username ? sanitizeFreeText(body.username, 100) : undefined
  if (username) {
    assertNoSuspiciousMarkup(username, 'username')
  }

  const token =
    body?.token && typeof body.token === 'string'
      ? sanitizeFreeText(body.token, 150)
      : undefined
  if (token) {
    assertNoSuspiciousMarkup(token, 'token')
  }

  return {
    rating,
    review,
    username,
    phoneNumber: body?.phoneNumber
      ? String(body.phoneNumber).replace(/\D/g, '').slice(0, 20)
      : undefined,
    ...(token ? { token } : {})
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req) ?? 'unknown'
    const rate = checkRateLimit(`assistant-rating:${clientIp}`, RATING_RATE_LIMIT)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi sebentar lagi.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } },
      )
    }

    const rawBody = await req.json()

    let body: ReturnType<typeof validateRatingBody>
    try {
      body = validateRatingBody(rawBody)
    } catch (validationErr: any) {
      return NextResponse.json(
        { error: validationErr?.message || 'Data tidak valid.' },
        { status: 400 },
      )
    }

    if (!UPSTREAM_RATING) {
      return NextResponse.json({ success: true, note: '✅ (STUB) rating saved locally (stub)' })
    }

    const auth = req.headers.get('authorization') || ''

    const { rawBody: signedBody, headers: signedHeaders } = signAssistantPayload(body)

    const upstreamRes = await fetch(UPSTREAM_RATING, {
      method: 'POST',
      headers: {
        ...signedHeaders,
        ...(auth ? { Authorization: auth } : {}),
      },
      body: signedBody,
      cache: 'no-store',
    })

    const text = await upstreamRes.text()
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: { 'Content-Type': upstreamRes.headers.get('content-type') || 'application/json' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

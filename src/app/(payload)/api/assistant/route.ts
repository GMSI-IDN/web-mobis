import { NextResponse } from 'next/server'

// Fail-closed: when MOBIS_ASSISTANT_API_BASE is unset we fall back to the local
// STUB below (see `if (!UPSTREAM)`), NOT to a hardcoded staging host. A missing
// env in production must never silently proxy real user chats to staging.
const UPSTREAM = process.env.MOBIS_ASSISTANT_API_BASE || ''

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // STUB (biar tidak 404 walau env belum diset)
    if (!UPSTREAM) {
      return NextResponse.json({
        answer: `✅ (STUB) Halo ${body?.username ?? ''}, kamu bilang: "${body?.query ?? ''}"`,
        token: 'stub-token',
      })
    }

    const auth = req.headers.get('authorization') || ''

    const upstreamRes = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
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

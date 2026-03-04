import { NextResponse } from 'next/server'

const UPSTREAM = process.env.MOBIS_ASSISTANT_API_BASE || '' // base chats
// rating endpoint biasanya: `${base}/rating`
const UPSTREAM_RATING =
  process.env.MOBIS_ASSISTANT_API_RATING || (UPSTREAM ? `${UPSTREAM}/rating` : '')

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!UPSTREAM_RATING) {
      return NextResponse.json({ success: true, note: '✅ (STUB) rating saved locally (stub)' })
    }

    const auth = req.headers.get('authorization') || ''

    const upstreamRes = await fetch(UPSTREAM_RATING, {
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

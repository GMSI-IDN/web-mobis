import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/http/getClientIp'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { signAssistantPayload } from '@/lib/security/assistantSigning'

const SYNC_RATE_LIMIT = { limit: 6, windowMs: 60 * 1000 }

// Webhook endpoint di n8n untuk trigger "SANDBOX - Sync FAQ RAG dari Sheet"
function getSyncWebhookUrl(): string {
  if (process.env.MOBIS_FAQ_SYNC_WEBHOOK_URL) {
    return process.env.MOBIS_FAQ_SYNC_WEBHOOK_URL
  }

  // Fallback derive from MOBIS_ASSISTANT_API_BASE
  const base = process.env.MOBIS_ASSISTANT_API_BASE || ''
  if (base.includes('/webhook/')) {
    const origin = base.substring(0, base.indexOf('/webhook/'))
    return `${origin}/webhook/sync_faq_mobis`
  }
  return 'https://stg-n8n.fleet-management-system.co.id/webhook/sync_faq_mobis'
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req) ?? 'unknown'
    const rate = checkRateLimit(`faq-sync:${clientIp}`, SYNC_RATE_LIMIT)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu sering menyinkronkan. Mohon tunggu beberapa detik lagi.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } },
      )
    }

    let payloadData: { environment?: string; channel?: string; triggeredAt?: string } = {}
    try {
      payloadData = await req.json()
    } catch {
      payloadData = {}
    }

    const syncPayload = {
      action: 'SYNC_FAQ_RAG',
      environment: payloadData.environment || 'staging',
      channel: payloadData.channel || 'dm',
      triggeredAt: new Date().toISOString(),
      triggeredBy: 'CMS_ADMIN_BUTTON',
    }

    const webhookUrl = getSyncWebhookUrl()

    // Sign payload with HMAC if secret is configured
    let fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    let fetchBody = JSON.stringify(syncPayload)

    if (process.env.MOBIS_ASSISTANT_SECRET) {
      try {
        const signed = signAssistantPayload(syncPayload)
        fetchHeaders = { ...signed.headers }
        fetchBody = signed.rawBody
      } catch (err) {
        console.warn('[FAQ Sync] Gagal sign HMAC, fallback unsigned:', err)
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    try {
      const upstreamRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: fetchBody,
        signal: controller.signal,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      if (upstreamRes.ok) {
        const text = await upstreamRes.text().catch(() => '')
        let data: any = null
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = null
        }

        return NextResponse.json({
          success: true,
          message: data?.message || 'Workflow sinkronisasi FAQ dari Google Sheet berhasil dijalankan di n8n!',
          webhookUrl,
        })
      } else {
        const errText = await upstreamRes.text().catch(() => '')
        return NextResponse.json(
          {
            success: false,
            error: `n8n webhook merespons HTTP ${upstreamRes.status}. Pastikan node Webhook 'sync_faq_mobis' sudah aktif di n8n.`,
            details: errText,
            webhookUrl,
          },
          { status: 200 },
        )
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId)
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({
          success: true,
          message: 'Permintaan sinkronisasi telah dikirim ke n8n (proses sedang berjalan di background).',
          webhookUrl,
        })
      }
      return NextResponse.json(
        {
          success: false,
          error: `Gagal menghubungi n8n: ${fetchErr.message || 'Koneksi terputus'}. Pastikan n8n aktif dan URL webhook terdaftar.`,
          webhookUrl,
        },
        { status: 200 },
      )
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

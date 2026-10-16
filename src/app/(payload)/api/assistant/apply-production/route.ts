import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/http/getClientIp'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { signAssistantPayload } from '@/lib/security/assistantSigning'
import { applyStagingToProduction } from '@/utilities/chatbotDb'

export const maxDuration = 600 // 10 menit untuk menampung AI analysis n8n
export const dynamic = 'force-dynamic'

const APPLY_RATE_LIMIT = { limit: 10, windowMs: 60 * 1000 }

function getApplyWebhookUrl(): string {
  if (process.env.MOBIS_FAQ_APPLY_WEBHOOK_URL) {
    return process.env.MOBIS_FAQ_APPLY_WEBHOOK_URL
  }
  if (process.env.MOBIS_FAQ_SYNC_WEBHOOK_URL) {
    return process.env.MOBIS_FAQ_SYNC_WEBHOOK_URL
  }
  const base = process.env.MOBIS_ASSISTANT_API_BASE || ''
  if (base.includes('/webhook/')) {
    const origin = base.substring(0, base.indexOf('/webhook/'))
    return `${origin}/webhook/apply_production_faq_mobis`
  }
  return 'https://stg-n8n.fleet-management-system.co.id/webhook/apply_production_faq_mobis'
}

function extractN8nFeedback(data: any): {
  feedbackText: string
  isContradiction: boolean
  isDuplicate: boolean
  isImmediately: boolean
  isError: boolean
  isSuccess: boolean
} {
  if (!data) {
    return {
      feedbackText: '',
      isContradiction: false,
      isDuplicate: false,
      isImmediately: false,
      isError: false,
      isSuccess: false,
    }
  }

  let target = data
  if (Array.isArray(data) && data.length > 0) {
    target = data[0]
  }
  if (target?.json) {
    target = target.json
  }

  let text = ''
  let explicitSuccess: boolean | null = null

  if (target === true) {
    explicitSuccess = true
  } else if (target === false) {
    explicitSuccess = false
  } else if (typeof target === 'object' && target !== null) {
    if (typeof target.success === 'boolean') {
      explicitSuccess = target.success
    } else if (target.success === 'true') {
      explicitSuccess = true
    } else if (target.success === 'false') {
      explicitSuccess = false
    }

    if (typeof target.output === 'string') {
      text = target.output
    } else if (typeof target.result === 'string') {
      text = target.result
    } else if (typeof target.response === 'string') {
      text = target.response
    } else if (typeof target.text === 'string') {
      text = target.text
    } else if (typeof target.message === 'string') {
      text = target.message
      if (typeof target.hint === 'string') {
        text += `\n\nPetunjuk n8n: ${target.hint}`
      }
    } else if (typeof target.feedback === 'string') {
      text = target.feedback
    } else if (typeof target.details === 'string') {
      text = target.details
    } else if (typeof target.summary === 'string') {
      text = target.summary
    } else if (typeof target.error === 'string') {
      text = target.error
    } else {
      text = JSON.stringify(target)
    }
  } else if (typeof target === 'string') {
    text = target
    if (target.trim().toLowerCase() === 'true') explicitSuccess = true
    if (target.trim().toLowerCase() === 'false') explicitSuccess = false
  }

  const isImmediately = text === 'Workflow was started' || text.includes('Workflow was started')
  const lower = text.toLowerCase()

  const isNoContradiction =
    lower.includes('tidak ditemukan kontradiksi') ||
    lower.includes('tidak ada kontradiksi') ||
    lower.includes('bebas kontradiksi') ||
    lower.includes('tanpa kontradiksi') ||
    lower.includes('tidak bertentangan') ||
    (lower.includes('kontradiksi') && lower.includes('tidak'))

  const isContradiction =
    !isNoContradiction &&
    (explicitSuccess === false ||
      lower.includes('ada kontradiksi') ||
      lower.includes('ditemukan kontradiksi') ||
      lower.includes('terdapat kontradiksi') ||
      lower.includes('vs baris') ||
      lower.includes('bertentangan') ||
      lower.includes('saling meniadakan') ||
      (lower.includes('kontradiksi') && !lower.includes('tidak')))

  const isDuplicate = lower.includes('duplikat') || lower.includes('duplikasi')
  const isError = lower.includes('error') || lower.includes('gagal') || (!isNoContradiction && explicitSuccess === false)

  const isSuccess =
    explicitSuccess === true ||
    isNoContradiction ||
    (!isContradiction && !isDuplicate && !isError && !isImmediately)

  return { feedbackText: text, isContradiction, isDuplicate, isImmediately, isError, isSuccess }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req) ?? 'unknown'
    const rate = checkRateLimit(`faq-apply:${clientIp}`, APPLY_RATE_LIMIT)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu sering melakukan apply. Mohon tunggu beberapa detik lagi.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } },
      )
    }

    let payloadData: { channel?: string; uuid?: string; triggeredBy?: string; action?: string } = {}
    try {
      payloadData = await req.json()
    } catch {
      payloadData = {}
    }

    const channel = (payloadData.channel as 'dm' | 'comment' | 'all') || 'dm'
    const uuid = payloadData.uuid

    // A. JIKA ACTION === 'commit': EKSEKUSI SINKRONISASI DATABASE KE PRODUCTION
    if (payloadData.action === 'commit') {
      let syncResponse
      try {
        const triggeredBy = payloadData.triggeredBy || 'CMS_GLOBAL_APPLY_CONFIRMED'
        syncResponse = await applyStagingToProduction(channel, uuid, triggeredBy)
      } catch (dbErr: any) {
        console.error('[Apply Production] Error commit DB:', dbErr)
        return NextResponse.json(
          { success: false, error: dbErr?.message || 'Gagal sinkron ke database production.' },
          { status: 500 },
        )
      }

      const totalCount = syncResponse.results.reduce((acc, curr) => acc + curr.syncedCount, 0)
      let channelLabel = 'Semua Sheet'
      if (channel === 'dm') channelLabel = 'Sheet Direct Message (DM)'
      if (channel === 'comment') channelLabel = 'Sheet Comment'

      const backupInfo = syncResponse.backup
        ? `\n\n💾 Snapshot backup otomatis telah tersimpan (#${syncResponse.backup.id} - ${syncResponse.backup.backup_name}).`
        : ''

      return NextResponse.json({
        success: true,
        committed: true,
        totalCount,
        results: syncResponse.results,
        backup: syncResponse.backup,
        title: 'Berhasil Disinkronkan ke Production!',
        subtitle: syncResponse.backup
          ? `Data telah aktif di Live Production • Backup #${syncResponse.backup.id} tersimpan`
          : 'Seluruh data telah aktif di Live Production',
        feedbackText: `Seluruh data FAQ (${channelLabel}) berhasil disinkronkan ke database Production (${totalCount} baris diperbarui).${backupInfo}`,
        message: `Berhasil menerapkan ${totalCount} FAQ ${channelLabel} ke database Production!`,
      })
    }

    // B. JIKA ACTION === 'scan' (ATAU DEFAULT): PICU WORKFLOW N8N UNTUK VALIDASI KONTRADIKSI
    const webhookUrl = getApplyWebhookUrl()
    let n8nTriggered = false
    let n8nData: any = null
    let feedbackResult = {
      feedbackText: '',
      isContradiction: false,
      isDuplicate: false,
      isImmediately: false,
      isError: false,
      isSuccess: false,
    }

    if (webhookUrl) {
      const applyPayload = {
        action: 'SCAN_CONTRADICTION',
        channel,
        uuid: uuid || null,
        environment: 'staging',
        applyToProduction: false,
        commit: false,
        triggeredAt: new Date().toISOString(),
        triggeredBy: payloadData.triggeredBy || 'CMS_ADMIN_BUTTON',
      }

      let fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      let fetchBody = JSON.stringify(applyPayload)

      if (process.env.MOBIS_ASSISTANT_SECRET) {
        try {
          const signed = signAssistantPayload(applyPayload)
          fetchHeaders = { ...signed.headers }
          fetchBody = signed.rawBody
        } catch (err) {
          console.warn('[Apply Production] Gagal sign HMAC:', err)
        }
      }

      // Berikan timeout 600 detik (10 menit) karena evaluasi AI Gemini review kontradiksi n8n membutuhkan waktu ~2-4 menit
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000)

      try {
        console.log(`[Apply Production] Mengirim request scan ke webhook n8n: ${webhookUrl}`)
        const n8nRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: fetchHeaders,
          body: fetchBody,
          signal: controller.signal,
          cache: 'no-store',
        })
        clearTimeout(timeoutId)

        const rawText = await n8nRes.text()
        try {
          n8nData = JSON.parse(rawText)
        } catch {
          n8nData = rawText
        }

        feedbackResult = extractN8nFeedback(n8nData)

        // 1. Respon langsung dari webhook (n8n Webhook node diset "Respond: Immediately")
        if (feedbackResult.isImmediately) {
          console.warn('[Apply Production] n8n Webhook merespons "Immediately":', n8nData)
          return NextResponse.json({
            success: false,
            isImmediately: true,
            title: 'Workflow n8n Sedang Berjalan di Background',
            subtitle: 'Node Webhook n8n saat ini tersetting ke "Respond: Immediately"',
            message:
              'Workflow n8n telah dipicu di background, namun node Webhook n8n diset ke "Respond: Immediately" sehingga n8n langsung membalas sebelum workflow selesai.',
            feedbackText:
              `Respon dari n8n: "${n8nData?.message || 'Workflow was started'}"\n\n` +
              `⚠️ Catatan:\n` +
              `Workflow di n8n saat ini masih berjalan di background (proses butuh ~1-2 menit).\n\n` +
              `👉 Agar halaman ini bisa otomatis menunggu (loading) sampai n8n selesai 100% dan menampilkan respon hasil evaluasi akhirnya:\n` +
              `1. Buka workflow n8n ("SANDBOX - Sync FAQ RAG ...")\n` +
              `2. Klik node "Webhook" pertama\n` +
              `3. Ubah pengaturan "Respond" dari "Immediately" menjadi "When Last Node Finishes" (atau gunakan node "Respond to Webhook" di akhir alur)\n` +
              `4. Klik Save / Publish di n8n.`,
            n8nResponse: n8nData,
          })
        }

        // 2. Deteksi jika n8n mengembalikan HTTP status error (4xx/5xx)
        if (!n8nRes.ok) {
          console.error('[Apply Production] n8n HTTP error:', n8nRes.status, feedbackResult.feedbackText)
          return NextResponse.json(
            {
              success: false,
              isContradiction: false,
              isDuplicate: false,
              title: 'Workflow n8n Mengembalikan Error HTTP',
              subtitle: `Kode status respons: ${n8nRes.status}`,
              feedbackText:
                `Server n8n merespons dengan HTTP status ${n8nRes.status}.\n\n` +
                (feedbackResult.feedbackText || 'Mohon periksa status dan log workflow di dashboard n8n.'),
              n8nResponse: n8nData,
              message: `Webhook n8n merespons error status ${n8nRes.status}.`,
            },
            { status: 502 },
          )
        }

        // 3. JIKA HASIL SCAN N8N FALSE / MENEMUKAN KONTRADIKSI ATAU DUPLIKASI
        if (!feedbackResult.isSuccess || feedbackResult.isContradiction || feedbackResult.isDuplicate) {
          console.warn('[Apply Production] Scan n8n mendeteksi false/kontradiksi/duplikat:', feedbackResult.feedbackText)
          return NextResponse.json({
            success: false,
            needsConfirmation: false,
            isContradiction: true,
            isDuplicate: feedbackResult.isDuplicate,
            title: 'Ditemukan Kontradiksi pada FAQ',
            subtitle: 'Data belum dapat disinkronkan ke Production',
            feedbackText:
              feedbackResult.feedbackText ||
              'Berdasarkan hasil analisis AI pada alur n8n, ditemukan adanya kontradiksi atau ketidaksesuaian jawaban pada data FAQ.\n\nSilakan sesuaikan dan perbaiki pertanyaan atau jawaban di tab Staging terlebih dahulu sebelum disinkronkan ke Production.',
            n8nResponse: n8nData,
            message: 'Ditemukan kontradiksi FAQ oleh AI Scanner di n8n! Silakan sesuaikan data.',
          })
        }

        n8nTriggered = true
      } catch (fetchErr: any) {
        clearTimeout(timeoutId)
        console.error('[Apply Production] Fetch error ke n8n:', fetchErr)
        if (fetchErr.name === 'AbortError') {
          return NextResponse.json(
            {
              success: false,
              isTimeout: true,
              isContradiction: false,
              error:
                'Timeout: n8n membutuhkan waktu lebih dari 600 detik (10 menit) untuk merespons scan kontradiksi.',
            },
            { status: 504 },
          )
        }
        return NextResponse.json(
          {
            success: false,
            isContradiction: false,
            error: `Gagal menghubungi n8n (${fetchErr.message || 'Koneksi gagal'}). Pastikan URL webhook aktif.`,
          },
          { status: 502 },
        )
      }
    }

    // 4. JIKA TRUE / LOLOS VALIDASI N8N: TAMPILKAN KONFIRMASI (TIDAK ADA KONTRADIKSI)
    const successFeedback =
      (feedbackResult.feedbackText ? `Pesan dari n8n: "${feedbackResult.feedbackText}"\n\n` : '') +
      'Berdasarkan hasil analisis AI pada workflow n8n, seluruh data FAQ telah diverifikasi dan tidak ditemukan adanya kontradiksi, duplikasi, atau inkonsistensi jawaban.\n\nApakah kamu yakin ingin menyinkronkan data ini ke Production?'

    return NextResponse.json({
      success: true,
      needsConfirmation: true,
      canCommit: true,
      isContradiction: false,
      title: 'Pemeriksaan AI Selesai - Tidak Ada Kontradiksi',
      subtitle: 'Data FAQ konsisten dan aman untuk diterapkan',
      feedbackText: successFeedback,
      message: 'Data FAQ valid tanpa kontradiksi. Menunggu konfirmasi untuk sinkron ke Production.',
      channel,
      uuid: uuid || null,
      n8nTriggered,
      n8nResponse: n8nData,
      webhookUrl,
    })
  } catch (err: any) {
    console.error('[Apply Production Error]:', err)
    return NextResponse.json(
      {
        success: false,
        error: `Gagal memproses apply ke Production: ${err?.message || 'Internal error'}`,
      },
      { status: 500 },
    )
  }
}

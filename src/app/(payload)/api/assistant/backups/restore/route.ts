import { NextResponse } from 'next/server'
import { restoreFaqBackup, type RestoreBackupOptions } from '@/utilities/chatbotDb'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Format JSON body tidak valid' }, { status: 400 })
    }

    const backupId = parseInt(body.backupId, 10)
    if (isNaN(backupId) || backupId <= 0) {
      return NextResponse.json({ error: 'Parameter backupId wajib diisi' }, { status: 400 })
    }

    const targetEnv = (body.targetEnv as 'staging' | 'production' | 'both') || 'both'
    const targetChannel = (body.targetChannel as 'dm' | 'comment' | 'all') || 'all'
    const triggeredBy = body.triggeredBy || 'CMS_ADMIN'

    const result = await restoreFaqBackup({
      backupId,
      targetEnv,
      targetChannel,
      triggeredBy,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Restore API Error]:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal memulihkan data dari backup' },
      { status: 500 }
    )
  }
}

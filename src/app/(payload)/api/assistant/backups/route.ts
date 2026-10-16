import { NextResponse } from 'next/server'
import { getFaqBackupsList, getFaqBackupById } from '@/utilities/chatbotDb'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idParam = url.searchParams.get('id')

    // Jika parameter ?id=... disertakan, kembalikan detail snapshot lengkap
    if (idParam) {
      const id = parseInt(idParam, 10)
      if (isNaN(id)) {
        return NextResponse.json({ error: 'ID backup tidak valid' }, { status: 400 })
      }

      const backup = await getFaqBackupById(id)
      if (!backup) {
        return NextResponse.json({ error: 'Data backup tidak ditemukan' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        backup,
      })
    }

    // Jika tanpa parameter id, kembalikan daftar ringkasan riwayat untuk Tampilan A
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    const backups = await getFaqBackupsList(isNaN(limit) ? 50 : limit)

    return NextResponse.json({
      success: true,
      total: backups.length,
      backups,
    })
  } catch (err: any) {
    console.error('[Backups API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat riwayat backup' },
      { status: 500 }
    )
  }
}

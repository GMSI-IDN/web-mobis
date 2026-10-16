import { NextResponse } from 'next/server'
import {
  updateStagingVectorFaq,
  deleteStagingVectorFaq,
  createStagingVectorFaq,
} from '@/utilities/chatbotDb'

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { uuid, channel = 'dm', question, answer, category } = body

    if (!uuid || !question || !answer) {
      return NextResponse.json(
        { error: 'UUID, pertanyaan, dan jawaban wajib diisi' },
        { status: 400 },
      )
    }

    const success = await updateStagingVectorFaq({
      uuid,
      channel: channel === 'comment' ? 'comment' : 'dm',
      question,
      answer,
      category,
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Data FAQ dengan UUID tersebut tidak ditemukan di tabel Staging' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'FAQ berhasil diperbarui di Staging',
      faq: {
        uuid,
        channel,
        question,
        answer,
        category: category || 'Umum',
      },
    })
  } catch (err: any) {
    console.error('[FAQ API] Error updating FAQ in staging:', err)
    return NextResponse.json(
      { error: err?.message || 'Gagal memperbarui FAQ di database' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    let uuid = url.searchParams.get('uuid')
    let channel = url.searchParams.get('channel') || 'dm'

    if (!uuid) {
      try {
        const body = await req.json()
        uuid = body.uuid
        channel = body.channel || channel
      } catch {
        // no-op
      }
    }

    if (!uuid) {
      return NextResponse.json(
        { error: 'UUID FAQ wajib disertakan untuk menghapus' },
        { status: 400 },
      )
    }

    const success = await deleteStagingVectorFaq({
      uuid,
      channel: channel === 'comment' ? 'comment' : 'dm',
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Data FAQ tidak ditemukan di tabel Staging atau sudah dihapus' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'FAQ berhasil dihapus dari Staging',
      uuid,
    })
  } catch (err: any) {
    console.error('[FAQ API] Error deleting FAQ from staging:', err)
    return NextResponse.json(
      { error: err?.message || 'Gagal menghapus FAQ dari database' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { channel = 'dm', question, answer, category } = body

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Pertanyaan dan jawaban wajib diisi' },
        { status: 400 },
      )
    }

    const result = await createStagingVectorFaq({
      channel: channel === 'comment' ? 'comment' : 'dm',
      question,
      answer,
      category,
    })

    return NextResponse.json({
      success: true,
      message: 'FAQ baru berhasil ditambahkan ke Staging',
      uuid: result.uuid,
    })
  } catch (err: any) {
    console.error('[FAQ API] Error creating FAQ in staging:', err)
    return NextResponse.json(
      { error: err?.message || 'Gagal menambahkan FAQ ke database' },
      { status: 500 },
    )
  }
}

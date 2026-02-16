import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

function normalizeCode(v: unknown) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })

  // ✅ Admin/auth required
  const { user } = await payload.auth({ headers: req.headers })
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const code = normalizeCode(body?.code)
  const customerId = String(body?.customerId ?? '')

  if (!code)
    return NextResponse.json({ ok: false, message: 'Kode promo wajib diisi' }, { status: 400 })
  if (!customerId)
    return NextResponse.json({ ok: false, message: 'customerId wajib diisi' }, { status: 400 })

  // 1) cari voucher
  const found = await payload.find({
    collection: 'vouchers',
    where: { code: { equals: code } },
    limit: 1,
  })

  const voucher = found.docs?.[0]
  if (!voucher)
    return NextResponse.json({ ok: false, message: 'Voucher tidak ditemukan' }, { status: 404 })
  if (!voucher.enabled)
    return NextResponse.json({ ok: false, message: 'Voucher tidak aktif' }, { status: 400 })

  // 2) cek tanggal aktif
  const now = Date.now()
  if (voucher.startAt && now < new Date(voucher.startAt).getTime()) {
    return NextResponse.json({ ok: false, message: 'Voucher belum mulai berlaku' }, { status: 400 })
  }
  if (voucher.endAt && now > new Date(voucher.endAt).getTime()) {
    return NextResponse.json({ ok: false, message: 'Voucher sudah expired' }, { status: 400 })
  }

  // 3) cek kuota
  const quota = Number(voucher.quota ?? 0)
  const used = Number(voucher.used ?? 0)
  if (quota <= 0)
    return NextResponse.json({ ok: false, message: 'Kuota voucher = 0' }, { status: 400 })
  if (used >= quota)
    return NextResponse.json({ ok: false, message: 'Kuota voucher habis' }, { status: 400 })

  // 4) cegah double redeem untuk customer yang sama
  const existed = await payload.find({
    collection: 'voucher_redemptions',
    where: {
      and: [
        { voucher: { equals: voucher.id } },
        { customer: { equals: customerId } },
        { status: { equals: 'APPLIED' } },
      ],
    },
    limit: 1,
  })

  if ((existed.totalDocs ?? 0) > 0) {
    return NextResponse.json(
      { ok: false, message: 'Voucher sudah dipakai customer ini' },
      { status: 400 },
    )
  }

  // 5) buat redemption log
  await payload.create({
    collection: 'voucher_redemptions',
    data: {
      voucher: voucher.id,
      customer: customerId,
      status: 'APPLIED',
      notes: `Applied via API by admin ${user.id}`,
    },
  })

  // 6) increment used
  await payload.update({
    collection: 'vouchers',
    id: voucher.id,
    data: { used: used + 1 },
  })

  return NextResponse.json({
    ok: true,
    message: 'Voucher berhasil di-apply',
    data: { voucherId: voucher.id, code: voucher.code, quota, used: used + 1 },
  })
}

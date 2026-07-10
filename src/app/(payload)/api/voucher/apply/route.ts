import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import { incrementVoucherUsed } from '@/lib/vouchers/incrementVoucherUsed'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { assertNoSuspiciousMarkup } from '@/lib/security/sanitize'

const VOUCHER_APPLY_RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 }

function normalizeCode(v: unknown) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .slice(0, 50)
}

function toNumberId(v: unknown): number | null {
  const n = Number(String(v ?? '').trim())
  return Number.isFinite(n) ? n : null
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })

  // ✅ Admin/auth required
  const { user } = await payload.auth({ headers: req.headers })
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  }

  const rate = checkRateLimit(`voucher-apply:${user.id}`, VOUCHER_APPLY_RATE_LIMIT)
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Terlalu banyak percobaan. Silakan coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } },
    )
  }

  const body = await req.json().catch(() => ({}) as any)
  const code = normalizeCode(body?.code)

  try {
    assertNoSuspiciousMarkup(code, 'code', 'Kode promo mengandung karakter yang tidak diperbolehkan.')
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message }, { status: 400 })
  }

  // ✅ FIX: customerId harus numeric sesuai type Payload kamu
  const customerIdNum = toNumberId(body?.customerId)

  if (!code) {
    return NextResponse.json({ ok: false, message: 'Kode promo wajib diisi' }, { status: 400 })
  }
  if (customerIdNum === null) {
    return NextResponse.json(
      { ok: false, message: 'customerId wajib diisi dan harus berupa angka' },
      { status: 400 },
    )
  }

  // 1) cari voucher
  const found = await payload.find({
    collection: 'vouchers',
    where: { code: { equals: code } },
    limit: 1,
  })

  const voucher = found?.docs?.[0]
  if (!voucher) {
    return NextResponse.json({ ok: false, message: 'Voucher tidak ditemukan' }, { status: 404 })
  }
  if (!voucher.enabled) {
    return NextResponse.json({ ok: false, message: 'Voucher tidak aktif' }, { status: 400 })
  }

  // siapkan voucherId (aman untuk response & query)
  const voucherIdAny = voucher.id
  const voucherIdStr = String(voucherIdAny)

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

  if (quota <= 0) {
    return NextResponse.json({ ok: false, message: 'Kuota voucher = 0' }, { status: 400 })
  }
  if (used >= quota) {
    return NextResponse.json({ ok: false, message: 'Kuota voucher habis' }, { status: 400 })
  }

  // 4) cegah double redeem untuk customer yang sama
  // NOTE: voucher equals pakai voucher.id (biarkan sesuai type relasi voucher kamu)
  const existed = await payload.find({
    collection: 'voucher_redemptions',
    where: {
      and: [
        { voucher: { equals: voucherIdAny } },
        { customer: { equals: customerIdNum } }, // ✅ FIX: number
        { status: { equals: 'APPLIED' } },
      ],
    },
    limit: 1,
  })

  if ((existed?.totalDocs ?? 0) > 0) {
    return NextResponse.json(
      { ok: false, message: 'Voucher sudah dipakai customer ini' },
      { status: 400 },
    )
  }

  // 5) reserve the slot first (atomic guard against quota overflow under
  //    concurrent applies) BEFORE writing the redemption log, so a lost race
  //    never leaves an APPLIED redemption without a matching increment.
  const increment = await incrementVoucherUsed(payload, Number(voucherIdAny))

  if (!increment.ok) {
    const message =
      increment.reason === 'quota_exhausted'
        ? 'Kuota voucher habis'
        : 'Voucher tidak ditemukan'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }

  // 6) buat redemption log
  // customer harus number sesuai type: number | Customer | undefined
  await payload.create({
    collection: 'voucher_redemptions',
    data: {
      voucher: voucherIdAny,
      customer: customerIdNum, // ✅ FIX UTAMA
      status: 'APPLIED',
      notes: `Applied via API by admin ${String(user.id)}`,
    },
  })

  return NextResponse.json({
    ok: true,
    message: 'Voucher berhasil di-apply',
    data: {
      voucherId: voucherIdStr,
      code: voucher.code,
      quota,
      used: increment.used,
      customerId: customerIdNum,
    },
  })
}

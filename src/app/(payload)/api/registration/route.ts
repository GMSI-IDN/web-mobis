import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

type RegistrationBody = {
  customerId?: string | number
  voucherCode?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = (await req.json()) as RegistrationBody

    const rawCustomerId = body.customerId
    const voucherCode = body.voucherCode?.trim()

    if (!rawCustomerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'customerId wajib diisi',
        },
        { status: 400 },
      )
    }

    const customerId = typeof rawCustomerId === 'number' ? rawCustomerId : Number(rawCustomerId)

    if (!Number.isFinite(customerId) || Number.isNaN(customerId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'customerId tidak valid',
        },
        { status: 400 },
      )
    }

    // Validasi customer harus ada
    const customerResult = await payload.find({
      collection: 'customers',
      where: {
        id: {
          equals: customerId,
        },
      },
      limit: 1,
    })

    const customer = customerResult.docs[0]

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer tidak ditemukan',
        },
        { status: 404 },
      )
    }

    // Jika voucher kosong, anggap registrasi tetap sukses tanpa voucher
    if (!voucherCode) {
      return NextResponse.json(
        {
          success: true,
          message: 'Registrasi berhasil tanpa voucher',
          voucherApplied: false,
        },
        { status: 200 },
      )
    }

    // Cek apakah collection voucher tersedia di Payload
    const hasVouchersCollection = Boolean(
      (payload.collections as Record<string, unknown>)['vouchers'],
    )
    const hasVoucherRedemptionsCollection = Boolean(
      (payload.collections as Record<string, unknown>)['voucher_redemptions'],
    )

    // Jika fitur voucher tidak tersedia, jangan error
    if (!hasVouchersCollection || !hasVoucherRedemptionsCollection) {
      return NextResponse.json(
        {
          success: true,
          message: 'Registrasi berhasil, fitur voucher tidak tersedia',
          voucherApplied: false,
        },
        { status: 200 },
      )
    }

    const voucherResult = await payload.find({
      collection: 'vouchers',
      where: {
        code: {
          equals: voucherCode,
        },
      },
      limit: 1,
    })

    const voucher = voucherResult.docs[0]

    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          message: 'Voucher tidak ditemukan',
        },
        { status: 404 },
      )
    }

    // Optional: cegah voucher yang sama dipakai customer yang sama lebih dari sekali
    const existingRedemption = await payload.find({
      collection: 'voucher_redemptions',
      where: {
        and: [
          {
            voucher: {
              equals: voucher.id,
            },
          },
          {
            customer: {
              equals: customerId,
            },
          },
        ],
      },
      limit: 1,
    })

    if (existingRedemption.docs.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Voucher sudah pernah digunakan oleh customer ini',
        },
        { status: 400 },
      )
    }

    await payload.create({
      collection: 'voucher_redemptions',
      data: {
        voucher: voucher.id,
        customer: customerId,
        status: 'APPLIED',
        notes: 'Auto-applied on registration',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Voucher berhasil diterapkan',
        voucherApplied: true,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Registration route error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server',
      },
      { status: 500 },
    )
  }
}

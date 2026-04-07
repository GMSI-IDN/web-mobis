import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

type Body = {
  voucherCode?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = (await req.json()) as Body

    const voucherCode = body.voucherCode?.trim()

    // Jika voucher tidak diisi, langsung anggap lanjut tanpa voucher
    if (!voucherCode) {
      return NextResponse.json(
        {
          success: true,
          message: 'Tidak menggunakan voucher',
          voucherApplied: false,
          voucherValid: false,
          data: null,
        },
        { status: 200 },
      )
    }

    // Cek apakah collection vouchers tersedia
    const hasVouchersCollection = Boolean(
      (payload.collections as Record<string, unknown>)['vouchers'],
    )

    if (!hasVouchersCollection) {
      return NextResponse.json(
        {
          success: false,
          message: 'Fitur voucher tidak tersedia',
          voucherApplied: false,
          voucherValid: false,
        },
        { status: 400 },
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
          voucherApplied: false,
          voucherValid: false,
        },
        { status: 404 },
      )
    }

    // Optional: cek status voucher jika field tersedia
    if ('status' in voucher && voucher.status && voucher.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          message: 'Voucher tidak aktif',
          voucherApplied: false,
          voucherValid: false,
        },
        { status: 400 },
      )
    }

    // Optional: cek expired jika field tersedia
    if (
      'expiredAt' in voucher &&
      voucher.expiredAt &&
      new Date(String(voucher.expiredAt)) < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Voucher sudah kadaluarsa',
          voucherApplied: false,
          voucherValid: false,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Voucher valid',
        voucherApplied: false,
        voucherValid: true,
        data: {
          id: voucher.id,
          code: 'code' in voucher ? voucher.code : voucherCode,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Voucher validate error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server',
      },
      { status: 500 },
    )
  }
}

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

    // const rawCustomerId = body.customerId
    const voucherCode = body.voucherCode?.trim()

    // if (!rawCustomerId) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'customerId wajib diisi',
    //     },
    //     { status: 400 },
    //   )
    // }

    // const customerId = typeof rawCustomerId === 'number' ? rawCustomerId : Number(rawCustomerId)

    // if (!Number.isFinite(customerId) || Number.isNaN(customerId)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'customerId tidak valid',
    //     },
    //     { status: 400 },
    //   )
    // }

    if (!voucherCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'voucherCode wajib diisi',
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
        },
        { status: 404 },
      )
    }

    await payload.create({
      collection: 'voucher_redemptions',
      data: {
        voucher: voucher.id,
        customer: 0, // Karena kita belum punya data customer, kita set null dulu
        status: 'APPLIED',
        notes: 'Auto-applied on registration',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Voucher berhasil diterapkan',
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

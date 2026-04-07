import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { appendLeadToSheet } from '@/lib/google-sheets/appendLeadToSheet'

type RegistrationBody = {
  name?: string
  phone?: string
  ktpNumber?: string
  domicile?: string
  currentAddress?: string
  houseOwnership?: string
  driverApps?: string
  activeAccountSelf?: string
  driverExperience?: string
  handoverLocation?: string
  sourceInfo?: string
  sourceDetail?: string
  otherSourceInfo?: string
  voucherCode?: string
  emergencyPhone?: string
  emergencyName?: string
  emergencyRelation?: string
  birthPlace?: string
  birthDate?: string
  simNumber?: string
  simType?: string
  simValidUntil?: string
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isNoDriverAccount(driverApps?: string): boolean {
  return normalizeText(driverApps).toLowerCase() === 'tidak ada akun'
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = (await req.json()) as RegistrationBody

    const voucherCode = normalizeText(body.voucherCode)
    const driverApps = normalizeText(body.driverApps)
    const noDriverAccount = isNoDriverAccount(driverApps)

    // Validasi field utama
    if (!normalizeText(body.name)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama wajib diisi',
        },
        { status: 400 },
      )
    }

    if (!normalizeText(body.phone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nomor telepon wajib diisi',
        },
        { status: 400 },
      )
    }

    if (!normalizeText(body.domicile)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Domisili wajib diisi',
        },
        { status: 400 },
      )
    }

    let voucher: Record<string, unknown> | null = null

    // Voucher opsional: hanya dicek jika diisi
    if (voucherCode) {
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

      voucher = (voucherResult.docs[0] as Record<string, unknown> | undefined) ?? null

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
    }

    // Payload yang dikirim ke appendLeadToSheet
    const registrationPayload = {
      name: normalizeText(body.name),
      phone: normalizeText(body.phone),
      ktpNumber: normalizeText(body.ktpNumber),
      domicile: normalizeText(body.domicile),
      currentAddress: normalizeText(body.currentAddress),
      houseOwnership: normalizeText(body.houseOwnership),
      driverApps,
      activeAccountSelf: noDriverAccount ? '' : normalizeText(body.activeAccountSelf),
      driverExperience: noDriverAccount ? '' : normalizeText(body.driverExperience),
      handoverLocation: normalizeText(body.handoverLocation),
      sourceInfo: normalizeText(body.sourceInfo),
      sourceDetail: normalizeText(body.sourceDetail),
      otherSourceInfo: normalizeText(body.otherSourceInfo),
      promoCode: voucherCode,
      emergencyPhone: normalizeText(body.emergencyPhone),
      emergencyName: normalizeText(body.emergencyName),
      emergencyRelation: normalizeText(body.emergencyRelation),
      birthPlace: normalizeText(body.birthPlace),
      birthDate: normalizeText(body.birthDate),
      simNumber: normalizeText(body.simNumber),
      simType: normalizeText(body.simType),
      simValidUntil: normalizeText(body.simValidUntil),
    }

    // WAJIB: kirim ke Google Sheets + external API
    await appendLeadToSheet(registrationPayload)

    return NextResponse.json(
      {
        success: true,
        message: voucherCode ? 'Registrasi berhasil, voucher valid' : 'Registrasi berhasil',
        voucherApplied: false,
        voucherValid: Boolean(voucherCode ? voucher : false),
        data: {
          voucher: voucherCode
            ? {
                id: voucher?.id ?? null,
                code:
                  typeof voucher?.code === 'string' && voucher.code ? voucher.code : voucherCode,
              }
            : null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Registration route error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

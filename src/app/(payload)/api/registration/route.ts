import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

import { validateRegistrationPayload } from '@/lib/validation/registration'
import { appendLeadToSheet } from '@/services/googleSheets/appendLead'
import type { RegistrationPayload } from '@/types/registration'

function normalizeCode(v: unknown) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

type PromoResult =
  | { provided: false }
  | { provided: true; applied: true; code: string; voucherId: string; quota: number; used: number }
  | { provided: true; applied: false; code: string; error: string }

async function autoApplyPromo(params: {
  payload: any
  customerId: string
  promoCode: string
}): Promise<PromoResult> {
  const { payload, customerId } = params
  const promoCode = normalizeCode(params.promoCode)

  const hasVouchersCollection = Boolean(
    (payload.collections as Record<string, unknown>)['vouchers'],
  )
  const hasVoucherRedemptionsCollection = Boolean(
    (payload.collections as Record<string, unknown>)['voucher_redemptions'],
  )

  if (!hasVouchersCollection || !hasVoucherRedemptionsCollection) {
    throw new Error('Fitur voucher tidak tersedia')
  }

  const found = await payload.find({
    collection: 'vouchers',
    where: { code: { equals: promoCode } },
    limit: 1,
  })

  const voucher = found?.docs?.[0]

  if (!voucher) {
    throw new Error('Voucher tidak ditemukan')
  }

  if ('enabled' in voucher && !voucher.enabled) {
    throw new Error('Voucher tidak aktif')
  }

  const now = Date.now()

  if ('startAt' in voucher && voucher.startAt && now < new Date(voucher.startAt).getTime()) {
    throw new Error('Voucher belum mulai berlaku')
  }

  if ('endAt' in voucher && voucher.endAt && now > new Date(voucher.endAt).getTime()) {
    throw new Error('Voucher sudah expired')
  }

  const quota = Number(voucher.quota ?? 0)
  const used = Number(voucher.used ?? 0)

  if (quota <= 0) {
    throw new Error('Kuota voucher = 0')
  }

  if (used >= quota) {
    throw new Error('Kuota voucher habis')
  }

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

  if ((existed?.totalDocs ?? 0) > 0) {
    throw new Error('Voucher sudah dipakai untuk customer ini')
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

  await payload.update({
    collection: 'vouchers',
    id: voucher.id,
    data: { used: used + 1 },
  })

  await payload.update({
    collection: 'customers',
    id: customerId,
    data: {
      promoApplied: true,
      promoAppliedAt: new Date().toISOString(),
      voucher: voucher.id,
      promoError: null,
    },
  })

  return {
    provided: true,
    applied: true,
    code: promoCode,
    voucherId: String(voucher.id),
    quota,
    used: used + 1,
  } as const
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[API /registration] payload received:', body)

    const reg: RegistrationPayload = validateRegistrationPayload(body)
    console.log('[API /registration] payload validated:', reg)

    const payload = await getPayload({ config })

    const promoCode = reg?.promoCode ? normalizeCode(reg.promoCode) : ''

    // Tetap kirim ke Google Sheets seperti script lama
    const sheetMeta = await appendLeadToSheet({
      ...reg,
      promoCode,
    })
    console.log('[API /registration] appended to Google Sheets', sheetMeta)

    const customer = await payload.create({
      collection: 'customers',
      data: {
        name: reg.name ?? '',
        birthPlace: reg.birthPlace ?? '',
        birthDate: reg.birthDate ?? '',

        phone: reg.phone ?? '',
        ktpNumber: reg.ktpNumber ?? '',

        simNumber: reg.simNumber ?? '',
        simType: reg.simType ?? '',
        domicile: reg.domicile ?? '',
        simValidUntil: reg.simValidUntil ?? '',

        currentAddress: reg.currentAddress ?? '',
        houseOwnership: reg.houseOwnership ?? '',

        emergencyName: reg.emergencyName ?? '',
        emergencyPhone: reg.emergencyPhone ?? '',
        emergencyRelation: reg.emergencyRelation ?? '',

        driverApps: reg.driverApps ?? '',
        activeAccountSelf: reg.activeAccountSelf ?? '',
        driverExperience: reg.driverExperience ?? '',

        handoverLocation: reg.handoverLocation ?? '',
        sourceInfo: reg.sourceInfo ?? '',
        promoCode: promoCode || undefined,

        promoApplied: false,
        promoError: promoCode ? 'PROMO_PENDING_VALIDATION' : undefined,

        rawPayload: body,
        sheetMeta,
      },
    })

    let promoResult: PromoResult

    // Promo / voucher opsional
    if (!promoCode) {
      promoResult = { provided: false }
    } else {
      try {
        promoResult = await autoApplyPromo({
          payload,
          customerId: String(customer.id),
          promoCode,
        })
      } catch (e: any) {
        const msg = String(e?.message ?? 'Promo code tidak valid')

        await payload.update({
          collection: 'customers',
          id: customer.id,
          data: {
            promoApplied: false,
            promoError: msg,
          },
        })

        promoResult = {
          provided: true,
          applied: false,
          code: promoCode,
          error: msg,
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Terkirim ke Google Sheets + tersimpan ke database.',
      customerId: customer.id,
      sheet: sheetMeta,
      promo: promoResult,
    })
  } catch (err: any) {
    console.error('[API /registration] ERROR:', err)

    return NextResponse.json(
      {
        ok: false,
        message: err?.message ?? 'Server error saat proses registration',
      },
      { status: err?.statusCode ?? 500 },
    )
  }
}

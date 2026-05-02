import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

import { validateRegistrationPayload } from '@/lib/validation/registration'
import { appendLeadToSheet } from '@/services/googleSheets/appendLead'
import type { RegistrationPayload } from '@/types/registration'

const KTP_REAPPLY_COOLDOWN_MONTHS = 3

function normalizeCode(v: unknown) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function formatDateID(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

async function getKtpCooldownInfo(params: {
  payload: any
  ktpNumber: string
}): Promise<{ blocked: false } | { blocked: true; nextEligibleAt: Date }> {
  const { payload, ktpNumber } = params

  const cooldownStart = addMonths(new Date(), -KTP_REAPPLY_COOLDOWN_MONTHS)

  const existing = await payload.find({
    collection: 'customers',
    where: {
      and: [
        {
          ktpNumber: {
            equals: ktpNumber,
          },
        },
        {
          createdAt: {
            greater_than_equal: cooldownStart.toISOString(),
          },
        },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })

  const latestMatch = existing?.docs?.[0]

  if (!latestMatch?.createdAt) return { blocked: false }

  const registeredAt = new Date(latestMatch.createdAt)
  if (Number.isNaN(registeredAt.getTime())) return { blocked: false }

  const nextEligibleAt = addMonths(registeredAt, KTP_REAPPLY_COOLDOWN_MONTHS)
  const now = Date.now()

  if (now < nextEligibleAt.getTime()) {
    return {
      blocked: true,
      nextEligibleAt,
    }
  }

  return { blocked: false }
}

type PromoResult =
  | { provided: false }
  | {
      provided: true
      valid: true
      code: string
      voucherId: number
      quota: number
      used: number
      remaining: number
    }
  | {
      provided: true
      valid: false
      code: string
      error: string
    }

async function validatePromoCode(params: {
  payload: any
  promoCode: string
}): Promise<PromoResult> {
  const { payload } = params
  const promoCode = normalizeCode(params.promoCode)

  const hasVouchersCollection = Boolean(
    (payload.collections as Record<string, unknown>)['vouchers'],
  )

  if (!hasVouchersCollection) {
    throw new Error('Fitur voucher tidak tersedia')
  }

  const found = await payload.find({
    collection: 'vouchers',
    where: {
      code: {
        equals: promoCode,
      },
    },
    limit: 1,
  })

  // console.log('Voucher search result:', found)

  const voucher = found?.docs?.[0]

  if (!voucher) {
    throw new Error('Voucher tidak ditemukan')
  }

  const voucherId = Number(voucher.id)
  if (!Number.isFinite(voucherId)) {
    throw new Error('ID voucher tidak valid')
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
  const remaining = Math.max(quota - used, 0)

  if (quota <= 0) {
    throw new Error('Kuota voucher = 0')
  }

  if (used >= quota) {
    throw new Error('Kuota voucher habis')
  }

  // VALIDASI SAJA
  // TIDAK cek voucher_redemptions
  // TIDAK create voucher_redemptions
  // TIDAK update vouchers.used
  // TIDAK update customers

  return {
    provided: true,
    valid: true,
    code: promoCode,
    voucherId,
    quota,
    used,
    remaining,
  }
}

function isIdUniqueValidationError(err: unknown) {
  const error = err as any
  const details = [
    ...(Array.isArray(error?.data?.errors) ? error.data.errors : []),
    ...(Array.isArray(error?.errors) ? error.errors : []),
  ]

  return details.some((item: any) => {
    const path = String(item?.path ?? '')
    const message = String(item?.message ?? '')
    return path === 'id' && /unique/i.test(message)
  })
}

async function resyncCustomersIdSequence(payload: any) {
  await payload.db.drizzle.execute(
    `SELECT setval(
      pg_get_serial_sequence('customers', 'id'),
      COALESCE((SELECT MAX(id) FROM customers), 0) + 1,
      false
    );`,
  )
}

export async function POST(req: Request) {
  let step = 'init'
  try {
    step = 'parse-body'
    const body = await req.json()
    const { id: _ignoredClientId, ...bodyWithoutId } =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    // console.log('[API /registration] payload received:', body)

    step = 'validate-payload'
    const reg: RegistrationPayload = validateRegistrationPayload(bodyWithoutId)
    // console.log('[API /registration] payload validated:', reg)

    step = 'init-payload'
    const payload = await getPayload({ config })
    step = 'check-ktp-cooldown'
    const ktpCooldown = await getKtpCooldownInfo({
      payload,
      ktpNumber: reg.ktpNumber,
    })

    if (ktpCooldown.blocked) {
      const message = `Nomor KTP ini sudah pernah digunakan untuk pendaftaran. Silakan daftar kembali setelah ${formatDateID(ktpCooldown.nextEligibleAt)}.`

      return NextResponse.json(
        {
          ok: false,
          code: 'KTP_COOLDOWN_ACTIVE',
          message,
          errors: {
            ktpNumber: message,
          },
          nextEligibleAt: ktpCooldown.nextEligibleAt.toISOString(),
        },
        { status: 400 },
      )
    }

    const promoCode = reg?.promoCode ? normalizeCode(reg.promoCode) : ''

    let promoResult: PromoResult

    // 1. Validasi promo dulu
    if (!promoCode) {
      promoResult = { provided: false }
    } else {
      try {
        step = 'validate-promo'
        promoResult = await validatePromoCode({
          payload,
          promoCode,
        })
      } catch (e: any) {
        const msg = String(e?.message ?? 'Promo code tidak valid')

        promoResult = {
          provided: true,
          valid: false,
          code: promoCode,
          error: msg,
        }
      }
    }

    // 2. Kalau promo diisi tapi tidak valid, hentikan
    if (promoResult.provided && !promoResult.valid) {
      return NextResponse.json(
        {
          ok: false,
          message: promoResult.error,
          promo: promoResult,
        },
        { status: 400 },
      )
    }

    // 3. Kirim ke Google Sheets
    step = 'append-google-sheet'
    const sheetMeta = await appendLeadToSheet({
      ...reg,
      promoCode,
    })
    // console.log('[API /registration] appended to Google Sheets', sheetMeta)

    // 4. Simpan customer
    step = 'create-customer'
    const customerData = {
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
      promoApplied: promoResult.provided ? promoResult.valid : false,
      promoAppliedAt:
        promoResult.provided && promoResult.valid ? new Date().toISOString() : undefined,
      voucher: promoResult.provided && promoResult.valid ? promoResult.voucherId : undefined,
      promoError: undefined,

      rawPayload: bodyWithoutId,
      sheetMeta,
    }

    let customer: any
    try {
      customer = await payload.create({
        collection: 'customers',
        data: customerData,
      })
    } catch (err) {
      if (!isIdUniqueValidationError(err)) throw err

      step = 'resync-customers-id-sequence'
      await resyncCustomersIdSequence(payload)

      step = 'create-customer-retry'
      customer = await payload.create({
        collection: 'customers',
        data: customerData,
      })
    }

    if (promoResult.provided && promoResult.valid) {
      step = 'increment-voucher-used'
      await payload.update({
        collection: 'vouchers',
        where: {
          code: {
            equals: promoResult.code,
          },
        },
        data: {
          used: promoResult.used + 1,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Terkirim ke Google Sheets + tersimpan ke database.',
      customerId: customer.id,
      // sheet: sheetMeta,
      promo: promoResult,
    })
  } catch (err: any) {
    console.error('[API /registration] ERROR:', {
      step,
      message: err?.message,
      code: err?.code,
      data: err?.data,
      errors: err?.errors,
      stack: err?.stack,
    })

    return NextResponse.json(
      {
        ok: false,
        step,
        code: err?.code,
        errors: err?.errors,
        data: err?.data,
        message: err?.message ?? 'Server error saat proses registration',
      },
      { status: err?.statusCode ?? 500 },
    )
  }
}

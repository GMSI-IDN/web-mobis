import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

import { validateRegistrationPayload } from '@/lib/validation/registration'
import { incrementVoucherUsed } from '@/lib/vouchers/incrementVoucherUsed'
import { appendLeadToSheet } from '@/services/googleSheets/appendLead'
import { sendMetaConversionsApiEvent } from '@/services/meta/sendConversionsApiEvent'
import type { RegistrationPayload } from '@/types/registration'

const KTP_REAPPLY_COOLDOWN_MONTHS = 3

function isTruthyEnv(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
}

function normalizeCode(v: unknown) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function sanitizeMetaEventId(value: unknown): string | undefined {
  const next = normalizeText(value)
  if (!next) return undefined
  if (next.length < 8 || next.length > 100) return undefined
  if (!/^[A-Za-z0-9._:-]+$/.test(next)) return undefined
  return next
}

function sanitizeSourcePath(value: unknown): string | undefined {
  const next = normalizeText(value)
  if (!next) return undefined
  if (next.length > 512) return undefined
  if (!next.startsWith('/')) return undefined
  return next
}

function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined

  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey) continue
    if (rawKey !== name) continue
    const rawValue = rest.join('=').trim()
    if (!rawValue) return undefined
    return decodeURIComponent(rawValue)
  }

  return undefined
}

function getClientIp(req: Request): string | undefined {
  const forwardedFor = normalizeText(req.headers.get('x-forwarded-for'))
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = normalizeText(req.headers.get('x-real-ip'))
  return realIp || undefined
}

function splitName(name: string): { firstName?: string; lastName?: string } {
  const normalized = normalizeText(name)
  if (!normalized) return {}

  const parts = normalized.split(/\s+/).filter(Boolean)
  if (!parts.length) return {}

  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined
  return { firstName, lastName }
}

function getEventSourceUrl(req: Request, sourcePath?: string): string | undefined {
  const referer = normalizeText(req.headers.get('referer'))
  if (referer.startsWith('http://') || referer.startsWith('https://')) return referer

  if (!sourcePath) return undefined

  const configuredBase = normalizeText(process.env.NEXT_PUBLIC_SERVER_URL)
  if (configuredBase.startsWith('http://') || configuredBase.startsWith('https://')) {
    return `${configuredBase.replace(/\/+$/, '')}${sourcePath}`
  }

  return undefined
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
  await resyncCollectionIdSequence(payload, 'customers')
}

async function resyncCollectionIdSequence(payload: any, tableName: string) {
  await payload.db.drizzle.execute(
    `SELECT setval(
      pg_get_serial_sequence('${tableName}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${tableName}), 0) + 1,
      false
    );`,
  )
}

export async function POST(req: Request) {
  let step = 'init'
  try {
    const bypassGoogleSheets = isTruthyEnv(process.env.REGISTRATION_BYPASS_GOOGLE_SHEETS)
    const metaDebug = isTruthyEnv(process.env.REGISTRATION_META_DEBUG)

    step = 'parse-body'
    const body = await req.json()
    const {
      id: _ignoredClientId,
      metaEventId: rawMetaEventId,
      metaSourcePath: rawMetaSourcePath,
      ...bodyWithoutId
    } =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const metaEventId = sanitizeMetaEventId(rawMetaEventId)
    const metaSourcePath = sanitizeSourcePath(rawMetaSourcePath)
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

    // 3. Kirim ke Google Sheets (opsional bypass via env)
    let sheetMeta: Record<string, unknown>
    if (bypassGoogleSheets) {
      step = 'skip-google-sheet'
      sheetMeta = {
        bypassed: true,
        bypassReason: 'REGISTRATION_BYPASS_GOOGLE_SHEETS enabled',
      }
    } else {
      step = 'append-google-sheet'
      sheetMeta = await appendLeadToSheet({
        ...reg,
        promoCode,
      })
    }
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

      // Atomic guard against quota overflow under concurrent registrations.
      const increment = await incrementVoucherUsed(payload, promoResult.voucherId)

      if (!increment.ok) {
        // The customer row was already created optimistically with promoApplied=true.
        // The voucher could not actually be claimed (race lost the last slot, or it
        // was disabled/removed between validation and now), so reconcile the record
        // to reflect that the promo did not apply — no oversell, no false claim.
        const promoError =
          increment.reason === 'quota_exhausted'
            ? 'Kuota voucher habis saat pendaftaran diproses.'
            : 'Voucher tidak lagi tersedia saat pendaftaran diproses.'

        console.warn('[API /registration] Voucher increment skipped:', {
          reason: increment.reason,
          voucherId: promoResult.voucherId,
          customerId: customer.id,
        })

        step = 'reconcile-customer-promo'
        try {
          await payload.update({
            collection: 'customers',
            id: customer.id,
            data: {
              promoApplied: false,
              promoAppliedAt: null,
              voucher: null,
              promoError,
            },
          })
        } catch (reconcileErr) {
          console.warn('[API /registration] Failed to reconcile promo on customer:', reconcileErr)
        }

        promoResult = {
          provided: true,
          valid: false,
          code: promoResult.code,
          error: promoError,
        }
      }
    }

    let capiResult: Awaited<ReturnType<typeof sendMetaConversionsApiEvent>> | null = null
    try {
      step = 'send-meta-conversion'
      const { firstName, lastName } = splitName(reg.name)
      const eventSourceUrl = getEventSourceUrl(req, metaSourcePath)
      const cookieHeader = req.headers.get('cookie')
      const fbc = getCookieValue(cookieHeader, '_fbc')
      const fbp = getCookieValue(cookieHeader, '_fbp')

      capiResult = await sendMetaConversionsApiEvent({
        eventName: 'CompleteRegistration',
        eventId: metaEventId,
        eventSourceUrl,
        userData: {
          phone: reg.phone,
          firstName,
          lastName,
          externalId: String(customer.id),
          clientIpAddress: getClientIp(req),
          clientUserAgent: req.headers.get('user-agent') ?? undefined,
          fbc,
          fbp,
        },
        customData: {
          value: 120000,
          currency: 'IDR',
          content_name: 'Registration Form',
          content_category: 'Lead',
          source_info: reg.sourceInfo || undefined,
          source_detail: reg.sourceDetail || undefined,
        },
      })

      if (!capiResult.sent) {
        console.warn('[API /registration] Meta CAPI skipped/failed:', {
          reason: capiResult.reason,
          status: capiResult.status,
          response: capiResult.response,
        })
      }

      if (metaDebug) {
        console.info('[API /registration] Meta CAPI debug:', {
          sent: capiResult.sent,
          status: capiResult.status,
          reason: capiResult.sent ? undefined : capiResult.reason,
          eventId: metaEventId,
          response: capiResult.response,
        })
      }
    } catch (metaErr: unknown) {
      console.warn('[API /registration] Meta CAPI exception:', metaErr)
    }

    return NextResponse.json({
      ok: true,
      message: bypassGoogleSheets
        ? 'Google Sheets dibypass. Data tersimpan ke database.'
        : 'Terkirim ke Google Sheets + tersimpan ke database.',
      customerId: customer.id,
      googleSheetsBypassed: bypassGoogleSheets,
      metaCapi: metaDebug
        ? {
            enabled: true,
            result: capiResult,
          }
        : undefined,
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

    const statusCode = Number(err?.statusCode) || 500

    // Only surface details for deliberate client-side (4xx) errors we author
    // (validation, KTP cooldown, promo). For unexpected 5xx failures, return a
    // generic message and never leak the internal pipeline step, DB payloads,
    // or raw error text to the client — the full detail is already logged above.
    if (statusCode >= 400 && statusCode < 500) {
      const fieldErrors =
        err?.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)
          ? err.errors
          : undefined

      return NextResponse.json(
        {
          ok: false,
          code: err?.code,
          message: err?.message ?? 'Data tidak valid.',
          errors: fieldErrors,
        },
        { status: statusCode },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      },
      { status: 500 },
    )
  }
}

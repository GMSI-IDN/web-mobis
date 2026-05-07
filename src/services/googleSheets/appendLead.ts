import { getEnv } from '@/lib/env'
import { getSheetsClient } from './client'
import type { RegistrationPayload } from '@/types/registration'

function resolveSpreadsheetId(handoverLocation?: string): string {
  const key = handoverLocation?.toLowerCase().trim() ?? ''
  console.log(`Resolving spreadsheet ID for handoverLocation: ${handoverLocation} (key: ${key})`)

  if (!key) {
    console.warn('No handoverLocation provided, using default spreadsheet ID')
  }

  const validJabodetabek = [
    'dki jakarta',
    'kota/kab. bogor',
    'kota/kab. bekasi',
    'kota/kab. tangerang',
    'kota tangerang selatan',
    'kota depok',
  ]

  const validSurabaya = ['kota surabaya', 'kab, sidoarjo', 'kab. gresik', 'mojokerto']
  const validMalang = ['malang']

  const validBali = ['provinsi bali']

  const validBandung = ['bandung']

  if (validJabodetabek.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_JABODETABEK')
  } else if (validSurabaya.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_SURABAYA')
  } else if (validMalang.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_MALANG')
  } else if (validBali.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_BALI')
  } else if (validBandung.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_BANDUNG')
  } else {
    console.warn(
      `Domicile "${handoverLocation}" does not match any specific area, using default spreadsheet ID`,
    )
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_DEFAULT')
  }
}

function calculateAge(birthDate?: string): string {
  if (!birthDate) return ''

  const now = new Date()
  const dob = new Date(birthDate)

  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--
  }

  return age.toString()
}

function mapSimTypeForSheet(simType?: string): string {
  switch (simType) {
    case '1':
      return 'SIM A UMUM'
    case '2':
      return 'SIM B'
    case '3':
      return 'SIM B2'
    case '4':
      return 'SIM B2 UMUM'
    case '5':
      return 'SIM C'
    case '6':
      return 'SIM B1'
    case '7':
      return 'SIM B1 UMUM'
    default:
      return 'SIM A'
  }
}

function mapSimTypeForApi(simType?: string): string {
  return mapSimTypeForSheet(simType)
}

function normalizeKeyword(value?: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function mapHomeOwnershipForApi(value?: string): number | null {
  const numericValue = toExternalInteger(value)
  if (numericValue !== null) return numericValue

  const keyword = normalizeKeyword(value)
  if (!keyword) return null

  // External service expects integer FK.
  // Support current FE option values + common human-readable labels.
  const mapping: Record<string, number> = {
    miliksendiri: 1,
    atasnamasendiri: 1,
    milikpribadi: 1,
    atasnamapribadi: 1,
    kontrak: 2,
    sewa: 2,
    ngontrak: 2,
    kos: 3,
    kost: 3,
    keluarga: 4,
    rumahkeluarga: 4,
    atasnamakeluarga: 4,
  }

  return mapping[keyword] ?? null
}

function toExternalInteger(value?: string): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  const digitsOnly = raw.replace(/\D/g, '')
  if (!digitsOnly) return null

  const parsed = Number(digitsOnly)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizePhone(phone?: string): string {
  if (!phone) return ''

  const clean = phone.replace(/\D/g, '')

  if (clean.startsWith('62')) return clean
  if (clean.startsWith('0')) return `62${clean.slice(1)}`
  return `62${clean}`
}

function buildWhatsappHyperlink(phone?: string): string {
  if (!phone) return ''

  const normalized = normalizePhone(phone)
  const localFormat = normalized.startsWith('62') ? `0${normalized.slice(2)}` : normalized

  return `=HYPERLINK("https://api.whatsapp.com/send/?phone=${normalized}", "${localFormat}")`
}

function normalizeDriverApps(driverApps?: string): string {
  return (driverApps || '').trim()
}

function isNoDriverAccount(driverApps?: string): boolean {
  const value = normalizeKeyword(normalizeDriverApps(driverApps))
  return value === 'tidakadaakun'
}

function formatSourceInfoLabel(sourceInfo?: string): string {
  if (!sourceInfo) return ''

  return sourceInfo
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildSourceDetail(payload: RegistrationPayload): string {
  const sourceDetail = payload.sourceDetail ?? ''
  const otherSourceInfo = (payload as any).otherSourceInfo ?? ''
  return [sourceDetail, otherSourceInfo].filter(Boolean).join(' | ')
}

function buildSheetSourceSummary(payload: RegistrationPayload): string {
  const sourceKey = (payload.sourceInfo ?? '').trim().toLowerCase()
  const sourceLabel = formatSourceInfoLabel(payload.sourceInfo)
  const sourceDetail = (payload.sourceDetail ?? '').trim()
  const promoCode = (payload.promoCode ?? '').trim()
  const parts: string[] = []

  if (sourceKey !== 'facebook' && sourceLabel && sourceDetail) {
    parts.push(`${sourceLabel}: ${sourceDetail}`)
  }

  if (promoCode) {
    parts.push(`Code Promo : ${promoCode}`)
  }

  return parts.join(' | ')
}

function buildRow(payload: RegistrationPayload): (string | null)[] {
  const now = new Date()
  const ageDisplay = calculateAge(payload.birthDate)

  const datePart = now
    .toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .replace(/\//g, '-')

  const timePart = now
    .toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace('.', ':')

  const simType = mapSimTypeForSheet(payload.simType)
  const noAccount = isNoDriverAccount(payload.driverApps)

  return [
    payload.name ?? '',
    buildWhatsappHyperlink(payload.phone),
    ageDisplay,
    payload.ktpNumber ?? '',
    payload.domicile ?? '',
    payload.currentAddress ?? '',
    payload.houseOwnership ?? '',
    payload.driverApps ?? '',
    noAccount ? '' : (payload.activeAccountSelf ?? ''),
    noAccount ? '' : (payload.driverExperience ?? ''),
    payload.handoverLocation ?? '',
    payload.sourceInfo ?? '',
    payload.sourceDetail ?? '',
    payload.promoCode ?? '',
    // payload.sourceInfo === 'facebook' ? (payload.sourceDetail ?? '') : '',
    // buildSheetSourceSummary(payload),
    'Website Mobis',
    '',
    '',
    datePart,
    timePart,
    buildWhatsappHyperlink(payload.emergencyPhone),
    payload.emergencyName ?? '',
    payload.emergencyRelation ?? '',
    payload.birthPlace ?? '',
    payload.birthDate ?? '',
    payload.simNumber ?? '',
    simType,
    payload.simValidUntil ?? '',
  ]
}

function buildExternalApiPayload(payload: RegistrationPayload) {
  const age = calculateAge(payload.birthDate)
  const noAccount = isNoDriverAccount(payload.driverApps)
  const mappedDomicile = toExternalInteger(payload.domicile)
  const mappedHomeOwnership = mapHomeOwnershipForApi(payload.houseOwnership)
  const mappedDriverApp = payload.driverApps ?? ''
  const mappedPersonalDriverApp = noAccount ? '' : (payload.activeAccountSelf ?? '')
  const mappedDriverDuration = noAccount ? '' : (payload.driverExperience ?? '')
  const mappedSourceDetail = buildSourceDetail(payload)
  const mappedSimType = mapSimTypeForApi(payload.simType)

  return {
    name: payload.name ?? '',
    phone_number: normalizePhone(payload.phone),
    age,
    identity_number: payload.ktpNumber ?? '',
    // External API expects an integer foreign-key value for domicile.
    // Send null when FE still provides a human-readable label.
    domicile: mappedDomicile,
    address: payload.currentAddress ?? '',
    // External API expects integer FK, not the display label.
    home_ownership_status: mappedHomeOwnership,
    online_driver_app: mappedDriverApp,
    personal_online_driver_app: mappedPersonalDriverApp,
    online_driver_duration: mappedDriverDuration,
    pool_preference: payload.handoverLocation ?? '',
    information_source: payload.sourceInfo ?? '',
    detail_information_source: mappedSourceDetail,
    promo_code: payload.promoCode ?? '',
    registered_from: 'Website Mobis',
    emergency_phone_number: normalizePhone(payload.emergencyPhone),
    emergency_contact_name: payload.emergencyName ?? '',
    emergency_contact_relation: payload.emergencyRelation ?? '',
    lead_place_of_birth: payload.birthPlace ?? '',
    lead_date_of_birth: payload.birthDate ?? '',
    lead_sim_no: payload.simNumber ?? '',
    lead_sim_type: mappedSimType,
    lead_sim_expire_date: payload.simValidUntil ?? '',
    // Backward/forward compatibility for endpoints that expect lead_* keys.
    lead_name: payload.name ?? '',
    lead_phone_number: normalizePhone(payload.phone),
    lead_age: age,
    lead_no_ktp: payload.ktpNumber ?? '',
    lead_domicile: mappedDomicile,
    lead_address: payload.currentAddress ?? '',
    lead_home_ownership_status: mappedHomeOwnership,
    lead_online_driver_app: mappedDriverApp,
    lead_personal_online_driver_app: mappedPersonalDriverApp,
    lead_online_driver_duration: mappedDriverDuration,
    lead_pool_preference: payload.handoverLocation ?? '',
    lead_information_source: payload.sourceInfo ?? '',
    lead_detail_information_source: mappedSourceDetail,
    lead_promo_code: payload.promoCode ?? '',
    lead_registered_from: 'Website Mobis',
    lead_emergency_phone_number: normalizePhone(payload.emergencyPhone),
    lead_emergency_contact_name: payload.emergencyName ?? '',
    lead_emergency_contact_relation: payload.emergencyRelation ?? '',
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetriableSheetsError(error: unknown): boolean {
  const err = error as any
  const status = Number(err?.code ?? err?.status ?? err?.response?.status ?? 0)
  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) return true

  const text = String(err?.message ?? '')
  return /timeout|timed out|econnreset|socket hang up|rate limit|quota/i.test(text)
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ')
}

function summarizeExternalApiError(status: number, responseText: string): string {
  const plain = stripHtmlTags(String(responseText || ''))
    .replace(/\s+/g, ' ')
    .trim()

  const sqlStateMatch = plain.match(/SQLSTATE\[[^\]]+\][^.?!]*/i)?.[0]?.trim()
  const core = (sqlStateMatch || plain).slice(0, 220)

  return core ? `External API failed (${status}): ${core}` : `External API failed (${status})`
}

async function sendLeadToExternalApi(payload: RegistrationPayload) {
  // const url = getEnv('MOBIS_LEAD_API_URL')
  // const publicKey = getEnv('MOBIS_LEAD_API_PUBLIC_KEY')
  const url = 'https://stgapi.fleet-management-system.co.id/public/mobis/leads'
  const publicKey = 'R01TeE1TSWluZG9uZXNpYTIwMjQ='

  const body = buildExternalApiPayload(payload)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-public-keys': publicKey,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(summarizeExternalApiError(response.status, responseText))
  }

  return {
    status: response.status,
    data: responseText,
  }
}

export async function appendLeadToSheet(payload: RegistrationPayload) {
  const spreadsheetId = resolveSpreadsheetId(payload.handoverLocation)
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Leads'

  // let sheetName = 'Leads'
  // if (payload.handoverLocation?.toLowerCase().includes('mojokerto')) {
  //   sheetName = 'LEADS MOJOKERTO'
  // }

  console.log(`Appending lead to sheet: ${spreadsheetId} (${sheetName})`)

  const row = buildRow(payload)
  const sheets = getSheetsClient()

  // WAJIB berhasil
  const maxAttempts = 3
  let sheetResponse: { data?: { updates?: { updatedRows?: number | null } | null } } | null = null
  let lastSheetError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      sheetResponse = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [row],
        },
      })
      break
    } catch (error) {
      lastSheetError = error
      const canRetry = attempt < maxAttempts && isRetriableSheetsError(error)

      if (!canRetry) {
        throw error
      }

      // Backoff sederhana: 400ms, 800ms
      await sleep(attempt * 400)
    }
  }

  if (!sheetResponse) {
    throw (lastSheetError instanceof Error
      ? lastSheetError
      : new Error('Google Sheets append failed without response'))
  }

  const updatedRows = Number(sheetResponse.data?.updates?.updatedRows ?? 0)
  if (!Number.isFinite(updatedRows) || updatedRows < 1) {
    throw new Error('Google Sheets append did not persist any row')
  }

  console.log('Append response data:', sheetResponse.data)

  // OPTIONAL
  let apiResponse: {
    status: number
    data: string
  } | null = null

  let externalApiError: string | null = null

  try {
    apiResponse = await sendLeadToExternalApi(payload)
    console.log('External API response:', apiResponse)
  } catch (error) {
    externalApiError = error instanceof Error ? error.message : 'Unknown external API error'
    console.error('External API failed but Google Sheets append succeeded:', externalApiError)
  }

  return {
    // spreadsheetId,
    // sheetName,
    domicile: payload.domicile ?? 'default',
    area: payload.handoverLocation ?? 'default',
    sheetSuccess: true,
    externalApiSuccess: Boolean(apiResponse),
    externalApi: apiResponse,
    externalApiError,
  }
}

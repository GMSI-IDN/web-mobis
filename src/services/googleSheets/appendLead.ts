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

  const validSurabaya = ['kota surabaya', 'sidoarjo', 'kota gresik']
  const validBali = ['provinsi bali']
  const validBandung = ['bandung']

  if (validJabodetabek.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_JABODETABEK')
  } else if (validSurabaya.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_SURABAYA')
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
  const value = normalizeDriverApps(driverApps).toLowerCase()
  return value === 'tidak ada akun'
}

function buildSourceDetail(payload: RegistrationPayload): string {
  const sourceDetail = (payload as any).sourceDetail ?? ''
  const otherSourceInfo = (payload as any).otherSourceInfo ?? ''
  return [sourceDetail, otherSourceInfo].filter(Boolean).join(' | ')
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
    (payload as any).sourceDetail ?? '',
    '',
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

  return {
    name: payload.name ?? '',
    phone_number: normalizePhone(payload.phone),
    age,
    identity_number: payload.ktpNumber ?? '',
    domicile: payload.domicile ?? '',
    address: payload.currentAddress ?? '',
    home_ownership_status: payload.houseOwnership ?? '',
    online_driver_app: payload.driverApps ?? '',
    personal_online_driver_app: noAccount ? '' : (payload.activeAccountSelf ?? ''),
    online_driver_duration: noAccount ? '' : (payload.driverExperience ?? ''),
    pool_preference: payload.handoverLocation ?? '',
    information_source: payload.sourceInfo ?? '',
    detail_information_source: buildSourceDetail(payload),
    promo_code: (payload as any).promoCode ?? '',
    registered_from: 'Website Mobis',
    emergency_phone_number: normalizePhone(payload.emergencyPhone),
    emergency_contact_name: payload.emergencyName ?? '',
    emergency_contact_relation: payload.emergencyRelation ?? '',
    lead_place_of_birth: payload.birthPlace ?? '',
    lead_date_of_birth: payload.birthDate ?? '',
    lead_sim_no: payload.simNumber ?? '',
    lead_sim_type: mapSimTypeForApi(payload.simType),
    lead_sim_expire_date: payload.simValidUntil ?? '',
  }
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
    throw new Error(
      `Failed to send lead to external API. Status: ${response.status}. Response: ${responseText}`,
    )
  }

  return {
    status: response.status,
    data: responseText,
  }
}

export async function appendLeadToSheet(payload: RegistrationPayload) {
  const spreadsheetId = resolveSpreadsheetId(payload.handoverLocation)
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Leads'

  console.log(`Appending lead to sheet: ${spreadsheetId} (${sheetName})`)

  const row = buildRow(payload)
  const sheets = getSheetsClient()

  // WAJIB berhasil
  const sheetResponse = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

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

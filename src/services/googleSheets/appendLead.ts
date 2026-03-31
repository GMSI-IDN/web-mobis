import { getEnv } from '@/lib/env'
import { getSheetsClient } from './client'
import type { RegistrationPayload } from '@/types/registration'
import { array } from 'payload/shared'

function resolveSpreadsheetId(domicile?: string): string {
  const key = (domicile || '').toLowerCase()
  console.log(`Resolving spreadsheet ID for domicile: ${domicile} (key: ${key})`)

  if (!key) {
    console.warn('No domicile provided, using default spreadsheet ID')
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

  if (validJabodetabek.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_JABODETABEK')
  } else if (validSurabaya.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_SURABAYA')
  } else if (validBali.includes(key)) {
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_BALI')
  } else {
    console.warn(
      `Domicile "${domicile}" does not match any specific area, using default spreadsheet ID`,
    )
    return getEnv('GOOGLE_SHEETS_SPREADSHEET_ID_DEFAULT')
  }
}

function buildRow(payload: RegistrationPayload): (string | null)[] {
  const now = new Date()

  return [
    now.toISOString(),

    payload.name ?? '',
    payload.birthPlace ?? '',
    payload.birthDate ?? '',

    payload.phone ?? '',
    payload.ktpNumber ?? '',

    payload.simNumber ?? '',
    payload.simType ?? '',
    payload.domicile ?? '',
    payload.simValidUntil ?? '',

    payload.currentAddress ?? '',
    payload.houseOwnership ?? '',

    payload.emergencyName ?? '',
    payload.emergencyPhone ?? '',
    payload.emergencyRelation ?? '',

    payload.driverApps ?? '',
    payload.activeAccountSelf ?? '',
    payload.driverExperience ?? '',

    payload.handoverLocation ?? '',
    payload.sourceInfo ?? '',
    payload.promoCode ?? '',
  ]
}

export async function appendLeadToSheet(payload: RegistrationPayload) {
  const spreadsheetId = resolveSpreadsheetId(payload.domicile)
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Leads'

  console.log(`Appending lead to sheet: ${spreadsheetId} (${sheetName})`)

  const row = buildRow(payload)

  const sheets = getSheetsClient()

  const responData = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

  console.log('Append response data:', responData.data)

  return {
    spreadsheetId,
    sheetName,
    area: payload.domicile ?? 'default',
  }
}

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

  let ageDisplay: string = '' // Kita siapkan sebagai string

  if (payload.birthDate) {
    const birthDate = new Date(payload.birthDate)
    let ageNum = now.getFullYear() - birthDate.getFullYear()
    const m = now.getMonth() - birthDate.getMonth()

    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
      ageNum--
    }

    ageDisplay = ageNum.toString() // Ubah angka ke string agar tidak error
  }

  // 1. Variabel Tanggal: DD-MM-YYYY
  const datePart = now
    .toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .replace(/\//g, '-') // Mengubah / menjadi -

  // 2. Variabel Waktu: HH:mm
  const timePart = now
    .toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace('.', ':') // Pastikan menggunakan titik dua (id-ID defaultnya titik)
  let simType = ''
  switch (payload.simType) {
    case '1':
      simType = 'SIM A UMUM'
      break
    case '2':
      simType = 'SIM B'
      break
    case '3':
      simType = 'SIM B2'
      break
    case '4':
      simType = 'SIM B2 UMUM'
      break
    case '5':
      simType = 'SIM C'
      break
    case '6':
      simType = 'SIM B1'
      break
    case '7':
      simType = 'SIM B1 UMUM'
      break
    default:
      simType = 'SIM A'
      break
  }

  let phone = ''
  if (payload.phone) {
    // phone = `http://api.whatsapp.com/send/?phone=62${payload.phone}`
    phone =
      '=HYPERLINK("api.whatsapp.com/send/?phone=62' + payload.phone + '", "' + payload.phone + '")'
  } else {
    phone = ''
  }
  let emergencyPhone = ''
  if (payload.emergencyPhone) {
    emergencyPhone =
      '=HYPERLINK("api.whatsapp.com/send/?phone=62' +
      payload.emergencyPhone +
      '", "' +
      payload.emergencyPhone +
      '")'
  } else {
    emergencyPhone = ''
  }

  return [
    payload.name ?? '',
    // '0' + (payload.phone ?? ''),
    phone,
    ageDisplay, // <--- Sekarang ini sudah bertipe string, aman untuk TypeScript
    payload.ktpNumber ?? '',
    payload.domicile ?? '',
    payload.currentAddress ?? '',
    payload.houseOwnership ?? '',
    payload.driverApps ?? '',
    payload.activeAccountSelf ?? '',
    payload.driverExperience ?? '',
    payload.handoverLocation ?? '',
    payload.sourceInfo ?? '',
    '',
    '',
    'Website Mobis',
    '',
    '',
    datePart,
    timePart,
    // '0' + (payload.emergencyPhone ?? ''),
    emergencyPhone,
    payload.emergencyName ?? '',
    payload.emergencyRelation ?? '',
    payload.birthPlace ?? '',
    payload.birthDate ?? '',
    payload.simNumber ?? '',
    simType,
    payload.simValidUntil ?? '',

    // payload.promoCode ?? '',
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

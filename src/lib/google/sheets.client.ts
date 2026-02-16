import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import { getEnv } from '@/lib/env'

export type SheetsAppendOptions = {
  spreadsheetId: string
  sheetName: string
  values: (string | number | boolean | null)[][]
}

function loadServiceAccount() {
  const relPath = getEnv('GOOGLE_SERVICE_ACCOUNT_JSON_PATH')
  const absPath = path.join(process.cwd(), relPath)

  if (!fs.existsSync(absPath)) {
    throw new Error(`Google service account file not found: ${absPath}`)
  }

  const raw = fs.readFileSync(absPath, 'utf8')
  return JSON.parse(raw)
}

export async function appendRowsToSheet(opts: SheetsAppendOptions) {
  const creds = loadServiceAccount()

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  await sheets.spreadsheets.values.append({
    spreadsheetId: opts.spreadsheetId,
    range: `${opts.sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: opts.values },
  })
}

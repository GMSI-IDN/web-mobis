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
  // path.resolve (unlike path.join) respects a leading "/" as an absolute path,
  // so this works whether GOOGLE_SERVICE_ACCOUNT_JSON_PATH is relative (local dev)
  // or absolute (production, where the file is bind-mounted at a fixed container path).
  const absPath = path.resolve(process.cwd(), relPath)

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

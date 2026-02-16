import { google, type sheets_v4 } from 'googleapis'
import fs from 'fs'
import path from 'path'

let cachedSheets: sheets_v4.Sheets | null = null

function getCredsFromFile() {
  const relPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH
  if (!relPath) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON_PATH env')
  }

  const absPath = path.join(process.cwd(), relPath)

  if (!fs.existsSync(absPath)) {
    throw new Error(`Credential file not found: ${absPath}`)
  }

  const raw = fs.readFileSync(absPath, 'utf8')
  const creds = JSON.parse(raw)

  if (!creds.client_email || !creds.private_key) {
    throw new Error('Invalid credentials.json format')
  }

  return creds
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (cachedSheets) return cachedSheets

  const creds = getCredsFromFile()

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  cachedSheets = google.sheets({
    version: 'v4',
    auth,
  })

  return cachedSheets
}

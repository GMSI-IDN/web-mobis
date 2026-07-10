// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g

export function sanitizeFreeText(value: unknown, maxLen: number): string {
  const trimmed = String(value ?? '').trim().replace(CONTROL_CHARS, '')
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}

// Google Sheets (and CSV consumers in general) interpret cell values starting
// with =, +, -, @, tab or CR as formulas when written with USER_ENTERED. A
// leading apostrophe forces the cell to be treated as literal text.
// https://owasp.org/www-community/attacks/CSV_Injection
const FORMULA_TRIGGER_CHARS = new Set(['=', '+', '-', '@', '\t', '\r'])

export function neutralizeSpreadsheetFormula(value: unknown): string {
  const str = String(value ?? '')
  const trimmed = str.trim()
  if (!trimmed) return str

  if (FORMULA_TRIGGER_CHARS.has(trimmed[0])) {
    return `'${str}`
  }

  return str
}

// Free-text fields on these forms (names, addresses, chat messages, etc.)
// have no legitimate reason to contain HTML/script markup. Rather than try
// to sanitize/strip and hope every XSS vector is covered, reject the whole
// submission outright — fail closed instead of silently cleaning input.
const SUSPICIOUS_INPUT_PATTERN = /[<>]|javascript:|data:text\/html/i

export function containsSuspiciousMarkup(value: unknown): boolean {
  return SUSPICIOUS_INPUT_PATTERN.test(String(value ?? ''))
}

export function assertNoSuspiciousMarkup(value: unknown, field: string, message: string): void {
  if (!containsSuspiciousMarkup(value)) return

  const err = new Error(message)
  ;(err as any).statusCode = 400
  ;(err as any).code = 'SUSPICIOUS_INPUT'
  ;(err as any).errors = { [field]: message }
  throw err
}

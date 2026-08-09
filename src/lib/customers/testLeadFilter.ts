export const TEST_LEAD_NAME_EXCLUDE_VALUES = ['test', 'testing', 'punten'] as const

const EXCLUDED_LEAD_NAME_REGEX = /\b(?:test(?:ing)?|punten)\w*\b/i

function normalizeLeadName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

export function isExcludedLeadName(name?: null | string): boolean {
  const value = String(name ?? '').trim()
  if (!value) return false

  if (EXCLUDED_LEAD_NAME_REGEX.test(value)) return true

  const normalized = normalizeLeadName(value)
  if (!normalized) return false

  return TEST_LEAD_NAME_EXCLUDE_VALUES.some((keyword) =>
    normalized.includes(normalizeLeadName(keyword)),
  )
}

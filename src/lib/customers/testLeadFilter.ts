export const TEST_LEAD_NAME_EXCLUDE_VALUES = ['test', 'punten'] as const

const EXCLUDED_LEAD_NAME_REGEX = /\b(?:test|punten)\w*\b/i

export function isExcludedLeadName(name?: null | string): boolean {
  const value = String(name ?? '').trim()
  if (!value) return false

  return EXCLUDED_LEAD_NAME_REGEX.test(value)
}

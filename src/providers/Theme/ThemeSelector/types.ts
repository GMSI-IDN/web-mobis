export type Theme = 'dark' | 'light'

// Also hardcoded in public/theme-init.js (served as a static, CSP-friendly
// script — see InitTheme). Keep both in sync if these ever change.
export const themeLocalStorageKey = 'payload-theme'

export const defaultTheme = 'light'

import Script from 'next/script'
import React from 'react'

// Served from public/theme-init.js instead of an inline script so the site's
// CSP script-src can stay 'self'-only (no 'unsafe-inline'). The values baked
// into that file (default theme 'light', localStorage key 'payload-theme')
// must be kept in sync with '../ThemeSelector/types' if those ever change.
export const InitTheme: React.FC = () => {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script src="/theme-init.js" id="theme-script" strategy="beforeInteractive" />
  )
}

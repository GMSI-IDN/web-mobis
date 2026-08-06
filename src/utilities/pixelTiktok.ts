'use client'

// TikTok's official "basic code" is normally an inline bootstrap script that
// defines a `ttq` command queue, then injects the real SDK <script> tag. We
// skip the inline-script part entirely (the CSP here has no 'unsafe-inline'
// for script-src) and instead load the SDK script ourselves from this
// module — a same-origin ('self') script is allowed to create a <script>
// pointed at an allow-listed host (see script-src in next.config.js).
// Events fired before the SDK finishes loading are queued via
// `loadPromise`/`initTiktokPixel`, mirroring what the stub queue would do.

declare global {
  interface Window {
    ttq?: {
      page: () => void
      track: (event: string, params?: Record<string, unknown>) => void
    }
  }
}

const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
let isInitialized = false
let loadPromise: Promise<void> | null = null

function loadTiktokScript(): Promise<void> {
  if (typeof window === 'undefined' || !pixelId) return Promise.resolve()
  if (window.ttq) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}&lib=ttq`
    script.onload = () => resolve()
    script.onerror = () => resolve() // fail silently — never block the page for a tracking script
    document.head.appendChild(script)
  })

  return loadPromise
}

export const initTiktokPixel = async () => {
  if (typeof window === 'undefined') return
  if (!pixelId) return
  if (isInitialized) return

  await loadTiktokScript()
  if (!window.ttq) return
  isInitialized = true
}

export const trackTiktokPageView = async () => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initTiktokPixel()
  window.ttq?.page()
}

export const trackTiktokEvent = async (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initTiktokPixel()
  window.ttq?.track(eventName, params || {})
}

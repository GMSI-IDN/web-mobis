'use client'

declare global {
  interface Window {
    ttq?: {
      page: () => void
      track: (event: string, params?: Record<string, unknown>) => void
    }
  }
}

export const initTiktokPixel = async () => {
  // Initialization is now handled directly via next/script in PixelTiktok component
  return
}

export const trackTiktokPageView = async () => {
  if (typeof window === 'undefined') return
  window.ttq?.page()
}

export const trackTiktokEvent = async (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  window.ttq?.track(eventName, params || {})
}

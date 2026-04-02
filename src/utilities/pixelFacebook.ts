'use client'

let ReactPixel: any = null

const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
let isPixelInitialized = false

const loadPixel = async () => {
  if (typeof window === 'undefined') return null
  if (ReactPixel) return ReactPixel

  const mod = await import('react-facebook-pixel')
  ReactPixel = mod.default
  return ReactPixel
}

export const initFacebookPixel = async () => {
  if (typeof window === 'undefined') return
  if (!pixelId) return
  if (isPixelInitialized) return

  const pixel = await loadPixel()
  if (!pixel) return

  pixel.init(pixelId)
  isPixelInitialized = true
}

export const trackFacebookPageView = async () => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initFacebookPixel()

  const pixel = await loadPixel()
  if (!pixel) return

  pixel.pageView()
}

export const trackFacebookEvent = async (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initFacebookPixel()

  const pixel = await loadPixel()
  if (!pixel) return

  pixel.track(eventName, params || {})
}

export const trackFacebookCustomEvent = async (
  eventName: string,
  params?: Record<string, unknown>,
) => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initFacebookPixel()

  const pixel = await loadPixel()
  if (!pixel) return

  pixel.trackCustom(eventName, params || {})
}

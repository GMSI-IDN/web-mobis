'use client'

let ReactPixel: any = null

const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
let isPixelInitialized = false

type FacebookTrackOptions = {
  eventID?: string
}

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
  options?: FacebookTrackOptions,
) => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initFacebookPixel()

  const pixel = await loadPixel()
  if (!pixel) return

  if (options?.eventID && typeof pixel.fbq === 'function') {
    pixel.fbq('trackCustom', eventName, params || {}, { eventID: options.eventID })
    return
  }

  pixel.trackCustom(eventName, params || {})
}

export const trackFacebookEventWithDedup = async (
  eventName: string,
  params?: Record<string, unknown>,
  options?: FacebookTrackOptions,
) => {
  if (typeof window === 'undefined') return
  if (!pixelId) return

  await initFacebookPixel()

  const pixel = await loadPixel()
  if (!pixel) return

  if (options?.eventID && typeof pixel.fbq === 'function') {
    pixel.fbq('track', eventName, params || {}, { eventID: options.eventID })
    return
  }

  pixel.track(eventName, params || {})
}

export type RegistrationCTATracking = {
  ctaText?: string
  ctaLink?: string
  section?: string
  placement?: string
  targetType?: 'section' | 'link' | 'modal' | 'submit'
}

export const trackRegistrationCTAClick = async ({
  ctaText,
  ctaLink,
  section = 'General',
  placement,
  targetType,
}: {
  ctaText: string
  ctaLink: string
  section?: string
  placement?: string
  targetType?: 'section' | 'link' | 'modal' | 'submit'
}) => {
  const payload = {
    content_name: ctaText,
    content_category: 'Record user location view',
    section,
    placement: placement || section,
    target: ctaLink,
    target_type: targetType || (ctaLink.startsWith('#') ? 'section' : 'link'),
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  }

  // await trackFacebookEvent('Lead', payload)
  await trackFacebookCustomEvent('ClickRegistrationCTA', {
    button_text: ctaText,
    section,
    placement: placement || section,
    target: ctaLink,
    target_type: payload.target_type,
    page_path: payload.page_path,
  })
}

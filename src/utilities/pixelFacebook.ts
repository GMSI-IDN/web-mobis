'use client'

type FacebookTrackOptions = {
  eventID?: string
}

export const initFacebookPixel = async () => {
  // Initialization is now handled directly via next/script in PixelFacebook component
  return
}

export const trackFacebookPageView = async () => {
  if (typeof window === 'undefined') return
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'PageView')
  }
}

export const trackFacebookEvent = async (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', eventName, params || {})
  }
}

export const trackFacebookCustomEvent = async (
  eventName: string,
  params?: Record<string, unknown>,
  options?: FacebookTrackOptions,
) => {
  if (typeof window === 'undefined') return

  if (typeof (window as any).fbq === 'function') {
    if (options?.eventID) {
      (window as any).fbq('trackCustom', eventName, params || {}, { eventID: options.eventID })
    } else {
      (window as any).fbq('trackCustom', eventName, params || {})
    }
  }
}

export const trackFacebookEventWithDedup = async (
  eventName: string,
  params?: Record<string, unknown>,
  options?: FacebookTrackOptions,
) => {
  if (typeof window === 'undefined') return

  if (typeof (window as any).fbq === 'function') {
    if (options?.eventID) {
      (window as any).fbq('track', eventName, params || {}, { eventID: options.eventID })
    } else {
      (window as any).fbq('track', eventName, params || {})
    }
  }
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

  await trackFacebookCustomEvent('ClickRegistrationCTA', {
    button_text: ctaText,
    section,
    placement: placement || section,
    target: ctaLink,
    target_type: payload.target_type,
    page_path: payload.page_path,
  })
}

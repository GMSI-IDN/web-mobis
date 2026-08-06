'use client'

// Single entry point for "fire this conversion event to every ad pixel".
// Call sites (BannerCarousel CTA, RegistrationForm submit/success, CMSLink)
// import from here instead of pixelFacebook/pixelTiktok directly, so adding
// or removing a pixel is a one-file change instead of touching every button.

import {
  trackFacebookCustomEvent,
  trackFacebookEventWithDedup,
  trackRegistrationCTAClick as trackFacebookRegistrationCTAClick,
  type RegistrationCTATracking,
} from './pixelFacebook'
import { trackTiktokEvent } from './pixelTiktok'

type TrackOptions = {
  eventID?: string
}

export const trackCustomEvent = async (
  eventName: string,
  params?: Record<string, unknown>,
  options?: TrackOptions,
) => {
  await Promise.all([
    trackFacebookCustomEvent(eventName, params, options),
    trackTiktokEvent(eventName, params),
  ])
}

export const trackEventWithDedup = async (
  eventName: string,
  params?: Record<string, unknown>,
  options?: TrackOptions,
) => {
  await Promise.all([
    trackFacebookEventWithDedup(eventName, params, options),
    trackTiktokEvent(eventName, params),
  ])
}

export type { RegistrationCTATracking }

export const trackRegistrationCTAClick = async (args: {
  ctaText: string
  ctaLink: string
  section?: string
  placement?: string
  targetType?: 'section' | 'link' | 'modal' | 'submit'
}) => {
  await Promise.all([
    trackFacebookRegistrationCTAClick(args),
    trackTiktokEvent('ClickRegistrationCTA', {
      button_text: args.ctaText,
      section: args.section || 'General',
      placement: args.placement || args.section || 'General',
      target: args.ctaLink,
      target_type: args.targetType || (args.ctaLink.startsWith('#') ? 'section' : 'link'),
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    }),
  ])
}

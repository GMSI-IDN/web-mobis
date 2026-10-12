/* eslint-disable */
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackFacebookPageView } from '@/utilities/pixelFacebook'

export default function PixelFacebook({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return

    // Stub fbq immediately so all tracking calls are safely queued
    if (!(window as any).fbq) {
      const n: any = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!(window as any)._fbq) (window as any)._fbq = n
      n.push = n
      n.loaded = !0
      n.version = '2.0'
      n.queue = []
      ;(window as any).fbq = n
      ;(window as any).fbq('set', 'autoConfig', false, pixelId)
      ;(window as any).fbq('init', pixelId)
      ;(window as any).fbq('track', 'PageView')
    }

    let loaded = false
    const loadScript = () => {
      if (loaded) return
      loaded = true
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      const first = document.getElementsByTagName('script')[0]
      first?.parentNode?.insertBefore(script, first)
    }

    // Load external script on first user interaction or idle timeout (5s)
    // This prevents 245KB of third-party script from blocking initial paint / LCP / TBT
    const interactionEvents = ['scroll', 'touchstart', 'pointerdown', 'keydown']
    const onInteraction = () => {
      interactionEvents.forEach((ev) => window.removeEventListener(ev, onInteraction))
      loadScript()
    }
    interactionEvents.forEach((ev) =>
      window.addEventListener(ev, onInteraction, { passive: true, once: true }),
    )

    const timer = setTimeout(onInteraction, 5000)

    return () => {
      clearTimeout(timer)
      interactionEvents.forEach((ev) => window.removeEventListener(ev, onInteraction))
    }
  }, [pixelId])

  useEffect(() => {
    // Skip tracking on initial load because the initFB handler tracks PageView
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }

    // Only track page view on route changes (pathname change) after the script is loaded
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      trackFacebookPageView()
    }
  }, [pathname])

  return null
}

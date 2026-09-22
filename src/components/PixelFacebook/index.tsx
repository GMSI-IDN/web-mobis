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

    const initFB = () => {
      if ((window as any).fbq) return
      ;(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        }
        if (!f._fbq) f._fbq = n
        n.push = n
        n.loaded = !0
        n.version = '2.0'
        n.queue = []
        t = b.createElement(e)
        t.async = !0
        t.src = v
        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
      ;(window as any).fbq('set', 'autoConfig', false, pixelId)
      ;(window as any).fbq('init', pixelId)
      ;(window as any).fbq('track', 'PageView')
    }

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(initFB, { timeout: 2500 })
      return () => (window as any).cancelIdleCallback(handle)
    } else {
      const timer = setTimeout(initFB, 1500)
      return () => clearTimeout(timer)
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

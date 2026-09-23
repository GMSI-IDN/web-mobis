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

    // 1. Initialize queue stub immediately so window.fbq is always available for tracking
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

    let scriptLoaded = false
    const loadScript = () => {
      if (scriptLoaded) return
      scriptLoaded = true
      cleanupEvents()
      const t = document.createElement('script')
      t.async = true
      t.src = 'https://connect.facebook.net/en_US/fbevents.js'
      const s = document.getElementsByTagName('script')[0]
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s)
      } else {
        document.head.appendChild(t)
      }
    }

    const events = ['scroll', 'touchstart', 'mousemove', 'click', 'keydown']
    const onUserInteraction = () => {
      loadScript()
    }
    const cleanupEvents = () => {
      events.forEach((event) => window.removeEventListener(event, onUserInteraction))
    }

    events.forEach((event) => window.addEventListener(event, onUserInteraction, { once: true, passive: true }))

    let idleHandle: any
    let timer: any
    if ('requestIdleCallback' in window) {
      idleHandle = (window as any).requestIdleCallback(loadScript, { timeout: 7000 })
    } else {
      timer = setTimeout(loadScript, 7000)
    }

    return () => {
      cleanupEvents()
      if (idleHandle && 'cancelIdleCallback' in window) (window as any).cancelIdleCallback(idleHandle)
      if (timer) clearTimeout(timer)
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

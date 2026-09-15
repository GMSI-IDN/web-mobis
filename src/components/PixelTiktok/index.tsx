/* eslint-disable */
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackTiktokPageView } from '@/utilities/pixelTiktok'

export default function PixelTiktok({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return

    const initTT = () => {
      if ((window as any).ttq) return
      ;(function (w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t
        var ttq = (w[t] = w[t] || [])
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie',
        ]
        ttq.setAndDefer = function (t: any, e: any) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
          }
        }
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
        ttq.instance = function (t: any) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
            ttq.setAndDefer(e, ttq.methods[n])
          return e
        }
        ttq.load = function (e: any, n: any) {
          var i = 'https://analytics.tiktok.com/i18n/pixel/events.js'
          ttq._i = ttq._i || {}
          ttq._i[e] = []
          ttq._i[e]._u = i
          ttq._t = ttq._t || {}
          ttq._t[e] = +new Date()
          ttq._o = ttq._o || {}
          ttq._o[e] = n || {}
          n = d.createElement('script')
          n.type = 'text/javascript'
          n.async = !0
          n.src = i + '?sdkid=' + e + '&lib=' + t
          var s = d.getElementsByTagName('script')[0]
          s.parentNode.insertBefore(n, s)
        }
        ttq.load(pixelId)
        ttq.page()
      })(window, document, 'ttq')
    }

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(initTT, { timeout: 2500 })
      return () => (window as any).cancelIdleCallback(handle)
    } else {
      const timer = setTimeout(initTT, 1500)
      return () => clearTimeout(timer)
    }
  }, [pixelId])

  useEffect(() => {
    // Skip tracking on initial load because initTT handles page()
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }

    if (typeof window !== 'undefined' && window.ttq) {
      trackTiktokPageView()
    }
  }, [pathname])

  return null
}

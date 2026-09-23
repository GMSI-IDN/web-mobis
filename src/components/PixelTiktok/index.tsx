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

    // 1. Initialize ttq queue stub immediately
    if (!(window as any).ttq) {
      const ttq: any = ((window as any).ttq = (window as any).ttq || [])
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
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
      ttq.instance = function (t: any) {
        const inst = ttq._i[t] || []
        for (let n = 0; n < ttq.methods.length; n++) {
          ttq.setAndDefer(inst, ttq.methods[n])
        }
        return inst
      }
      ttq.load = function (e: any, n: any) {
        const i = 'https://analytics.tiktok.com/i18n/pixel/events.js'
        ttq._i = ttq._i || {}
        ttq._i[e] = []
        ttq._i[e]._u = i
        ttq._t = ttq._t || {}
        ttq._t[e] = +new Date()
        ttq._o = ttq._o || {}
        ttq._o[e] = n || {}
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.async = true
        script.src = i + '?sdkid=' + e + '&lib=ttq'
        const s = document.getElementsByTagName('script')[0]
        if (s && s.parentNode) {
          s.parentNode.insertBefore(script, s)
        } else {
          document.head.appendChild(script)
        }
      }
      ttq.page()
    }

    let scriptLoaded = false
    const loadScript = () => {
      if (scriptLoaded) return
      scriptLoaded = true
      cleanupEvents()
      if ((window as any).ttq?.load) {
        ;(window as any).ttq.load(pixelId)
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
      idleHandle = (window as any).requestIdleCallback(loadScript, { timeout: 4000 })
    } else {
      timer = setTimeout(loadScript, 3500)
    }

    return () => {
      cleanupEvents()
      if (idleHandle && 'cancelIdleCallback' in window) (window as any).cancelIdleCallback(idleHandle)
      if (timer) clearTimeout(timer)
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

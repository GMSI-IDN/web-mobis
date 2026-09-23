'use client'
import { useEffect } from 'react'

export function BootstrapClient() {
  useEffect(() => {
    let loaded = false
    const loadBootstrap = () => {
      if (loaded) return
      loaded = true
      cleanup()
      void import('bootstrap')
    }

    const events = ['scroll', 'touchstart', 'click', 'keydown']
    const cleanup = () => {
      events.forEach((event) => window.removeEventListener(event, loadBootstrap))
    }

    events.forEach((event) => window.addEventListener(event, loadBootstrap, { once: true, passive: true }))

    let idleHandle: any
    let timer: any
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = (window as any).requestIdleCallback(loadBootstrap, { timeout: 6000 })
    } else {
      timer = setTimeout(loadBootstrap, 5000)
    }

    return () => {
      cleanup()
      if (idleHandle && 'cancelIdleCallback' in window) (window as any).cancelIdleCallback(idleHandle)
      if (timer) clearTimeout(timer)
    }
  }, [])

  return null
}


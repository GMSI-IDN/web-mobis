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

    return () => {
      cleanup()
    }
  }, [])

  return null
}


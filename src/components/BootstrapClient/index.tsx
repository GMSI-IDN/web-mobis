'use client'
import { useEffect } from 'react'

export function BootstrapClient() {
  useEffect(() => {
    const loadBootstrap = () => {
      void import('bootstrap')
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(loadBootstrap, { timeout: 2000 })
      return () => (window as any).cancelIdleCallback(handle)
    } else {
      const timer = setTimeout(loadBootstrap, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  return null
}


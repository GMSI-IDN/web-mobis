'use client'
import { useEffect } from 'react'

export function BootstrapClient() {
  useEffect(() => {
    void import('bootstrap')
  }, [])

  return null
}

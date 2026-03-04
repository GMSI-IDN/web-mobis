'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Portal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // pastikan document sudah ada dan body ready
    if (typeof document !== 'undefined' && document.body) setTarget(document.body)
  }, [])

  if (!target) return null

  try {
    return createPortal(children, target)
  } catch (e) {
    console.error('[MobisWidget Portal] createPortal failed:', e)
    return null
  }
}

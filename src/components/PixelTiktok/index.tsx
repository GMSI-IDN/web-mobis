'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initTiktokPixel, trackTiktokPageView } from '@/utilities/pixelTiktok'

export default function PixelTiktok() {
  const pathname = usePathname()

  useEffect(() => {
    initTiktokPixel()
  }, [])

  useEffect(() => {
    trackTiktokPageView()
  }, [pathname])

  return null
}

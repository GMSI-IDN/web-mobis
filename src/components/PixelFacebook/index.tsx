'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initFacebookPixel, trackFacebookPageView } from '@/utilities/pixelFacebook'

export default function PixelFacebook() {
  const pathname = usePathname()

  useEffect(() => {
    initFacebookPixel()
  }, [])

  useEffect(() => {
    trackFacebookPageView()
  }, [pathname])

  return null
}

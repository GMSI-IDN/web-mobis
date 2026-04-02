'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initFacebookPixel, trackFacebookPageView } from '@/utilities/pixelFacebook'

export default function PixelFacebook() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initFacebookPixel()
  }, [])

  useEffect(() => {
    trackFacebookPageView()
  }, [pathname, searchParams])

  return null
}

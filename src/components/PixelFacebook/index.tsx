'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { trackFacebookPageView } from '@/utilities/pixelFacebook'

export default function PixelFacebook({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    // Skip tracking on initial load because the inline script handles it
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }

    // Only track page view on route changes (pathname change) after the script is loaded
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      trackFacebookPageView()
    }
  }, [pathname])

  if (!pixelId) return null

  return (
    <Script
      id="fb-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}

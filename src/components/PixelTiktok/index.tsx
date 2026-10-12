/* eslint-disable */
'use client'

import React, { useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { trackTiktokPageView } from '@/utilities/pixelTiktok'

const DEFAULT_TIKTOK_PIXEL_ID = 'D9OL9IJC77UA78ACTEP0'

export default function PixelTiktok({ pixelId }: { pixelId?: string }) {
  const activePixelId =
    pixelId || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || DEFAULT_TIKTOK_PIXEL_ID
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    // Skip tracking on initial load because ttq.page() runs when the script initializes
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }

    if (typeof window !== 'undefined' && (window as any).ttq) {
      trackTiktokPageView()
    }
  }, [pathname])

  if (!activePixelId) return null

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('${activePixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  )
}

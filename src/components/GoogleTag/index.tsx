'use client'

import React from 'react'
import Script from 'next/script'

export default function GoogleTag({ tagId }: { tagId?: string }) {
  if (!tagId) return null

  // Google Tag Manager (GTM-XXXXXX)
  if (tagId.startsWith('GTM-')) {
    return (
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${tagId}');
          `,
        }}
      />
    )
  }

  // Google Analytics 4 / Google Ads (G-XXXXXX / AW-XXXXXX / GT-XXXXXX)
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-tag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${tagId}');
          `,
        }}
      />
    </>
  )
}

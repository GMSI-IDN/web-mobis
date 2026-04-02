import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import './style.css'

import React from 'react'
import { draftMode } from 'next/headers'
import Script from 'next/script'

import { AdminBar } from '@/components/AdminBar'
import { BootstrapClient } from '@/components/BootstrapClient'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { MobisWidgetProvider } from '@/components/MobisWidget'
import { inter } from './fonts'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

  return (
    <div className={`${inter.className} ${inter.variable} d-flex flex-column min-vh-100`}>
      <InitTheme />
      <Providers>
        <AdminBar adminBarProps={{ preview: isEnabled }} />
        <BootstrapClient />
        <Header />

        {/* FACEBOOK PIXEL */}
        {pixelId && (
          <>
            <Script
              id="facebook-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s){
                    if(f.fbq)return;
                    n=f.fbq=function(){
                      n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
                    };
                    if(!f._fbq)f._fbq=n;
                    n.push=n;
                    n.loaded=!0;
                    n.version='2.0';
                    n.queue=[];
                    t=b.createElement(e);
                    t.async=!0;
                    t.src=v;
                    s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s);
                  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                  fbq('init', '999031544681604');
                  fbq('track', 'PageView');
                `,
              }}
            />

            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=999031544681604&ev=PageView&noscript=1"`}
                alt=""
              />
            </noscript>
          </>
        )}

        {children}

        <MobisWidgetProvider />
        <Footer />
      </Providers>
    </div>
  )
}

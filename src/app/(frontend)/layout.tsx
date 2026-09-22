import './bootstrap-custom.generated.css'
import './globals.css'
import './style.css'

import React, { Suspense } from 'react'
import { draftMode } from 'next/headers'

import { AdminBar } from '@/components/AdminBar'
import { BootstrapClient } from '@/components/BootstrapClient'
import PixelFacebook from '@/components/PixelFacebook'
import PixelTiktok from '@/components/PixelTiktok'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import MobisWidgetProvider from '@/components/MobisWidget/LazyMobisWidgetProvider'
import { inter } from './fonts'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <div className={`${inter.className} ${inter.variable} d-flex flex-column min-vh-100`}>
      <Providers>
        <AdminBar adminBarProps={{ preview: isEnabled }} />
        <BootstrapClient />

        <Suspense fallback={null}>
          <PixelFacebook pixelId={process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.FACEBOOK_PIXEL_ID} />
        </Suspense>
        <Suspense fallback={null}>
          <PixelTiktok pixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || process.env.TIKTOK_PIXEL_ID} />
        </Suspense>

        <Header />
        <main id="main-content" className="flex-grow-1">
          {children}
        </main>
        <MobisWidgetProvider />
        <Footer />
      </Providers>
    </div>
  )
}

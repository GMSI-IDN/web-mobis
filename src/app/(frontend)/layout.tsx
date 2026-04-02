import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import './style.css'

import React, { Suspense } from 'react'
import { draftMode } from 'next/headers'

import { AdminBar } from '@/components/AdminBar'
import { BootstrapClient } from '@/components/BootstrapClient'
import PixelFacebook from '@/components/PixelFacebook'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { MobisWidgetProvider } from '@/components/MobisWidget'
import { inter } from './fonts'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <div className={`${inter.className} ${inter.variable} d-flex flex-column min-vh-100`}>
      <InitTheme />
      <Providers>
        <AdminBar adminBarProps={{ preview: isEnabled }} />
        <BootstrapClient />

        <Suspense fallback={null}>
          <PixelFacebook />
        </Suspense>

        <Header />
        {children}
        <MobisWidgetProvider />
        <Footer />
      </Providers>
    </div>
  )
}

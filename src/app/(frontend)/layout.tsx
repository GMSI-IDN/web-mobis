import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import './style.css'

import React from 'react'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'

import { AdminBar } from '@/components/AdminBar'
import { BootstrapClient } from '@/components/BootstrapClient'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { inter } from './fonts'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html lang="id" className={inter.variable}>
      <body className={inter.className}>
        <InitTheme />
        <Providers>
          <AdminBar adminBarProps={{ preview: isEnabled }} />
          <BootstrapClient />
          <Header />

          {children}

          <Footer />
        </Providers>
      </body>
    </html>
  )
}

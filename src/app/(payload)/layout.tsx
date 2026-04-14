import config from '@payload-config'
import '@payloadcms/next/css'
import { rtlLanguages } from '@payloadcms/translations'
import { ProgressBar, RootProvider } from '@payloadcms/ui'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { cookies as nextCookies } from 'next/headers'
import type { ServerFunctionClient } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import React from 'react'

import { getNavPrefs } from '../../../node_modules/@payloadcms/next/dist/elements/Nav/getNavPrefs.js'
import { NestProviders } from '../../../node_modules/@payloadcms/next/dist/layouts/Root/NestProviders.js'
import { getRequestTheme } from '../../../node_modules/@payloadcms/next/dist/utilities/getRequestTheme.js'
import { initReq } from '../../../node_modules/@payloadcms/next/dist/utilities/initReq.js'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = async ({ children }: Args) => {
  const {
    cookies,
    headers,
    languageCode,
    permissions,
    req,
    req: {
      payload: { config: payloadConfig },
    },
  } = await initReq({
    configPromise: config,
    importMap,
    key: 'RootLayout',
  })

  const theme = getRequestTheme({
    config: payloadConfig,
    cookies,
    headers,
  })

  const dir = (rtlLanguages as readonly string[]).includes(languageCode) ? 'RTL' : 'LTR'

  const languageOptions = Object.entries(payloadConfig.i18n.supportedLanguages || {}).reduce<
    Array<{ label: string; value: string }>
  >((acc, [language, languageConfig]) => {
    if (Object.keys(payloadConfig.i18n.supportedLanguages || {}).includes(language)) {
      const currentLanguageConfig = languageConfig as {
        translations: {
          general: {
            thisLanguage: string
          }
        }
      }

      acc.push({
        label: currentLanguageConfig.translations.general.thisLanguage,
        value: language,
      })
    }

    return acc
  }, [])

  async function switchLanguageServerAction(lang: string) {
    'use server'

    const cookiesStore = await nextCookies()
    cookiesStore.set({
      name: `${payloadConfig.cookiePrefix || 'payload'}-lng`,
      path: '/',
      value: lang,
    })
  }

  const navPrefs = await getNavPrefs(req)

  const clientConfig = getClientConfig({
    config: payloadConfig,
    i18n: req.i18n,
    importMap,
    user: req.user as any,
  })

  await applyLocaleFiltering({
    clientConfig,
    config: payloadConfig,
    req,
  })

  return (
    <>
      <style>{'@layer payload-default, payload;'}</style>
      <div
        className="payload-admin-shell"
        data-theme={theme}
        dir={dir}
        lang={languageCode}
        suppressHydrationWarning={payloadConfig?.admin?.suppressHydrationWarning ?? false}
      >
        <RootProvider
          config={clientConfig}
          dateFNSKey={req.i18n.dateFNSKey}
          fallbackLang={payloadConfig.i18n.fallbackLanguage}
          isNavOpen={navPrefs?.open ?? true}
          languageCode={languageCode}
          languageOptions={languageOptions as any}
          locale={req.locale ?? undefined}
          permissions={(req.user ? permissions : undefined) as any}
          serverFunction={serverFunction}
          switchLanguageServerAction={switchLanguageServerAction}
          theme={theme}
          translations={req.i18n.translations}
          user={req.user ?? null}
        >
          <ProgressBar />
          {Array.isArray(payloadConfig.admin?.components?.providers) &&
          payloadConfig.admin.components.providers.length > 0 ? (
            <NestProviders
              importMap={req.payload.importMap}
              providers={payloadConfig.admin.components.providers}
              serverProps={{
                i18n: req.i18n,
                payload: req.payload,
                permissions,
                user: req.user ?? undefined,
              }}
            >
              {children}
            </NestProviders>
          ) : (
            children
          )}
        </RootProvider>
        <div id="portal" />
      </div>
    </>
  )
}

export default Layout

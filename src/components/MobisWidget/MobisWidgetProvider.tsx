'use client'

import { useMemo, useRef, useState } from 'react'
import { inter } from '@/app/(frontend)/fonts'
import './styles.css'

import useHideWidgetMobile from './hooks/useHideWidgetMobile'
import { useMobisWidgetConfig } from './config/useConfig'
import type { MobisWidgetConfig } from './config/types'
import { bsModalHide, bsModalShow } from './shared/bootstrapModal'

import FloatingButtons from './widgets/FloatingButtons/FloatingButtons'
import StatusModal from './widgets/StatusRegistration/StatusModal'
import AssistantWidget from './widgets/ContactAssistant/AssistantWidget'

export default function MobisWidgetProvider({
  payloadGlobalUrl,
  overrideConfig,
}: {
  payloadGlobalUrl?: string
  overrideConfig?: MobisWidgetConfig
}) {
  const cfg = useMobisWidgetConfig(payloadGlobalUrl, overrideConfig)

  const [assistantOpen, setAssistantOpen] = useState(false)
  const statusModalRef = useRef<HTMLDivElement>(null)

  // Hide hanya di mobile saat section RegistrationForm masuk ke area bawah viewport
  const hideOnMobileFormSection = useHideWidgetMobile('RegistrationForm')

  const floating = useMemo(() => cfg?.floating ?? {}, [cfg])
  const status = useMemo(() => cfg?.statusWidget ?? {}, [cfg])
  const assistant = useMemo(() => cfg?.assistantWidget ?? {}, [cfg])

  const anchor = floating.registerAnchorId || 'RegistrationForm'
  const width = floating.buttonWidth ?? 225

  const areas = useMemo(
    () => (status.areas?.length ? status.areas : [{ label: 'Jabodetabek' }]).map((a) => a.label),
    [status.areas],
  )

  if (!cfg || cfg.enabled === false) return null

  return (
    <section className={`${inter.className} ${inter.variable} mobis-widget-root`}>
      <div
        className={`mobis-widget-floating-wrap ${
          hideOnMobileFormSection ? 'is-hidden-mobile' : ''
        }`}
      >
        <FloatingButtons
          width={width}
          showRegister={floating.showRegister ?? true}
          showStatus={floating.showStatus ?? true}
          showAssistant={floating.showAssistant ?? true}
          onRegister={() => {
            window.location.hash = `#${anchor}`
          }}
          onStatus={() => {
            if (statusModalRef.current) void bsModalShow(statusModalRef.current)
          }}
          onAssistant={() => {
            setAssistantOpen(true)
          }}
        />
      </div>

      <StatusModal
        title={status.title || 'Registration Mobis Check'}
        areas={areas}
        apiPath={status.apiPath || '/api/widget/status-check'}
        modalRef={statusModalRef}
        onClose={() => {
          if (statusModalRef.current) void bsModalHide(statusModalRef.current)
        }}
      />

      <AssistantWidget
        title={assistant.title || 'Assistants'}
        brandText={assistant.brandText || 'MOBIS'}
        greeting={assistant.greeting || 'Halo saya Assistant MOBIS, ada yang bisa saya bantu?'}
        apiBase={assistant.apiBase || '/api/assistant'}
        isOpen={assistantOpen}
        onCloseToButtons={() => setAssistantOpen(false)}
      />
    </section>
  )
}

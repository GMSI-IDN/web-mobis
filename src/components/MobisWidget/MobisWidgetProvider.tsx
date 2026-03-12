'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { inter } from '@/app/(frontend)/fonts'
import './styles.css'

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
  const [hideWidget, setHideWidget] = useState(false)

  const statusModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sections = ['form', 'footerSection']

    const elements = sections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el instanceof HTMLElement)

    if (!elements.length) {
      setHideWidget(false)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((entry) => entry.isIntersecting)
        setHideWidget(anyVisible)
      },
      { threshold: 0.25 },
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const floating = useMemo(() => cfg?.floating ?? {}, [cfg])
  const status = useMemo(() => cfg?.statusWidget ?? {}, [cfg])
  const assistant = useMemo(() => cfg?.assistantWidget ?? {}, [cfg])

  const anchor = floating.registerAnchorId || 'sectionForm'
  const width = floating.buttonWidth ?? 225

  const areas = useMemo(
    () => (status.areas?.length ? status.areas : [{ label: 'Jabodetabek' }]).map((a) => a.label),
    [status.areas],
  )

  if (!cfg || cfg.enabled === false) return null

  return (
    <section
      className={`${inter.className} ${inter.variable} mobis-widget-root ${
        hideWidget ? 'mobis-widget-hidden' : ''
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
          if (statusModalRef.current) bsModalShow(statusModalRef.current)
        }}
        onAssistant={() => setAssistantOpen(true)}
      />

      <StatusModal
        title={status.title || 'Registration Mobis Check'}
        areas={areas}
        apiPath={status.apiPath || '/api/widget/status-check'}
        modalRef={statusModalRef}
        onClose={() => {
          if (statusModalRef.current) bsModalHide(statusModalRef.current)
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

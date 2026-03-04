'use client'

import React, { useRef, useState } from 'react'
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
  const statusModalRef = useRef<HTMLDivElement>(null!)

  if (!cfg || cfg.enabled === false) return null

  const floating = cfg.floating ?? {}
  const status = cfg.statusWidget ?? {}
  const assistant = cfg.assistantWidget ?? {}

  const anchor = floating.registerAnchorId || 'sectionForm'
  const width = floating.buttonWidth ?? 225
  const areas = (status.areas?.length ? status.areas : [{ label: 'Jabodetabek' }]).map(
    (a) => a.label,
  )

  return (
    <section className="mobis-widget-root">
      <FloatingButtons
        width={width}
        showRegister={floating.showRegister ?? true}
        showStatus={floating.showStatus ?? true}
        showAssistant={floating.showAssistant ?? true}
        onRegister={() => (window.location.hash = `#${anchor}`)}
        onStatus={() => bsModalShow(statusModalRef.current)}
        onAssistant={() => setAssistantOpen(true)}
      />

      <StatusModal
        title={status.title || 'Registration Mobis Check'}
        areas={areas}
        apiPath={status.apiPath || '/api/widget/status-check'}
        modalRef={statusModalRef}
        onClose={() => bsModalHide(statusModalRef.current)}
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

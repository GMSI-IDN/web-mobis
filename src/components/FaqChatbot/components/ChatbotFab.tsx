'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Bot } from 'lucide-react'
import '@/components/MobisWidget/styles.css'

const AssistantWidget = dynamic(
  () => import('@/components/MobisWidget/widgets/ContactAssistant/AssistantWidget'),
  { ssr: false },
)

export default function ChatbotFab({
  isOpen,
  onToggle,
  appliedQuery,
}: {
  isOpen: boolean
  onToggle: (open: boolean) => void
  appliedQuery?: string
}) {
  return (
    <>
      <div className="mobis-faq-fab-wrap" style={{ display: isOpen ? 'none' : 'flex' }}>
        <button
          type="button"
          className="mobis-faq-fab-btn"
          aria-label="Preview MOBIS Assistant"
          onClick={() => onToggle(true)}
        >
          <Bot size={18} />
          <span>Test Assistant</span>
        </button>
      </div>

      <AssistantWidget
        title="MOBIS Assistant"
        brandText="MOBIS"
        greeting="Halo! Ada yang bisa saya bantu seputar layanan MOBIS?"
        apiBase="/api/assistant"
        isOpen={isOpen}
        onCloseToButtons={() => onToggle(false)}
        initialStage="chat"
        initialUser={{ name: 'Admin MOBIS', phone: '081234567890' }}
        appliedQuery={appliedQuery}
      />
    </>
  )
}

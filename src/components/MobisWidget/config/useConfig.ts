'use client'
import { useEffect, useState } from 'react'
import type { MobisWidgetConfig } from './types'
import { getJSON } from '../shared/fetcher'

const API_BASE = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE || '/api'

export function useMobisWidgetConfig(
  payloadGlobalUrl = `${API_BASE}/globals/mobisWidgets?depth=0`,
  override?: MobisWidgetConfig,
) {
  const [cfg, setCfg] = useState<MobisWidgetConfig | null>(override ?? null)

  useEffect(() => {
    if (override) return
    ;(async () => {
      try {
        const data = await getJSON<MobisWidgetConfig>(payloadGlobalUrl)
        setCfg(data)
      } catch {
        setCfg({
          enabled: true,
          floating: {
            registerAnchorId: 'sectionForm',
            showRegister: true,
            showStatus: true,
            showAssistant: true,
            buttonWidth: 225,
          },
          statusWidget: {
            title: 'Registration Mobis Check',
            areas: [{ label: 'Jabodetabek' }],
            apiPath: '/api/widget/status-check',
          },
          assistantWidget: {
            title: 'Assistants',
            brandText: 'MOBIS',
            greeting: 'Halo saya Assistant MOBIS, ada yang bisa saya bantu?',
            apiBase: '/api/assistant',
          },
        })
      }
    })()
  }, [override, payloadGlobalUrl])

  return cfg
}

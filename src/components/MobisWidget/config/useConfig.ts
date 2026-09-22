'use client'
import { useEffect, useState } from 'react'
import type { MobisWidgetConfig } from './types'
import { getJSON } from '../shared/fetcher'

const API_BASE = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE || '/api'

const DEFAULT_CONFIG: MobisWidgetConfig = {
  enabled: true,
  floating: {
    registerAnchorId: 'RegistrationForm',
    showRegister: false,
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
}

export function useMobisWidgetConfig(
  payloadGlobalUrl = `${API_BASE}/globals/mobisWidgets?depth=0`,
  override?: MobisWidgetConfig,
) {
  const [cfg, setCfg] = useState<MobisWidgetConfig>(override ?? DEFAULT_CONFIG)

  useEffect(() => {
    if (override) return
    let isMounted = true
    ;(async () => {
      try {
        const data = await getJSON<MobisWidgetConfig>(payloadGlobalUrl)
        if (isMounted && data) {
          setCfg(data)
        }
      } catch {
        // Fallback to DEFAULT_CONFIG already set
      }
    })()

    return () => {
      isMounted = false
    }
  }, [override, payloadGlobalUrl])

  return cfg
}


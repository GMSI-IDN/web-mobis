export type MobisWidgetConfig = {
  enabled?: boolean

  floating?: {
    registerAnchorId?: string
    showRegister?: boolean
    showStatus?: boolean
    showAssistant?: boolean
    buttonWidth?: number
  }

  statusWidget?: {
    title?: string
    areas?: { label: string }[]
    apiPath?: string // internal: /api/widget/status-check
  }

  assistantWidget?: {
    title?: string
    brandText?: string
    greeting?: string
    apiBase?: string // internal: /api/assistant
  }
}

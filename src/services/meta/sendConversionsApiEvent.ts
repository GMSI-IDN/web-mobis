import { createHash } from 'crypto'

type MetaUserDataInput = {
  phone?: string
  firstName?: string
  lastName?: string
  externalId?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbc?: string
  fbp?: string
}

type MetaCustomDataInput = {
  [key: string]: string | number | boolean | null | undefined
}

type SendMetaConversionsApiEventInput = {
  eventName: string
  eventId?: string
  eventTime?: number
  eventSourceUrl?: string
  userData?: MetaUserDataInput
  customData?: MetaCustomDataInput
  timeoutMs?: number
}

type SendMetaConversionsApiEventResult =
  | {
      sent: true
      status: number
      response: unknown
    }
  | {
      sent: false
      reason: string
      status?: number
      response?: unknown
    }

const HASH_REGEX = /^[a-f0-9]{64}$/i

function normalizeString(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizePhone(phone: unknown): string {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

function normalizeName(value: unknown): string {
  return normalizeString(value).toLowerCase().replace(/\s+/g, ' ')
}

function normalizeExternalId(value: unknown): string {
  return normalizeString(value).toLowerCase()
}

function isHash(value: string): boolean {
  return HASH_REGEX.test(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashOrReuse(value: string): string {
  const normalized = normalizeString(value).toLowerCase()
  if (!normalized) return ''
  if (isHash(normalized)) return normalized
  return sha256(normalized)
}

function pruneCustomData(input?: MetaCustomDataInput): MetaCustomDataInput | undefined {
  if (!input) return undefined

  const next: MetaCustomDataInput = {}
  for (const [key, value] of Object.entries(input)) {
    if (!key) continue
    if (value === undefined) continue
    next[key] = value
  }

  return Object.keys(next).length ? next : undefined
}

function getMetaConversionsConfig() {
  const pixelId = normalizeString(process.env.FACEBOOK_PIXEL_ID)
  const accessToken = normalizeString(process.env.FACEBOOK_CONVERSIONS_API_ACCESS_TOKEN)
  const apiVersion = normalizeString(process.env.FACEBOOK_GRAPH_API_VERSION || 'v23.0')
  const testEventCode = normalizeString(process.env.FACEBOOK_CONVERSIONS_TEST_EVENT_CODE)

  if (!pixelId || !accessToken) return null

  return {
    pixelId,
    accessToken,
    apiVersion,
    testEventCode: testEventCode || undefined,
  }
}

export async function sendMetaConversionsApiEvent(
  input: SendMetaConversionsApiEventInput,
): Promise<SendMetaConversionsApiEventResult> {
  const config = getMetaConversionsConfig()
  if (!config) {
    return {
      sent: false,
      reason: 'missing-config',
    }
  }

  const userDataInput = input.userData ?? {}
  const normalizedPhone = normalizePhone(userDataInput.phone)
  const normalizedFirstName = normalizeName(userDataInput.firstName)
  const normalizedLastName = normalizeName(userDataInput.lastName)
  const normalizedExternalId = normalizeExternalId(userDataInput.externalId)
  const normalizedFbc = normalizeString(userDataInput.fbc)
  const normalizedFbp = normalizeString(userDataInput.fbp)

  const userData: Record<string, unknown> = {
    client_ip_address: normalizeString(userDataInput.clientIpAddress) || undefined,
    client_user_agent: normalizeString(userDataInput.clientUserAgent) || undefined,
    fbc: normalizedFbc || undefined,
    fbp: normalizedFbp || undefined,
  }

  if (normalizedPhone) userData.ph = [hashOrReuse(normalizedPhone)]
  if (normalizedFirstName) userData.fn = [hashOrReuse(normalizedFirstName)]
  if (normalizedLastName) userData.ln = [hashOrReuse(normalizedLastName)]
  if (normalizedExternalId) userData.external_id = [hashOrReuse(normalizedExternalId)]

  const payload = {
    data: [
      {
        event_name: normalizeString(input.eventName) || 'CompleteRegistration',
        event_time: Number.isFinite(input.eventTime) ? input.eventTime : Math.floor(Date.now() / 1000),
        event_id: normalizeString(input.eventId) || undefined,
        action_source: 'website',
        event_source_url: normalizeString(input.eventSourceUrl) || undefined,
        user_data: userData,
        custom_data: pruneCustomData(input.customData),
      },
    ],
    test_event_code: config.testEventCode,
  }

  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`
  const timeoutMs = Math.max(500, Math.min(10_000, input.timeoutMs ?? 2500))
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${endpoint}?access_token=${encodeURIComponent(config.accessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = text
    }

    if (!res.ok) {
      return {
        sent: false,
        reason: 'meta-api-error',
        status: res.status,
        response: json,
      }
    }

    return {
      sent: true,
      status: res.status,
      response: json,
    }
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError' ? 'request-timeout' : 'request-failed'

    return {
      sent: false,
      reason,
      response: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timeoutHandle)
  }
}

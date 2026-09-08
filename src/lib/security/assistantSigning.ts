import { createHmac } from 'crypto'

const SECRET =
  process.env.MOBIS_ASSISTANT_SECRET

/**
 * Signs a JSON payload with HMAC-SHA256 for the Mobis Assistant webhook.
 *
 * IMPORTANT: The returned `rawBody` string MUST be used as the fetch body
 * verbatim — do NOT re-stringify it, otherwise the signature will mismatch.
 *
 * @param bodyObject - Plain JS object to be serialised and signed.
 * @returns `{ rawBody, headers }` — headers include Content-Type, X-Timestamp, X-Signature.
 */
export function signAssistantPayload(bodyObject: unknown): {
  rawBody: string
  headers: {
    'Content-Type': string
    'X-Timestamp': string
    'X-Signature': string
  }
} {
  const timestamp = Date.now().toString()
  const rawBody = JSON.stringify(bodyObject)
  const signature = createHmac('sha256', SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  return {
    rawBody,
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    },
  }
}

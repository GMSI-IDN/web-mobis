export function clampPhone(v: string) {
  return v.replace(/[^\d+]/g, '').slice(0, 18)
}
export function onlyDigits(v: string) {
  return (v || '').replace(/\D/g, '')
}
export function uid() {
  return crypto.randomUUID()
}
export function isThankYouMessage(message: string) {
  return [/ter[i]?ma\s*kasih/i, /makasih/i, /thanks/i, /thank\s*you/i, /thx/i].some((p) =>
    p.test(message),
  )
}
export function isNoMessage(message: string) {
  return [/tidak/i, /enggak/i, /nggak/i, /sudah/i, /udah/i, /no/i].some((p) => p.test(message))
}

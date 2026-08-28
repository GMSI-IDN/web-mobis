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
  const clean = message.toLowerCase().replace(/[^a-z]/g, '')
  return clean.includes('makasih') || clean.includes('thanks') || clean.includes('terimakasih')
}
export function isNoMessage(message: string) {
  // Hanya memotong jika pesan SANGAT pendek dan memang bermaksud menutup percakapan
  const clean = message.toLowerCase().trim().replace(/[^a-z]/g, '')
  return ['tidak', 'enggak', 'nggak', 'ga', 'gak', 'sudah', 'udah', 'no', 'cukup'].includes(clean)
}

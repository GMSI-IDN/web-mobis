import type { RegistrationPayload } from '@/types/registration'
import { sanitizeFreeText, assertNoSuspiciousMarkup } from '@/lib/security/sanitize'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

function fieldError(message: string, code: string, field: string): never {
  const err = new Error(message)
  ;(err as any).statusCode = 400
  ;(err as any).code = code
  ;(err as any).errors = { [field]: message }
  throw err
}

function optionalDateField(value: unknown, field: string, message: string): string | undefined {
  const trimmed = value ? String(value).trim() : ''
  if (!trimmed) return undefined
  if (!DATE_PATTERN.test(trimmed)) fieldError(message, 'INVALID_DATE_FORMAT', field)
  return trimmed
}

function optionalPhoneField(value: unknown, field: string, message: string): string | undefined {
  const digits = value ? onlyDigits(String(value)) : ''
  if (!digits) return undefined
  if (digits.length < 10 || digits.length > 15) fieldError(message, 'INVALID_PHONE_FORMAT', field)
  return digits
}

function optionalText(value: unknown, maxLen: number, field: string): string | undefined {
  if (!value) return undefined
  const sanitized = sanitizeFreeText(value, maxLen)
  if (!sanitized) return undefined
  assertNoSuspiciousMarkup(sanitized, field, 'Input mengandung karakter yang tidak diperbolehkan.')
  return sanitized
}

export function validateRegistrationPayload(body: any): RegistrationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const name = sanitizeFreeText(body.name, 100)
  const phone = onlyDigits(String(body.phone ?? ''))
  const ktpNumber = onlyDigits(String(body.ktpNumber ?? ''))

  if (!name || !phone || !ktpNumber) {
    const err = new Error('Field wajib belum lengkap (name/phone/ktpNumber).')
    ;(err as any).statusCode = 400
    ;(err as any).code = 'REQUIRED_FIELDS_MISSING'
    ;(err as any).errors = {
      name: !name ? 'Nama wajib diisi.' : undefined,
      phone: !phone ? 'Nomor handphone wajib diisi.' : undefined,
      ktpNumber: !ktpNumber ? 'Nomor KTP wajib diisi.' : undefined,
    }
    throw err
  }

  if (ktpNumber.length !== 16) {
    const err = new Error('Nomor KTP harus 16 digit.')
    ;(err as any).statusCode = 400
    ;(err as any).code = 'INVALID_KTP_NUMBER'
    ;(err as any).errors = {
      ktpNumber: 'Nomor KTP harus 16 digit.',
    }
    throw err
  }

  if (phone.length < 10 || phone.length > 15) {
    const err = new Error('Nomor handphone harus 10-15 digit.')
    ;(err as any).statusCode = 400
    ;(err as any).code = 'INVALID_PHONE_FORMAT'
    ;(err as any).errors = {
      phone: 'Nomor handphone harus 10-15 digit.',
    }
    throw err
  }

  assertNoSuspiciousMarkup(name, 'name', 'Nama mengandung karakter yang tidak diperbolehkan.')

  // optional fields (sanitized: trimmed, control chars stripped, length-capped,
  // rejected outright if they contain HTML/script markup)
  const payload: RegistrationPayload = {
    name,
    phone,
    ktpNumber,

    birthPlace: optionalText(body.birthPlace, 100, 'birthPlace'),
    birthDate: optionalDateField(body.birthDate, 'birthDate', 'Format tanggal lahir tidak valid.'),
    simNumber: optionalText(body.simNumber, 50, 'simNumber'),
    simType: optionalText(body.simType, 50, 'simType'),
    domicile: optionalText(body.domicile, 150, 'domicile'),
    simValidUntil: optionalDateField(
      body.simValidUntil,
      'simValidUntil',
      'Format masa berlaku SIM tidak valid.',
    ),
    currentAddress: optionalText(body.currentAddress, 300, 'currentAddress'),
    houseOwnership: optionalText(body.houseOwnership, 150, 'houseOwnership'),
    emergencyName: optionalText(body.emergencyName, 100, 'emergencyName'),
    emergencyPhone: optionalPhoneField(
      body.emergencyPhone,
      'emergencyPhone',
      'Nomor HP emergency harus 10-15 digit.',
    ),
    emergencyRelation: optionalText(body.emergencyRelation, 150, 'emergencyRelation'),
    driverApps: optionalText(body.driverApps, 150, 'driverApps'),
    activeAccountSelf: optionalText(body.activeAccountSelf, 150, 'activeAccountSelf'),
    driverExperience: optionalText(body.driverExperience, 150, 'driverExperience'),
    handoverLocation: optionalText(body.handoverLocation, 150, 'handoverLocation'),
    sourceInfo: optionalText(body.sourceInfo, 150, 'sourceInfo'),
    sourceDetail: optionalText(body.sourceDetail, 150, 'sourceDetail'),
    promoCode: optionalText(body.promoCode, 50, 'promoCode'),
  }

  return payload
}

import type { RegistrationPayload } from '@/types/registration'

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

export function validateRegistrationPayload(body: any): RegistrationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const name = String(body.name ?? '').trim()
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

  // optional fields (sanitize)
  const payload: RegistrationPayload = {
    name,
    phone,
    ktpNumber,

    birthPlace: body.birthPlace ? String(body.birthPlace).trim() : undefined,
    birthDate: body.birthDate ? String(body.birthDate).trim() : undefined,
    simNumber: body.simNumber ? String(body.simNumber).trim() : undefined,
    simType: body.simType ? String(body.simType).trim() : undefined,
    domicile: body.domicile ? String(body.domicile).trim() : undefined,
    simValidUntil: body.simValidUntil ? String(body.simValidUntil).trim() : undefined,
    currentAddress: body.currentAddress ? String(body.currentAddress).trim() : undefined,
    houseOwnership: body.houseOwnership ? String(body.houseOwnership).trim() : undefined,
    emergencyName: body.emergencyName ? String(body.emergencyName).trim() : undefined,
    emergencyPhone: body.emergencyPhone ? onlyDigits(String(body.emergencyPhone)) : undefined,
    emergencyRelation: body.emergencyRelation ? String(body.emergencyRelation).trim() : undefined,
    driverApps: body.driverApps ? String(body.driverApps).trim() : undefined,
    activeAccountSelf: body.activeAccountSelf ? String(body.activeAccountSelf).trim() : undefined,
    driverExperience: body.driverExperience ? String(body.driverExperience).trim() : undefined,
    handoverLocation: body.handoverLocation ? String(body.handoverLocation).trim() : undefined,
    sourceInfo: body.sourceInfo ? String(body.sourceInfo).trim() : undefined,
    sourceDetail: body.sourceDetail ? String(body.sourceDetail).trim() : undefined,
    promoCode: body.promoCode ? String(body.promoCode).trim() : undefined,
  }

  return payload
}

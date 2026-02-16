import type { RegistrationPayload } from '@/types/registration'

export function validateRegistrationPayload(body: any): RegistrationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const name = String(body.name ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const ktpNumber = String(body.ktpNumber ?? '').trim()

  if (!name || !phone || !ktpNumber) {
    const err = new Error('Field wajib belum lengkap (name/phone/ktpNumber).')
    ;(err as any).statusCode = 400
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
    emergencyPhone: body.emergencyPhone ? String(body.emergencyPhone).trim() : undefined,
    emergencyRelation: body.emergencyRelation ? String(body.emergencyRelation).trim() : undefined,
    driverApps: body.driverApps ? String(body.driverApps).trim() : undefined,
    activeAccountSelf: body.activeAccountSelf ? String(body.activeAccountSelf).trim() : undefined,
    driverExperience: body.driverExperience ? String(body.driverExperience).trim() : undefined,
    handoverLocation: body.handoverLocation ? String(body.handoverLocation).trim() : undefined,
    sourceInfo: body.sourceInfo ? String(body.sourceInfo).trim() : undefined,
    promoCode: body.promoCode ? String(body.promoCode).trim() : undefined,
  }

  return payload
}

'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { trackFacebookEvent, trackFacebookCustomEvent } from '@/utilities/pixelFacebook'

type Option = { label: string; value: string }

type Props = {
  title?: string
  submitLabel?: string
  successMessage?: string
  opts?: {
    sim?: Option[]
    dom?: Option[]
    house?: Option[]
    emRel?: Option[]
    drvExp?: Option[]
    handover?: Option[]
    onlineApp?: Option[]
    source?: Option[]
  }
}

type Status = 'idle' | 'loading' | 'success' | 'error'

type FormValues = {
  name: string
  birthPlace: string
  birthDate: string
  phone: string
  ktpNumber: string
  simNumber: string
  simType: string
  domicile: string
  simValidUntil: string
  currentAddress: string
  houseOwnership: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
  driverApps: string
  activeAccountSelf: string
  driverExperience: string
  handoverLocation: string
  sourceInfo: string
  promoCode: string
  agree: boolean
}

type FormErrors = Partial<Record<keyof FormValues, string>>
type TouchedState = Partial<Record<keyof FormValues, boolean>>

function normalizeOptions(input?: Option[]): Option[] {
  return (input ?? [])
    .map((o) => ({
      label: String(o?.label ?? '').trim(),
      value: String(o?.value ?? '').trim(),
    }))
    .filter((o) => o.label && o.value)
}

const handleBannerCTATrack = ({
  ctaText,
  ctaLink,
  targetType,
}: {
  ctaText: string
  ctaLink: string
  targetType: string
}) => {
  const payload = {
    content_name: ctaText,
    content_category: 'Banner CTA',
    section: 'Banner Carousel',
    target: ctaLink,
    target_type: targetType,
    page_path: window.location.pathname,
  }

  trackFacebookEvent('Leads', payload)

  trackFacebookCustomEvent('ClickBannerCarouselCTA', {
    button_text: ctaText,
    section: 'Banner Carousel',
    target: ctaLink,
    target_type: targetType,
    page_path: window.location.pathname,
  })
}

function SelectField({
  name,
  required,
  placeholder,
  options,
  className,
  value,
  onChange,
  isInvalid,
}: {
  name: string
  required?: boolean
  placeholder: string
  options: Option[]
  className?: string
  value: string
  onChange: (value: string) => void
  isInvalid?: boolean
}) {
  return (
    <select
      name={name}
      className={`${className ?? 'form-select form-select-sm'} ${isInvalid ? 'is-invalid' : ''}`}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt, idx) => (
        <option key={`${name}-${opt.value}-${idx}`} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export const RegistrationForm: React.FC<Props> = ({ title, submitLabel, successMessage, opts }) => {
  const [status, setStatus] = useState<Status>('idle')

  const initialValues: FormValues = {
    name: '',
    birthPlace: '',
    birthDate: '',
    phone: '',
    ktpNumber: '',
    simNumber: '',
    simType: '',
    domicile: '',
    simValidUntil: '',
    currentAddress: '',
    houseOwnership: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    driverApps: '',
    activeAccountSelf: '',
    driverExperience: '',
    handoverLocation: '',
    sourceInfo: '',
    promoCode: '',
    agree: false,
  }

  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedState>({})

  const timersRef = useRef<Partial<Record<keyof FormValues, ReturnType<typeof setTimeout>>>>({})

  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  const defaults = useMemo(
    () => ({
      sim: [
        { label: 'SIM A', value: 'A' },
        { label: 'SIM B1', value: 'B1' },
        { label: 'SIM B2', value: 'B2' },
        { label: 'SIM C', value: 'C' },
      ],
      dom: [
        { label: 'Jabodetabek', value: 'jabodetabek' },
        { label: 'Surabaya', value: 'surabaya' },
        { label: 'Sidoarjo', value: 'sidoarjo' },
        { label: 'Gresik', value: 'gresik' },
        { label: 'Bali', value: 'bali' },
      ],
      house: [
        { label: 'Milik sendiri', value: 'milikSendiri' },
        { label: 'Kontrak', value: 'kontrak' },
        { label: 'Kos', value: 'kos' },
        { label: 'Rumah keluarga', value: 'keluarga' },
      ],
      emRel: [
        { label: 'Orang tua', value: 'orangTua' },
        { label: 'Pasangan', value: 'pasangan' },
        { label: 'Saudara', value: 'saudara' },
        { label: 'Teman', value: 'teman' },
        { label: 'Lainnya', value: 'lainnya' },
      ],
      drvExp: [
        { label: '< 3 bulan', value: 'lt3bln' },
        { label: '3 - 6 bulan', value: '3-6bln' },
        { label: '6 - 12 bulan', value: '6-12bln' },
        { label: '> 1 tahun', value: 'gt1th' },
      ],
      handover: [{ label: 'Pool MOBIS', value: 'pool' }],
      onlineApp: [
        { label: 'Gojek', value: 'gojek' },
        { label: 'Grab', value: 'grab' },
        { label: 'Maxim', value: 'maxim' },
        { label: 'Lainnya', value: 'lainnya' },
      ],
      source: [
        { label: 'Instagram', value: 'ig' },
        { label: 'Facebook', value: 'fb' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'Teman/Referensi', value: 'teman' },
        { label: 'Google', value: 'google' },
        { label: 'Lainnya', value: 'lainnya' },
      ],
    }),
    [],
  )

  const SIM_OPTS = (() => {
    const v = normalizeOptions(opts?.sim)
    return v.length ? v : defaults.sim
  })()

  const DOMICILE_OPTS = (() => {
    const v = normalizeOptions(opts?.dom)
    return v.length ? v : defaults.dom
  })()

  const HOUSE_OPTS = (() => {
    const v = normalizeOptions(opts?.house)
    return v.length ? v : defaults.house
  })()

  const EMERGENCY_REL_OPTS = (() => {
    const v = normalizeOptions(opts?.emRel)
    return v.length ? v : defaults.emRel
  })()

  const EXP_OPTS = (() => {
    const v = normalizeOptions(opts?.drvExp)
    return v.length ? v : defaults.drvExp
  })()

  const HANDOVER_OPTS = (() => {
    const v = normalizeOptions(opts?.handover)
    return v.length ? v : defaults.handover
  })()

  const ONLINE_APP_OPTS = (() => {
    const v = normalizeOptions(opts?.onlineApp)
    return v.length ? v : defaults.onlineApp
  })()

  const SOURCE_OPTS = (() => {
    const v = normalizeOptions(opts?.source)
    return v.length ? v : defaults.source
  })()

  function onlyDigits(value: string) {
    return value.replace(/\D/g, '')
  }

  function validateField(
    name: keyof FormValues,
    value: string | boolean,
    allValues: FormValues,
  ): string {
    switch (name) {
      case 'name':
        if (!String(value).trim()) return 'Nama wajib diisi.'
        if (String(value).trim().length < 2) return 'Nama minimal 2 karakter.'
        return ''

      case 'birthPlace':
        if (!String(value).trim()) return 'Tempat lahir wajib diisi.'
        return ''

      case 'birthDate':
        if (!String(value).trim()) return 'Tanggal lahir wajib diisi.'
        return ''

      case 'phone': {
        const v = onlyDigits(String(value))
        if (!v) return 'Nomor handphone wajib diisi.'
        if (v.length < 10) return 'Nomor handphone minimal 10 digit.'
        if (v.length > 15) return 'Nomor handphone maksimal 15 digit.'
        return ''
      }

      case 'ktpNumber': {
        const v = onlyDigits(String(value))
        if (!v) return 'Nomor KTP wajib diisi.'
        if (v.length !== 16) return 'Nomor KTP harus 16 digit.'
        return ''
      }

      case 'simNumber':
        if (!String(value).trim()) return 'Nomor SIM wajib diisi.'
        return ''

      case 'simType':
        if (!String(value).trim()) return 'Jenis SIM wajib dipilih.'
        return ''

      case 'domicile':
        if (!String(value).trim()) return 'Domisili wajib dipilih.'
        return ''

      case 'simValidUntil':
        if (!String(value).trim()) return 'Masa berlaku SIM wajib diisi.'
        return ''

      case 'currentAddress':
        if (!String(value).trim()) return 'Alamat lengkap wajib diisi.'
        if (String(value).trim().length < 10) return 'Alamat terlalu singkat.'
        return ''

      case 'houseOwnership':
        if (!String(value).trim()) return 'Status kepemilikan rumah wajib dipilih.'
        return ''

      case 'emergencyName':
        if (!String(value).trim()) return 'Nama emergency wajib diisi.'
        return ''

      case 'emergencyPhone': {
        const v = onlyDigits(String(value))
        if (!v) return 'Nomor HP emergency wajib diisi.'
        if (v.length < 10) return 'Nomor HP emergency minimal 10 digit.'
        if (v.length > 15) return 'Nomor HP emergency maksimal 15 digit.'
        if (v === onlyDigits(allValues.phone)) {
          return 'Nomor emergency tidak boleh sama dengan nomor utama.'
        }
        return ''
      }

      case 'emergencyRelation':
        if (!String(value).trim()) return 'Hubungan emergency wajib dipilih.'
        return ''

      case 'driverApps':
        if (!String(value).trim()) return 'Aplikasi driver online wajib dipilih.'
        return ''

      case 'activeAccountSelf':
        if (!String(value).trim()) return 'Pilih salah satu status akun driver online.'
        return ''

      case 'driverExperience':
        if (!String(value).trim()) return 'Lama bekerja wajib dipilih.'
        return ''

      case 'handoverLocation':
        if (!String(value).trim()) return 'Lokasi serah terima wajib dipilih.'
        return ''

      case 'sourceInfo':
        if (!String(value).trim()) return 'Sumber informasi wajib dipilih.'
        return ''

      case 'agree':
        if (!value) return 'Anda harus menyetujui pernyataan ini.'
        return ''

      case 'promoCode':
        return ''

      default:
        return ''
    }
  }

  function validateForm(currentValues: FormValues): FormErrors {
    const nextErrors: FormErrors = {}

    ;(Object.keys(currentValues) as Array<keyof FormValues>).forEach((key) => {
      if (key === 'promoCode') return
      const error = validateField(key, currentValues[key], currentValues)
      if (error) nextErrors[key] = error
    })

    return nextErrors
  }

  function scheduleValidation<K extends keyof FormValues>(
    field: K,
    nextValue: FormValues[K],
    nextValues: FormValues,
  ) {
    if (timersRef.current[field]) {
      clearTimeout(timersRef.current[field]!)
    }

    timersRef.current[field] = setTimeout(() => {
      setTouched((prev) => ({ ...prev, [field]: true }))
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, nextValue, nextValues),
      }))
    }, 1000)
  }

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    let nextValue = value

    if (field === 'phone' || field === 'ktpNumber' || field === 'emergencyPhone') {
      nextValue = onlyDigits(String(value)) as FormValues[K]
    }

    const nextValues = { ...values, [field]: nextValue }
    setValues(nextValues)
    setErrors((prev) => ({ ...prev, [field]: '' }))

    if (field !== 'promoCode') {
      scheduleValidation(field, nextValue, nextValues)
    }

    if (field === 'phone' && touched.emergencyPhone) {
      setErrors((prev) => ({ ...prev, emergencyPhone: '' }))
      scheduleValidation('emergencyPhone', nextValues.emergencyPhone, nextValues)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextErrors = validateForm(values)
    setErrors(nextErrors)

    const allTouched: TouchedState = {}
    ;(Object.keys(values) as Array<keyof FormValues>).forEach((key) => {
      if (key !== 'promoCode') allTouched[key] = true
    })
    setTouched(allTouched)

    if (Object.keys(nextErrors).length > 0) return

    setStatus('loading')

    try {
      const payload = {
        ...values,
        phone: onlyDigits(values.phone),
        ktpNumber: onlyDigits(values.ktpNumber),
        emergencyPhone: onlyDigits(values.emergencyPhone),
        agree: values.agree ? '1' : '0',
      }

      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.message || 'Gagal')

      setStatus('success')
      setValues(initialValues)
      setErrors({})
      setTouched({})
    } catch {
      setStatus('error')
    }
  }

  const labelCol = 'col-12 col-md-4'
  const fieldCol = 'col-12 col-md-8'

  return (
    <section id="RegistrationForm" className="bg-gradient-form hide-widget-area">
      <div className="container py-4">
        <div className="card border-0 shadow-sm mx-auto reg-form-card" style={{ maxWidth: 560 }}>
          <div className="card-body p-3 p-md-4">
            <h3 className="h6 fw-bold text-center mb-3">{title ?? 'Form Pendaftaran'}</h3>

            <form onSubmit={onSubmit} className="reg-form" noValidate>
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Nama</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="name"
                    className={`form-control form-control-sm ${touched.name && errors.name ? 'is-invalid' : ''}`}
                    placeholder="Ketik nama"
                    value={values.name}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                  {touched.name && errors.name ? (
                    <div className="invalid-feedback d-block">{errors.name}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Tempat &amp; Tanggal Lahir</label>
                </div>
                <div className={fieldCol}>
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <input
                        name="birthPlace"
                        className={`form-control form-control-sm ${touched.birthPlace && errors.birthPlace ? 'is-invalid' : ''}`}
                        placeholder="Tempat"
                        value={values.birthPlace}
                        onChange={(e) => setField('birthPlace', e.target.value)}
                      />
                      {touched.birthPlace && errors.birthPlace ? (
                        <div className="invalid-feedback d-block">{errors.birthPlace}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-sm-6">
                      <input
                        name="birthDate"
                        type="date"
                        className={`form-control form-control-sm ${touched.birthDate && errors.birthDate ? 'is-invalid' : ''}`}
                        value={values.birthDate}
                        onChange={(e) => setField('birthDate', e.target.value)}
                      />
                      {touched.birthDate && errors.birthDate ? (
                        <div className="invalid-feedback d-block">{errors.birthDate}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">No. HP (Whatsapp)</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="phone"
                    className={`form-control form-control-sm ${touched.phone && errors.phone ? 'is-invalid' : ''}`}
                    placeholder="Ketik nomor handphone"
                    inputMode="tel"
                    value={values.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                  {touched.phone && errors.phone ? (
                    <div className="invalid-feedback d-block">{errors.phone}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Nomor KTP</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="ktpNumber"
                    className={`form-control form-control-sm ${touched.ktpNumber && errors.ktpNumber ? 'is-invalid' : ''}`}
                    placeholder="Ketik nomor KTP"
                    inputMode="numeric"
                    maxLength={16}
                    value={values.ktpNumber}
                    onChange={(e) => setField('ktpNumber', e.target.value)}
                  />
                  {touched.ktpNumber && errors.ktpNumber ? (
                    <div className="invalid-feedback d-block">{errors.ktpNumber}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">SIM</label>
                </div>
                <div className={fieldCol}>
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <input
                        name="simNumber"
                        className={`form-control form-control-sm ${touched.simNumber && errors.simNumber ? 'is-invalid' : ''}`}
                        placeholder="Nomor SIM"
                        value={values.simNumber}
                        onChange={(e) => setField('simNumber', e.target.value)}
                      />
                      {touched.simNumber && errors.simNumber ? (
                        <div className="invalid-feedback d-block">{errors.simNumber}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-sm-6">
                      <SelectField
                        name="simType"
                        placeholder="Jenis SIM"
                        options={SIM_OPTS}
                        value={values.simType}
                        onChange={(value) => setField('simType', value)}
                        isInvalid={!!(touched.simType && errors.simType)}
                      />
                      {touched.simType && errors.simType ? (
                        <div className="invalid-feedback d-block">{errors.simType}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-sm-6">
                      <SelectField
                        name="domicile"
                        placeholder="Pilih domisili"
                        options={DOMICILE_OPTS}
                        value={values.domicile}
                        onChange={(value) => setField('domicile', value)}
                        isInvalid={!!(touched.domicile && errors.domicile)}
                      />
                      {touched.domicile && errors.domicile ? (
                        <div className="invalid-feedback d-block">{errors.domicile}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-sm-6">
                      <input
                        name="simValidUntil"
                        type="date"
                        className={`form-control form-control-sm ${touched.simValidUntil && errors.simValidUntil ? 'is-invalid' : ''}`}
                        value={values.simValidUntil}
                        onChange={(e) => setField('simValidUntil', e.target.value)}
                      />
                      {touched.simValidUntil && errors.simValidUntil ? (
                        <div className="invalid-feedback d-block">{errors.simValidUntil}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Alamat Lengkap Saat Ini</label>
                </div>
                <div className={fieldCol}>
                  <textarea
                    name="currentAddress"
                    className={`form-control form-control-sm ${touched.currentAddress && errors.currentAddress ? 'is-invalid' : ''}`}
                    placeholder="Ketik alamat saat ini"
                    rows={3}
                    value={values.currentAddress}
                    onChange={(e) => setField('currentAddress', e.target.value)}
                  />
                  {touched.currentAddress && errors.currentAddress ? (
                    <div className="invalid-feedback d-block">{errors.currentAddress}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Status Kepemilikan Rumah</label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="houseOwnership"
                    placeholder="- Pilih -"
                    options={HOUSE_OPTS}
                    value={values.houseOwnership}
                    onChange={(value) => setField('houseOwnership', value)}
                    isInvalid={!!(touched.houseOwnership && errors.houseOwnership)}
                  />
                  {touched.houseOwnership && errors.houseOwnership ? (
                    <div className="invalid-feedback d-block">{errors.houseOwnership}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Nama &amp; No. HP Emergency</label>
                </div>
                <div className={fieldCol}>
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <input
                        name="emergencyName"
                        className={`form-control form-control-sm ${touched.emergencyName && errors.emergencyName ? 'is-invalid' : ''}`}
                        placeholder="Ketik nama"
                        value={values.emergencyName}
                        onChange={(e) => setField('emergencyName', e.target.value)}
                      />
                      {touched.emergencyName && errors.emergencyName ? (
                        <div className="invalid-feedback d-block">{errors.emergencyName}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-sm-6">
                      <input
                        name="emergencyPhone"
                        className={`form-control form-control-sm ${touched.emergencyPhone && errors.emergencyPhone ? 'is-invalid' : ''}`}
                        placeholder="Ketik nomor HP"
                        inputMode="tel"
                        value={values.emergencyPhone}
                        onChange={(e) => setField('emergencyPhone', e.target.value)}
                      />
                      {touched.emergencyPhone && errors.emergencyPhone ? (
                        <div className="invalid-feedback d-block">{errors.emergencyPhone}</div>
                      ) : null}
                    </div>

                    <div className="col-12">
                      <SelectField
                        name="emergencyRelation"
                        placeholder="Hubungan - Pilih -"
                        options={EMERGENCY_REL_OPTS}
                        value={values.emergencyRelation}
                        onChange={(value) => setField('emergencyRelation', value)}
                        isInvalid={!!(touched.emergencyRelation && errors.emergencyRelation)}
                      />
                      {touched.emergencyRelation && errors.emergencyRelation ? (
                        <div className="invalid-feedback d-block">{errors.emergencyRelation}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Aplikasi Driver Online</label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="driverApps"
                    placeholder="Pilih aplikasi driver online"
                    options={ONLINE_APP_OPTS}
                    value={values.driverApps}
                    onChange={(value) => setField('driverApps', value)}
                    isInvalid={!!(touched.driverApps && errors.driverApps)}
                  />
                  {touched.driverApps && errors.driverApps ? (
                    <div className="invalid-feedback d-block">{errors.driverApps}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">
                    Akun driver online aktif atas nama diri sendiri?
                  </label>
                </div>
                <div className={fieldCol}>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="form-check">
                      <input
                        className={`form-check-input ${touched.activeAccountSelf && errors.activeAccountSelf ? 'is-invalid' : ''}`}
                        type="radio"
                        name="activeAccountSelf"
                        value="ya"
                        id={`acc-ya-${uid}`}
                        checked={values.activeAccountSelf === 'ya'}
                        onChange={(e) => setField('activeAccountSelf', e.target.value)}
                      />
                      <label className="form-check-label small" htmlFor={`acc-ya-${uid}`}>
                        Ya
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className={`form-check-input ${touched.activeAccountSelf && errors.activeAccountSelf ? 'is-invalid' : ''}`}
                        type="radio"
                        name="activeAccountSelf"
                        value="tidak"
                        id={`acc-tidak-${uid}`}
                        checked={values.activeAccountSelf === 'tidak'}
                        onChange={(e) => setField('activeAccountSelf', e.target.value)}
                      />
                      <label className="form-check-label small" htmlFor={`acc-tidak-${uid}`}>
                        Tidak
                      </label>
                    </div>
                  </div>
                  {touched.activeAccountSelf && errors.activeAccountSelf ? (
                    <div className="invalid-feedback d-block">{errors.activeAccountSelf}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">
                    Sudah berapa lama bekerja sebagai driver online?
                  </label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="driverExperience"
                    placeholder="Pilih jangka waktu"
                    options={EXP_OPTS}
                    value={values.driverExperience}
                    onChange={(value) => setField('driverExperience', value)}
                    isInvalid={!!(touched.driverExperience && errors.driverExperience)}
                  />
                  {touched.driverExperience && errors.driverExperience ? (
                    <div className="invalid-feedback d-block">{errors.driverExperience}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Lokasi serah terima unit</label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="handoverLocation"
                    placeholder="Pilih preferensi"
                    options={HANDOVER_OPTS}
                    value={values.handoverLocation}
                    onChange={(value) => setField('handoverLocation', value)}
                    isInvalid={!!(touched.handoverLocation && errors.handoverLocation)}
                  />
                  {touched.handoverLocation && errors.handoverLocation ? (
                    <div className="invalid-feedback d-block">{errors.handoverLocation}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Mengetahui Informasi dari</label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="sourceInfo"
                    placeholder="Pilih sumber informasi"
                    options={SOURCE_OPTS}
                    value={values.sourceInfo}
                    onChange={(value) => setField('sourceInfo', value)}
                    isInvalid={!!(touched.sourceInfo && errors.sourceInfo)}
                  />
                  {touched.sourceInfo && errors.sourceInfo ? (
                    <div className="invalid-feedback d-block">{errors.sourceInfo}</div>
                  ) : null}
                </div>
              </div>

              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Promo Code</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="promoCode"
                    className="form-control form-control-sm"
                    placeholder="Masukkan promo code yang dimiliki"
                    value={values.promoCode}
                    onChange={(e) => setField('promoCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="form-check">
                  <input
                    className={`form-check-input ${touched.agree && errors.agree ? 'is-invalid' : ''}`}
                    type="checkbox"
                    value="1"
                    id={`agree-${uid}`}
                    name="agree"
                    checked={values.agree}
                    onChange={(e) => {
                      const checked = e.target.checked
                      const nextValues = { ...values, agree: checked }

                      setValues(nextValues)
                      setErrors((prev) => ({ ...prev, agree: '' }))

                      if (timersRef.current.agree) {
                        clearTimeout(timersRef.current.agree)
                      }

                      timersRef.current.agree = setTimeout(() => {
                        setTouched((prev) => ({ ...prev, agree: true }))
                        setErrors((prev) => ({
                          ...prev,
                          agree: validateField('agree', checked, nextValues),
                        }))
                      }, 1000)
                    }}
                  />
                  <label className="form-check-label small" htmlFor={`agree-${uid}`}>
                    Data yang Saya isi adalah benar dan Saya bersedia untuk dihubungi oleh pihak
                    Mobis untuk memproses pendaftaran mobil sewa lebih lanjut.
                  </label>
                  {touched.agree && errors.agree ? (
                    <div className="invalid-feedback d-block">{errors.agree}</div>
                  ) : null}
                </div>

                <p className="small text-muted mt-2 mb-0">
                  Kami berkomitmen untuk mengelola informasi pribadi Anda sesuai dengan prosedur
                  yang berlaku.
                </p>
              </div>

              <div className="mt-3 button-center">
                <button
                  type="submit"
                  className="btn btn-register w-100 rounded-pill"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Mengirim...' : (submitLabel ?? 'Kirim')}
                </button>
              </div>

              {status === 'success' ? (
                <div className="alert alert-success mt-3 mb-0">
                  {successMessage ?? 'Terkirim. Terima kasih!'}
                </div>
              ) : null}

              {status === 'error' ? (
                <div className="alert alert-danger mt-3 mb-0">Gagal mengirim. Coba lagi.</div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

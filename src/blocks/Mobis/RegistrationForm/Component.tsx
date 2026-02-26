'use client'

import React, { useId, useMemo, useState } from 'react'

type Option = { label: string; value: string }

type Props = {
  title?: string
  submitLabel?: string
  successMessage?: string

  // ✅ SESUAI Config.ts: options dari Payload Admin ada di `opts`
  opts?: {
    sim?: Option[]
    dom?: Option[]
    house?: Option[]
    emRel?: Option[]
    drvExp?: Option[]
    handover?: Option[]
    source?: Option[]
  }
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function normalizeOptions(input?: Option[]): Option[] {
  return (input ?? [])
    .map((o) => ({
      label: String(o?.label ?? '').trim(),
      value: String(o?.value ?? '').trim(),
    }))
    .filter((o) => o.label && o.value)
}

function SelectField({
  name,
  required,
  placeholder,
  options,
  className,
}: {
  name: string
  required?: boolean
  placeholder: string
  options: Option[]
  className?: string
}) {
  return (
    <select
      name={name}
      className={className ?? 'form-select form-select-sm'}
      required={required}
      defaultValue=""
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

  // ✅ id unik agar tidak bentrok jika block dipakai lebih dari 1 kali
  const uid = useId().replace(/:/g, '')

  // ✅ fallback default jika admin belum isi
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

  // ✅ ambil dari Admin dulu, kalau kosong fallback ke default
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

  const SOURCE_OPTS = (() => {
    const v = normalizeOptions(opts?.source)
    return v.length ? v : defaults.source
  })()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')

    try {
      const form = e.currentTarget
      const data = Object.fromEntries(new FormData(form).entries())

      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.message || 'Gagal')

      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  // helper: label col (desktop) vs stack (mobile)
  const labelCol = 'col-12 col-md-4'
  const fieldCol = 'col-12 col-md-8'

  return (
    <section id="form" className="bg-gradient-form">
      <div className="container py-4">
        <div className="card border-0 shadow-sm mx-auto reg-form-card" style={{ maxWidth: 560 }}>
          <div className="card-body p-3 p-md-4">
            <h3 className="h6 fw-bold text-center mb-3">{title ?? 'Form Pendaftaran'}</h3>

            <form onSubmit={onSubmit} className="reg-form">
              {/* Nama */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Nama</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="name"
                    className="form-control form-control-sm"
                    placeholder="Ketik nama"
                    required
                  />
                </div>
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Tempat &amp; Tanggal Lahir</label>
                </div>
                <div className={fieldCol}>
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <input
                        name="birthPlace"
                        className="form-control form-control-sm"
                        placeholder="Tempat"
                        required
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        name="birthDate"
                        type="date"
                        className="form-control form-control-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* No. HP */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">No. HP (Whatsapp)</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="phone"
                    className="form-control form-control-sm"
                    placeholder="Ketik nomor handphone"
                    inputMode="tel"
                    required
                  />
                </div>
              </div>

              {/* Nomor KTP */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Nomor KTP</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="ktpNumber"
                    className="form-control form-control-sm"
                    placeholder="Ketik nomor KTP"
                    required
                  />
                </div>
              </div>

              {/* SIM */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">SIM</label>
                </div>
                <div className={fieldCol}>
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <input
                        name="simNumber"
                        className="form-control form-control-sm"
                        placeholder="Nomor SIM"
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <SelectField
                        name="simType"
                        required
                        placeholder="Jenis SIM"
                        options={SIM_OPTS}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <SelectField
                        name="domicile"
                        required
                        placeholder="Pilih domisili"
                        options={DOMICILE_OPTS}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <input
                        name="simValidUntil"
                        type="date"
                        className="form-control form-control-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div className="row g-2 mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Alamat Lengkap Saat Ini</label>
                </div>
                <div className={fieldCol}>
                  <textarea
                    name="currentAddress"
                    className="form-control form-control-sm"
                    placeholder="Ketik alamat saat ini"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Status Kepemilikan Rumah */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Status Kepemilikan Rumah</label>
                </div>
                <div className={fieldCol}>
                  <SelectField name="houseOwnership" placeholder="- Pilih -" options={HOUSE_OPTS} />
                </div>
              </div>

              {/* Emergency */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Nama &amp; No. HP Emergency</label>
                </div>
                <div className={fieldCol}>
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <input
                        name="emergencyName"
                        className="form-control form-control-sm"
                        placeholder="Ketik nama"
                        required
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        name="emergencyPhone"
                        className="form-control form-control-sm"
                        placeholder="Ketik nomor HP"
                        inputMode="tel"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <SelectField
                        name="emergencyRelation"
                        placeholder="Hubungan - Pilih -"
                        options={EMERGENCY_REL_OPTS}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aplikasi driver */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">
                    Apa Aplikasi Driver Online Anda
                  </label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="driverApps"
                    className="form-control form-control-sm"
                    placeholder="Pilih aplikasi yang Anda punya"
                  />
                </div>
              </div>

              {/* Akun aktif atas nama sendiri */}
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
                        className="form-check-input"
                        type="radio"
                        name="activeAccountSelf"
                        value="ya"
                        id={`acc-ya-${uid}`}
                        required
                      />
                      <label className="form-check-label small" htmlFor={`acc-ya-${uid}`}>
                        Ya
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="activeAccountSelf"
                        value="tidak"
                        id={`acc-tidak-${uid}`}
                        required
                      />
                      <label className="form-check-label small" htmlFor={`acc-tidak-${uid}`}>
                        Tidak
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lama bekerja */}
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
                  />
                </div>
              </div>

              {/* Lokasi serah terima */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Lokasi serah terima unit</label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="handoverLocation"
                    placeholder="Pilih Preferensi"
                    options={HANDOVER_OPTS}
                  />
                </div>
              </div>

              {/* Info dari */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Mengetahui Informasi dari</label>
                </div>
                <div className={fieldCol}>
                  <SelectField
                    name="sourceInfo"
                    placeholder="Pilih sumber informasi"
                    options={SOURCE_OPTS}
                  />
                </div>
              </div>

              {/* Promo code */}
              <div className="row g-2 align-items-md-center mb-2">
                <div className={labelCol}>
                  <label className="form-label reg-label mb-0">Promo Code</label>
                </div>
                <div className={fieldCol}>
                  <input
                    name="promoCode"
                    className="form-control form-control-sm"
                    placeholder="Masukkan promo code yang dimiliki"
                  />
                </div>
              </div>

              {/* Persetujuan */}
              <div className="mt-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value="1"
                    id={`agree-${uid}`}
                    name="agree"
                    required
                  />
                  <label className="form-check-label small" htmlFor={`agree-${uid}`}>
                    Data yang Saya isi adalah benar dan Saya bersedia untuk dihubungi oleh pihak
                    Mobis untuk memproses pendaftaran mobil sewa lebih lanjut.
                  </label>
                </div>

                <p className="small text-muted mt-2 mb-0">
                  Kami berkomitmen untuk mengelola informasi pribadi Anda sesuai dengan prosedur
                  yang berlaku.
                </p>
              </div>

              {/* Submit */}
              <div className="mt-3 button-center">
                <button
                  className="btn btn-register w-100 rounded-pill"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Mengirim...' : (submitLabel ?? 'Kirim')}
                </button>
              </div>

              {/* Alert */}
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

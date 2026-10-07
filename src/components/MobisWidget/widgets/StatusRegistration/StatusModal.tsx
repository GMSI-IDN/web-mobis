'use client'
import React, { useMemo, useState, useRef, useEffect } from 'react'
import { CheckCircle2, Hourglass, XCircle, Circle, ChevronDown, Check } from 'lucide-react'
import { onlyDigits } from '../../shared/helpers'
import { postJSON } from '../../shared/fetcher'
import type { StatusResponse, StatusStep } from './types'

function getStepTextClass(status: StatusStep['status']) {
  if (status === 'success') return 'text-success fw-bold'
  if (status === 'in-progress') return 'mobis-gold fw-bold'
  if (status === 'failed') return 'text-danger fw-bold'
  return 'text-secondary'
}

function StepIcon({ status }: { status: StatusStep['status'] }) {
  if (status === 'success') {
    return <CheckCircle2 className="text-success fs-4 fw-bold" size={24} />
  }
  if (status === 'in-progress') {
    return <Hourglass className="mobis-gold fs-4 fw-bold" size={24} />
  }
  if (status === 'failed') {
    return <XCircle className="text-danger fs-4 fw-bold" size={24} />
  }
  return <Circle className="text-secondary fs-4" size={24} />
}

function sanitizeAlertMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return ''

  const lower = msg.toLowerCase()
  const hasSocialOrContact =
    lower.includes('hubungi kami') ||
    lower.includes('informasi lebih lanjut') ||
    lower.includes('instagram') ||
    lower.includes('facebook') ||
    lower.includes('tiktok') ||
    lower.includes('globalmobilityservice')

  if (hasSocialOrContact) {
    let prefixText = ''
    const matchPrefix = msg.match(/^(?:<p[^>]*>)?(Data\s+[^.<]+[.!?])/i)
    if (matchPrefix && matchPrefix[1]) {
      prefixText = `<div class="status-alert-prefix">${matchPrefix[1]}</div>`
    }

    return `
${prefixText}
<div class="status-contact-card">
  <div class="status-contact-header">
    <svg class="status-contact-icon-info" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
    <span>Informasi lebih lanjut silakan hubungi kami melalui:</span>
  </div>
  <div class="status-contact-grid">
    <a href="https://www.instagram.com/rentalmobis" target="_blank" rel="noopener noreferrer" class="status-contact-btn status-ig-btn">
      <img src="/mobis/img/instagram-color.svg" alt="Instagram" width="20" height="20" />
      <span class="status-contact-label">@rentalmobis</span>
    </a>
    <a href="https://www.facebook.com/rentalmobis" target="_blank" rel="noopener noreferrer" class="status-contact-btn status-fb-btn">
      <img src="/mobis/img/facebook-color.svg" alt="Facebook" width="20" height="20" />
      <span class="status-contact-label">Rental Mobis</span>
    </a>
    <a href="https://www.tiktok.com/@rentalmobis" target="_blank" rel="noopener noreferrer" class="status-contact-btn status-tk-btn">
      <img src="/mobis/img/tiktok-color.svg" alt="TikTok" width="20" height="20" />
      <span class="status-contact-label">@rentalmobis</span>
    </a>
  </div>
</div>`.trim()
  }

  return msg
}

type StatusModalProps = {
  title: string
  areas: string[]
  apiPath: string
  modalRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}

export default function StatusModal({
  title,
  areas,
  apiPath,
  modalRef,
  onClose,
}: StatusModalProps) {
  const [area, setArea] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [inputType, setInputType] = useState<'nik' | 'phone'>('nik')
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [steps, setSteps] = useState<StatusStep[] | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const meta = useMemo(() => {
    if (inputType === 'nik') {
      return { placeholder: 'Masukan NIK Terdaftar (16 digit)', max: 16 }
    }
    return { placeholder: 'Masukan Nomor Handphone (contoh: 0812...)', max: 15 }
  }, [inputType])

  // [07-10-2026] Opsi Bali dan Bandung dinonaktifkan sementara dari dropdown Cek Status
  const availableAreas = useMemo(() => {
    const excluded = ['bali', 'bandung']
    return (areas ?? []).filter((a) => !excluded.includes(a.toLowerCase().trim()))
  }, [areas])

  async function check() {
    setAlert(null)
    setSteps(null)

    const a = area.trim()
    const v = onlyDigits(val)

    if (!a) {
      return setAlert({ type: 'danger', message: 'Silakan pilih area.' })
    }

    if (!v) {
      return setAlert({
        type: 'danger',
        message: inputType === 'nik' ? 'NIK harus diisi.' : 'Nomor Handphone harus diisi.',
      })
    }

    if (inputType === 'nik' && v.length !== 16) {
      return setAlert({
        type: 'danger',
        message: 'NIK harus berjumlah tepat 16 digit angka.',
      })
    }

    if (inputType === 'phone' && (v.length < 9 || v.length > 15)) {
      return setAlert({
        type: 'danger',
        message: 'Nomor handphone harus valid (9 - 15 digit angka).',
      })
    }

    setLoading(true)
    try {
      const res = await postJSON<StatusResponse>(apiPath, {
        area: a.toUpperCase(),
        inputType,
        value: v,
      })

      if (res.success) {
        setAlert({ type: 'success', message: res.message || 'Data pendaftaran ditemukan.' })
        setSteps(res.steps ?? [])
      } else {
        setAlert({ type: 'danger', message: res.message || res.error || 'Data tidak ditemukan.' })
        setSteps([])
      }
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Terjadi kesalahan saat mengambil data. Coba lagi.'
      setAlert({ type: 'danger', message: msg })
      setSteps([])
    } finally {
      setLoading(false)
    }
  }

  const stepsToRender: StatusStep[] =
    steps !== null
      ? steps.length
        ? steps
        : [
            {
              title: 'Pendaftaran belum ditemukan',
              date: 'Silakan cek kembali NIK / No HP / Area',
              status: 'pending',
            },
          ]
      : []

  const displayTitle =
    !title || title === 'Registration Mobis Check'
      ? 'Cek Status Pendaftaran Kamu Disini!'
      : title

  return (
    <div className="modal fade" tabIndex={-1} ref={modalRef} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content status-modal-content">
          <div className="modal-header status-modal-header">
            <h5 className="modal-title status-modal-title">{displayTitle}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body status-modal-body">
            {alert && (
              <div 
                className={`status-check-alert alert-${alert.type}`} 
                dangerouslySetInnerHTML={{ __html: sanitizeAlertMessage(alert.message) }} 
              />
            )}

            <div className="mb-3 position-relative" ref={dropdownRef}>
              <label className="form-label status-field-label">Area / Preferensi</label>
              <button
                type="button"
                className={`status-custom-select ${dropdownOpen ? 'is-open' : ''} ${area ? 'has-value' : ''}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <span className="status-custom-select-text">
                  {area || '— Pilih Area —'}
                </span>
                <ChevronDown
                  className={`status-custom-select-chevron ${dropdownOpen ? 'is-rotated' : ''}`}
                  size={18}
                />
              </button>

              {dropdownOpen && (
                <div className="status-dropdown-menu" role="listbox">
                  {availableAreas.length === 0 ? (
                    <div className="status-dropdown-empty">Tidak ada area tersedia</div>
                  ) : (
                    availableAreas.map((a) => {
                      const isSelected = area.toLowerCase().trim() === a.toLowerCase().trim()
                      return (
                        <div
                          key={a}
                          role="option"
                          aria-selected={isSelected}
                          className={`status-dropdown-option ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setArea(a)
                            setDropdownOpen(false)
                          }}
                        >
                          <span className="status-dropdown-option-label">{a}</span>
                          {isSelected && <Check size={16} className="status-dropdown-check" />}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label status-field-label">Cari Berdasarkan</label>
              <div className="status-type-switch">
                <button
                  type="button"
                  className={`status-type-btn ${inputType === 'nik' ? 'is-active' : ''}`}
                  onClick={() => {
                    setInputType('nik')
                    setVal('')
                  }}
                >
                  NIK (KTP)
                </button>
                <button
                  type="button"
                  className={`status-type-btn ${inputType === 'phone' ? 'is-active' : ''}`}
                  onClick={() => {
                    setInputType('phone')
                    setVal('')
                  }}
                >
                  Nomor Handphone
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label status-field-label">
                {inputType === 'nik' ? 'Nomor Induk Kependudukan (16 digit)' : 'Nomor Handphone'}
              </label>
              <input
                className="form-control status-input"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={meta.placeholder}
                maxLength={meta.max}
                inputMode="numeric"
              />
            </div>

            <button
              className="btn status-submit-btn w-100"
              type="button"
              disabled={loading}
              onClick={check}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Memeriksa Status...
                </>
              ) : (
                'Cek Status Pendaftaran'
              )}
            </button>
          </div>

          {steps !== null && (
            <div className="status-timeline-card">
              <div className="status-timeline-header">
                <h6 className="status-timeline-title">Progress Pendaftaran</h6>
              </div>

              <div className="status-timeline-body">
                {stepsToRender.map((s, i) => (
                  <div
                    key={i}
                    className="status-timeline-item"
                  >
                    <div className="status-timeline-content">
                      <div className={`status-timeline-step-name ${getStepTextClass(s.status)}`}>
                        {i + 1}. {s.title}
                      </div>
                      {s.date && (
                        <div className="status-timeline-date">
                          {s.date}
                        </div>
                      )}
                      {s.detail && (
                        <div className="status-timeline-detail">
                          {s.detail}
                        </div>
                      )}
                    </div>

                    <div className="status-timeline-icon-wrap">
                      <StepIcon status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

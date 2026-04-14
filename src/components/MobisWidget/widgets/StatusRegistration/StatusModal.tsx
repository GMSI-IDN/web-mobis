'use client'
import React, { useMemo, useState } from 'react'
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
    return <i className="bi bi-check-circle-fill text-success fs-4 fw-bold" />
  }
  if (status === 'in-progress') {
    return <i className="bi bi-hourglass-split mobis-gold fs-4 fw-bold" />
  }
  if (status === 'failed') {
    return <i className="bi bi-x-circle-fill text-danger fs-4 fw-bold" />
  }
  return <i className="bi bi-circle text-secondary fs-4" />
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
  const [inputType, setInputType] = useState<'nik' | 'phone'>('nik')
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [steps, setSteps] = useState<StatusStep[] | null>(null)

  const meta = useMemo(() => {
    if (inputType === 'nik') {
      return { placeholder: 'Masukan NIK Terdaftar (16 digit)', max: 16 }
    }
    return { placeholder: 'Masukan Nomor Handphone Terdaftar (contoh: 0812...)', max: 15 }
  }, [inputType])

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
    } catch {
      setAlert({ type: 'danger', message: 'Terjadi kesalahan saat mengambil data. Coba lagi.' })
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

  return (
    <div className="modal fade" tabIndex={-1} ref={modalRef} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

            <div className="mb-3">
              <label className="form-label">Area/Preferensi</label>
              <select
                className="form-select"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="" disabled>
                  — Pilih Area —
                </option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  checked={inputType === 'nik'}
                  onChange={() => {
                    setInputType('nik')
                    setVal('')
                  }}
                />
                <label className="form-check-label">NIK</label>
              </div>

              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  checked={inputType === 'phone'}
                  onChange={() => {
                    setInputType('phone')
                    setVal('')
                  }}
                />
                <label className="form-check-label">Nomor Handphone</label>
              </div>
            </div>

            <div className="mb-3">
              <input
                className="form-control"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={meta.placeholder}
                maxLength={meta.max}
                inputMode="numeric"
              />
            </div>

            <button
              className="btn btn-success w-100"
              type="button"
              disabled={loading}
              onClick={check}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              Check Status Pendaftaran
            </button>
          </div>

          {steps !== null && (
            <div className="border-top p-3 bg-light">
              <h6 className="text-center fw-bold mb-3">Progress Pendaftaran</h6>

              {stepsToRender.map((s, i) => (
                <div
                  key={i}
                  className="d-flex align-items-start justify-content-between py-2 border-bottom"
                >
                  <div>
                    <div className={getStepTextClass(s.status)}>
                      {i + 1}. {s.title}
                    </div>
                    {s.date && (
                      <div className="text-muted small" style={{ whiteSpace: 'pre-line' }}>
                        {s.date}
                      </div>
                    )}
                  </div>

                  <div className="ms-3" style={{ minWidth: 32, textAlign: 'right' }}>
                    <StepIcon status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

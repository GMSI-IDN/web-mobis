'use client'
import React, { useEffect, useState } from 'react'

type Cat = { id: number; name: string }

function extractErrorMessage(data: any, status: number) {
  if (typeof data?.message === 'string' && data.message.trim()) return data.message

  const nestedFieldMessage = data?.errors?.[0]?.data?.errors?.[0]?.message
  if (typeof nestedFieldMessage === 'string' && nestedFieldMessage.trim()) return nestedFieldMessage

  const directFieldMessage = data?.errors?.[0]?.message
  if (typeof directFieldMessage === 'string' && directFieldMessage.trim()) return directFieldMessage

  return `Request failed: ${status}`
}

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(extractErrorMessage(data, res.status))
  return data
}

function normalizeCode(v: string) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function toNumberId(v: string): number | null {
  const n = Number(String(v || '').trim())
  return Number.isFinite(n) ? n : null
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, '0'),
)

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultVoucherWindow() {
  const start = new Date()
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

  return {
    startDate: formatDateInput(start),
    startHour: String(start.getHours()).padStart(2, '0'),
    startMinute: String(start.getMinutes()).padStart(2, '0'),
    endDate: formatDateInput(end),
    endHour: String(end.getHours()).padStart(2, '0'),
    endMinute: String(end.getMinutes()).padStart(2, '0'),
  }
}

function toISOFromDateAndTime(params: {
  date: string
  hour: string
  minute: string
}): string | null | undefined {
  const date = String(params.date || '').trim()
  const hour = String(params.hour || '').trim()
  const minute = String(params.minute || '').trim()

  if (!date && !hour && !minute) return null
  if (!date || !hour || !minute) return undefined

  const dt = new Date(`${date}T${hour}:${minute}:00`)
  if (Number.isNaN(dt.getTime())) return null

  return dt.toISOString()
}

export default function VoucherForm({
  categories,
  onSuccess,
  loadingGlobal,
}: {
  categories: Cat[]
  onSuccess?: () => void
  loadingGlobal?: boolean
}) {
  const defaultWindow = getDefaultVoucherWindow()
  const [categoryId, setCategoryId] = useState('')
  const [code, setCode] = useState('')
  const [quota, setQuota] = useState<number>(10)
  const [enabled, setEnabled] = useState(true)
  const [startDate, setStartDate] = useState(defaultWindow.startDate)
  const [startHour, setStartHour] = useState(defaultWindow.startHour)
  const [startMinute, setStartMinute] = useState(defaultWindow.startMinute)
  const [endDate, setEndDate] = useState(defaultWindow.endDate)
  const [endHour, setEndHour] = useState(defaultWindow.endHour)
  const [endMinute, setEndMinute] = useState(defaultWindow.endMinute)
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!categoryId && categories?.[0]?.id) setCategoryId(String(categories[0].id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories?.length])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')

    const c = normalizeCode(code)
    if (!categoryId) return setErr('Kategori wajib dipilih.')
    if (!c) return setErr('Kode wajib diisi.')
    if (!Number.isFinite(quota) || quota < 0) return setErr('Quota tidak valid.')
    const categoryIdNum = toNumberId(categoryId)
    if (categoryIdNum === null) return setErr('Kategori tidak valid.')

    const startAtISO = toISOFromDateAndTime({
      date: startDate,
      hour: startHour,
      minute: startMinute,
    })
    const endAtISO = toISOFromDateAndTime({
      date: endDate,
      hour: endHour,
      minute: endMinute,
    })

    if (startAtISO === undefined || (startAtISO === null && (startDate || startHour || startMinute))) {
      return setErr('Start Date & Time harus lengkap (tanggal, jam, menit).')
    }
    if (endAtISO === undefined || (endAtISO === null && (endDate || endHour || endMinute))) {
      return setErr('Exp Date & Time harus lengkap (tanggal, jam, menit).')
    }

    // validasi tanggal (optional)
    if (startAtISO && endAtISO) {
      const s = new Date(startAtISO as string).getTime()
      const ed = new Date(endAtISO as string).getTime()
      if (!Number.isNaN(s) && !Number.isNaN(ed) && s >= ed)
        return setErr('Start Date harus < Exp Date.')
    }

    setLoading(true)
    try {
      await api('/api/vouchers', {
        method: 'POST',
        body: JSON.stringify({
          category: categoryIdNum,
          code: c,
          quota: Number(quota),
          enabled: Boolean(enabled),
          startAt: startAtISO,
          endAt: endAtISO,
          description: description || '',
        }),
      })

      setCode('')
      setQuota(10)
      setEnabled(true)
      const nextDefaultWindow = getDefaultVoucherWindow()
      setStartDate(nextDefaultWindow.startDate)
      setStartHour(nextDefaultWindow.startHour)
      setStartMinute(nextDefaultWindow.startMinute)
      setEndDate(nextDefaultWindow.endDate)
      setEndHour(nextDefaultWindow.endHour)
      setEndMinute(nextDefaultWindow.endMinute)
      setDescription('')
      onSuccess?.()
    } catch (e: any) {
      setErr(e?.message ?? 'Gagal membuat voucher.')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || !!loadingGlobal

  return (
    <div className="card">
      <div className="card-body">
        <b>Buat Voucher</b>

        {err ? <div className="alert alert-danger py-1 mt-2 mb-2">{err}</div> : null}

        <form className="mt-3 row g-3" onSubmit={submit}>
          <div className="col-12">
            <label className="form-label">Kategori</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={disabled}
            >
              <option value="">-- pilih --</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Kode</label>
            <input
              className="form-control"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MOBIS10"
              disabled={disabled}
            />
            <div className="form-text">Auto uppercase & tanpa spasi.</div>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Quota</label>
            <input
              type="number"
              className="form-control"
              value={quota}
              onChange={(e) => setQuota(Number(e.target.value))}
              min={0}
              step={1}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-3 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                disabled={disabled}
                id="voucher-enabled"
              />
              <label className="form-check-label" htmlFor="voucher-enabled">
                Aktif
              </label>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Start Date & Time</label>
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={disabled}
              />
              <select
                className="form-select"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                disabled={disabled}
              >
                <option value="">HH</option>
                {HOUR_OPTIONS.map((hour) => (
                  <option key={`start-hour-${hour}`} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
                disabled={disabled}
              >
                <option value="">MM</option>
                {MINUTE_OPTIONS.map((minute) => (
                  <option key={`start-minute-${minute}`} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Exp Date & Time</label>
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={disabled}
              />
              <select
                className="form-select"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                disabled={disabled}
              >
                <option value="">HH</option>
                {HOUR_OPTIONS.map((hour) => (
                  <option key={`end-hour-${hour}`} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
                disabled={disabled}
              >
                <option value="">MM</option>
                {MINUTE_OPTIONS.map((minute) => (
                  <option key={`end-minute-${minute}`} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Keterangan</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="col-12">
            <button className="btn btn-primary" disabled={disabled}>
              {disabled ? 'Processing…' : 'Buat Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

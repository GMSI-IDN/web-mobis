'use client'
import React, { useEffect, useState } from 'react'

type Cat = { id: string; name: string }

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
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`)
  return data
}

function normalizeCode(v: string) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
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
  const [categoryId, setCategoryId] = useState('')
  const [code, setCode] = useState('')
  const [quota, setQuota] = useState<number>(10)
  const [enabled, setEnabled] = useState(true)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!categoryId && categories?.[0]?.id) setCategoryId(categories[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories?.length])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')

    const c = normalizeCode(code)
    if (!categoryId) return setErr('Kategori wajib dipilih.')
    if (!c) return setErr('Kode wajib diisi.')
    if (!Number.isFinite(quota) || quota < 0) return setErr('Quota tidak valid.')

    // validasi tanggal (optional)
    if (startAt && endAt) {
      const s = new Date(startAt).getTime()
      const ed = new Date(endAt).getTime()
      if (!Number.isNaN(s) && !Number.isNaN(ed) && s >= ed)
        return setErr('Start Date harus < Exp Date.')
    }

    setLoading(true)
    try {
      await api('/api/vouchers', {
        method: 'POST',
        body: JSON.stringify({
          category: categoryId,
          code: c,
          quota: Number(quota),
          enabled: Boolean(enabled),
          startAt: startAt ? new Date(startAt).toISOString() : null,
          endAt: endAt ? new Date(endAt).toISOString() : null,
          description: description || '',
        }),
      })

      setCode('')
      setQuota(10)
      setEnabled(true)
      setStartAt('')
      setEndAt('')
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
                <option key={c.id} value={c.id}>
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
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Exp Date</label>
            <input
              type="date"
              className="form-control"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              disabled={disabled}
            />
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

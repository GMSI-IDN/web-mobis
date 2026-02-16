'use client'
import React, { useState } from 'react'

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

function normalizeUpper(v: string) {
  return String(v || '')
    .trim()
    .toUpperCase()
}

export default function CategoryForm({
  onSuccess,
  loadingGlobal,
}: {
  onSuccess?: () => void
  loadingGlobal?: boolean
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')

    const nm = normalizeUpper(name)
    if (!nm) return setErr('Nama kategori wajib diisi.')

    setLoading(true)
    try {
      await api('/api/voucher_categories', {
        method: 'POST',
        body: JSON.stringify({ name: nm }),
      })
      setName('')
      onSuccess?.()
    } catch (e: any) {
      setErr(e?.message ?? 'Gagal membuat kategori.')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || !!loadingGlobal

  return (
    <div className="card mb-3">
      <div className="card-body">
        <b>Buat Kategori</b>

        {err ? <div className="alert alert-danger py-1 mt-2 mb-2">{err}</div> : null}

        <form className="mt-2 d-flex gap-2" onSubmit={submit}>
          <input
            className="form-control"
            placeholder="FACEBOOK / INSTAGRAM"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
          />
          <button className="btn btn-success" disabled={disabled}>
            {disabled ? '...' : 'Tambah'}
          </button>
        </form>
      </div>
    </div>
  )
}

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

// Mirrors the backend check in src/lib/security/sanitize.ts
// (containsSuspiciousMarkup) — instant feedback for the same rule the
// Payload collection's field `validate` enforces server-side.
const SUSPICIOUS_INPUT_PATTERN =
  /[<>]|javascript:|data:text\/html|(?:https?|ftp):\/\/|www\.[a-z0-9-]/i
function hasSuspiciousMarkup(value: string) {
  return SUSPICIOUS_INPUT_PATTERN.test(value)
}

export default function CategoryFormPanel({
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
    if (nm.length > 100 || hasSuspiciousMarkup(nm)) return setErr('Format teks tidak diterima.')

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
    <section className="voucher-dashboard__panel">
      <div className="voucher-dashboard__panel-head">
        <div>
          <h5>Buat Kategori</h5>
          <p>Kelompokkan voucher berdasarkan channel promosi atau campaign yang sedang berjalan.</p>
        </div>
      </div>

      {err ? (
        <div className="voucher-dashboard__alert voucher-dashboard__alert--danger">{err}</div>
      ) : null}

      <form className="voucher-dashboard__inline-form" onSubmit={submit}>
        <input
          className="voucher-dashboard__input"
          placeholder="FACEBOOK / INSTAGRAM"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={disabled}
        />
        <button
          className="voucher-dashboard__action voucher-dashboard__action--primary"
          disabled={disabled}
        >
          {disabled ? 'Processing...' : 'Tambah'}
        </button>
      </form>
    </section>
  )
}

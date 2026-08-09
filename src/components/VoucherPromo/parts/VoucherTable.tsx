'use client'
import React, { useState } from 'react'

type Voucher = {
  id: number
  code: string
  quota: number
  used?: number
  enabled?: boolean
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
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`)
  return data
}

function pct(used: number, quota: number) {
  if (!quota || quota <= 0) return 0
  const v = (used / quota) * 100
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}

function parseNonNegativeInteger(raw: string): number | null {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return null
  if (!/^\d+$/.test(trimmed)) return null

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return null

  return parsed
}

export default function VoucherTable({
  data,
  onChanged,
}: {
  data: Voucher[]
  onChanged?: () => void
}) {
  const [busyId, setBusyId] = useState<number | null>(null)

  async function toggleActive(v: Voucher) {
    setBusyId(v.id)
    try {
      await api(`/api/vouchers/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !Boolean(v.enabled) }),
      })
      onChanged?.()
    } finally {
      setBusyId(null)
    }
  }

  async function updateQuota(v: Voucher, value: number) {
    if (!Number.isFinite(value) || value < 0) return
    if (value === Number(v.quota ?? 0)) return

    setBusyId(v.id)
    try {
      await api(`/api/vouchers/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quota: value }),
      })
      onChanged?.()
    } finally {
      setBusyId(null)
    }
  }

  async function deleteVoucher(v: Voucher) {
    const ok = confirm(`Hapus voucher ${v.code}?`)
    if (!ok) return

    setBusyId(v.id)
    try {
      await api(`/api/vouchers/${v.id}`, { method: 'DELETE' })
      onChanged?.()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <b>Voucher</b>

        <div className="table-responsive mt-2">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Kode</th>
                <th style={{ width: 120 }}>Quota</th>
                <th style={{ width: 200 }}>Usage</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 90 }} className="text-end"></th>
              </tr>
            </thead>

            <tbody>
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Belum ada voucher
                  </td>
                </tr>
              )}

              {(data || []).slice(0, 15).map((v) => {
                const used = Number(v.used ?? 0)
                const quota = Number(v.quota ?? 0)
                const percent = pct(used, quota)

                return (
                  <tr key={v.id}>
                    <td className="fw-semibold">
                      {v.code}{' '}
                      {v.enabled === false ? (
                        <span className="badge text-bg-secondary ms-1">OFF</span>
                      ) : null}
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        defaultValue={quota}
                        min={0}
                        step={1}
                        disabled={busyId === v.id}
                        onBlur={(e) => {
                          const nextQuota = parseNonNegativeInteger(e.target.value)
                          if (nextQuota === null) {
                            e.currentTarget.value = String(quota)
                            return
                          }

                          if (nextQuota === quota) {
                            e.currentTarget.value = String(quota)
                            return
                          }

                          void updateQuota(v, nextQuota)
                        }}
                      />
                    </td>

                    <td>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="small text-muted mt-1">
                        {used} / {quota} ({Math.round(percent)}%)
                      </div>
                    </td>

                    <td>
                      <button
                        className={`btn btn-sm ${v.enabled ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => toggleActive(v)}
                        disabled={busyId === v.id}
                      >
                        {v.enabled ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteVoucher(v)}
                        disabled={busyId === v.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="small text-muted mt-2">
          Quota bisa diubah inline (blur). Used bertambah saat promo berhasil auto-applied pada
          registration.
        </div>
      </div>
    </div>
  )
}

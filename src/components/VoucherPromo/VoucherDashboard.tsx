'use client'

import React, { useEffect, useMemo, useState } from 'react'
import VoucherForm from './parts/VoucherForm'
import CategoryForm from './parts/CategoryForm'
import VoucherTable from './parts/VoucherTable'
import CategoryTable from './parts/CategoryTable'

type Cat = { id: number; name: string; createdAt?: string }
type Voucher = {
  id: number
  code: string
  quota: number
  used?: number
  enabled?: boolean
  category?: number | { id: number; name?: string }
  createdAt?: string
}

type ListRes<T> = { docs: T[]; totalDocs?: number }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
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
  return data as T
}

function normalizeCode(v: string) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export default function VoucherDashboard() {
  const [cats, setCats] = useState<Cat[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // search & filter
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const summary = useMemo(() => {
    const total = vouchers.length
    const used = vouchers.reduce((a, v) => a + Number(v.used ?? 0), 0)
    const quota = vouchers.reduce((a, v) => a + Number(v.quota ?? 0), 0)
    return { total, used, quota }
  }, [vouchers])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const q = new URLSearchParams()
      q.set('limit', '50')
      q.set('sort', '-createdAt')
      q.set('depth', '1')

      if (search.trim()) q.append('where[code][like]', normalizeCode(search.trim()))
      if (filterCategory) q.append('where[category][equals]', filterCategory)

      const [catRes, vouRes] = await Promise.all([
        api<ListRes<Cat>>('/api/voucher_categories?limit=50&sort=-createdAt'),
        api<ListRes<Voucher>>(`/api/vouchers?${q.toString()}`),
      ])

      setCats(catRes.docs || [])
      setVouchers(vouRes.docs || [])

      // auto set filterCategory if empty
      if (!filterCategory && (catRes.docs?.[0]?.id || (catRes.docs?.[0] as any)?._id)) {
        // don't force; keep empty (All)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Gagal load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="container mt-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div>
          <h4 className="mb-1">Voucher Promo</h4>
          <div className="text-muted small">
            Create, search, toggle, edit quota, dan monitoring usage.
          </div>
        </div>

        <div className="d-flex gap-2">
          <a
            className="btn btn-outline-secondary btn-sm"
            href="/admin/collections/voucher_categories"
            target="_blank"
            rel="noreferrer"
          >
            Manage Kategori
          </a>
          <a
            className="btn btn-outline-secondary btn-sm"
            href="/admin/collections/vouchers"
            target="_blank"
            rel="noreferrer"
          >
            Manage Voucher
          </a>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}

      <div className="alert alert-info py-2 mb-3">
        <b>Summary:</b> Total Voucher: {summary.total} | Total Used: {summary.used} | Total Quota:{' '}
        {summary.quota}
      </div>

      {/* Search + Filter */}
      <div className="card mb-3">
        <div className="card-body d-flex flex-column flex-md-row gap-2">
          <input
            className="form-control"
            placeholder="Search code (contoh: MOBIS10)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadData()
            }}
            disabled={loading}
          />

          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            disabled={loading}
          >
            <option value="">All Category</option>
            {cats.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={loadData} disabled={loading}>
              Apply
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearch('')
                setFilterCategory('')
                setTimeout(loadData, 0)
              }}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <VoucherForm categories={cats} onSuccess={loadData} loadingGlobal={loading} />
        </div>

        <div className="col-12 col-lg-5">
          <CategoryForm onSuccess={loadData} loadingGlobal={loading} />
          <CategoryTable data={cats} />
          <VoucherTable data={vouchers} onChanged={loadData} />
        </div>
      </div>
    </section>
  )
}

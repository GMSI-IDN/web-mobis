'use client'

import React, { useEffect, useMemo, useState } from 'react'

import VoucherFormPanel from './parts/VoucherFormPanel'
import VoucherTablePanel from './parts/VoucherTablePanel'
import './index.scss'

type Cat = { id: number; name: string; createdAt?: string }
type Voucher = {
  id: number
  code: string
  quota: number
  used?: number
  enabled?: boolean
  category?: number | { id: number; name?: string }
}

type ListRes<T> = { docs: T[] }

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

export default function VoucherDashboardView() {
  const [cats, setCats] = useState<Cat[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [voucherModalOpen, setVoucherModalOpen] = useState(false)

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
      q.set('limit', '500')
      q.set('sort', '-createdAt')
      q.set('depth', '1')

      if (search.trim()) q.append('where[code][like]', normalizeCode(search.trim()))
      if (filterCategory) q.append('where[category][equals]', filterCategory)

      const [catRes, vouRes] = await Promise.all([
        api<ListRes<Cat>>('/api/voucher_categories?limit=500&sort=-createdAt'),
        api<ListRes<Voucher>>(`/api/vouchers?${q.toString()}`),
      ])

      setCats(catRes.docs || [])
      setVouchers(vouRes.docs || [])
    } catch (e: any) {
      setError(e?.message ?? 'Gagal load data')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="voucher-dashboard">
      <div className="voucher-dashboard__header">
        <div>
          <p className="voucher-dashboard__eyebrow">Voucher Pendaftaran</p>
          <h4 className="voucher-dashboard__title">Voucher Promo Mobis</h4>
          <p className="voucher-dashboard__description">
            Kelola kode promo pendaftaran, kategori campaign, dan pemakaian voucher user dari satu
            panel yang rapi, cepat dipindai, dan nyaman dipakai untuk operasional harian.
          </p>
        </div>

        <div className="voucher-dashboard__actions">
          <a
            className="voucher-dashboard__action voucher-dashboard__action--ghost"
            href="/admin/collections/voucher_categories"
            target="_blank"
            rel="noreferrer"
          >
            Buka Kategori
          </a>
          <a
            className="voucher-dashboard__action voucher-dashboard__action--ghost"
            href="/admin/collections/vouchers"
            target="_blank"
            rel="noreferrer"
          >
            Buka Koleksi Voucher
          </a>
          <button
            className="voucher-dashboard__action voucher-dashboard__action--primary"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="voucher-dashboard__alert voucher-dashboard__alert--danger">{error}</div>
      ) : null}
      {success ? (
        <div className="voucher-dashboard__alert voucher-dashboard__alert--success">{success}</div>
      ) : null}

      <div className="voucher-dashboard__stats">
        <div className="voucher-dashboard__stat-card">
          <span className="voucher-dashboard__stat-label">Voucher Terdaftar</span>
          <strong className="voucher-dashboard__stat-value">{summary.total}</strong>
          <small className="voucher-dashboard__stat-note">
            Total kode promo yang saat ini tersedia di sistem
          </small>
        </div>
        <div className="voucher-dashboard__stat-card">
          <span className="voucher-dashboard__stat-label">Sudah Digunakan</span>
          <strong className="voucher-dashboard__stat-value">{summary.used}</strong>
          <small className="voucher-dashboard__stat-note">
            Akumulasi voucher yang sudah dipakai pada form pendaftaran
          </small>
        </div>
        <div className="voucher-dashboard__stat-card">
          <span className="voucher-dashboard__stat-label">Total Kuota</span>
          <strong className="voucher-dashboard__stat-value">{summary.quota}</strong>
          <small className="voucher-dashboard__stat-note">
            Jumlah seluruh kuota dari voucher aktif dan nonaktif
          </small>
        </div>
      </div>

      <VoucherTablePanel
        categories={cats}
        data={vouchers}
        filterCategory={filterCategory}
        loadingGlobal={loading}
        onApplyFilter={loadData}
        onChanged={loadData}
        onFilterCategoryChange={setFilterCategory}
        onOpenCreateVoucher={() => setVoucherModalOpen(true)}
        onResetFilter={() => {
          setSearch('')
          setFilterCategory('')
          setTimeout(loadData, 0)
        }}
        onSearchChange={setSearch}
        search={search}
      />

      {voucherModalOpen ? (
        <VoucherFormPanel
          categories={cats}
          loadingGlobal={loading}
          mode="modal"
          onClose={() => setVoucherModalOpen(false)}
          onSuccess={async (createdCode) => {
            await loadData()
            setVoucherModalOpen(false)
            if (createdCode) {
              setSuccess(`Voucher ${createdCode} berhasil dibuat.`)
              setError('')
            }
          }}
        />
      ) : null}
    </section>
  )
}

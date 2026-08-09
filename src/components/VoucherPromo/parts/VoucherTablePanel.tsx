'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Cat = { id: number; name: string }
type Voucher = {
  id: number
  code: string
  quota: number
  used?: number
  enabled?: boolean
  category?: number | { id: number; name?: string }
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

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (page <= 3) return [1, 2, 3, 4, 5, '...', totalPages] as const
  if (page >= totalPages - 2) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
  }

  return [1, '...', page - 1, page, page + 1, '...', totalPages] as const
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export default function VoucherTablePanel({
  categories,
  data,
  filterCategory,
  loadingGlobal,
  onApplyFilter,
  onChanged,
  onFilterCategoryChange,
  onOpenCreateVoucher,
  onResetFilter,
  onSearchChange,
  search,
}: {
  categories: Cat[]
  data: Voucher[]
  filterCategory: string
  loadingGlobal?: boolean
  onApplyFilter?: () => void
  onChanged?: () => void
  onFilterCategoryChange?: (value: string) => void
  onOpenCreateVoucher?: () => void
  onResetFilter?: () => void
  onSearchChange?: (value: string) => void
  search: string
}) {
  const [busyId, setBusyId] = useState<number | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)
  const disabled = Boolean(loadingGlobal) || Boolean(busyId)
  const activeCount = useMemo(
    () => data.filter((voucher) => voucher.enabled !== false).length,
    [data],
  )
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, page, pageSize])
  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages])
  const activeFilterCount = Number(Boolean(search.trim())) + Number(Boolean(filterCategory))

  useEffect(() => {
    setPage(1)
  }, [pageSize, search, filterCategory])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

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
    <section className="voucher-dashboard__panel">
      <div className="voucher-dashboard__panel-head">
        <div>
          <h5>Voucher Aktif</h5>
          <p>
            Cari dan pantau voucher yang dipakai user saat mendaftar, ubah quota cepat, dan
            nonaktifkan jika diperlukan.
          </p>
        </div>
      </div>

      <div className="voucher-dashboard__summary-strip">
        <div className="voucher-dashboard__summary-chip">
          <span>Voucher tampil</span>
          <strong>{data.length}</strong>
          <small>Hasil sesuai filter saat ini</small>
        </div>
        <div className="voucher-dashboard__summary-chip">
          <span>Status aktif</span>
          <strong>{activeCount}</strong>
          <small>Voucher yang siap dipakai user</small>
        </div>
        <button
          type="button"
          className="voucher-dashboard__summary-action"
          onClick={onOpenCreateVoucher}
          disabled={disabled}
        >
          <span>Voucher baru</span>
          <strong>Buat Voucher</strong>
          <small>Tambah promo code pendaftaran</small>
        </button>
      </div>

      <div className="voucher-dashboard__filter-card">
        <div className="voucher-dashboard__filter-card-head">
          <div>
            <h6 className="voucher-dashboard__subheading">Filter Cepat</h6>
            <p className="voucher-dashboard__subcopy">
              Gunakan pencarian kode dan kategori untuk mempersempit voucher yang sedang dipantau.
            </p>
          </div>
          <div className="voucher-dashboard__filter-status">
            <span>Filter aktif</span>
            <strong>{activeFilterCount}</strong>
          </div>
        </div>

        <div className="voucher-dashboard__filter-grid voucher-dashboard__filter-grid--inside">
          <label className="voucher-dashboard__field voucher-dashboard__field--search">
            <span>Cari kode</span>
            <input
              className="voucher-dashboard__input"
              placeholder="Cari kode voucher, mis. MOBIS10"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApplyFilter?.()
              }}
              disabled={disabled}
            />
          </label>

          <label className="voucher-dashboard__field voucher-dashboard__field--category">
            <span>Kategori</span>
            <select
              className="voucher-dashboard__input"
              value={filterCategory}
              onChange={(e) => onFilterCategoryChange?.(e.target.value)}
              disabled={disabled}
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="voucher-dashboard__filter-actions voucher-dashboard__filter-actions--inside">
            <button
              className="voucher-dashboard__action voucher-dashboard__action--primary"
              onClick={() => onApplyFilter?.()}
              disabled={disabled}
              type="button"
            >
              Terapkan
            </button>
            <button
              className="voucher-dashboard__action voucher-dashboard__action--ghost"
              onClick={() => onResetFilter?.()}
              disabled={disabled}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="voucher-dashboard__table-header">
        <div>
          <h6 className="voucher-dashboard__subheading">Daftar Voucher</h6>
          <p className="voucher-dashboard__subcopy">
            Pantau kode promo yang tampil, ubah quota langsung dari tabel, lalu aktifkan atau
            nonaktifkan voucher sesuai kebutuhan tim operasional.
          </p>
        </div>

        <div className="voucher-dashboard__table-tools">
          <label className="voucher-dashboard__table-size">
            <span>Tampilkan</span>
            <select
              className="voucher-dashboard__input voucher-dashboard__input--sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              disabled={disabled}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <span className="voucher-dashboard__table-meta">
            {data.length === 0
              ? 'Belum ada data'
              : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.length)} dari ${
                  data.length
                } voucher`}
          </span>
        </div>
      </div>

      <div className="voucher-dashboard__table-wrap">
        <table className="voucher-dashboard__table voucher-dashboard__table--vouchers">
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
                <td colSpan={5} className="voucher-dashboard__empty">
                  {activeFilterCount > 0
                    ? 'Belum ada voucher yang sesuai dengan filter saat ini.'
                    : 'Belum ada voucher yang tersimpan.'}
                </td>
              </tr>
            )}

            {paginatedData.map((v) => {
              const used = Number(v.used ?? 0)
              const quota = Number(v.quota ?? 0)
              const percent = pct(used, quota)

              return (
                <tr key={v.id}>
                  <td className="voucher-dashboard__code-cell">
                    <div className="voucher-dashboard__code-stack">
                      <span className="voucher-dashboard__code-text">{v.code}</span>
                      <span className="voucher-dashboard__row-meta">Kode promo pendaftaran</span>
                    </div>
                    {typeof v.category === 'object' && v.category?.name ? (
                      <span className="voucher-dashboard__category-badge">{v.category.name}</span>
                    ) : null}
                    {v.enabled === false ? <span className="voucher-dashboard__badge">OFF</span> : null}
                  </td>

                  <td>
                    <input
                      type="number"
                      className="voucher-dashboard__input voucher-dashboard__input--sm"
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
                    <div className="voucher-dashboard__progress">
                      <div
                        className="voucher-dashboard__progress-bar"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="voucher-dashboard__usage-text">
                      {used} / {quota} ({Math.round(percent)}%)
                    </div>
                  </td>

                  <td>
                    <button
                      className={`voucher-dashboard__action voucher-dashboard__action--status ${
                        v.enabled
                          ? 'voucher-dashboard__action--status-on'
                          : 'voucher-dashboard__action--status-off'
                      }`}
                      onClick={() => toggleActive(v)}
                      disabled={busyId === v.id}
                    >
                      {v.enabled ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="text-end">
                    <button
                      className="voucher-dashboard__action voucher-dashboard__action--danger"
                      onClick={() => deleteVoucher(v)}
                      disabled={busyId === v.id}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {data.length > 0 ? (
        <div className="voucher-dashboard__pagination">
          <button
            type="button"
            className="voucher-dashboard__action voucher-dashboard__action--ghost voucher-dashboard__action--page"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={disabled || page === 1}
          >
            Sebelumnya
          </button>

          <div className="voucher-dashboard__pagination-pages">
            {visiblePages.map((pageItem, index) =>
              pageItem === '...' ? (
                <span key={`ellipsis-${index}`} className="voucher-dashboard__pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={pageItem}
                  type="button"
                  className={`voucher-dashboard__pagination-page ${
                    pageItem === page ? 'voucher-dashboard__pagination-page--active' : ''
                  }`}
                  onClick={() => setPage(pageItem)}
                  disabled={disabled}
                >
                  {pageItem}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className="voucher-dashboard__action voucher-dashboard__action--ghost voucher-dashboard__action--page"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={disabled || page === totalPages}
          >
            Berikutnya
          </button>
        </div>
      ) : null}

      <p className="voucher-dashboard__note">
        Quota bisa diubah langsung dari tabel. Angka used bertambah saat voucher berhasil dipakai
        user pada form pendaftaran.
      </p>
    </section>
  )
}

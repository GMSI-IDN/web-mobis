'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Customer = {
  id: string
  name?: string | null
  phone?: string | null
  domicile?: string | null
  promoApplied?: boolean | null
  promoCode?: string | null
  createdAt?: string | null
}

type CustomersResponse = {
  docs: Customer[]
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

async function api<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || `Request failed: ${response.status}`)
  return data as T
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

function displayText(value?: string | null) {
  return value?.trim() || '-'
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (page <= 3) return [1, 2, 3, 4, 5, '...', totalPages] as const
  if (page >= totalPages - 2) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
  }

  return [1, '...', page - 1, page, page + 1, '...', totalPages] as const
}

export default function RecentRegistrationsPanel() {
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<Customer[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [promoCount, setPromoCount] = useState(0)

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const [customers, promo] = await Promise.all([
          api<CustomersResponse>(
            `/api/customers?limit=${pageSize}&page=${page}&sort=-createdAt&depth=0`,
          ),
          api<CustomersResponse>(
            '/api/customers?limit=1&page=1&depth=0&where[promoApplied][equals]=true',
          ),
        ])

        if (cancelled) return

        setRows(customers.docs || [])
        setTotalDocs(customers.totalDocs || 0)
        setTotalPages(Math.max(1, customers.totalPages || 1))
        setPromoCount(promo.totalDocs || 0)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Gagal memuat data pendaftar.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages])
  const rangeStart = totalDocs === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = totalDocs === 0 ? 0 : Math.min(page * pageSize, totalDocs)

  return (
    <section className="mobis-admin-dashboard__panel">
      <div className="mobis-admin-dashboard__panel-head">
        <div>
          <p className="mobis-admin-dashboard__eyebrow">Pendaftaran Driver</p>
          <h4 className="mobis-admin-dashboard__title">Pendaftar Terbaru</h4>
          <p className="mobis-admin-dashboard__description">
            Dashboard ini menampilkan data user yang sudah mendaftar melalui form utama di website
            Mobis.
          </p>
        </div>

        <a
          className="mobis-admin-dashboard__action"
          href="/admin/collections/customers"
          rel="noreferrer"
          target="_blank"
        >
          Lihat Semua Pendaftar
        </a>
      </div>

      {error ? <div className="mobis-admin-dashboard__alert">{error}</div> : null}

      <div className="mobis-admin-dashboard__stats">
        <div className="mobis-admin-dashboard__stat">
          <span>Total Pendaftar</span>
          <strong>{totalDocs}</strong>
        </div>
        <div className="mobis-admin-dashboard__stat">
          <span>Promo Terpakai</span>
          <strong>{promoCount}</strong>
        </div>
      </div>

      <div className="mobis-admin-dashboard__table-head">
        <div>
          <h5 className="mobis-admin-dashboard__table-title">Daftar Pendaftar</h5>
          <p className="mobis-admin-dashboard__table-description">
            Default menampilkan 10 data. Ubah jumlah data untuk melihat lebih banyak pendaftar
            sekaligus.
          </p>
        </div>

        <div className="mobis-admin-dashboard__table-tools">
          <label className="mobis-admin-dashboard__table-size">
            <span>Tampilkan</span>
            <select
              className="mobis-admin-dashboard__table-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              disabled={loading}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <span className="mobis-admin-dashboard__table-meta">
            {totalDocs === 0 ? 'Belum ada data' : `${rangeStart}-${rangeEnd} dari ${totalDocs} user`}
          </span>
        </div>
      </div>

      <div className="mobis-admin-dashboard__table-wrap">
        <table className="mobis-admin-dashboard__table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Telepon</th>
              <th>Domisili</th>
              <th>Promo</th>
              <th>Terdaftar</th>
              <th className="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="mobis-admin-dashboard__empty" colSpan={6}>
                  {loading ? 'Memuat data pendaftar...' : 'Belum ada user yang mendaftar.'}
                </td>
              </tr>
            ) : (
              rows.map((customer) => (
                <tr key={customer.id}>
                  <td className="mobis-admin-dashboard__name-cell">{displayText(customer.name)}</td>
                  <td>{displayText(customer.phone)}</td>
                  <td>{displayText(customer.domicile)}</td>
                  <td>
                    {customer.promoApplied ? (
                      <span className="mobis-admin-dashboard__badge mobis-admin-dashboard__badge--success">
                        {displayText(customer.promoCode)}
                      </span>
                    ) : (
                      <span className="mobis-admin-dashboard__badge">Tanpa promo</span>
                    )}
                  </td>
                  <td>{formatDateTime(customer.createdAt)}</td>
                  <td className="text-end">
                    <a
                      className="mobis-admin-dashboard__row-link"
                      href={`/admin/collections/customers/${customer.id}`}
                    >
                      Buka
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalDocs > 0 ? (
        <div className="mobis-admin-dashboard__pagination">
          <button
            type="button"
            className="mobis-admin-dashboard__page-action"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || page === 1}
          >
            Sebelumnya
          </button>

          <div className="mobis-admin-dashboard__page-list">
            {visiblePages.map((pageItem, index) =>
              pageItem === '...' ? (
                <span key={`ellipsis-${index}`} className="mobis-admin-dashboard__page-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={pageItem}
                  type="button"
                  className={`mobis-admin-dashboard__page-button ${
                    pageItem === page ? 'mobis-admin-dashboard__page-button--active' : ''
                  }`}
                  onClick={() => setPage(pageItem)}
                  disabled={loading}
                >
                  {pageItem}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className="mobis-admin-dashboard__page-action"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={loading || page === totalPages}
          >
            Berikutnya
          </button>
        </div>
      ) : null}
    </section>
  )
}

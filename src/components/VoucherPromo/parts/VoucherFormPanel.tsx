'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Cat = { id: string; name: string; createdAt?: string }

async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
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

function normalizeUpper(v: string) {
  return String(v || '')
    .trim()
    .toUpperCase()
}

function fmtDate(d?: string) {
  if (!d) return '-'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('id-ID')
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (page <= 3) return [1, 2, 3, 4, 5, '...', totalPages] as const
  if (page >= totalPages - 2) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
  }

  return [1, '...', page - 1, page, page + 1, '...', totalPages] as const
}

export default function VoucherFormPanel({
  categories,
  mode = 'panel',
  onClose,
  onSuccess,
  loadingGlobal,
}: {
  categories: Cat[]
  mode?: 'modal' | 'panel'
  onClose?: () => void
  onSuccess?: () => void | Promise<void>
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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryErr, setCategoryErr] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryPageSize, setCategoryPageSize] = useState<number>(10)
  const [categoryPage, setCategoryPage] = useState<number>(1)

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

    if (startAt && endAt) {
      const s = new Date(startAt).getTime()
      const ed = new Date(endAt).getTime()
      if (!Number.isNaN(s) && !Number.isNaN(ed) && s >= ed) {
        return setErr('Start Date harus lebih kecil dari Exp Date.')
      }
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
      await onSuccess?.()
    } catch (e: any) {
      setErr(e?.message ?? 'Gagal membuat voucher.')
    } finally {
      setLoading(false)
    }
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault()
    setCategoryErr('')

    const name = normalizeUpper(categoryName)
    if (!name) return setCategoryErr('Nama kategori wajib diisi.')

    setCategoryLoading(true)
    try {
      const created = await api<Cat>('/api/voucher_categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })

      setCategoryName('')
      if (created?.id) setCategoryId(created.id)
      await onSuccess?.()
      setCategoryModalOpen(false)
    } catch (e: any) {
      setCategoryErr(e?.message ?? 'Gagal membuat kategori.')
    } finally {
      setCategoryLoading(false)
    }
  }

  const disabled = loading || !!loadingGlobal
  const categoryDisabled = categoryLoading || !!loadingGlobal
  const categoryTotalPages = Math.max(1, Math.ceil(categories.length / categoryPageSize))
  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * categoryPageSize
    return categories.slice(start, start + categoryPageSize)
  }, [categories, categoryPage, categoryPageSize])
  const visibleCategoryPages = useMemo(
    () => getVisiblePages(categoryPage, categoryTotalPages),
    [categoryPage, categoryTotalPages],
  )

  useEffect(() => {
    setCategoryPage(1)
  }, [categoryPageSize])

  useEffect(() => {
    if (categoryPage > categoryTotalPages) setCategoryPage(categoryTotalPages)
  }, [categoryPage, categoryTotalPages])

  const formContent = (
    <>
      {err ? (
        <div className="voucher-dashboard__alert voucher-dashboard__alert--danger">{err}</div>
      ) : null}

      <form className="voucher-dashboard__form-grid" onSubmit={submit}>
        <div className="voucher-dashboard__field voucher-dashboard__field--full">
          <span>Kategori</span>
          <div className="voucher-dashboard__field-inline">
            <select
              className="voucher-dashboard__input"
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
            <button
              type="button"
              className="voucher-dashboard__action voucher-dashboard__action--ghost voucher-dashboard__action--inline"
              onClick={() => setCategoryModalOpen(true)}
              disabled={disabled}
            >
              Kelola Kategori
            </button>
          </div>
        </div>

        <label className="voucher-dashboard__field voucher-dashboard__field--code">
          <span>Kode</span>
          <input
            className="voucher-dashboard__input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MOBIS10"
            disabled={disabled}
          />
          <small className="voucher-dashboard__hint">Otomatis uppercase dan tanpa spasi.</small>
        </label>

        <label className="voucher-dashboard__field voucher-dashboard__field--quota">
          <span>Quota</span>
          <input
            type="number"
            className="voucher-dashboard__input"
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value))}
            min={0}
            step={1}
            disabled={disabled}
          />
          <small className="voucher-dashboard__hint">Jumlah maksimal pemakaian voucher.</small>
        </label>

        <div className="voucher-dashboard__field voucher-dashboard__field--toggle">
          <span>Status Voucher</span>
          <label className="voucher-dashboard__toggle" htmlFor="voucher-enabled-panel">
            <input
              className="voucher-dashboard__toggle-input"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={disabled}
              id="voucher-enabled-panel"
            />
            <span className="voucher-dashboard__toggle-ui" aria-hidden="true">
              <span className="voucher-dashboard__toggle-knob" />
            </span>
            <span className="voucher-dashboard__toggle-label">
              {enabled ? 'Voucher aktif' : 'Voucher nonaktif'}
            </span>
          </label>
          <small className="voucher-dashboard__hint">
            Aktifkan agar voucher langsung bisa dipakai user saat mendaftar.
          </small>
        </div>

        <label className="voucher-dashboard__field voucher-dashboard__field--date">
          <span>Start Date</span>
          <input
            type="date"
            className="voucher-dashboard__input"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="voucher-dashboard__field voucher-dashboard__field--date">
          <span>Exp Date</span>
          <input
            type="date"
            className="voucher-dashboard__input"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="voucher-dashboard__field voucher-dashboard__field--full">
          <span>Keterangan</span>
          <textarea
            className="voucher-dashboard__input voucher-dashboard__input--textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            placeholder="Catatan internal, syarat promo, atau konteks campaign"
          />
        </label>

        <div className="voucher-dashboard__form-actions">
          <button
            className="voucher-dashboard__action voucher-dashboard__action--primary"
            disabled={disabled}
          >
            {loading ? 'Memproses...' : 'Buat Voucher'}
          </button>
        </div>
      </form>
    </>
  )

  return (
    <>
      {mode === 'modal' ? (
        <div
          className="voucher-dashboard__modal-backdrop"
          onClick={() => {
            if (!disabled) onClose?.()
          }}
        >
          <section
            className="voucher-dashboard__modal voucher-dashboard__modal--form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-create-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="voucher-dashboard__modal-head">
              <div>
                <p className="voucher-dashboard__eyebrow">Buat Voucher</p>
                <h5 id="voucher-create-modal-title" className="voucher-dashboard__modal-title">
                  Tambah voucher promo pendaftaran
                </h5>
                <p className="voucher-dashboard__modal-description">
                  Buat promo code baru yang digunakan user saat mendaftar, lengkap dengan quota
                  dan periode aktif.
                </p>
              </div>
              <button
                type="button"
                className="voucher-dashboard__action voucher-dashboard__action--danger-icon"
                onClick={onClose}
                disabled={disabled}
                aria-label="Tutup modal voucher"
              >
                X
              </button>
            </div>

            {formContent}
          </section>
        </div>
      ) : (
        <section className="voucher-dashboard__panel">
          <div className="voucher-dashboard__panel-head">
            <div>
              <h5>Buat Voucher</h5>
              <p>
                Buat promo code baru yang digunakan user saat mendaftar, lengkap dengan quota dan
                periode aktif.
              </p>
            </div>
          </div>

          {formContent}
        </section>
      )}

      {categoryModalOpen ? (
        <div
          className="voucher-dashboard__modal-backdrop"
          onClick={() => {
            if (!categoryLoading) setCategoryModalOpen(false)
          }}
        >
          <section
            className="voucher-dashboard__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-category-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="voucher-dashboard__modal-head">
              <div>
                <p className="voucher-dashboard__eyebrow">Kelola Kategori</p>
                <h5 id="voucher-category-modal-title" className="voucher-dashboard__modal-title">
                  Tambah dan lihat kategori voucher
                </h5>
                <p className="voucher-dashboard__modal-description">
                  Kategori membantu tim mengelompokkan voucher berdasarkan channel promosi atau
                  campaign yang sedang berjalan.
                </p>
              </div>
              <button
                type="button"
                className="voucher-dashboard__action voucher-dashboard__action--danger-icon"
                onClick={() => setCategoryModalOpen(false)}
                disabled={categoryLoading}
                aria-label="Tutup modal kategori"
              >
                X
              </button>
            </div>

            <div className="voucher-dashboard__category-summary">
              <div className="voucher-dashboard__category-summary-card">
                <span>Total kategori</span>
                <strong>{categories.length}</strong>
              </div>
              <div className="voucher-dashboard__category-summary-card">
                <span>Halaman aktif</span>
                <strong>
                  {categoryPage} / {categoryTotalPages}
                </strong>
              </div>
            </div>

            {categoryErr ? (
              <div className="voucher-dashboard__alert voucher-dashboard__alert--danger">
                {categoryErr}
              </div>
            ) : null}

            <form className="voucher-dashboard__inline-form" onSubmit={submitCategory}>
              <input
                className="voucher-dashboard__input"
                placeholder="FACEBOOK / INSTAGRAM"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={categoryDisabled}
              />
              <button
                className="voucher-dashboard__action voucher-dashboard__action--primary"
                disabled={categoryDisabled}
              >
                {categoryDisabled ? 'Menyimpan...' : 'Tambah Kategori'}
              </button>
            </form>

            <div className="voucher-dashboard__table-header voucher-dashboard__table-header--modal">
              <div>
                <h6 className="voucher-dashboard__subheading">Daftar Kategori</h6>
                <p className="voucher-dashboard__subcopy">
                  Pilih jumlah data yang ingin ditampilkan lalu gunakan pagination untuk melihat
                  kategori lain.
                </p>
              </div>

              <div className="voucher-dashboard__table-tools">
                <label className="voucher-dashboard__table-size">
                  <span>Tampilkan</span>
                  <select
                    className="voucher-dashboard__input voucher-dashboard__input--sm"
                    value={categoryPageSize}
                    onChange={(e) => setCategoryPageSize(Number(e.target.value))}
                    disabled={categoryDisabled}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="voucher-dashboard__table-meta">
                  {categories.length === 0
                    ? 'Belum ada data'
                    : `${(categoryPage - 1) * categoryPageSize + 1}-${Math.min(
                        categoryPage * categoryPageSize,
                        categories.length,
                      )} dari ${categories.length} kategori`}
                </span>
              </div>
            </div>

            <div className="voucher-dashboard__table-wrap">
              <table className="voucher-dashboard__table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th className="text-end">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="voucher-dashboard__empty">
                        Belum ada kategori
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((c) => (
                      <tr key={c.id}>
                        <td className="voucher-dashboard__code-cell">{c.name}</td>
                        <td className="text-end">{fmtDate(c.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {categories.length > 0 ? (
              <div className="voucher-dashboard__pagination">
                <button
                  type="button"
                  className="voucher-dashboard__action voucher-dashboard__action--ghost voucher-dashboard__action--page"
                  onClick={() => setCategoryPage((current) => Math.max(1, current - 1))}
                  disabled={categoryDisabled || categoryPage === 1}
                >
                  Sebelumnya
                </button>

                <div className="voucher-dashboard__pagination-pages">
                  {visibleCategoryPages.map((pageItem, index) =>
                    pageItem === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="voucher-dashboard__pagination-ellipsis"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageItem}
                        type="button"
                        className={`voucher-dashboard__pagination-page ${
                          pageItem === categoryPage ? 'voucher-dashboard__pagination-page--active' : ''
                        }`}
                        onClick={() => setCategoryPage(pageItem)}
                        disabled={categoryDisabled}
                      >
                        {pageItem}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="voucher-dashboard__action voucher-dashboard__action--ghost voucher-dashboard__action--page"
                  onClick={() =>
                    setCategoryPage((current) => Math.min(categoryTotalPages, current + 1))
                  }
                  disabled={categoryDisabled || categoryPage === categoryTotalPages}
                >
                  Berikutnya
                </button>
              </div>
            ) : null}

            <p className="voucher-dashboard__note">
              Kategori dipakai untuk grouping voucher seperti Facebook, Instagram, TikTok, atau
              channel promosi lain.
            </p>
          </section>
        </div>
      ) : null}
    </>
  )
}
